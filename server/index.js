// Charger les variables d'environnement en premier
import dotenv from 'dotenv';
dotenv.config();

console.log('🚀 Démarrage du serveur...');

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
// import helmet from 'helmet'; // Temporairement désactivé
import { nanoid } from 'nanoid';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

console.log('📦 Imports de base chargés');

import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import rankingsRoutes from './routes/rankings.js';
import meRoutes from './routes/me.js';
import friendsRoutes, { setOnlineUsers } from './routes/friends.js';
import matchesRoutes from './routes/matches.js';
import discordRoutes from './routes/discord.js';
import ogImageRoutes from './routes/og-image.js';

console.log('📦 Routes importées');

import { getUserById, recordMatch, updateUser, getAllUsers } from './db.js';
// Système ELO amélioré activé : K-factor adaptatif selon le nombre de matchs et le niveau
// Plus précis que ELO standard, meilleure adaptation pour nouveaux joueurs
import { calculateNewMMR } from './utils/eloImproved.js';
import { invalidateRankingsCache } from './utils/rankingsCache.js';
import { MatchmakingQueue } from './utils/matchmakingQueue.js';
import { initSocketNotifications } from './utils/socketNotifications.js';
import logger from './utils/logger.js';

console.log('📦 Tous les imports chargés');

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const httpServer = createServer(app);

// Configuration Socket.io simple
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || (process.env.NODE_ENV === 'production' ? 'https://typingpvp.com' : 'http://localhost:5173'),
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['polling'],
  allowUpgrades: false
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

// Headers de sécurité avec Helmet
// TEMPORAIRE: Désactivation de Helmet pour diagnostiquer les erreurs 500
// TODO: Réactiver Helmet une fois le problème résolu
// app.use(helmet({
//   contentSecurityPolicy: {
//     directives: {
//       defaultSrc: ["'self'"],
//       styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
//       fontSrc: ["'self'", "https://fonts.gstatic.com"],
//       scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://www.googletagmanager.com", "https://www.google-analytics.com", "https://pagead2.googlesyndication.com"],
//       imgSrc: ["'self'", "data:", "https://www.google-analytics.com", "https://www.googletagmanager.com", "https://typingpvp.com", "https://*.googleusercontent.com", "https://*.discordapp.net", "https://*.discord.com"],
//       connectSrc: [
//         "'self'",
//         "https://www.google-analytics.com",
//         "https://www.googletagmanager.com",
//         "ws://localhost:3001",
//         "wss://typingpvp.com",
//         "wss://localhost:3001",
//         "http://localhost:5173"
//       ],
//       frameSrc: ["'self'", "https://www.youtube.com", "https://buymeacoffee.com", "https://googleads.g.doubleclick.net", "https://tpc.googlesyndication.com"],
//       mediaSrc: ["'self'"],
//       objectSrc: ["'none'"],
//       upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
//     },
//   },
//   crossOriginEmbedderPolicy: false,
//   crossOriginResourcePolicy: { policy: "cross-origin" },
//   hsts: {
//     maxAge: 31536000,
//     includeSubDomains: true,
//     preload: true
//   }
// }));

