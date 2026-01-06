// Charger les variables d'environnement en premier
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { nanoid } from 'nanoid';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import rankingsRoutes from './routes/rankings.js';
import meRoutes from './routes/me.js';
import friendsRoutes, { setOnlineUsers } from './routes/friends.js';
import matchesRoutes from './routes/matches.js';
import discordRoutes from './routes/discord.js';
import { getUserById, recordMatch, updateUser } from './db.js';
import { calculateNewMMR } from './utils/elo.js';
import { MatchmakingQueue } from './utils/matchmakingQueue.js';
// Système ELO amélioré disponible (optionnel - voir OPTIMIZATION_PLAN.md)
// import { calculateNewMMR } from './utils/eloImproved.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const httpServer = createServer(app);

// Configuration Socket.io - optimisée pour Plesk/Apache
// Plesk tue les connexions long-running, donc on utilise des timeouts très courts

// Configuration Socket.io - version simple qui fonctionnait ce matin (3404b51)
// Retour à la configuration simple qui fonctionnait avant les modifications
// CORS simple : accepter CLIENT_URL ou localhost, et typingpvp.com en production
const socketCorsOrigin = process.env.CLIENT_URL || 
  (process.env.NODE_ENV === 'production' ? 'https://typingpvp.com' : 'http://localhost:5173');

const io = new Server(httpServer, {
  cors: {
    origin: socketCorsOrigin,
    methods: ["GET", "POST"],
    credentials: true
  },
  // Forcer polling uniquement pour éviter les problèmes avec Plesk/Apache qui tue les connexions long-running
  transports: ['polling'],
  allowUpgrades: false,
  // Timeouts augmentés pour permettre au reverse proxy de fonctionner correctement
  // pingTimeout: temps max entre un ping et sa réponse (si dépassé, session expirée)
  // IMPORTANT: En production avec reverse proxy, augmenter encore plus pour éviter les sessions expirées
  pingTimeout: 120000, // 120 secondes (2 minutes) pour les reverse proxies très lents
  // pingInterval: temps entre chaque ping envoyé par le serveur
  pingInterval: 25000, // 25 secondes (moins fréquent pour réduire la charge, mais assez pour maintenir la connexion)
  // connectTimeout: temps max pour établir une connexion initiale
  connectTimeout: 60000, // 60 secondes (augmenté pour les connexions lentes)
  // Améliorer la gestion des sessions expirées
  allowEIO3: false, // Désactiver Engine.IO v3 pour éviter les problèmes
  // Augmenter les timeouts pour les requêtes polling longues
  httpCompression: false, // Désactiver la compression pour réduire la latence
  // Améliorer la gestion des reconnexions
  maxHttpBufferSize: 1e6 // 1MB pour les messages
});

