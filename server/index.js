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
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true
  },
  // Forcer polling pour compatibilité avec Plesk/nginx
  transports: ['polling'],
  allowUpgrades: false // Empêcher l'upgrade vers WebSocket
});

// Configuration CORS pour accepter les requêtes depuis le frontend
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json());

// Stockage des rooms en mémoire
const rooms = new Map();
const players = new Map();

// Système de matchmaking (queue)
const matchmakingQueue = new Map(); // Map<socketId, { userId, mmr, language, socketId }>

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
  res.json({ status: 'ok' });
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
  // IMPORTANT: Cette route doit être APRÈS toutes les routes API
  app.get('*', (req, res, next) => {
    // Ne pas intercepter les routes API - elles devraient déjà être traitées par les routes définies avant
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ error: 'API route not found' });
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
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      return res.status(404).json({ error: 'Not found. Client is served separately.' });
    }
  });
}

// Gestion des connexions Socket.io
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

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
      chatMessages: [] // Historique du chat pour la room
    };
    
    rooms.set(roomId, room);
    socket.join(roomId);
    
    socket.emit('room-created', { roomId, text });
    console.log(`Room created: ${roomId}`);
  });

  // Rejoindre une room
  socket.on('join-room', (data) => {
    const { roomId, playerName, userId } = data;
    const room = rooms.get(roomId);
    
    if (!room) {
      socket.emit('error', { message: 'Room not found' });
      return;
    }
    
    // Pour les rooms de matchmaking, vérifier si le joueur fait déjà partie de la room
    if (room.matchmaking && userId) {
      const existingPlayer = room.players.find(p => p.userId === userId);
      if (existingPlayer) {
        // Le joueur fait déjà partie de la room (matchmaking), mettre à jour son socket.id
        existingPlayer.id = socket.id;
        players.set(socket.id, { roomId, player: existingPlayer });
        socket.join(roomId);
        socket.emit('room-joined', { roomId, text: room.text, players: room.players });
        console.log(`Player ${playerName} reconnected to matchmaking room ${roomId}`);
        return;
      }
    }
    
    // Vérification normale pour les rooms non-matchmaking
    if (!room.matchmaking && room.players.length >= 2) {
      socket.emit('error', { message: 'Room is full' });
      return;
    }
    
    if (room.status !== 'waiting') {
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
  });

  // Démarrer la partie
  socket.on('start-game', (data) => {
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
  });

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
      
      // Mettre à jour les résultats du match (incluant les changements d'ELO)
      let eloChanges = {};
      if (room.matchmaking || room.players.some(p => p.userId)) {
        // updateMatchResults calcule et enregistre les changements d'ELO, et les retourne
        eloChanges = await updateMatchResults(room).catch(err => {
          console.error('Error updating match results:', err);
          return {};
        });
      }
      
      io.to(roomId).emit('game-finished', { results: room.results, players: room.players, eloChanges });
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

  // MATCHMAKING SYSTEM
  // Rejoindre la queue de matchmaking
  socket.on('join-matchmaking', async (data) => {
    const { userId, username, language = 'en', mmr = 1000 } = data;
    
    // Vérifier si déjà dans la queue
    if (matchmakingQueue.has(socket.id)) {
      socket.emit('matchmaking-error', { message: 'Already in queue' });
      return;
    }
    
    // Ajouter à la queue (userId peut être null pour les guests)
    matchmakingQueue.set(socket.id, {
      userId: userId || null,
      username: username || null, // Pour les guests
      mmr: parseInt(mmr) || 1000,
      language,
      socketId: socket.id,
      joinedAt: Date.now()
    });
    
    socket.emit('matchmaking-joined', { language, mmr });
    console.log(`Player ${userId || username || 'guest'} joined matchmaking queue (${language}, MMR: ${mmr})`);
    
    // Chercher un match
    findMatch(socket.id, language, mmr);
  });

  // Quitter la queue de matchmaking
  socket.on('leave-matchmaking', () => {
    if (matchmakingQueue.has(socket.id)) {
      matchmakingQueue.delete(socket.id);
      socket.emit('matchmaking-left');
      console.log(`Player left matchmaking queue: ${socket.id}`);
    }
  });

  // Fonction pour trouver un match
  function findMatch(socketId, language, mmr) {
    const player = matchmakingQueue.get(socketId);
    if (!player) return;
    
    // Chercher un adversaire avec un MMR similaire (±200)
    const MMR_RANGE = 200;
    let bestMatch = null;
    let bestMMRDiff = Infinity;
    
    for (const [otherSocketId, otherPlayer] of matchmakingQueue.entries()) {
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
      createMatchmakingRoom(socketId, player, bestMatch.socketId, bestMatch.player, language);
    }
  }

  // Créer une room depuis le matchmaking
  async function createMatchmakingRoom(socketId1, player1, socketId2, player2, language) {
    // Retirer les joueurs de la queue
    matchmakingQueue.delete(socketId1);
    matchmakingQueue.delete(socketId2);
    
    // Récupérer les noms d'utilisateurs
    const user1 = await getUserById(player1.userId);
    const user2 = await getUserById(player2.userId);
    
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
      socket1.emit('matchmaking-match-found', { roomId, text, players: room.players });
    }
    
    if (socket2) {
      socket2.join(roomId);
      players.set(socketId2, { roomId, player: player2Data });
      socket2.emit('matchmaking-match-found', { roomId, text, players: room.players });
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
    // Retirer de la queue de matchmaking
    if (matchmakingQueue.has(socket.id)) {
      matchmakingQueue.delete(socket.id);
    }
    
    const playerData = players.get(socket.id);
    if (playerData) {
      // Gérer les rooms 1v1
      if (playerData.roomId) {
        const room = rooms.get(playerData.roomId);
        if (room) {
          room.players = room.players.filter(p => p.id !== socket.id);
          
          // Pour les rooms matchmaking, ne pas supprimer immédiatement
          // Attendre 30 secondes avant de supprimer pour permettre la reconnexion
          if (room.players.length === 0) {
            if (room.matchmaking) {
              // Délai de grâce pour les rooms matchmaking (reconnexion possible)
              setTimeout(() => {
                const checkRoom = rooms.get(playerData.roomId);
                if (checkRoom && checkRoom.players.length === 0) {
                  rooms.delete(playerData.roomId);
                  console.log(`Matchmaking room ${playerData.roomId} deleted after grace period`);
                }
              }, 30000); // 30 secondes
            } else {
              // Suppression immédiate pour les rooms normales
              rooms.delete(playerData.roomId);
            }
          } else {
            io.to(playerData.roomId).emit('player-left', { players: room.players });
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
const HOST = process.env.HOST || '0.0.0.0'; // Écouter sur toutes les interfaces pour PulseHeberg
httpServer.listen(PORT, HOST, () => {
  console.log(`Server running on ${HOST}:${PORT}`);
});