// Headers de sécurité de base sans Helmet (temporaire pour diagnostic)
app.use((req, res, next) => {
  // Headers de sécurité de base
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

app.use(cors(corsOptions));
app.use(express.json());

// Middleware pour logger les requêtes API
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    logger.debug(`📡 ${req.method} ${req.path}`);
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

/**
 * Helpers d'erreur Socket.IO.
 * Objectif: renvoyer un message clair + un code pour un debug rapide côté client.
 */
function emitSocketError(socket, code, message, context = {}) {
  socket.emit('error', { code, message, ...context });
}

function emitStartError(socket, code, message, context = {}) {
  socket.emit('start-error', { code, message, ...context });
}

function emitMatchmakingError(socket, code, message, context = {}) {
  socket.emit('matchmaking-error', { code, message, ...context });
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

/**
 * Génère un texte "phrases" côté serveur.
 * IMPORTANT: Implémentation fallback simple et robuste.
 * Cela évite un crash serveur si le mode "phrases" est sélectionné.
 */
function generatePhraseTextForLanguage(langCode = 'en', difficulty = 'medium', phraseCount = 20) {
  // Fallback: utiliser des phrases existantes, sinon générer des "phrases" à partir de mots.
  const basePhrases = Array.isArray(defaultTexts) && defaultTexts.length > 0
    ? defaultTexts
    : ['TypingPVP is a competitive typing game.'];

  // Ajuster la longueur selon la difficulté (si on doit générer)
  const wordsPerPhrase =
    difficulty === 'easy' ? 8 :
    difficulty === 'medium' ? 12 :
    difficulty === 'hard' ? 16 : 20;

  const phrases = [];
  for (let i = 0; i < phraseCount; i++) {
    const seed = basePhrases[i % basePhrases.length];
    if (typeof seed === 'string' && seed.trim().length > 0) {
      phrases.push(seed.trim());
    } else {
      phrases.push(generateTextForLanguage(langCode, wordsPerPhrase));
    }
  }

  return phrases.join(' ');
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
app.use('/og-image', ogImageRoutes); // Route pour images Open Graph dynamiques

// Configurer onlineUsers dans friendsRoutes
setOnlineUsers(onlineUsers);

app.use('/api/friends', friendsRoutes);
app.use('/api/matches', matchesRoutes);
app.use('/api/discord', discordRoutes);

// Route pour générer le sitemap.xml dynamiquement pour le SEO
// Cette route doit être accessible directement (pas sous /api)
app.get('/sitemap.xml', async (req, res) => {
  try {
    const baseUrl = process.env.CLIENT_URL || 'https://typingpvp.com';
    const currentDate = new Date().toISOString().split('T')[0];
    
    // Pages statiques principales avec priorité et fréquence de changement
    const staticPages = [
      { url: '/', priority: '1.0', changefreq: 'daily' },
      { url: '/rankings', priority: '0.9', changefreq: 'hourly' },
      { url: '/faq', priority: '0.7', changefreq: 'monthly' },
      { url: '/terms', priority: '0.3', changefreq: 'monthly' },
      { url: '/privacy', priority: '0.3', changefreq: 'monthly' },
      { url: '/legal', priority: '0.3', changefreq: 'monthly' }
    ];

    // Langues supportées pour les rankings
    const supportedLanguages = ['en', 'fr', 'es', 'de', 'it', 'pt', 'ru', 'ja', 'zh', 'ko'];
    
    // Ajouter les pages de rankings par langue
    supportedLanguages.forEach(lang => {
      staticPages.push({
        url: `/rankings?lang=${lang}`,
        priority: '0.8',
        changefreq: 'hourly'
      });
    });

    // Récupérer les top utilisateurs pour ajouter leurs profils au sitemap
    // Limiter à 1000 profils pour éviter un sitemap trop volumineux
    let topUsers = [];
    try {
      // Récupérer tous les utilisateurs (ou une fonction optimisée pour les top users)
      // Pour l'instant, on utilise getAllUsers mais on pourrait optimiser avec une query limitée
      const allUsers = await getAllUsers();
      
      // Trier par MMR total (somme de tous les MMR) et prendre les top 1000
      topUsers = allUsers
        .filter(user => user.username && user.username !== 'undefined')
        .map(user => {
          // Calculer le MMR total pour le tri
          const mmr = user.mmr || {};
          const totalMMR = Object.values(mmr).reduce((sum, val) => sum + (val || 0), 0);
          return { ...user, totalMMR };
        })
        .sort((a, b) => (b.totalMMR || 0) - (a.totalMMR || 0))
        .slice(0, 1000);
    } catch (error) {
      logger.warn('Erreur lors de la récupération des utilisateurs pour le sitemap:', error);
      // Continuer sans les profils utilisateurs en cas d'erreur
    }

    // Générer le XML du sitemap
    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
`;

    // Ajouter les pages statiques
    staticPages.forEach(page => {
      sitemap += `  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
`;
    });

    // Ajouter les profils utilisateurs avec lastmod précis
    topUsers.forEach(user => {
      if (user.username && user.username !== 'undefined') {
        // Utiliser updatedAt si disponible, sinon createdAt, sinon date actuelle
        let lastModified = currentDate;
        if (user.updatedAt) {
          lastModified = new Date(user.updatedAt).toISOString().split('T')[0];
        } else if (user.updated_at) {
          lastModified = new Date(user.updated_at).toISOString().split('T')[0];
        } else if (user.createdAt) {
          lastModified = new Date(user.createdAt).toISOString().split('T')[0];
        } else if (user.created_at) {
          lastModified = new Date(user.created_at).toISOString().split('T')[0];
        }
        
        sitemap += `  <url>
    <loc>${baseUrl}/profile/${encodeURIComponent(user.username)}</loc>
    <lastmod>${lastModified}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
`;
      }
    });

    sitemap += `</urlset>`;

    // Définir les headers appropriés pour le XML
    res.set('Content-Type', 'application/xml; charset=utf-8');
    res.set('Cache-Control', 'public, max-age=3600'); // Cache 1 heure
    res.send(sitemap);
  } catch (error) {
    logger.error('Erreur lors de la génération du sitemap:', error);
    res.status(500).send('Error generating sitemap');
  }
});

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
  logger.info('✅ Dossier uploads configuré pour servir les fichiers statiques');
}

// Servir les fichiers statiques du client (frontend) - UNIQUEMENT si SERVE_CLIENT=true
// Par défaut, le client est servi séparément sur un autre port
if (process.env.SERVE_CLIENT === 'true') {
  const clientDistPath = join(__dirname, '..', 'client', 'dist');
  
  // Vérifier que le dossier client/dist existe
  if (!existsSync(clientDistPath)) {
    logger.error('❌ ERREUR: Le dossier client/dist n\'existe pas!');
    logger.error('Le serveur ne peut pas servir le client sans ce dossier.');
    logger.error('Vérifiez que le build du client a été effectué correctement.');
  } else {
    logger.info('✅ Dossier client/dist trouvé, configuration du serveur de fichiers statiques...');
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
      logger.warn(`⚠️ Route API non trouvée: ${req.method} ${req.path}`);
      return res.status(404).json({ error: 'API route not found', path: req.path, method: req.method });
    }
    
    // Servir index.html pour toutes les autres routes (SPA routing)
    const indexPath = join(clientDistPath, 'index.html');
    if (!existsSync(indexPath)) {
      logger.error('❌ ERREUR: index.html non trouvé dans client/dist');
      return res.status(500).json({ error: 'Client not built. Please build the client first.' });
    }
    res.sendFile(indexPath, (err) => {
      if (err) {
        logger.error('Error sending index.html:', err);
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


// Gestion des connexions Socket.io
io.on('connection', (socket) => {
  logger.debug(`✅ User connected: ${socket.id}`);
  
  socket.on('disconnect', (reason) => {
    logger.debug(`⚠️ Socket ${socket.id} connection closed:`, reason);
  });
  
  // Gérer les reconnexions (si le transport se reconnecte)
  socket.conn.on('upgrade', () => {
    logger.debug(`⬆️ Socket ${socket.id} transport upgraded`);
  });

  // Enregistrer un utilisateur comme en ligne (pour les notifications)
  socket.on('register-user', ({ userId }) => {
    if (!userId) return;
    
    // Ajouter le socket à la liste des sockets de cet utilisateur
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId).add(socket.id);
    
    // Notifier les amis que cet utilisateur est en ligne
    // (géré dans friendsRoutes via setOnlineUsers)
  });

  // Créer une nouvelle room
  socket.on('create-room', (data) => {
    const roomId = nanoid(8);
    const text = getRandomText();
    
    const room = {
      id: roomId,
      text: text,
      players: [],
      status: 'waiting', // waiting, playing, finished
      startTime: null,
      results: {},
      chatMessages: [], // Historique du chat pour la room
      createdAt: Date.now() // Timestamp de création pour détecter les rooms trop anciennes
    };
    
    rooms.set(roomId, room);
    socket.join(roomId);
    
    socket.emit('room-created', { roomId, text });
      logger.debug(`Room created: ${roomId}`);
  });

  // Helper pour trouver un joueur existant dans une room (pour reconnexions)
  function findExistingPlayer(room, userId, playerName) {
    return room.players.find(p => {
      if (userId && p.userId) return p.userId === userId;
      if (!userId && !p.userId) return p.name === playerName;
      return false;
    });
  }

  // Rejoindre une room
  socket.on('join-room', (data) => {
    const { roomId, playerName, userId } = data;
    logger.debug(`🔌 Tentative de rejoindre la room ${roomId} par ${playerName} (${userId || 'guest'})`);
    
    // Validation basique
    if (!roomId) {
      // Message clair + code pour debug client.
      emitSocketError(socket, 'ROOM_ID_REQUIRED', 'Room ID is required');
      return;
    }
    
    const room = rooms.get(roomId);
    if (!room) {
      // Room inexistante: informer proprement le client.
      emitSocketError(socket, 'ROOM_NOT_FOUND', 'Room not found');
      return;
    }
    
    // CAS SPÉCIAL : Rooms de matchmaking
    // Pour les rooms matchmaking, join-room est utilisé SEULEMENT pour les reconnexions
    // Les nouveaux joueurs arrivent via matchmaking-match-found (déjà dans la room)
    if (room.matchmaking) {
      // IMPORTANT: Vérifier que la room est dans un état valide
      // Si la room est vide ou dans un état invalide, la supprimer et refuser la connexion
      // Vérifier aussi si la room est trop ancienne (plus de 5 minutes) et la supprimer
      const roomAge = Date.now() - (room.createdAt || Date.now());
      const MAX_ROOM_AGE = 5 * 60 * 1000; // 5 minutes
      
      if (room.players.length === 0 || !room.text || typeof room.text !== 'string' || room.text.trim().length === 0 || roomAge > MAX_ROOM_AGE) {
        logger.warn(`⚠️ Matchmaking room ${roomId} is in invalid state or too old (age=${Math.round(roomAge/1000)}s, empty=${room.players.length === 0}, noText=${!room.text}), deleting it`);
        rooms.delete(roomId);
        emitSocketError(
          socket,
          'MATCHMAKING_ROOM_EXPIRED',
          'Room is no longer available. Please start a new matchmaking.'
        );
        return;
      }
      
      const existingPlayer = findExistingPlayer(room, userId, playerName);
      if (existingPlayer) {
        // RECONNEXION : Le joueur existe déjà dans la room matchmaking
        // Vérifier que le texte est toujours valide
        if (!room.text || typeof room.text !== 'string' || room.text.trim().length === 0) {
          logger.warn(`⚠️ Matchmaking room ${roomId} has invalid text, deleting it`);
          rooms.delete(roomId);
          emitSocketError(
            socket,
            'MATCHMAKING_ROOM_INVALID',
            'Room is no longer available. Please start a new matchmaking.'
          );
          return;
        }
        
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
        logger.debug(`Player ${playerName} reconnected to matchmaking room ${roomId}`);
        return;
      } else {
        // NOUVEAU JOUEUR tentant de rejoindre une room matchmaking
        // Cela ne devrait pas arriver normalement, mais on refuse pour éviter les problèmes
        logger.warn(`⚠️ Tentative de rejoindre une room matchmaking par un joueur non autorisé: ${playerName}`);
        emitSocketError(
          socket,
          'MATCHMAKING_ROOM_LOCKED',
          'Cannot join matchmaking room. Players are already assigned.'
        );
        return;
      }
    }
    
    // CAS SIMPLE : Room normale (non-matchmaking) en attente
    // C'est le cas principal pour les duels 1v1 simples
    if (!room.matchmaking && room.status === 'waiting') {
      // IMPORTANT: Vérifier d'abord si le socket est déjà associé à un joueur dans cette room
      // Cela évite les doublons si join-room est appelé plusieurs fois rapidement
      const existingPlayerBySocket = Array.from(players.entries()).find(
        ([sockId, data]) => sockId === socket.id && data.roomId === roomId
      );
      if (existingPlayerBySocket) {
        // Le socket est déjà associé à un joueur dans cette room
        const [, playerData] = existingPlayerBySocket;
        const playerInRoom = room.players.find(p => p.id === socket.id || 
          (userId && p.userId === userId) || 
          (!userId && p.name === playerName && p.id === socket.id)
        );
        if (playerInRoom) {
          // Le joueur existe déjà dans la room avec ce socket, juste mettre à jour et renvoyer l'état
          socket.join(roomId);
          socket.emit('room-joined', { roomId, text: room.text, players: room.players, chatMessages: room.chatMessages || [] });
          logger.debug(`Socket ${socket.id} already in room ${roomId}, returning current state`);
          return;
        }
      }
      
      // Vérifier si déjà dans la room par userId/playerName (reconnexion avec nouveau socket)
      const existingPlayer = findExistingPlayer(room, userId, playerName);
      if (existingPlayer) {
        // Si le joueur existe déjà (reconnexion), mettre à jour son socket.id
        existingPlayer.id = socket.id;
        // Mettre à jour la map des joueurs
        players.set(socket.id, { roomId, player: existingPlayer });
        socket.join(roomId);
        socket.emit('room-joined', { roomId, text: room.text, players: room.players, chatMessages: room.chatMessages || [] });
        io.to(roomId).emit('player-joined', { players: room.players });
        logger.debug(`Player ${playerName} (${userId || 'guest'}) reconnected/updated in room ${roomId}`);
        return;
      }
      
      // Vérifier si la room est pleine (max 2 joueurs pour 1v1)
      if (room.players.length >= 2) {
        emitSocketError(socket, 'ROOM_FULL', 'Room is full');
        logger.debug(`Room ${roomId} is full (${room.players.length} players)`);
        return;
      }
      
      // IMPORTANT: Vérifier une dernière fois qu'on n'ajoute pas un doublon
      // Cela peut arriver si join-room est appelé deux fois très rapidement
      const duplicateCheck = room.players.find(p => 
        (userId && p.userId === userId) || 
        (!userId && !p.userId && p.name === playerName)
      );
      if (duplicateCheck) {
        // Le joueur existe déjà dans la room, mettre à jour le socket.id et renvoyer l'état
        duplicateCheck.id = socket.id;
        players.set(socket.id, { roomId, player: duplicateCheck });
        socket.join(roomId);
        socket.emit('room-joined', { roomId, text: room.text, players: room.players, chatMessages: room.chatMessages || [] });
        io.to(roomId).emit('player-joined', { players: room.players });
        logger.debug(`Player ${playerName} (${userId || 'guest'}) already in room ${roomId}, updated socket.id`);
        return;
      }
      
      // Ajouter le joueur (cas simple - nouveau joueur)
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
      logger.debug(`Player ${playerName} (${userId || 'guest'}) joined room ${roomId}. Total players: ${room.players.length}`);
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
        logger.debug(`Player ${playerName} reconnected to playing room ${roomId}`);
        return;
      }
      emitSocketError(socket, 'GAME_IN_PROGRESS', 'Game is already in progress');
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
      logger.debug(`Player ${playerName} joined finished room ${roomId} to view results`);
      return;
    }
    
    // État inattendu
    emitSocketError(socket, 'ROOM_NOT_AVAILABLE', 'Room is not available');
  });

  // Démarrer la partie
  socket.on('start-game', (data, ack) => {
    try {
      const { roomId, language = 'en', mode = 'timer', timerDuration = 60, difficulty = 'medium' } = data || {};
      const room = rooms.get(roomId);

      // Log minimal pour diagnostic
      logger.debug(`🎮 start-game request: room=${roomId} by socket=${socket.id} mode=${mode} lang=${language}`);

      if (!room) {
        const message = 'Room not found. Please refresh the page.';
        logger.error(`❌ start-game: Room ${roomId} not found for socket ${socket.id}`);
        emitStartError(socket, 'START_ROOM_NOT_FOUND', message);
        if (typeof ack === 'function') ack({ ok: false, message });
        return;
      }
      
      // IMPORTANT: Vérifier que le socket qui demande le start est bien dans la room
      const playerData = players.get(socket.id);
      if (!playerData || playerData.roomId !== roomId) {
        const message = 'You are not in this room. Please refresh the page.';
        logger.warn(`⚠️ start-game: Socket ${socket.id} not in room ${roomId}`);
        emitStartError(socket, 'START_NOT_IN_ROOM', message);
        if (typeof ack === 'function') ack({ ok: false, message });
        return;
      }
      
      // IMPORTANT: Vérifier que le joueur est le créateur (pour les rooms non-matchmaking)
      // Pour les rooms matchmaking, le start est automatique après 3 secondes
      if (!room.matchmaking) {
        const isCreator = room.players.find(p => p.id === socket.id && p.userId === playerData.player?.userId);
        if (!isCreator && room.players.length > 0) {
          // Vérifier si c'est le premier joueur (créateur)
          const firstPlayer = room.players[0];
          if (firstPlayer.id !== socket.id) {
            const message = 'Only the room creator can start the game.';
            logger.warn(`⚠️ start-game: Socket ${socket.id} is not the creator of room ${roomId}`);
            emitStartError(socket, 'START_NOT_CREATOR', message);
            if (typeof ack === 'function') ack({ ok: false, message });
            return;
          }
        }
      }
      
      if (room.status !== 'waiting') {
        const message = 'Game already started or finished.';
        logger.warn(`⚠️ start-game: Room ${roomId} status=${room.status}, cannot start`);
        emitStartError(socket, 'START_INVALID_STATUS', message);
        if (typeof ack === 'function') ack({ ok: false, message });
        return;
      }
      if (!Array.isArray(room.players) || room.players.length < 2) {
        const message = 'Waiting for opponent to join.';
        logger.warn(`⚠️ start-game: Room ${roomId} has only ${room.players?.length || 0} players`);
        emitStartError(socket, 'START_NEED_TWO_PLAYERS', message);
        if (typeof ack === 'function') ack({ ok: false, message });
        return;
      }

      let newText = '';

      // Générer le texte selon le mode
      try {
        if (mode === 'phrases') {
          const phraseCount = difficulty === 'easy' ? 15 : difficulty === 'medium' ? 20 : difficulty === 'hard' ? 25 : 30;
          newText = generatePhraseTextForLanguage(language, difficulty, phraseCount);
        } else {
          // Mode timer : générer un texte long comme Solo
          newText = generateTextForLanguage(language, 300);
        }
        
        // IMPORTANT: Vérifier que le texte généré est valide
        if (!newText || typeof newText !== 'string' || newText.trim().length === 0) {
          const message = 'Failed to generate game text. Please try again.';
          logger.error(`❌ start-game: Invalid text generated for room ${roomId} (mode=${mode}, lang=${language})`);
          emitStartError(socket, 'START_TEXT_INVALID', message);
          if (typeof ack === 'function') ack({ ok: false, message });
          return;
        }
      } catch (textError) {
        const message = 'Failed to generate game text. Please try again.';
        logger.error(`❌ start-game: Error generating text for room ${roomId}:`, textError);
        emitStartError(socket, 'START_TEXT_ERROR', message);
        if (typeof ack === 'function') ack({ ok: false, message });
        return;
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

      if (typeof ack === 'function') ack({ ok: true });
      logger.debug(`✅ Game started in room ${roomId}`);
    } catch (err) {
      const message = 'Server error while starting the game. Please refresh the page.';
      logger.error('❌ start-game exception:', err);
      emitStartError(socket, 'START_EXCEPTION', message);
      if (typeof ack === 'function') ack({ ok: false, message });
    }
  });

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
    
    // Stocker les résultats complets incluant les erreurs et les caractères si disponibles
    room.results[socket.id] = {
      wpm: player.wpm,
      accuracy: player.accuracy,
      time: player.finishTime,
      errors: data.errors !== undefined ? data.errors : 0,
      characters: data.characters !== undefined ? data.characters : 0
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
          logger.error('Error updating match results:', err);
          return {};
        });
      } else if (room.matchmaking && !room.ranked) {
        // Pour unrated, enregistrer le match sans mettre à jour l'ELO
        await recordUnratedMatch(room).catch(err => {
          logger.error('Error recording unrated match:', err);
        });
      }
      
      // Stocker les changements d'ELO dans la room pour les reconnexions (vide pour unrated)
      room.eloChanges = eloChanges;
      
      io.to(roomId).emit('game-finished', { results: room.results, players: room.players, eloChanges });
      
      // Initialiser le système de rematch
      room.rematchReady = new Set();
      
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

  // Gérer les demandes de rematch
  socket.on('request-rematch', (data) => {
    const playerData = players.get(socket.id);
    if (!playerData) return;
    
    const { roomId } = playerData;
    const room = rooms.get(roomId);
    if (!room || room.status !== 'finished') return;
    
    // Initialiser rematchReady si nécessaire
    if (!room.rematchReady) {
      room.rematchReady = new Set();
    }
    
    // Ajouter le joueur à la liste des joueurs prêts pour le rematch
    room.rematchReady.add(socket.id);
    
    // Informer tous les joueurs de la room qu'un joueur est prêt
    io.to(roomId).emit('rematch-ready', {
      playerId: socket.id,
      ready: true
    });
    
    // Si les deux joueurs sont prêts, démarrer le rematch
    if (room.rematchReady.size === 2 && room.players.length === 2) {
      // Réinitialiser les états de la room pour le rematch
      room.status = 'waiting';
      room.players.forEach(p => {
        p.finished = false;
        p.wpm = 0;
        p.accuracy = 100;
        p.progress = 0;
      });
      room.results = {};
      room.rematchReady.clear();
      
      // Générer un nouveau texte pour le rematch
      const language = room.language || 'en';
      let newText = '';
      
      try {
        if (room.mode === 'timer') {
          // Générer du texte pour le mode timer
          newText = generateTextForLanguage(language, 300);
        } else if (room.mode === 'phrases') {
          // Générer des phrases selon la difficulté
          const difficulty = room.difficulty || 'medium';
          const phraseCount = 20; // Nombre de phrases par défaut
          newText = generatePhraseTextForLanguage(language, difficulty, phraseCount);
        }
      } catch (textError) {
        logger.error(`Error generating text for rematch in room ${roomId}:`, textError);
        io.to(roomId).emit('error', {
          code: 'REMATCH_FAILED',
          message: 'Failed to start rematch. Please try again.'
        });
        room.rematchReady.clear();
        return;
      }
      
      if (!newText) {
        logger.error('Failed to generate text for rematch');
        io.to(roomId).emit('error', {
          code: 'REMATCH_FAILED',
          message: 'Failed to start rematch. Please try again.'
        });
        room.rematchReady.clear();
        return;
      }
      
      room.text = newText;
      room.startTime = Date.now();
      room.status = 'playing';
      
      // Démarrer la partie
      io.to(roomId).emit('rematch-start', {
        text: newText,
        startTime: room.startTime,
        mode: room.mode,
        timerDuration: room.timerDuration,
        difficulty: room.difficulty
      });
      
      logger.debug(`Rematch started in room ${roomId}`);
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
    
    // Récupérer le nombre de matchs pour le K-factor adaptatif
    const matchCount1 = user1.stats?.totalMatches || 0;
    const matchCount2 = user2.stats?.totalMatches || 0;
    
    // Calculer les nouveaux MMR avec K-factor adaptatif (plus précis pour nouveaux joueurs)
    const newMMR1 = calculateNewMMR(mmr1, mmr2, player1Won, matchCount1);
    const newMMR2 = calculateNewMMR(mmr2, mmr1, !player1Won, matchCount2);
    
    // Mettre à jour les MMR
    user1.updateMMR(language, newMMR1);
    user2.updateMMR(language, newMMR2);
    
    // Mettre à jour les stats
    // IMPORTANT: Inclure le type pour que updateStats sache que c'est un match multijoueur
    user1.updateStats({
      type: 'battle', // Indiquer que c'est un match multijoueur
      won: player1Won,
      wpm: result1.wpm,
      accuracy: result1.accuracy
    });
    
    user2.updateStats({
      type: 'battle', // Indiquer que c'est un match multijoueur
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
    
    // Invalider le cache des rankings pour cette langue (les ELO ont changé)
    invalidateRankingsCache(language);
    
    // Log seulement en développement
    if (process.env.NODE_ENV !== 'production') {
      logger.debug(`Match results updated: ${user1.username} (${mmr1} → ${newMMR1}) vs ${user2.username} (${mmr2} → ${newMMR2}), Winner: ${player1Won ? user1.username : user2.username}`);
    }
    
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
    
    logger.debug(`Unrated match recorded: ${player1.name} vs ${player2.name}, Winner: ${player1Won ? player1.name : player2.name}`);
  }

  // MATCHMAKING SYSTEM - Optimisé avec buckets MMR
  // Rejoindre la queue de matchmaking
  socket.on('join-matchmaking', async (data) => {
    const { userId, username, language = 'en', mmr = 1000, ranked = true } = data;
    const queueName = ranked ? 'ranked' : 'unrated';
    
    // Vérifier si déjà dans la queue
    if (matchmakingQueue.hasPlayer(socket.id)) {
      emitMatchmakingError(socket, 'MATCHMAKING_ALREADY_IN_QUEUE', 'Already in queue');
      return;
    }
    
    // Pour ranked, exiger un userId (pas de guests)
    if (ranked && !userId) {
      emitMatchmakingError(
        socket,
        'MATCHMAKING_RANKED_LOGIN_REQUIRED',
        'Must be logged in for ranked matches'
      );
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
      emitMatchmakingError(socket, 'MATCHMAKING_JOIN_FAILED', 'Failed to join queue');
      return;
    }
    
    socket.emit('matchmaking-joined', { language, mmr, ranked });
    logger.debug(`Player ${userId || username || 'guest'} joined ${queueName} matchmaking queue (${language}, MMR: ${mmr}) - Queue size: ${matchmakingQueue.getQueueSizeFor(language, queueName)}`);
    
    // Chercher un match (optimisé avec buckets)
    findMatch(socket.id, language, mmr, ranked);
  });

  // Quitter la queue de matchmaking
  socket.on('leave-matchmaking', () => {
    const left = matchmakingQueue.removePlayer(socket.id);
    if (left) {
      socket.emit('matchmaking-left');
      logger.debug(`Player left matchmaking queue: ${socket.id} - Queue size: ${matchmakingQueue.getQueueSize()}`);
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
      // IMPORTANT: Vérifier que les deux joueurs sont toujours dans la queue avant de créer la room
      // Cela évite les problèmes de race condition si un joueur quitte pendant la recherche
      if (matchmakingQueue.hasPlayer(socketId) && matchmakingQueue.hasPlayer(bestMatch.socketId)) {
        createMatchmakingRoom(socketId, player, bestMatch.socketId, bestMatch.player, language, ranked);
      } else {
        // Un des joueurs a quitté, réessayer pour le joueur restant
        logger.debug(`Match found but one player left queue, retrying for ${socketId}`);
        // Réessayer après un court délai pour éviter les boucles infinies
        setTimeout(() => {
          if (matchmakingQueue.hasPlayer(socketId)) {
            findMatch(socketId, language, mmr, ranked);
          }
        }, 100);
      }
    } else {
      // Pas de match trouvé immédiatement, mais le joueur reste dans la queue
      // Le matchmaking sera réessayé quand un autre joueur rejoint
      logger.debug(`No match found for ${socketId}, waiting in queue`);
    }
  }

  // Créer une room depuis le matchmaking
  async function createMatchmakingRoom(socketId1, player1, socketId2, player2, language, ranked = true) {
    try {
      // IMPORTANT: Vérifier que ce n'est pas le même joueur (même socketId ou même userId)
      if (socketId1 === socketId2) {
        logger.warn(`⚠️ Cannot create matchmaking room: same socket ID (${socketId1})`);
        matchmakingQueue.removePlayer(socketId1);
        return;
      }
      
      // Vérifier que ce n'est pas le même utilisateur avec deux sockets différents
      if (player1.userId && player2.userId && player1.userId === player2.userId) {
        logger.warn(`⚠️ Cannot create matchmaking room: same user ID (${player1.userId}) with different sockets`);
        matchmakingQueue.removePlayer(socketId1);
        matchmakingQueue.removePlayer(socketId2);
        return;
      }
      
      // IMPORTANT: Vérifier que les deux joueurs sont toujours dans la queue avant de créer la room
      // Cela évite les problèmes si un joueur a quitté entre-temps
      if (!matchmakingQueue.hasPlayer(socketId1) || !matchmakingQueue.hasPlayer(socketId2)) {
        logger.warn(`⚠️ Cannot create matchmaking room: one or both players left queue (${socketId1}, ${socketId2})`);
        // Retirer les joueurs restants de la queue s'ils sont encore là
        if (matchmakingQueue.hasPlayer(socketId1)) {
          matchmakingQueue.removePlayer(socketId1);
        }
        if (matchmakingQueue.hasPlayer(socketId2)) {
          matchmakingQueue.removePlayer(socketId2);
        }
        return;
      }
      
      // IMPORTANT: Vérifier que les sockets sont toujours connectés
      const socket1 = io.sockets.sockets.get(socketId1);
      const socket2 = io.sockets.sockets.get(socketId2);
      if (!socket1 || !socket2 || !socket1.connected || !socket2.connected) {
        logger.warn(`⚠️ Cannot create matchmaking room: one or both sockets disconnected (${socketId1}, ${socketId2})`);
        matchmakingQueue.removePlayer(socketId1);
        matchmakingQueue.removePlayer(socketId2);
        return;
      }
      
      // Retirer les joueurs de la queue optimisée
      matchmakingQueue.removePlayer(socketId1);
      matchmakingQueue.removePlayer(socketId2);
      
      // Récupérer les noms d'utilisateurs
      const user1 = player1.userId ? await getUserById(player1.userId) : null;
      const user2 = player2.userId ? await getUserById(player2.userId) : null;
    
    // Créer une nouvelle room avec un ID unique
    const roomId = nanoid(8);
    // IMPORTANT: Générer un texte long selon la langue choisie (comme pour Solo)
    // Utiliser generateTextForLanguage pour générer un texte de 300 mots (suffisant pour 60 secondes)
    // C'est le même type de texte que l'écran d'accueil (Solo)
    let text = '';
    try {
      text = generateTextForLanguage(language, 300);
      
      // Vérifier que le texte est valide (non vide, string)
      if (!text || typeof text !== 'string' || text.trim().length === 0) {
        logger.error(`❌ Failed to generate valid text for matchmaking room (language: ${language})`);
        // Notifier les joueurs de l'erreur
        if (socket1) {
          emitMatchmakingError(
            socket1,
            'MATCHMAKING_CREATE_FAILED',
            'Failed to create match. Please try again.'
          );
        }
        if (socket2) {
          emitMatchmakingError(
            socket2,
            'MATCHMAKING_CREATE_FAILED',
            'Failed to create match. Please try again.'
          );
        }
        return;
      }
    } catch (textError) {
      logger.error(`❌ Error generating text for matchmaking room (language: ${language}):`, textError);
      // Notifier les joueurs de l'erreur
      if (socket1) {
        emitMatchmakingError(
          socket1,
          'MATCHMAKING_CREATE_FAILED',
          'Failed to create match. Please try again.'
        );
      }
      if (socket2) {
        emitMatchmakingError(
          socket2,
          'MATCHMAKING_CREATE_FAILED',
          'Failed to create match. Please try again.'
        );
      }
      return;
    }
    
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
      mode: 'timer', // Mode par défaut pour matchmaking (timer)
      timerDuration: 60, // Durée par défaut pour matchmaking (60 secondes)
      difficulty: null, // Pas de difficulté pour le mode timer
      chatMessages: [], // Historique du chat pour la room
      createdAt: Date.now() // Timestamp de création pour détecter les rooms trop anciennes
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
    
    // IMPORTANT: Vérifier à nouveau que les sockets sont toujours connectés avant de les ajouter
    // Cela évite d'ajouter des sockets déconnectés à la room
    const socket1Final = io.sockets.sockets.get(socketId1);
    const socket2Final = io.sockets.sockets.get(socketId2);
    
    if (!socket1Final || !socket2Final || !socket1Final.connected || !socket2Final.connected) {
      logger.warn(`⚠️ Cannot add players to matchmaking room: one or both sockets disconnected`);
      // Nettoyer la room créée
      rooms.delete(roomId);
      // Notifier les joueurs s'ils sont encore connectés
      if (socket1Final && socket1Final.connected) {
        emitMatchmakingError(
          socket1Final,
          'MATCHMAKING_OPPONENT_DISCONNECTED',
          'Opponent disconnected. Please try again.'
        );
      }
      if (socket2Final && socket2Final.connected) {
        emitMatchmakingError(
          socket2Final,
          'MATCHMAKING_OPPONENT_DISCONNECTED',
          'Opponent disconnected. Please try again.'
        );
      }
      return;
    }
    
    // Rejoindre les sockets à la room
    socket1Final.join(roomId);
    players.set(socketId1, { roomId, player: player1Data });
    socket1Final.emit('matchmaking-match-found', { roomId, text, players: room.players, ranked: ranked });
    
    socket2Final.join(roomId);
    players.set(socketId2, { roomId, player: player2Data });
    socket2Final.emit('matchmaking-match-found', { roomId, text, players: room.players, ranked: ranked });
    
      // Démarrer automatiquement après 3 secondes
      setTimeout(() => {
        const currentRoom = rooms.get(roomId);
        if (!currentRoom) {
          logger.warn(`⚠️ Room ${roomId} not found when trying to start game`);
          return;
        }
        
        // IMPORTANT: Vérifier que la room est toujours valide avant de démarrer
        // Vérifier que le texte existe et est valide
        if (!currentRoom.text || typeof currentRoom.text !== 'string' || currentRoom.text.trim().length === 0) {
          logger.error(`❌ Cannot start matchmaking game: room ${roomId} has invalid text`);
          // Nettoyer la room et notifier les joueurs
          rooms.delete(roomId);
          io.to(roomId).emit('matchmaking-error', {
            code: 'MATCHMAKING_GAME_TEXT_INVALID',
            message: 'Game text is invalid. Please start a new matchmaking.'
          });
          return;
        }
        
        if (currentRoom.status === 'waiting' && currentRoom.players.length === 2) {
          // Vérifier que les deux joueurs sont toujours connectés
          const connectedPlayers = currentRoom.players.filter(p => {
            const playerSocket = io.sockets.sockets.get(p.id);
            return playerSocket && playerSocket.connected;
          });
          
          if (connectedPlayers.length < 2) {
            logger.warn(`⚠️ Cannot start matchmaking game: not all players connected (${connectedPlayers.length}/2)`);
            // Nettoyer la room si un joueur s'est déconnecté
            rooms.delete(roomId);
            io.to(roomId).emit('matchmaking-error', {
              code: 'MATCHMAKING_OPPONENT_DISCONNECTED',
              message: 'Opponent disconnected. Please start a new matchmaking.'
            });
            return;
          }
          
          currentRoom.status = 'playing';
          currentRoom.startTime = Date.now();
          // Envoyer toutes les informations nécessaires pour game-started
          // IMPORTANT: Inclure le texte, le mode, etc. pour que le client puisse démarrer correctement
          io.to(roomId).emit('game-started', { 
            startTime: currentRoom.startTime,
            text: currentRoom.text, // Inclure le texte généré
            mode: 'timer', // Mode par défaut pour matchmaking (timer)
            timerDuration: 60, // Durée par défaut pour matchmaking (60 secondes)
            difficulty: null // Pas de difficulté pour le mode timer
          });
          logger.debug(`✅ Matchmaking game started in room ${roomId}`);
        } else {
          logger.warn(`⚠️ Cannot start matchmaking game: room ${roomId} status=${currentRoom.status}, players=${currentRoom.players.length}`);
        }
      }, 3000);
      
      logger.debug(`✅ Matchmaking match created: Room ${roomId} with players ${player1Data.name} and ${player2Data.name}`);
    } catch (error) {
      logger.error(`❌ Error creating matchmaking room:`, error);
      // En cas d'erreur, retirer les joueurs de la queue et notifier
      matchmakingQueue.removePlayer(socketId1);
      matchmakingQueue.removePlayer(socketId2);
      
      const socket1 = io.sockets.sockets.get(socketId1);
      const socket2 = io.sockets.sockets.get(socketId2);
      
      if (socket1) {
        emitMatchmakingError(
          socket1,
          'MATCHMAKING_CREATE_EXCEPTION',
          'Failed to create match. Please try again.'
        );
      }
      if (socket2) {
        emitMatchmakingError(
          socket2,
          'MATCHMAKING_CREATE_EXCEPTION',
          'Failed to create match. Please try again.'
        );
      }
    }
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
    
    logger.debug(`Player ${username || socket.id} joined competition ${competitionId}`);
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
    logger.debug(`Competition created: ${competitionId} (${language}, max: ${maxPlayers}) by ${username || socket.id}`);
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
        
        logger.debug(`Competition ${competitionId} started with ${competition.players.length} players`);
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
    // Retirer de la liste des utilisateurs en ligne
    for (const [userId, socketIds] of onlineUsers.entries()) {
      if (socketIds.has(socket.id)) {
        socketIds.delete(socket.id);
        // Si plus aucun socket pour cet utilisateur, retirer de la map
        if (socketIds.size === 0) {
          onlineUsers.delete(userId);
        }
      }
    }
    
    // Retirer de la queue de matchmaking optimisée
    const wasInQueue = matchmakingQueue.hasPlayer(socket.id);
    if (wasInQueue) {
      matchmakingQueue.removePlayer(socket.id);
      logger.debug(`Player ${socket.id} removed from matchmaking queue - Queue size: ${matchmakingQueue.getQueueSize()}`);
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
              logger.debug(`Finished room ${playerData.roomId} deleted - all players disconnected`);
              return; // Sortir tôt car la room n'existe plus
            } else {
              logger.debug(`Player disconnected from finished room ${playerData.roomId}, ${connectedPlayers.length} player(s) still connected`);
            }
          }
          
          // Pour les rooms non-finished, vérifier si on doit supprimer
          if (room.status !== 'finished' && room.players.length === 0) {
            if (room.matchmaking) {
              // IMPORTANT: Pour les rooms matchmaking vides, supprimer immédiatement
              // Le délai de grâce n'est pas nécessaire car si les deux joueurs ont quitté,
              // la room ne peut plus être utilisée et doit être supprimée
              // Cela évite qu'un joueur soit redirigé vers une ancienne room vide
              rooms.delete(playerData.roomId);
              logger.debug(`Matchmaking room ${playerData.roomId} deleted immediately (empty and not finished)`);
            } else {
              // Suppression immédiate pour les rooms normales (pas finished)
              rooms.delete(playerData.roomId);
              logger.debug(`Normal room ${playerData.roomId} deleted (empty and not finished)`);
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
    
    logger.debug('User disconnected:', socket.id);
  });
});

// Initialiser les notifications Socket.io pour les routes (après la définition de onlineUsers)
initSocketNotifications(io, onlineUsers);

// Exporter onlineUsers pour utilisation dans les routes
export { onlineUsers };

const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0'; // Écouter sur toutes les interfaces pour Plesk

console.log(`🔧 Configuration: PORT=${PORT}, HOST=${HOST}`);
console.log(`🔧 NODE_ENV=${process.env.NODE_ENV || 'development'}`);

// Démarrer le serveur
console.log('🚀 Tentative de démarrage du serveur...');

try {
  httpServer.listen(PORT, HOST, () => {
    console.log(`✅ Serveur démarré sur ${HOST}:${PORT}`);
    logger.info(`✅ Serveur démarré sur ${HOST}:${PORT}`);
  }).on('error', (error) => {
    logger.error('❌ Erreur lors du démarrage du serveur:', error);
    logger.error('Code erreur:', error.code);
    logger.error('Message:', error.message);
    if (error.code === 'EADDRINUSE') {
      logger.error(`⚠️ Le port ${PORT} est déjà utilisé. Vérifiez votre configuration Plesk.`);
    } else if (error.code === 'EACCES') {
      logger.error(`⚠️ Permission refusée pour le port ${PORT}. Vérifiez les permissions.`);
    }
    process.exit(1);
  });
  
  // Gérer les erreurs du serveur HTTP après démarrage
  httpServer.on('error', (error) => {
    logger.error('❌ Erreur HTTP serveur:', error);
    logger.error('Code:', error.code);
    logger.error('Stack:', error.stack);
    // Ne pas faire planter le serveur, juste logger
  });
  
  // Gérer les erreurs de connexion
  httpServer.on('clientError', (error, socket) => {
    console.error('❌ Erreur client HTTP:', error.message);
    // Ne pas logger toutes les erreurs client (peut être très verbeux)
    if (error.code !== 'ECONNRESET' && error.code !== 'EPIPE') {
      logger.error('Code:', error.code);
    }
    socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
  });
  
// Logger les erreurs de requête
app.use((err, req, res, next) => {
  logger.error('❌ Erreur:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

} catch (error) {
  logger.error('❌ Erreur fatale lors de la configuration du serveur:', error);
  logger.error('Stack:', error.stack);
  process.exit(1);
}