// Configuration CORS pour accepter les requêtes depuis le frontend
const corsOptions = {
  origin: function (origin, callback) {
    // En production, accepter les requêtes depuis le domaine configuré
    const allowedOrigins = [
      process.env.CLIENT_URL,
      'https://typingpvp.com',
      'http://localhost:5173',
      'http://localhost:3000'
    ].filter(Boolean);
    
    // En développement, permettre toutes les origines
    if (process.env.NODE_ENV === 'development' || !origin) {
      return callback(null, true);
    }
    
    // Vérifier si l'origine est autorisée
    if (allowedOrigins.some(allowed => origin.includes(allowed.replace(/^https?:\/\//, '')))) {
      callback(null, true);
    } else {
      callback(null, true); // Permettre temporairement pour debug
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
};

app.use(cors(corsOptions));
app.use(express.json());

// Middleware pour logger les requêtes API uniquement
// IMPORTANT: Ignorer complètement les requêtes Socket.io - Socket.io les gère directement
// Ne pas ajouter de middleware qui pourrait ralentir les requêtes Socket.io
app.use((req, res, next) => {
  // Ignorer complètement les requêtes Socket.io - laisser Socket.io les gérer directement
  // Gérer aussi /api/socket.io au cas où le client essaierait de s'y connecter
  // (bien que le client devrait utiliser /socket.io/ directement)
  if (req.path.startsWith('/socket.io/') || req.path.startsWith('/api/socket.io/')) {
    return next(); // Passer immédiatement sans aucune modification
  }
  
  // Logger les requêtes API seulement (pas Socket.io)
  if (req.path.startsWith('/api')) {
    console.log(`📡 ${req.method} ${req.path}`, {
      origin: req.headers.origin,
      query: Object.keys(req.query).length > 0 ? req.query : undefined
    });
  }
  next();
});

// Stockage des rooms en mémoire
const rooms = new Map();
const players = new Map();

// Une seule queue optimisée pour tous les types (ranked/unrated)
// La queue gère elle-même la séparation par langue et type
// Utilise le système de buckets MMR pour O(1) recherche au lieu de O(n)
const matchmakingQueue = new MatchmakingQueue();

// Système de compétitions (mass multiplayer)
const competitions = new Map(); // Map<competitionId, { id, text, players, status, startTime, results, language, maxPlayers }>

// Système de présence en ligne : Map<userId, Set<socketId>>
// Un utilisateur peut avoir plusieurs sockets (onglets différents)
const onlineUsers = new Map(); // Map<userId, Set<socketId>>

// Texte de test par défaut
const defaultTexts = [
  "Le développement web moderne utilise React pour créer des interfaces utilisateur interactives et performantes.",
  "La programmation nécessite de la patience, de la logique et beaucoup de pratique pour maîtriser les concepts.",
  "Les frameworks JavaScript permettent de construire des applications complexes plus facilement et rapidement.",
  "L'open source est un modèle de développement qui favorise la collaboration et l'innovation dans le monde du logiciel.",
  "Les algorithmes et structures de données sont fondamentaux pour résoudre efficacement les problèmes informatiques."
];

function getRandomText() {
  return defaultTexts[Math.floor(Math.random() * defaultTexts.length)];
}

// Mots les plus utilisés par langue (version simplifiée pour le serveur)
const languageWords = {
  en: ['the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at', 'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she', 'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what', 'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me', 'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know', 'take', 'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see', 'other', 'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over', 'think', 'also', 'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well', 'way', 'even', 'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most', 'us'],
  fr: ['le', 'de', 'et', 'à', 'un', 'il', 'être', 'en', 'avoir', 'que', 'pour', 'dans', 'ce', 'son', 'une', 'sur', 'avec', 'ne', 'se', 'pas', 'tout', 'plus', 'par', 'grand', 'autre', 'du', 'de', 'le', 'et', 'à', 'il', 'être', 'en', 'avoir', 'que', 'pour', 'dans', 'ce', 'son', 'une', 'sur', 'avec', 'ne', 'se', 'pas', 'tout', 'plus', 'par', 'grand', 'en', 'une', 'autre', 'du', 'de', 'le', 'et', 'à', 'être', 'avoir', 'faire', 'dire', 'aller', 'voir', 'savoir', 'vouloir', 'venir', 'falloir', 'pouvoir', 'devoir', 'parler', 'trouver', 'donner', 'prendre', 'mettre', 'rester', 'passer', 'comprendre', 'connaître', 'rendre', 'laisser', 'entendre', 'sortir', 'monter', 'descendre', 'arriver', 'partir', 'revenir'],
  es: ['el', 'la', 'de', 'que', 'y', 'a', 'en', 'un', 'ser', 'se', 'no', 'haber', 'por', 'con', 'su', 'para', 'como', 'estar', 'tener', 'le', 'lo', 'todo', 'pero', 'más', 'hacer', 'o', 'poder', 'decir', 'este', 'ir', 'otro', 'ese', 'la', 'si', 'me', 'ya', 'ver', 'porque', 'dar', 'cuando', 'él', 'muy', 'sin', 'vez', 'mucho', 'saber', 'qué', 'sobre', 'mi', 'alguno', 'mismo', 'yo', 'también', 'hasta', 'año', 'dos', 'querer', 'entre', 'así', 'primero', 'desde', 'grande', 'eso', 'ni', 'nos', 'llegar', 'pasar', 'tiempo', 'ella', 'sí', 'día', 'uno', 'bien', 'poco', 'deber', 'entonces', 'poner', 'cosa', 'tanto', 'hombre', 'parecer', 'nuestro', 'tan', 'donde', 'ahora', 'parte', 'después', 'vida', 'quedar', 'siempre', 'creer', 'hablar', 'llevar', 'dejar', 'nada', 'cada', 'seguir', 'menos', 'nuevo', 'encontrar', 'venir', 'pensar', 'casa', 'mujer', 'mirar', 'otro', 'acción', 'ir', 'ver', 'dos', 'tener', 'querer', 'hablar', 'dar', 'usar', 'encontrar', 'decir', 'trabajar', 'llamar', 'tratar', 'preguntar', 'necesitar', 'sentir', 'convertir', 'dejar', 'empezar', 'ayudar', 'mostrar', 'escuchar', 'cambiar', 'vivir', 'terminar', 'continuar', 'establecer', 'aprender', 'añadir', 'seguir', 'empezar', 'cambiar', 'crear', 'abrir', 'caminar', 'ofrecer', 'recordar', 'amar', 'considerar', 'aparecer', 'comprar', 'esperar', 'servir', 'morir', 'enviar', 'construir', 'permanecer', 'caer', 'cortar', 'alcanzar', 'matar', 'levantar']
};

// Fonction pour générer un texte dans une langue spécifique
function generateTextForLanguage(langCode = 'en', wordCount = 50) {
  const words = languageWords[langCode] || languageWords.en;
  const result = [];
  
  for (let i = 0; i < wordCount; i++) {
    const randomIndex = Math.floor(Math.random() * words.length);
    if (i === 0) {
      result.push(words[randomIndex]);
    } else {
      result.push(' ' + words[randomIndex]);
    }
  }
  
  return result.join('');
}

// Routes API
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Route de test pour vérifier que le serveur répond
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Server is running',
    port: process.env.PORT || 3001,
    host: process.env.HOST || '0.0.0.0',
    socketIoPath: '/socket.io/'
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/rankings', rankingsRoutes);
app.use('/api/me', meRoutes);

// Configurer onlineUsers dans friendsRoutes
setOnlineUsers(onlineUsers);

app.use('/api/friends', friendsRoutes);
app.use('/api/matches', matchesRoutes);
app.use('/api/discord', discordRoutes);

// Route de santé pour Socket.io - vérifie que le serveur Socket.io fonctionne
// IMPORTANT: Cette route doit être AVANT la route catch-all
app.get('/api/socket-health', (req, res) => {
  const socketCount = io.sockets.sockets.size;
  res.json({
    status: 'ok',
    socketIo: {
      connected: true,
      activeConnections: socketCount,
      transports: ['polling']
    },
    server: {
      nodeEnv: process.env.NODE_ENV || 'development',
      clientUrl: process.env.CLIENT_URL || 'not set',
      port: process.env.PORT || 3001
    }
  });
});

// Servir les fichiers uploadés statiquement
// Les avatars seront accessibles via /uploads/avatars/filename
const uploadsPath = join(__dirname, 'uploads');
if (existsSync(uploadsPath)) {
  app.use('/uploads', express.static(uploadsPath));
  console.log('✅ Dossier uploads configuré pour servir les fichiers statiques');
}

// Servir les fichiers statiques du client (frontend) - UNIQUEMENT si SERVE_CLIENT=true
// Par défaut, le client est servi séparément sur un autre port
if (process.env.SERVE_CLIENT === 'true') {
  const clientDistPath = join(__dirname, '..', 'client', 'dist');
  
  // Vérifier que le dossier client/dist existe
  if (!existsSync(clientDistPath)) {
    console.error('❌ ERREUR: Le dossier client/dist n\'existe pas!');
    console.error('Le serveur ne peut pas servir le client sans ce dossier.');
    console.error('Vérifiez que le build du client a été effectué correctement.');
  } else {
    console.log('✅ Dossier client/dist trouvé, configuration du serveur de fichiers statiques...');
  }
  
  // Middleware pour servir les fichiers statiques avec gestion d'erreur
  app.use(express.static(clientDistPath, {
    // Ne pas retourner d'erreur si le fichier n'existe pas, laisser passer à la route catch-all
    fallthrough: true
  }));
  
  // Route catch-all : servir index.html pour toutes les routes non-API
  // IMPORTANT: Cette route doit être APRÈS toutes les routes API et Socket.io
  // CRITIQUE: Ne pas intercepter les routes Socket.io - elles sont gérées par Socket.io directement
  app.all('*', (req, res, next) => {
    // Ne pas intercepter les routes Socket.io - Socket.io les gère directement via httpServer
    // Gérer aussi /api/socket.io au cas où (bien que le client devrait utiliser /socket.io/ directement)
    if (req.path.startsWith('/socket.io/') || req.path.startsWith('/api/socket.io/')) {
      // Laisser Socket.io gérer ces requêtes
      return next();
    }
    
    // Ne pas intercepter les routes API - elles devraient déjà être traitées par les routes définies avant
    // MAIS exclure /api/socket.io qui doit être géré par Socket.IO
    if (req.path.startsWith('/api') && !req.path.startsWith('/api/socket.io/')) {
      // Si on arrive ici, c'est qu'aucune route API n'a matché
      // Logger pour debug
      console.warn(`⚠️ Route API non trouvée: ${req.method} ${req.path}`);
      return res.status(404).json({ error: 'API route not found', path: req.path, method: req.method });
    }
    
    // Servir index.html pour toutes les autres routes (SPA routing)
    const indexPath = join(clientDistPath, 'index.html');
    if (!existsSync(indexPath)) {
      console.error('❌ ERREUR: index.html non trouvé dans client/dist');
      return res.status(500).json({ error: 'Client not built. Please build the client first.' });
    }
    res.sendFile(indexPath, (err) => {
      if (err) {
        console.error('Error sending index.html:', err);
        res.status(500).json({ error: 'Internal server error' });
      }
    });
  });
} else {
  // Si le client n'est pas servi par le serveur, retourner 404 pour les routes non-API
  app.all('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      return res.status(404).json({ error: 'Not found. Client is served separately.' });
    }
    // Pour les routes API non trouvées, laisser Express gérer la 404
    res.status(404).json({ error: 'API route not found', path: req.path, method: req.method });
  });
}

// Route de test pour Socket.io (sans connexion)
// IMPORTANT: Ne pas utiliser /socket.io/test car Socket.io intercepte toutes les requêtes /socket.io/*
// Utiliser /api/socket-test à la place
app.get('/api/socket-test', (req, res) => {
  const socketCount = io.sockets.sockets.size;
  res.json({ 
    message: 'Socket.io endpoint is accessible',
    socketIoPath: '/socket.io/',
    transports: ['polling'],
    activeConnections: socketCount,
    server: {
      nodeEnv: process.env.NODE_ENV || 'development',
      clientUrl: process.env.CLIENT_URL || 'not set',
      port: process.env.PORT || 3001
    },
    note: 'To test Socket.IO connection, use the client application. Direct browser access to /socket.io/ will not work as it requires specific Socket.IO protocol parameters.'
  });
});

// Gestion des erreurs Socket.io - logs détaillés pour diagnostic
io.engine.on('connection_error', (err) => {
  console.error('❌ Erreur Socket.io:', err.message);
  console.error('Code:', err.code);
  if (err.req) {
    console.error('Transport:', err.req._query?.transport || 'non spécifié');
    console.error('Origin:', err.req.headers?.origin);
    console.error('URL:', err.req.url);
  }
});

// Logger toutes les requêtes Socket.io pour diagnostic
// IMPORTANT: Logger toutes les requêtes pour diagnostiquer les problèmes 400/502
io.engine.on('request', (req, res) => {
  const sid = req.query?.sid || 'new';
  const isError = res.statusCode >= 400;
  
  // Logger toutes les requêtes (pas seulement en production) pour debug
  if (isError || process.env.NODE_ENV === 'production') {
    console.log(`🔌 Socket.io ${req.method} ${req.url}`, {
      statusCode: res.statusCode,
      origin: req.headers.origin,
      transport: req.query?.transport,
      sid: sid,
      timestamp: new Date().toISOString()
    });
  }
  
  // Logger les erreurs avec plus de détails
  if (isError) {
    console.error(`❌ Erreur Socket.io ${req.method} ${req.url}:`, res.statusCode);
    console.error('Headers:', {
      origin: req.headers.origin,
      host: req.headers.host,
      'user-agent': req.headers['user-agent']?.substring(0, 50),
      'x-forwarded-for': req.headers['x-forwarded-for']
    });
    console.error('Query:', req.query);
    
    // Si c'est une erreur 400 avec un sid (session), c'est probablement une session expirée
    if (res.statusCode === 400 && req.query?.sid) {
      console.error('⚠️ Erreur 400: Session invalide ou expirée pour sid:', req.query.sid);
      
      // Vérifier si la session existe réellement
      try {
        const session = io.engine.clients.get(req.query.sid);
        if (!session) {
          console.error('❌ Session non trouvée dans le serveur - Session expirée ou serveur redémarré');
          console.error('💡 Cause probable: Le serveur a redémarré, la session a expiré (timeout), ou le reverse proxy a mis trop de temps à router la requête');
          console.error('💡 Solutions possibles:');
          console.error('   - Vérifier que le serveur Node.js ne redémarre pas fréquemment');
          console.error('   - Augmenter les timeouts du reverse proxy (nginx/Apache) pour Socket.IO');
          console.error('   - Vérifier les logs système pour voir si le processus Node.js crash');
        } else {
          console.error('✅ Session trouvée mais requête rejetée - Problème de validation côté serveur');
          console.error('💡 Peut être dû à un problème de synchronisation ou de headers');
        }
      } catch (error) {
        console.error('❌ Erreur lors de la vérification de session:', error.message);
      }
      
      // Log supplémentaire pour diagnostiquer
      console.error('💡 Le client devrait automatiquement créer une nouvelle session');
      console.error('💡 Statistiques Socket.IO:', {
        totalClients: io.engine.clients.size,
        timestamp: new Date().toISOString()
      });
    }
    
    // Si c'est une erreur 502, c'est probablement un problème de reverse proxy
    if (res.statusCode === 502) {
      console.error('⚠️ Erreur 502: Problème de reverse proxy ou serveur Node.js inaccessible');
      console.error('💡 Vérifiez que le serveur Node.js est bien démarré et que le reverse proxy peut y accéder');
      console.error('💡 Vérifiez les timeouts du reverse proxy (doivent être >= 120s)');
    }
  }
  
  // Gérer les erreurs de session expirée de manière plus gracieuse
  res.on('error', (error) => {
    console.error('❌ Erreur de réponse Socket.io:', error.message);
    console.error('URL:', req.url);
    console.error('SID:', sid);
  });
});

// Helper pour wrapper les handlers Socket.io avec gestion d'erreur
function safeHandler(handler) {
  return function(...args) {
    try {
      return handler.apply(this, args);
    } catch (error) {
      console.error('❌ Erreur dans handler Socket.io:', error);
      console.error('Stack:', error.stack);
      // Ne pas faire planter le serveur, juste logger
      if (args[0] && typeof args[0].emit === 'function') {
        try {
          args[0].emit('error', { message: 'Internal server error' });
        } catch (emitError) {
          console.error('❌ Impossible d\'émettre l\'erreur:', emitError);
        }
      }
    }
  };
}

// Gestion des connexions Socket.io
io.on('connection', (socket) => {
  // Monitoring des connexions Socket.io
  socketConnectionCount++;
  console.log(`✅ User connected: ${socket.id} (Total: ${socketConnectionCount})`);
  console.log(`📍 Socket transport: ${socket.conn.transport.name}, readyState: ${socket.conn.readyState}`);
  
  // Heartbeat pour maintenir la connexion active (aligné avec pingInterval)
  // Note: Socket.IO gère déjà son propre heartbeat, mais on peut ajouter un ping custom si nécessaire
  const heartbeatInterval = setInterval(() => {
    if (socket.connected) {
      socket.emit('ping', { timestamp: Date.now() });
    } else {
      clearInterval(heartbeatInterval);
    }
  }, 25000); // Ping toutes les 25 secondes (aligné avec pingInterval serveur)
  
  // Nettoyer l'intervalle à la déconnexion
  socket.on('disconnect', safeHandler((reason) => {
    clearInterval(heartbeatInterval);
    socketDisconnectionCount++;
    console.log(`⚠️ User disconnected: ${socket.id}, Reason: ${reason} (Total: ${socketDisconnectionCount})`);
  }));
  
  // Gérer les erreurs de connexion avec plus de détails
  socket.conn.on('error', (err) => {
    console.error('❌ Erreur de connexion pour socket', socket.id, ':', err.message);
    console.error('Type:', err.type);
    if (err.description) {
      console.error('Description:', err.description);
    }
    // Si c'est une erreur de transport, ne pas faire planter le socket
    // Socket.IO gérera automatiquement la reconnexion
  });
  
  // Gérer les erreurs dans les handlers Socket.io
  socket.on('error', (err) => {
    console.error('❌ Erreur Socket.io pour socket', socket.id, ':', err.message);
    if (err.stack) {
      console.error('Stack:', err.stack);
    }
  });
  
  // Gérer les déconnexions avec plus de détails
  socket.conn.on('close', (reason) => {
    console.log(`⚠️ Socket ${socket.id} connection closed:`, reason);
  });
  
  // Gérer les reconnexions (si le transport se reconnecte)
  socket.conn.on('upgrade', () => {
    console.log(`⬆️ Socket ${socket.id} transport upgraded`);
  });

  // Créer une nouvelle room
  socket.on('create-room', safeHandler((data) => {
    const roomId = nanoid(8);
    const text = getRandomText();
    
    const room = {
      id: roomId,
      text: text,
      players: [],
      status: 'waiting', // waiting, playing, finished
      startTime: null,
      results: {},
      chatMessages: [] // Historique du chat pour la room
    };
    
    rooms.set(roomId, room);
    socket.join(roomId);
    
    socket.emit('room-created', { roomId, text });
    console.log(`Room created: ${roomId}`);
  }));

  // Helper pour trouver un joueur existant dans une room (pour reconnexions)
  function findExistingPlayer(room, userId, playerName) {
    return room.players.find(p => {
      if (userId && p.userId) return p.userId === userId;
      if (!userId && !p.userId) return p.name === playerName;
      return false;
    });
  }

  // Rejoindre une room
  socket.on('join-room', safeHandler((data) => {
    const { roomId, playerName, userId } = data;
    console.log(`🔌 Tentative de rejoindre la room ${roomId} par ${playerName} (${userId || 'guest'})`);
    
    // Validation basique
    if (!roomId) {
      socket.emit('error', { message: 'Room ID is required' });
      return;
    }
    
    const room = rooms.get(roomId);
    if (!room) {
      socket.emit('error', { message: 'Room not found' });
      return;
    }
    
    // CAS SPÉCIAL : Rooms de matchmaking
    // Pour les rooms matchmaking, join-room est utilisé SEULEMENT pour les reconnexions
    // Les nouveaux joueurs arrivent via matchmaking-match-found (déjà dans la room)
    if (room.matchmaking) {
      const existingPlayer = findExistingPlayer(room, userId, playerName);
      if (existingPlayer) {
        // RECONNEXION : Le joueur existe déjà dans la room matchmaking
        existingPlayer.id = socket.id;
        players.set(socket.id, { roomId, player: existingPlayer });
        socket.join(roomId);
        socket.emit('room-joined', { roomId, text: room.text, players: room.players, chatMessages: room.chatMessages || [] });
        if (room.status === 'finished' && room.results) {
          socket.emit('game-finished', { results: room.results, players: room.players, eloChanges: room.eloChanges || {} });
        } else if (room.status === 'playing') {
          // Si la partie est en cours, renvoyer l'état actuel
          socket.emit('game-started', { 
            startTime: room.startTime, 
            text: room.text,
            mode: room.mode,
            timerDuration: room.timerDuration,
            difficulty: room.difficulty
          });
        }
        console.log(`Player ${playerName} reconnected to matchmaking room ${roomId}`);
        return;
      } else {
        // NOUVEAU JOUEUR tentant de rejoindre une room matchmaking
        // Cela ne devrait pas arriver normalement, mais on refuse pour éviter les problèmes
        console.warn(`⚠️ Tentative de rejoindre une room matchmaking par un joueur non autorisé: ${playerName}`);
        socket.emit('error', { message: 'Cannot join matchmaking room. Players are already assigned.' });
        return;
      }
    }
    
    // CAS SIMPLE : Room normale (non-matchmaking) en attente
    // C'est le cas principal pour les duels 1v1 simples
    if (!room.matchmaking && room.status === 'waiting') {
      // Vérifier si déjà dans la room (reconnexion)
      const existingPlayer = findExistingPlayer(room, userId, playerName);
      if (existingPlayer) {
        existingPlayer.id = socket.id;
        players.set(socket.id, { roomId, player: existingPlayer });
        socket.join(roomId);
        socket.emit('room-joined', { roomId, text: room.text, players: room.players, chatMessages: room.chatMessages || [] });
        console.log(`Player ${playerName} reconnected to room ${roomId}`);
        return;
      }
      
      // Vérifier si la room est pleine (max 2 joueurs pour 1v1)
      if (room.players.length >= 2) {
        socket.emit('error', { message: 'Room is full' });
        return;
      }
      
      // Ajouter le joueur (cas simple)
      const player = {
        id: socket.id,
        userId: userId || null,
        name: playerName || `Player ${room.players.length + 1}`,
        progress: 0,
        wpm: 0,
        accuracy: 100,
        finished: false,
        finishTime: null
      };
      
      room.players.push(player);
      players.set(socket.id, { roomId, player });
      socket.join(roomId);
      socket.emit('room-joined', { roomId, text: room.text, players: room.players, chatMessages: room.chatMessages || [] });
      io.to(roomId).emit('player-joined', { players: room.players });
      console.log(`Player ${playerName} joined room ${roomId}`);
      return;
    }
    
    // CAS : Reconnexion pendant le jeu (pour les deux types de rooms)
    if (room.status === 'playing') {
      const existingPlayer = findExistingPlayer(room, userId, playerName);
      if (existingPlayer) {
        existingPlayer.id = socket.id;
        if (existingPlayer.disconnected !== undefined) {
          existingPlayer.disconnected = false;
        }
        players.set(socket.id, { roomId, player: existingPlayer });
        socket.join(roomId);
        socket.emit('room-joined', { roomId, text: room.text, players: room.players, chatMessages: room.chatMessages || [] });
        socket.emit('game-started', { 
          startTime: room.startTime, 
          text: room.text,
          mode: room.mode,
          timerDuration: room.timerDuration,
          difficulty: room.difficulty
        });
        console.log(`Player ${playerName} reconnected to playing room ${roomId}`);
        return;
      }
      socket.emit('error', { message: 'Game is already in progress' });
      return;
    }
    
    // CAS : Room terminée (voir les résultats)
    if (room.status === 'finished') {
      const existingPlayer = findExistingPlayer(room, userId, playerName);
      if (existingPlayer) {
        existingPlayer.id = socket.id;
        players.set(socket.id, { roomId, player: existingPlayer });
        socket.join(roomId);
        socket.emit('room-joined', { roomId, text: room.text, players: room.players, chatMessages: room.chatMessages || [] });
        if (room.results) {
          socket.emit('game-finished', { results: room.results, players: room.players, eloChanges: room.eloChanges || {} });
        }
        console.log(`Player ${playerName} reconnected to finished room ${roomId}`);
        return;
      }
      // Permettre à n'importe qui de voir les résultats (lecture seule)
      socket.join(roomId);
      socket.emit('room-joined', { roomId, text: room.text, players: room.players, chatMessages: room.chatMessages || [] });
      if (room.results) {
        socket.emit('game-finished', { results: room.results, players: room.players, eloChanges: room.eloChanges || {} });
      }
      console.log(`Player ${playerName} joined finished room ${roomId} to view results`);
      return;
    }
    
    // État inattendu
    socket.emit('error', { message: 'Room is not available' });
  }));

  // Démarrer la partie
  socket.on('start-game', safeHandler((data) => {
    const { roomId, language = 'en', mode = 'timer', timerDuration = 60, difficulty = 'medium' } = data;
    const room = rooms.get(roomId);
    
    if (!room || room.status !== 'waiting') return;
    if (room.players.length < 2) return;
    
    let newText = '';
    
    // Générer le texte selon le mode
    if (mode === 'phrases') {
      // Mode phrases : générer plusieurs phrases selon la difficulté
      const phraseCount = difficulty === 'easy' ? 15 : difficulty === 'medium' ? 20 : difficulty === 'hard' ? 25 : 30;
      newText = generatePhraseTextForLanguage(language, difficulty, phraseCount);
    } else {
      // Mode timer : générer un texte long comme Solo
      newText = generateTextForLanguage(language, 300); // 300 mots pour avoir assez de texte
    }
    
    room.text = newText;
    room.language = language;
    room.mode = mode;
    room.timerDuration = mode === 'timer' ? timerDuration : null;
    room.difficulty = mode === 'phrases' ? difficulty : null;
    
    room.status = 'playing';
    room.startTime = Date.now();
    
    io.to(roomId).emit('game-started', { 
      startTime: room.startTime, 
      text: newText,
      mode: mode,
      timerDuration: room.timerDuration,
      difficulty: room.difficulty
    });
    
    console.log(`Game started in room ${roomId}`);
  }));

  // Mettre à jour la progression
  // NOTE: Ce handler est appelé très fréquemment (à chaque frappe)
  // IMPORTANT: Throttling côté serveur pour éviter de surcharger la connexion Socket.io
  // Avec le polling, chaque message doit être envoyé via HTTP, donc on limite la fréquence
  const updateProgressThrottle = new Map(); // Map<socketId, { lastEmit: number, timeout: NodeJS.Timeout }>
  
  socket.on('update-progress', (data) => {
    const playerData = players.get(socket.id);
    if (!playerData) return;
    
    const { roomId } = playerData;
    const room = rooms.get(roomId);
    if (!room || room.status !== 'playing') return;
    
    const player = room.players.find(p => p.id === socket.id);
    if (!player) return;
    
    // Mise à jour immédiate des données du joueur (toujours à jour)
    player.progress = data.progress;
    player.wpm = data.wpm || 0;
    player.accuracy = data.accuracy || 100;
    
    // Throttling côté serveur : envoyer les mises à jour maximum toutes les 500ms
    // Cela évite de surcharger la connexion Socket.io avec le polling
    const now = Date.now();
    const throttleData = updateProgressThrottle.get(socket.id);
    
    if (!throttleData || (now - throttleData.lastEmit) >= 500) {
      // Envoyer immédiatement si c'est la première fois ou si 500ms se sont écoulées
      socket.to(roomId).emit('opponent-update', {
        playerId: socket.id,
        progress: player.progress,
        wpm: player.wpm,
        accuracy: player.accuracy
      });
      
      if (throttleData && throttleData.timeout) {
        clearTimeout(throttleData.timeout);
      }
      
      updateProgressThrottle.set(socket.id, { lastEmit: now, timeout: null });
    } else {
      // Programmer une mise à jour différée si on est dans la fenêtre de throttling
      if (throttleData.timeout) {
        clearTimeout(throttleData.timeout);
      }
      
      const delay = 500 - (now - throttleData.lastEmit);
      throttleData.timeout = setTimeout(() => {
        socket.to(roomId).emit('opponent-update', {
          playerId: socket.id,
          progress: player.progress,
          wpm: player.wpm,
          accuracy: player.accuracy
        });
        updateProgressThrottle.set(socket.id, { lastEmit: Date.now(), timeout: null });
      }, delay);
    }
  });
  
  // Nettoyer le throttling à la déconnexion
  socket.on('disconnect', () => {
    const throttleData = updateProgressThrottle.get(socket.id);
    if (throttleData && throttleData.timeout) {
      clearTimeout(throttleData.timeout);
    }
    updateProgressThrottle.delete(socket.id);
  });

  // Finir la partie
  socket.on('finish-game', async (data) => {
    const playerData = players.get(socket.id);
    if (!playerData) return;
    
    const { roomId } = playerData;
    const room = rooms.get(roomId);
    if (!room || room.status !== 'playing') return;
    
    const player = room.players.find(p => p.id === socket.id);
    if (!player) return;
    
    player.finished = true;
    player.finishTime = Date.now() - room.startTime;
    player.wpm = data.wpm || 0;
    player.accuracy = data.accuracy || 100;
    
    room.results[socket.id] = {
      wpm: player.wpm,
      accuracy: player.accuracy,
      time: player.finishTime
    };
    
    // Vérifier si tous les joueurs ont terminé
    const allFinished = room.players.every(p => p.finished);
    
    if (allFinished) {
      room.status = 'finished';
      
      // Mettre à jour les résultats du match (incluant les changements d'ELO uniquement pour ranked)
      let eloChanges = {};
      // Seulement mettre à jour l'ELO pour les matchs ranked
      if (room.ranked && room.matchmaking && room.players.some(p => p.userId)) {
        // updateMatchResults calcule et enregistre les changements d'ELO, et les retourne
        eloChanges = await updateMatchResults(room).catch(err => {
          console.error('Error updating match results:', err);
          return {};
        });
      } else if (room.matchmaking && !room.ranked) {
        // Pour unrated, enregistrer le match sans mettre à jour l'ELO
        await recordUnratedMatch(room).catch(err => {
          console.error('Error recording unrated match:', err);
        });
      }
      
      // Stocker les changements d'ELO dans la room pour les reconnexions (vide pour unrated)
      room.eloChanges = eloChanges;
      
      io.to(roomId).emit('game-finished', { results: room.results, players: room.players, eloChanges });
      
      // La room sera supprimée automatiquement quand les deux joueurs se déconnecteront
      // (géré dans le handler disconnect)
    } else {
      socket.to(roomId).emit('opponent-finished', {
        playerId: socket.id,
        wpm: player.wpm,
        accuracy: player.accuracy,
        time: player.finishTime
      });
    }
  });

  // Fonction pour mettre à jour MMR et stats après un match
  // Retourne un objet avec les changements d'ELO pour chaque joueur
  async function updateMatchResults(room) {
    if (room.players.length !== 2) return {};
    
    const [player1, player2] = room.players;
    const result1 = room.results[player1.id];
    const result2 = room.results[player2.id];
    
    if (!result1 || !result2 || !player1.userId || !player2.userId) return {};
    
    // Déterminer le gagnant (meilleur WPM, en cas d'égalité meilleure accuracy)
    let player1Won = false;
    if (result1.wpm > result2.wpm) {
      player1Won = true;
    } else if (result1.wpm === result2.wpm) {
      player1Won = result1.accuracy > result2.accuracy;
    }
    
    // Récupérer les utilisateurs
    const user1 = await getUserById(player1.userId);
    const user2 = await getUserById(player2.userId);
    
    if (!user1 || !user2) return {};
    
    const language = room.language || 'en';
    const mmr1 = user1.getMMR(language);
    const mmr2 = user2.getMMR(language);
    
    // Calculer les nouveaux MMR
    const newMMR1 = calculateNewMMR(mmr1, mmr2, player1Won);
    const newMMR2 = calculateNewMMR(mmr2, mmr1, !player1Won);
    
    // Mettre à jour les MMR
    user1.updateMMR(language, newMMR1);
    user2.updateMMR(language, newMMR2);
    
    // Mettre à jour les stats
    user1.updateStats({
      won: player1Won,
      wpm: result1.wpm,
      accuracy: result1.accuracy
    });
    
    user2.updateStats({
      won: !player1Won,
      wpm: result2.wpm,
      accuracy: result2.accuracy
    });
    
    // Sauvegarder dans la base de données
    await updateUser(user1);
    await updateUser(user2);
    
    // Calculer les changements d'ELO
    const eloChange1 = newMMR1 - mmr1;
    const eloChange2 = newMMR2 - mmr2;
    
    // Retourner les changements d'ELO indexés par socket.id
    const eloChanges = {
      [player1.id]: eloChange1,
      [player2.id]: eloChange2
    };
    
    // Enregistrer le match avec les changements d'ELO
    await recordMatch({
      type: 'battle',
      language: language,
      players: [{
        userId: user1.id,
        username: user1.username,
        wpm: result1.wpm,
        accuracy: result1.accuracy,
        won: player1Won,
        eloBefore: mmr1,
        eloAfter: newMMR1,
        eloChange: eloChange1
      }, {
        userId: user2.id,
        username: user2.username,
        wpm: result2.wpm,
        accuracy: result2.accuracy,
        won: !player1Won,
        eloBefore: mmr2,
        eloAfter: newMMR2,
        eloChange: eloChange2
      }]
    });
    
    console.log(`Match results updated: ${user1.username} (${mmr1} → ${newMMR1}) vs ${user2.username} (${mmr2} → ${newMMR2}), Winner: ${player1Won ? user1.username : user2.username}`);
    
    return eloChanges;
  }

  // Fonction pour enregistrer un match unrated (sans mettre à jour l'ELO)
  async function recordUnratedMatch(room) {
    if (room.players.length !== 2) return;
    
    const [player1, player2] = room.players;
    const result1 = room.results[player1.id];
    const result2 = room.results[player2.id];
    
    if (!result1 || !result2) return;
    
    // Déterminer le gagnant (meilleur WPM, en cas d'égalité meilleure accuracy)
    let player1Won = false;
    if (result1.wpm > result2.wpm) {
      player1Won = true;
    } else if (result1.wpm === result2.wpm) {
      player1Won = result1.accuracy > result2.accuracy;
    }
    
    const language = room.language || 'en';
    
    // Enregistrer le match sans changements d'ELO
    await recordMatch({
      type: 'battle',
      language: language,
      players: [{
        userId: player1.userId || null,
        username: player1.name,
        wpm: result1.wpm,
        accuracy: result1.accuracy,
        won: player1Won,
        eloBefore: null,
        eloAfter: null,
        eloChange: null
      }, {
        userId: player2.userId || null,
        username: player2.name,
        wpm: result2.wpm,
        accuracy: result2.accuracy,
        won: !player1Won,
        eloBefore: null,
        eloAfter: null,
        eloChange: null
      }]
    });
    
    console.log(`Unrated match recorded: ${player1.name} vs ${player2.name}, Winner: ${player1Won ? player1.name : player2.name}`);
  }

  // MATCHMAKING SYSTEM - Optimisé avec buckets MMR
  // Rejoindre la queue de matchmaking
  socket.on('join-matchmaking', async (data) => {
    const { userId, username, language = 'en', mmr = 1000, ranked = true } = data;
    const queueName = ranked ? 'ranked' : 'unrated';
    
    // Vérifier si déjà dans la queue
    if (matchmakingQueue.hasPlayer(socket.id)) {
      socket.emit('matchmaking-error', { message: 'Already in queue' });
      return;
    }
    
    // Pour ranked, exiger un userId (pas de guests)
    if (ranked && !userId) {
      socket.emit('matchmaking-error', { message: 'Must be logged in for ranked matches' });
      return;
    }
    
    // Préparer les données du joueur
    const playerData = {
      userId: userId || null,
      username: username || null, // Pour les guests (unrated uniquement)
      mmr: parseInt(mmr) || 1000,
      language,
      socketId: socket.id,
      joinedAt: Date.now(),
      ranked
    };
    
    // Ajouter à la queue optimisée (système de buckets)
    const added = matchmakingQueue.addPlayer(language, queueName, socket.id, playerData);
    
    if (!added) {
      socket.emit('matchmaking-error', { message: 'Failed to join queue' });
      return;
    }
    
    socket.emit('matchmaking-joined', { language, mmr, ranked });
    console.log(`Player ${userId || username || 'guest'} joined ${queueName} matchmaking queue (${language}, MMR: ${mmr}) - Queue size: ${matchmakingQueue.getQueueSizeFor(language, queueName)}`);
    
    // Chercher un match (optimisé avec buckets)
    findMatch(socket.id, language, mmr, ranked);
  });

  // Quitter la queue de matchmaking
  socket.on('leave-matchmaking', () => {
    const left = matchmakingQueue.removePlayer(socket.id);
    if (left) {
      socket.emit('matchmaking-left');
      console.log(`Player left matchmaking queue: ${socket.id} - Queue size: ${matchmakingQueue.getQueueSize()}`);
    }
  });

  // Fonction pour trouver un match (optimisée avec buckets MMR)
  function findMatch(socketId, language, mmr, ranked) {
    const player = matchmakingQueue.getPlayer(socketId);
    if (!player) {
      console.warn(`⚠️ Player not found in queue: ${socketId}`);
      return;
    }
    
    // Pour ranked : chercher un adversaire avec un MMR similaire (±200)
    // Pour unrated : chercher avec une plage plus large (±500) pour trouver plus facilement
    const MMR_RANGE = ranked ? 200 : 500;
    
    // Utiliser le système de buckets optimisé (O(1) au lieu de O(n))
    const bestMatch = matchmakingQueue.findMatch(socketId, MMR_RANGE);
    
    // Si un match est trouvé, créer une room
    if (bestMatch) {
      createMatchmakingRoom(socketId, player, bestMatch.socketId, bestMatch.player, language, ranked);
    } else {
      // Pas de match trouvé immédiatement, mais le joueur reste dans la queue
      // Le matchmaking sera réessayé quand un autre joueur rejoint
    }
  }

  // Créer une room depuis le matchmaking
  async function createMatchmakingRoom(socketId1, player1, socketId2, player2, language, ranked = true) {
    // Retirer les joueurs de la queue optimisée
    matchmakingQueue.removePlayer(socketId1);
    matchmakingQueue.removePlayer(socketId2);
    
    // Récupérer les noms d'utilisateurs
    const user1 = player1.userId ? await getUserById(player1.userId) : null;
    const user2 = player2.userId ? await getUserById(player2.userId) : null;
    
    // Créer une nouvelle room
    const roomId = nanoid(8);
    const text = getRandomText();
    
    const room = {
      id: roomId,
      text: text,
      players: [],
      status: 'waiting',
      startTime: null,
      results: {},
      language: language,
      matchmaking: true,
      ranked: ranked, // Indicateur si c'est un match ranked ou unrated
      chatMessages: [] // Historique du chat pour la room
    };
    
    rooms.set(roomId, room);
    
    // Ajouter les joueurs à la room
    // Utiliser username pour les guests, sinon utiliser user.username
    const player1Data = {
      id: socketId1,
      userId: player1.userId || null,
      name: user1 ? user1.username : (player1.username || `Guest ${socketId1.substring(0, 4)}`),
      progress: 0,
      wpm: 0,
      accuracy: 100,
      finished: false,
      finishTime: null
    };
    
    const player2Data = {
      id: socketId2,
      userId: player2.userId || null,
      name: user2 ? user2.username : (player2.username || `Guest ${socketId2.substring(0, 4)}`),
      progress: 0,
      wpm: 0,
      accuracy: 100,
      finished: false,
      finishTime: null
    };
    
    room.players.push(player1Data, player2Data);
    
    // Rejoindre les sockets à la room
    const socket1 = io.sockets.sockets.get(socketId1);
    const socket2 = io.sockets.sockets.get(socketId2);
    
    if (socket1) {
      socket1.join(roomId);
      players.set(socketId1, { roomId, player: player1Data });
      socket1.emit('matchmaking-match-found', { roomId, text, players: room.players, ranked: ranked });
    }
    
    if (socket2) {
      socket2.join(roomId);
      players.set(socketId2, { roomId, player: player2Data });
      socket2.emit('matchmaking-match-found', { roomId, text, players: room.players, ranked: ranked });
    }
    
    // Démarrer automatiquement après 3 secondes
    setTimeout(() => {
      if (room.status === 'waiting' && room.players.length === 2) {
        room.status = 'playing';
        room.startTime = Date.now();
        io.to(roomId).emit('game-started', { startTime: room.startTime });
      }
    }, 3000);
    
    console.log(`Matchmaking match created: Room ${roomId} with players ${player1Data.name} and ${player2Data.name}`);
  }

  // COMPETITION SYSTEM
  // Obtenir la liste des compétitions disponibles
  socket.on('get-competitions', () => {
    const activeCompetitions = Array.from(competitions.values())
      .filter(comp => comp.status === 'waiting' || comp.status === 'starting')
      .map(comp => ({
        id: comp.id,
        language: comp.language,
        playerCount: comp.players.length,
        maxPlayers: comp.maxPlayers,
        status: comp.status
      }));
    
    socket.emit('competitions-list', activeCompetitions);
  });

  // Rejoindre une compétition
  socket.on('join-competition', (data) => {
    const { competitionId, userId, username } = data;
    const competition = competitions.get(competitionId);
    
    if (!competition) {
      socket.emit('competition-error', { message: 'Competition not found' });
      return;
    }
    
    if (competition.status !== 'waiting' && competition.status !== 'starting') {
      socket.emit('competition-error', { message: 'Competition already started or finished' });
      return;
    }
    
    if (competition.players.length >= competition.maxPlayers) {
      socket.emit('competition-error', { message: 'Competition is full' });
      return;
    }
    
    // Vérifier si déjà dans la compétition
    if (competition.players.some(p => p.id === socket.id)) {
      socket.emit('competition-error', { message: 'Already in this competition' });
      return;
    }
    
    const player = {
      id: socket.id,
      userId: userId || null,
      name: username || `Player ${competition.players.length + 1}`,
      progress: 0,
      wpm: 0,
      accuracy: 100,
      finished: false,
      finishTime: null,
      position: 0
    };
    
    competition.players.push(player);
    players.set(socket.id, { competitionId, player });
    
    socket.join(competitionId);
    socket.emit('competition-joined', {
      competitionId,
      text: competition.text,
      players: competition.players,
      status: competition.status
    });
    
    io.to(competitionId).emit('competition-updated', {
      players: competition.players,
      status: competition.status
    });
    
    console.log(`Player ${username || socket.id} joined competition ${competitionId}`);
  });

  // Créer une nouvelle compétition
  socket.on('create-competition', (data) => {
    const { language = 'en', maxPlayers = 50, userId, username } = data;
    const competitionId = nanoid(8);
    const text = getRandomText();
    
    const competition = {
      id: competitionId,
      text: text,
      players: [],
      status: 'waiting',
      startTime: null,
      results: {},
      language: language,
      maxPlayers: Math.min(maxPlayers, 100) // Limite à 100 joueurs max
    };
    
    // Ajouter automatiquement le créateur
    const player = {
      id: socket.id,
      userId: userId || null,
      name: username || `Player 1`,
      progress: 0,
      wpm: 0,
      accuracy: 100,
      finished: false,
      finishTime: null,
      position: 0
    };
    
    competition.players.push(player);
    players.set(socket.id, { competitionId, player });
    
    competitions.set(competitionId, competition);
    socket.join(competitionId);
    
    socket.emit('competition-created', { 
      competitionId, 
      text,
      players: competition.players,
      status: competition.status
    });
    console.log(`Competition created: ${competitionId} (${language}, max: ${maxPlayers}) by ${username || socket.id}`);
  });

  // Démarrer une compétition (automatique après un délai ou manuel)
  socket.on('start-competition', (data) => {
    const { competitionId } = data;
    const competition = competitions.get(competitionId);
    
    if (!competition || competition.status !== 'waiting') return;
    
    // Commencer le compte à rebours
    competition.status = 'starting';
    io.to(competitionId).emit('competition-starting', { countdown: 5 });
    
    let countdown = 5;
    const countdownInterval = setInterval(() => {
      countdown--;
      if (countdown > 0) {
        io.to(competitionId).emit('competition-countdown', { countdown });
      } else {
        clearInterval(countdownInterval);
        
        // Démarrer la compétition
        competition.status = 'playing';
        competition.startTime = Date.now();
        
        io.to(competitionId).emit('competition-started', {
          startTime: competition.startTime,
          text: competition.text
        });
        
        console.log(`Competition ${competitionId} started with ${competition.players.length} players`);
      }
    }, 1000);
  });

  // Mettre à jour la progression dans une compétition
  // NOTE: Ce handler est appelé très fréquemment (à chaque frappe)
  // Il est optimisé pour être rapide : seulement des lookups et une mise à jour du leaderboard
  // Le throttling est géré côté client pour éviter de bloquer le thread principal
  socket.on('competition-progress', (data) => {
    const playerData = players.get(socket.id);
    if (!playerData || !playerData.competitionId) return;
    
    const competition = competitions.get(playerData.competitionId);
    if (!competition || competition.status !== 'playing') return;
    
    const player = competition.players.find(p => p.id === socket.id);
    if (!player || player.finished) return;
    
    // Mise à jour rapide des données du joueur
    player.progress = data.progress || 0;
    player.wpm = data.wpm || 0;
    player.accuracy = data.accuracy || 100;
    
    // Envoyer le classement mis à jour (opération légère)
    // Le client gère le throttling pour éviter les problèmes de performance
    updateCompetitionLeaderboard(competition);
  });

  // Finir une compétition
  socket.on('competition-finished', async (data) => {
    const playerData = players.get(socket.id);
    if (!playerData || !playerData.competitionId) return;
    
    const competition = competitions.get(playerData.competitionId);
    if (!competition || competition.status !== 'playing') return;
    
    const player = competition.players.find(p => p.id === socket.id);
    if (!player || player.finished) return;
    
    player.finished = true;
    player.finishTime = Date.now() - competition.startTime;
    player.wpm = data.wpm || 0;
    player.accuracy = data.accuracy || 100;
    
    competition.results[socket.id] = {
      wpm: player.wpm,
      accuracy: player.accuracy,
      time: player.finishTime
    };
    
    // Mettre à jour le classement
    updateCompetitionLeaderboard(competition);
    
    // Vérifier si tous les joueurs ont terminé
    const allFinished = competition.players.every(p => p.finished);
    if (allFinished) {
      competition.status = 'finished';
      
      // Mettre à jour les stats et enregistrer les matchs pour les joueurs connectés
      const leaderboard = getCompetitionLeaderboard(competition);
      const language = competition.language || 'en';
      
      // Préparer les données des joueurs pour l'enregistrement du match (utiliser le leaderboard trié)
      const competitionPlayersPromises = leaderboard
        .filter(p => p.userId)
        .map(async (p, index) => {
          const user = await getUserById(p.userId);
          const position = index + 1;
          const won = position <= 3;
          return {
            userId: p.userId,
            username: user ? user.username : p.name,
            wpm: p.wpm,
            accuracy: p.accuracy,
            won: won,
            position: position
          };
        });
      
      const competitionPlayers = await Promise.all(competitionPlayersPromises);
      
      // Enregistrer le match une seule fois pour toute la compétition
      if (competitionPlayers.length > 0) {
        await recordMatch({
          type: 'competition',
          language: language,
          players: competitionPlayers
        });
      }
      
      // Mettre à jour les stats de chaque joueur
      for (const playerData of competitionPlayers) {
        const user = await getUserById(playerData.userId);
        if (user) {
          user.updateStats({
            type: 'competition',
            won: playerData.won,
            wpm: playerData.wpm,
            accuracy: playerData.accuracy
          });
          await updateUser(user);
        }
      }
      
      io.to(competition.id).emit('competition-ended', {
        leaderboard: leaderboard
      });
    }
  });

  // Fonction pour mettre à jour le classement d'une compétition
  function updateCompetitionLeaderboard(competition) {
    const leaderboard = getCompetitionLeaderboard(competition);
    io.to(competition.id).emit('competition-leaderboard', { leaderboard });
  }

  // Fonction pour obtenir le classement d'une compétition
  function getCompetitionLeaderboard(competition) {
    return competition.players
      .map((player, index) => ({
        ...player,
        position: index + 1
      }))
      .sort((a, b) => {
        if (a.finished && !b.finished) return -1;
        if (!a.finished && b.finished) return 1;
        if (a.finished && b.finished) {
          // Les joueurs finis sont classés par WPM puis accuracy
          if (b.wpm !== a.wpm) return b.wpm - a.wpm;
          return b.accuracy - a.accuracy;
        }
        // Les joueurs en cours sont classés par progression puis WPM
        if (b.progress !== a.progress) return b.progress - a.progress;
        return b.wpm - a.wpm;
      })
      .map((player, index) => ({
        ...player,
        position: index + 1
      }));
  }

  // Déconnexion
  socket.on('disconnect', () => {
    // Retirer de la queue de matchmaking optimisée
    const wasInQueue = matchmakingQueue.hasPlayer(socket.id);
    if (wasInQueue) {
      matchmakingQueue.removePlayer(socket.id);
      console.log(`Player ${socket.id} removed from matchmaking queue - Queue size: ${matchmakingQueue.getQueueSize()}`);
    }
    
    const playerData = players.get(socket.id);
    if (playerData) {
      // Gérer les rooms 1v1
      if (playerData.roomId) {
        const room = rooms.get(playerData.roomId);
        if (room) {
          // Ne pas retirer le joueur de la liste si la partie est terminée
          // Cela permet de garder les résultats visibles
          if (room.status !== 'finished') {
            room.players = room.players.filter(p => p.id !== socket.id);
          } else {
            // Pour les rooms finished, marquer le joueur comme déconnecté mais le garder dans la liste
            const player = room.players.find(p => p.id === socket.id);
            if (player) {
              player.disconnected = true;
            }
            
            // Vérifier si tous les joueurs sont déconnectés
            // Compter les joueurs encore connectés
            const connectedPlayers = room.players.filter(p => {
              const playerSocket = io.sockets.sockets.get(p.id);
              return playerSocket && playerSocket.connected;
            });
            
            // Si aucun joueur n'est connecté, supprimer la room
            if (connectedPlayers.length === 0) {
              rooms.delete(playerData.roomId);
              console.log(`Finished room ${playerData.roomId} deleted - all players disconnected`);
              return; // Sortir tôt car la room n'existe plus
            } else {
              console.log(`Player disconnected from finished room ${playerData.roomId}, ${connectedPlayers.length} player(s) still connected`);
            }
          }
          
          // Pour les rooms non-finished, vérifier si on doit supprimer
          if (room.status !== 'finished' && room.players.length === 0) {
            if (room.matchmaking) {
              // Délai de grâce pour les rooms matchmaking (reconnexion possible)
              setTimeout(() => {
                const checkRoom = rooms.get(playerData.roomId);
                if (checkRoom && checkRoom.players.length === 0 && checkRoom.status !== 'finished') {
                  rooms.delete(playerData.roomId);
                  console.log(`Matchmaking room ${playerData.roomId} deleted after grace period`);
                }
              }, 30000); // 30 secondes
            } else {
              // Suppression immédiate pour les rooms normales (pas finished)
              rooms.delete(playerData.roomId);
              console.log(`Normal room ${playerData.roomId} deleted (empty and not finished)`);
            }
          } else {
            // Notifier les autres joueurs seulement si la partie n'est pas terminée
            if (room.status !== 'finished') {
              io.to(playerData.roomId).emit('player-left', { players: room.players });
            }
          }
        }
      }
      
      // Gérer les compétitions
      if (playerData.competitionId) {
        const competition = competitions.get(playerData.competitionId);
        if (competition) {
          competition.players = competition.players.filter(p => p.id !== socket.id);
          if (competition.players.length === 0 && competition.status !== 'playing') {
            competitions.delete(playerData.competitionId);
          } else {
            io.to(playerData.competitionId).emit('competition-updated', {
              players: competition.players,
              status: competition.status
            });
          }
        }
      }
      
      players.delete(socket.id);
    }
    
    console.log('User disconnected:', socket.id);
  });
});

// Exporter onlineUsers pour utilisation dans les routes
export { onlineUsers };

const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0'; // Écouter sur toutes les interfaces pour Plesk

// Logger avant de démarrer le serveur
console.log('🚀 Tentative de démarrage du serveur HTTP...');
console.log(`📍 Port: ${PORT}, Host: ${HOST}`);
console.log(`⚠️ Si vous avez plusieurs applications Node.js sur ce serveur, vérifiez que les ports sont différents`);

// Démarrer le serveur avec gestion d'erreur
try {
  httpServer.listen(PORT, HOST, () => {
    console.log(`✅ Serveur démarré sur ${HOST}:${PORT}`);
    console.log(`📡 Socket.io configuré (polling uniquement)`);
  }).on('error', (error) => {
    console.error('❌ Erreur lors du démarrage du serveur:', error);
    console.error('Code erreur:', error.code);
    console.error('Message:', error.message);
    if (error.code === 'EADDRINUSE') {
      console.error(`⚠️ Le port ${PORT} est déjà utilisé. Vérifiez votre configuration Plesk.`);
    } else if (error.code === 'EACCES') {
      console.error(`⚠️ Permission refusée pour le port ${PORT}. Vérifiez les permissions.`);
    }
    process.exit(1);
  });
  
  // Gérer les erreurs du serveur HTTP après démarrage
  httpServer.on('error', (error) => {
    console.error('❌ Erreur HTTP serveur:', error);
    console.error('Code:', error.code);
    console.error('Stack:', error.stack);
    // Ne pas faire planter le serveur, juste logger
  });
  
  // Gérer les erreurs de connexion
  httpServer.on('clientError', (error, socket) => {
    console.error('❌ Erreur client HTTP:', error.message);
    // Ne pas logger toutes les erreurs client (peut être très verbeux)
    if (error.code !== 'ECONNRESET' && error.code !== 'EPIPE') {
      console.error('Code:', error.code);
    }
    socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
  });
  
  // Monitoring de la santé du serveur
let requestCount = 0;
let errorCount = 0;
let socketConnectionCount = 0;
let socketDisconnectionCount = 0;

app.use((req, res, next) => {
  requestCount++;
  // Logger toutes les 100 requêtes pour monitoring
  if (requestCount % 100 === 0) {
    console.log(`📊 Statistiques serveur: ${requestCount} requêtes, ${errorCount} erreurs`);
    console.log(`📡 Socket.io: ${socketConnectionCount} connexions, ${socketDisconnectionCount} déconnexions`);
  }
  next();
});

// Logger les erreurs de requête
app.use((err, req, res, next) => {
  errorCount++;
  console.error('❌ Erreur dans une requête:', err.message);
  console.error('URL:', req.url);
  if (err.stack && process.env.NODE_ENV !== 'production') {
    console.error('Stack:', err.stack);
  }
  res.status(500).json({ error: 'Internal server error' });
});

// Monitoring Socket.io
io.engine.on('connection_error', (err) => {
  console.error('❌ Erreur de connexion Socket.io:', err.message);
  console.error('Code:', err.code);
  console.error('Context:', err.context);
});

} catch (error) {
  console.error('❌ Erreur fatale lors de la configuration du serveur:', error);
  console.error('Stack:', error.stack);
  process.exit(1);
}
