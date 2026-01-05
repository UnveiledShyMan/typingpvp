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

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const httpServer = createServer(app);

// Configuration Socket.io - optimisée pour Plesk/Apache
// Plesk tue les connexions long-running, donc on utilise des timeouts très courts

// Configuration CORS pour Socket.io - accepter les connexions depuis le même domaine en production
const allowedSocketOrigins = [
  process.env.CLIENT_URL,
  'https://typingpvp.com',
  'http://localhost:5173',
  'http://localhost:3000'
].filter(Boolean);

// En production, accepter aussi les connexions depuis le même domaine (même origine)
const socketCorsConfig = {
  origin: function (origin, callback) {
    // En développement ou si pas d'origine (connexion directe), permettre
    if (process.env.NODE_ENV === 'development' || !origin) {
      return callback(null, true);
    }
    
    // Vérifier si l'origine est dans la liste autorisée
    const isAllowed = allowedSocketOrigins.some(allowed => {
      // Comparer les domaines (sans protocole et port)
      const allowedDomain = allowed.replace(/^https?:\/\//, '').split(':')[0];
      const originDomain = origin.replace(/^https?:\/\//, '').split(':')[0];
      return originDomain === allowedDomain || origin.includes(allowedDomain);
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn('⚠️ Origine non autorisée pour Socket.io:', origin);
      // En production, permettre quand même si c'est le même domaine
      callback(null, true);
    }
  },
  methods: ["GET", "POST"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
};

const io = new Server(httpServer, {
  cors: socketCorsConfig,
  // Forcer polling uniquement pour éviter les problèmes avec Plesk/Apache qui tue les connexions long-running
  transports: ['polling'],
  allowUpgrades: false,
  // Timeouts très courts pour éviter que Plesk tue les connexions
  // Plesk vérifie les connexions long-running, donc on doit être très agressif
  pingTimeout: 10000, // 10 secondes (réduit de 20s)
  pingInterval: 5000, // 5 secondes (réduit de 10s) - heartbeat plus fréquent
  // Permettre les reconnexions rapides
  connectTimeout: 10000, // 10 secondes (réduit de 20s)
  // Réduire la taille du buffer pour éviter les timeouts
  maxHttpBufferSize: 1e6, // 1MB au lieu de la valeur par défaut
  // Forcer la fermeture des connexions inactives rapidement
  allowEIO3: true,
  // Compression désactivée pour réduire la latence
  compression: false
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

// Middleware pour logger les requêtes API et Socket.io (toujours actif pour diagnostic)
// IMPORTANT: Ce middleware doit être AVANT la route catch-all pour ne pas bloquer Socket.io
app.use((req, res, next) => {
  // Logger les requêtes API
  if (req.path.startsWith('/api')) {
    console.log(`📡 ${req.method} ${req.path}`, {
      origin: req.headers.origin,
      query: Object.keys(req.query).length > 0 ? req.query : undefined
    });
  }
  // Logger les requêtes Socket.io pour le débogage en production
  if (req.path.startsWith('/socket.io/')) {
    // Logger toutes les requêtes Socket.io en production pour diagnostic
    if (process.env.NODE_ENV === 'production') {
      console.log(`🔌 Socket.io ${req.method} ${req.path}`, {
        origin: req.headers.origin,
        host: req.headers.host,
        transport: req.query?.transport || 'polling',
        sid: req.query?.sid || 'new'
      });
    }
    // Logger les erreurs avec un wrapper sur res.send
    const originalSend = res.send;
    res.send = function(data) {
      if (res.statusCode >= 400) {
        console.error(`❌ Requête Socket.io échouée: ${req.method} ${req.path}`, {
          statusCode: res.statusCode,
          origin: req.headers.origin,
          host: req.headers.host,
          query: req.query
        });
      }
      return originalSend.call(this, data);
    };
  }
  next();
});

// Stockage des rooms en mémoire
const rooms = new Map();
const players = new Map();

// Système de matchmaking (queues séparées pour ranked et unrated)
const rankedMatchmakingQueue = new Map(); // Map<socketId, { userId, username, mmr, language, socketId, joinedAt }>
const unratedMatchmakingQueue = new Map(); // Map<socketId, { userId, username, mmr, language, socketId, joinedAt }>

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
      transports: ['polling'],
      path: '/socket.io/'
    },
    cors: {
      allowedOrigins: allowedSocketOrigins,
      currentOrigin: req.headers.origin
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
    if (req.path.startsWith('/socket.io/')) {
      // Laisser Socket.io gérer ces requêtes
      return next();
    }
    
    // Ne pas intercepter les routes API - elles devraient déjà être traitées par les routes définies avant
    if (req.path.startsWith('/api')) {
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
// Cette route permet de vérifier que Socket.io est accessible
// IMPORTANT: Cette route doit être AVANT la route catch-all
app.get('/socket.io/test', (req, res) => {
  res.json({ 
    message: 'Socket.io endpoint is accessible',
    socketIoPath: '/socket.io/',
    transports: ['polling'],
    cors: {
      allowedOrigins: allowedSocketOrigins,
      currentOrigin: req.headers.origin
    },
    server: {
      nodeEnv: process.env.NODE_ENV || 'development',
      clientUrl: process.env.CLIENT_URL || 'not set'
    }
  });
});

// Gestion des erreurs Socket.io avec logs détaillés
io.engine.on('connection_error', (err) => {
  console.error('❌ Erreur de connexion Socket.io:', err.message);
  console.error('Code:', err.code);
  if (err.req) {
    console.error('URL:', err.req.url);
    console.error('SID:', err.req._query?.sid);
    console.error('Transport demandé:', err.req._query?.transport);
    console.error('Origin:', err.req.headers?.origin);
    console.error('Host:', err.req.headers?.host);
    
    // Gérer spécifiquement l'erreur "Transport unknown"
    if (err.message && err.message.includes('Transport unknown')) {
      console.error('⚠️ Transport inconnu détecté - Le client essaie d\'utiliser un transport non autorisé');
      console.error('⚠️ Transports autorisés: polling uniquement');
      console.error('⚠️ Transport demandé:', err.req._query?.transport || 'non spécifié');
    }
  }
  if (err.context) {
    console.error('Context:', err.context);
  }
  // Ne pas faire planter le serveur pour une erreur de connexion
});

// Logger les tentatives de connexion réussies avec plus de détails
io.engine.on('connection', (req) => {
  console.log('🔌 Connexion Socket.io établie:', {
    url: req.url,
    transport: req._query?.transport || 'polling',
    origin: req.headers?.origin || 'unknown',
    host: req.headers?.host || 'unknown',
    userAgent: req.headers?.['user-agent']?.substring(0, 50) || 'unknown'
  });
});

// Logger toutes les requêtes Socket.io pour le débogage
io.engine.on('request', (req, res) => {
  // Logger seulement les erreurs pour éviter trop de logs
  if (res.statusCode >= 400) {
    console.error('❌ Requête Socket.io échouée:', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      origin: req.headers?.origin,
      host: req.headers?.host
    });
  }
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
  
  // Heartbeat manuel pour maintenir la connexion active avec Plesk
  // Plesk tue les connexions inactives, donc on envoie un ping toutes les 4 secondes
  const heartbeatInterval = setInterval(() => {
    if (socket.connected) {
      socket.emit('ping', { timestamp: Date.now() });
    } else {
      clearInterval(heartbeatInterval);
    }
  }, 4000); // Ping toutes les 4 secondes
  
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
  });
  
  // Gérer les erreurs dans les handlers Socket.io
  socket.on('error', (err) => {
    console.error('❌ Erreur Socket.io pour socket', socket.id, ':', err.message);
    if (err.stack) {
      console.error('Stack:', err.stack);
    }
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

  // Rejoindre une room
  socket.on('join-room', safeHandler((data) => {
    const { roomId, playerName, userId } = data;
    console.log(`🔌 Tentative de rejoindre la room ${roomId} par ${playerName} (${userId || 'guest'})`);
    
    if (!roomId) {
      console.error('❌ join-room appelé sans roomId');
      socket.emit('error', { message: 'Room ID is required' });
      return;
    }
    
    const room = rooms.get(roomId);
    
    if (!room) {
      console.error(`❌ Room ${roomId} not found`);
      socket.emit('error', { message: 'Room not found' });
      return;
    }
    
    console.log(`✅ Room ${roomId} trouvée, statut: ${room.status}, joueurs: ${room.players.length}`);
    
    // Pour les rooms de matchmaking, vérifier si le joueur fait déjà partie de la room
    if (room.matchmaking && userId) {
      const existingPlayer = room.players.find(p => p.userId === userId);
      if (existingPlayer) {
        // Le joueur fait déjà partie de la room (matchmaking), mettre à jour son socket.id
        existingPlayer.id = socket.id;
        players.set(socket.id, { roomId, player: existingPlayer });
        socket.join(roomId);
        
        // Si la partie est terminée, envoyer aussi les résultats
        if (room.status === 'finished') {
          socket.emit('room-joined', { 
            roomId, 
            text: room.text, 
            players: room.players,
            chatMessages: room.chatMessages || []
          });
          // Envoyer les résultats si disponibles
          if (room.results && Object.keys(room.results).length > 0) {
            socket.emit('game-finished', { 
              results: room.results, 
              players: room.players,
              eloChanges: room.eloChanges || {}
            });
          }
        } else {
          socket.emit('room-joined', { roomId, text: room.text, players: room.players, chatMessages: room.chatMessages || [] });
        }
        console.log(`Player ${playerName} reconnected to matchmaking room ${roomId}`);
        return;
      }
    }
    
    // Si la room est terminée, permettre de rejoindre pour voir les résultats
    if (room.status === 'finished') {
      // Vérifier si le joueur était déjà dans la room (reconnexion)
      // Chercher par userId d'abord, puis par nom si pas de userId
      const existingPlayer = room.players.find(p => {
        if (userId && p.userId) {
          return p.userId === userId;
        }
        if (!userId && !p.userId) {
          return p.name === playerName;
        }
        return false;
      });
      
      if (existingPlayer) {
        // Reconnexion : mettre à jour le socket.id
        existingPlayer.id = socket.id;
        if (existingPlayer.disconnected !== undefined) {
          existingPlayer.disconnected = false; // Marquer comme reconnecté
        }
        players.set(socket.id, { roomId, player: existingPlayer });
        socket.join(roomId);
        socket.emit('room-joined', { 
          roomId, 
          text: room.text, 
          players: room.players,
          chatMessages: room.chatMessages || []
        });
        // Envoyer les résultats
        if (room.results && Object.keys(room.results).length > 0) {
          socket.emit('game-finished', { 
            results: room.results, 
            players: room.players,
            eloChanges: room.eloChanges || {}
          });
        }
        console.log(`Player ${playerName} (${userId || 'guest'}) reconnected to finished room ${roomId}`);
        return;
      }
      
      // Nouveau joueur qui veut voir les résultats (permission de lecture seule)
      // Permettre à n'importe qui de voir les résultats d'une room finished
      socket.join(roomId);
      socket.emit('room-joined', { 
        roomId, 
        text: room.text, 
        players: room.players,
        chatMessages: room.chatMessages || []
      });
      // Envoyer les résultats
      if (room.results && Object.keys(room.results).length > 0) {
        socket.emit('game-finished', { 
          results: room.results, 
          players: room.players,
          eloChanges: room.eloChanges || {}
        });
      }
      console.log(`Player ${playerName} (${userId || 'guest'}) joined finished room ${roomId} to view results`);
      return;
    }
    
    // Vérification normale pour les rooms non-matchmaking en attente
    if (!room.matchmaking && room.status === 'waiting' && room.players.length >= 2) {
      socket.emit('error', { message: 'Room is full' });
      return;
    }
    
    // Ne pas permettre de rejoindre une room en cours de jeu (sauf si c'est une reconnexion)
    if (room.status === 'playing') {
      // Vérifier si c'est une reconnexion du même joueur
      // Chercher par userId d'abord, puis par nom si pas de userId
      const existingPlayer = room.players.find(p => {
        if (userId && p.userId) {
          return p.userId === userId;
        }
        if (!userId && !p.userId) {
          return p.name === playerName;
        }
        return false;
      });
      
      if (existingPlayer) {
        // Reconnexion : mettre à jour le socket.id
        existingPlayer.id = socket.id;
        if (existingPlayer.disconnected !== undefined) {
          existingPlayer.disconnected = false; // Marquer comme reconnecté
        }
        players.set(socket.id, { roomId, player: existingPlayer });
        socket.join(roomId);
        socket.emit('room-joined', { 
          roomId, 
          text: room.text, 
          players: room.players,
          chatMessages: room.chatMessages || []
        });
        // Si la partie est en cours, renvoyer l'état actuel
        if (room.status === 'playing') {
          socket.emit('game-started', { 
            startTime: room.startTime, 
            text: room.text,
            mode: room.mode,
            timerDuration: room.timerDuration,
            difficulty: room.difficulty
          });
        }
        console.log(`Player ${playerName} (${userId || 'guest'}) reconnected to playing room ${roomId}`);
        return;
      } else {
        socket.emit('error', { message: 'Game is already in progress' });
        return;
      }
    }
    
    // Si on arrive ici, la room doit être en 'waiting'
    // Si ce n'est pas le cas, c'est un état inattendu
    if (room.status !== 'waiting') {
      console.error(`Unexpected room status: ${room.status} for room ${roomId}`);
      socket.emit('error', { message: 'Room is not available' });
      return;
    }
    
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
  socket.on('update-progress', (data) => {
    const playerData = players.get(socket.id);
    if (!playerData) return;
    
    const { roomId } = playerData;
    const room = rooms.get(roomId);
    if (!room || room.status !== 'playing') return;
    
    const player = room.players.find(p => p.id === socket.id);
    if (!player) return;
    
    player.progress = data.progress;
    player.wpm = data.wpm || 0;
    player.accuracy = data.accuracy || 100;
    
    // Envoyer la mise à jour aux autres joueurs
    socket.to(roomId).emit('opponent-update', {
      playerId: socket.id,
      progress: player.progress,
      wpm: player.wpm,
      accuracy: player.accuracy
    });
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

  // MATCHMAKING SYSTEM
  // Rejoindre la queue de matchmaking
  socket.on('join-matchmaking', async (data) => {
    const { userId, username, language = 'en', mmr = 1000, ranked = true } = data;
    
    // Sélectionner la bonne queue
    const queue = ranked ? rankedMatchmakingQueue : unratedMatchmakingQueue;
    const queueName = ranked ? 'ranked' : 'unrated';
    
    // Vérifier si déjà dans une queue (ranked ou unrated)
    if (rankedMatchmakingQueue.has(socket.id) || unratedMatchmakingQueue.has(socket.id)) {
      socket.emit('matchmaking-error', { message: 'Already in queue' });
      return;
    }
    
    // Pour ranked, exiger un userId (pas de guests)
    if (ranked && !userId) {
      socket.emit('matchmaking-error', { message: 'Must be logged in for ranked matches' });
      return;
    }
    
    // Ajouter à la queue appropriée
    queue.set(socket.id, {
      userId: userId || null,
      username: username || null, // Pour les guests (unrated uniquement)
      mmr: parseInt(mmr) || 1000,
      language,
      socketId: socket.id,
      joinedAt: Date.now(),
      ranked
    });
    
    socket.emit('matchmaking-joined', { language, mmr, ranked });
    console.log(`Player ${userId || username || 'guest'} joined ${queueName} matchmaking queue (${language}, MMR: ${mmr})`);
    
    // Chercher un match
    findMatch(socket.id, language, mmr, ranked);
  });

  // Quitter la queue de matchmaking
  socket.on('leave-matchmaking', () => {
    let left = false;
    if (rankedMatchmakingQueue.has(socket.id)) {
      rankedMatchmakingQueue.delete(socket.id);
      left = true;
    }
    if (unratedMatchmakingQueue.has(socket.id)) {
      unratedMatchmakingQueue.delete(socket.id);
      left = true;
    }
    if (left) {
      socket.emit('matchmaking-left');
      console.log(`Player left matchmaking queue: ${socket.id}`);
    }
  });

  // Fonction pour trouver un match
  function findMatch(socketId, language, mmr, ranked) {
    const queue = ranked ? rankedMatchmakingQueue : unratedMatchmakingQueue;
    const player = queue.get(socketId);
    if (!player) return;
    
    // Pour ranked : chercher un adversaire avec un MMR similaire (±200)
    // Pour unrated : chercher n'importe quel adversaire avec la même langue
    const MMR_RANGE = ranked ? 200 : Infinity;
    let bestMatch = null;
    let bestMMRDiff = Infinity;
    
    for (const [otherSocketId, otherPlayer] of queue.entries()) {
      if (otherSocketId === socketId) continue;
      if (otherPlayer.language !== language) continue;
      
      const mmrDiff = Math.abs(otherPlayer.mmr - mmr);
      if (mmrDiff <= MMR_RANGE && mmrDiff < bestMMRDiff) {
        bestMatch = { socketId: otherSocketId, player: otherPlayer };
        bestMMRDiff = mmrDiff;
      }
    }
    
    // Si un match est trouvé, créer une room
    if (bestMatch) {
      createMatchmakingRoom(socketId, player, bestMatch.socketId, bestMatch.player, language, ranked);
    }
  }

  // Créer une room depuis le matchmaking
  async function createMatchmakingRoom(socketId1, player1, socketId2, player2, language, ranked = true) {
    // Retirer les joueurs de la queue appropriée
    const queue = ranked ? rankedMatchmakingQueue : unratedMatchmakingQueue;
    queue.delete(socketId1);
    queue.delete(socketId2);
    
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
  socket.on('competition-progress', (data) => {
    const playerData = players.get(socket.id);
    if (!playerData || !playerData.competitionId) return;
    
    const competition = competitions.get(playerData.competitionId);
    if (!competition || competition.status !== 'playing') return;
    
    const player = competition.players.find(p => p.id === socket.id);
    if (!player || player.finished) return;
    
    player.progress = data.progress || 0;
    player.wpm = data.wpm || 0;
    player.accuracy = data.accuracy || 100;
    
    // Envoyer le classement mis à jour
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
    // Retirer de la queue de matchmaking (ranked ou unrated)
    if (rankedMatchmakingQueue.has(socket.id)) {
      rankedMatchmakingQueue.delete(socket.id);
      console.log(`Player ${socket.id} removed from ranked matchmaking queue`);
    }
    if (unratedMatchmakingQueue.has(socket.id)) {
      unratedMatchmakingQueue.delete(socket.id);
      console.log(`Player ${socket.id} removed from unrated matchmaking queue`);
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

// Démarrer le serveur avec gestion d'erreur
try {
  httpServer.listen(PORT, HOST, () => {
    console.log(`✅ Serveur démarré avec succès sur ${HOST}:${PORT}`);
    console.log(`📡 Socket.io configuré avec polling uniquement (compatible Plesk)`);
    console.log(`🌐 Client URL: ${process.env.CLIENT_URL || 'http://localhost:5173'}`);
    console.log(`📦 SERVE_CLIENT: ${process.env.SERVE_CLIENT || 'false'}`);
    console.log(`🔧 NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌍 Origines Socket.io autorisées:`, allowedSocketOrigins);
    console.log(`✅ Le serveur est prêt à accepter les connexions`);
    console.log(`🔍 Test Socket.io: http://${HOST}:${PORT}/socket.io/test`);
    console.log(`🔍 Santé Socket.io: http://${HOST}:${PORT}/api/socket-health`);
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
