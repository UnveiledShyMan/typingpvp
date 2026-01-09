import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom'
import LogoIconSmall from '../components/icons/LogoIconSmall'
import ShareButtons from '../components/ShareButtons'
import UserTooltip from '../components/UserTooltip'
import MatchResults from '../components/MatchResults'
import { useToastContext } from '../contexts/ToastContext'
import { authService } from '../services/apiService'
import { useUser } from '../contexts/UserContext'
import Modal from '../components/Modal'
import { languages } from '../data/languages'
import { generateText } from '../data/languages'
import { generatePhraseText } from '../data/phrases'
import { getSocket, cleanupSocket } from '../services/socketService'
import { navigateToProfile, isValidUserId } from '../utils/profileNavigation'

export default function BattleRoom() {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { playerName: initialPlayerName, userId, isCreator, matchmaking, ranked } = location.state || {};
  const { toast } = useToastContext();
  const { user: currentUserFromContext } = useUser();
  
  // Vérifier que navigate est bien une fonction (sécurité supplémentaire)
  if (!navigate || typeof navigate !== 'function') {
    console.error('BattleRoom: navigate is not a valid function');
    return <div>Error: Navigation not available</div>;
  }
  
  // État pour gérer le pseudo si l'utilisateur rejoint via un lien direct
  const [showNameModal, setShowNameModal] = useState(false);
  const [tempPlayerName, setTempPlayerName] = useState('');
  const [playerName, setPlayerName] = useState(initialPlayerName || currentUserFromContext?.username || '');
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  
  // État pour le mode de battle
  const [battleMode, setBattleMode] = useState('timer'); // 'timer' ou 'phrases'
  const [timerDuration, setTimerDuration] = useState(60); // 60, 30, ou 10 secondes
  const [phraseDifficulty, setPhraseDifficulty] = useState('medium'); // 'easy', 'medium', 'hard', 'hardcore'
  const [timeLeft, setTimeLeft] = useState(null); // Temps restant pour le mode timer
  
  const [text, setText] = useState('');
  const [input, setInput] = useState('');
  const [players, setPlayers] = useState([]);
  const [gameStatus, setGameStatus] = useState('connecting'); // connecting, waiting, playing, finished
  const [startTime, setStartTime] = useState(null); // Temps de début de la partie (pour le timer)
  const startTimeRef = useRef(null); // Ref pour accéder à startTime dans les callbacks
  const [typingStartTime, setTypingStartTime] = useState(null); // Temps de début de la frappe (pour le WPM)
  const typingStartTimeRef = useRef(null); // Ref pour accéder à typingStartTime dans les callbacks
  const [opponentTypingStartTime, setOpponentTypingStartTime] = useState(null); // Temps de début de frappe de l'adversaire
  const opponentTypingStartTimeRef = useRef(null); // Ref pour accéder à opponentTypingStartTime dans les callbacks
  const [myStats, setMyStats] = useState({ wpm: 0, accuracy: 100, progress: 0 });
  const [opponentStats, setOpponentStats] = useState({ wpm: 0, accuracy: 100, progress: 0 });
  const [results, setResults] = useState(null);
  const [eloChanges, setEloChanges] = useState({});
  const [errors, setErrors] = useState(0);
  const [currentUser, setCurrentUser] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const progressIntervalRef = useRef(null);
  const timerIntervalRef = useRef(null); // Ref pour le timer du mode timer
  const inputRef = useRef(null);
  const socketRef = useRef(null);
  const textContainerRef = useRef(null);
  const chatContainerRef = useRef(null);
  const hasJoinedRoomRef = useRef(false); // Ref pour éviter de joindre plusieurs fois
  const listenersSetupRef = useRef(false); // Ref pour éviter de configurer les listeners plusieurs fois
  const lastErrorCountRef = useRef(0); // Ref pour le calcul incrémental des erreurs (optimisation O(1))
  const statsUpdateRef = useRef(null); // Ref pour throttler les calculs de stats avec requestAnimationFrame

  // Vérifier si l'utilisateur doit choisir un pseudo
  useEffect(() => {
    if (!playerName && !currentUserFromContext) {
      setShowNameModal(true);
      return;
    } else if (currentUserFromContext && !playerName) {
      setPlayerName(currentUserFromContext.username);
    }
  }, [playerName, currentUserFromContext]);

  // Récupérer l'utilisateur courant si userId est fourni
  // Ne pas faire la requête si l'utilisateur n'est pas connecté (évite l'erreur 401)
  useEffect(() => {
    // Vérifier si un token existe avant de faire la requête
    const token = localStorage.getItem('token');
    if ((userId || matchmaking || currentUserFromContext) && token) {
      const fetchUser = async () => {
        try {
          const userData = await authService.getCurrentUser();
          setCurrentUser(userData);
          if (!playerName && userData) {
            setPlayerName(userData.username);
          }
        } catch (error) {
          // Erreur gérée par apiService - silencieuse si 401 (utilisateur non connecté)
          setCurrentUser(null);
        }
      };
      fetchUser();
    } else {
      // Pas de token, définir currentUser à null
      setCurrentUser(null);
    }
  }, [userId, matchmaking, currentUserFromContext, playerName]);

  // Gérer la soumission du nom
  const handleNameSubmit = () => {
    if (!tempPlayerName.trim()) {
      toast.warning('Please enter a name');
      return;
    }
    setPlayerName(tempPlayerName.trim());
    setShowNameModal(false);
  };

  // Initialiser le socket une seule fois au montage du composant
  useEffect(() => {
    // Obtenir l'instance unique de socket (ou la créer si elle n'existe pas)
    // Pour les battle rooms, on peut réutiliser la connexion existante
    socketRef.current = getSocket(false);
    
    return () => {
      // Ne pas déconnecter le socket ici car il peut être utilisé par d'autres composants
      // On nettoie juste les listeners spécifiques à cette room
      if (socketRef.current) {
        cleanupSocket(socketRef.current, [
          'matchmaking-match-found', // Pour les rooms matchmaking
          'room-joined',
          'player-joined',
          'player-left',
          'game-started',
          'opponent-update',
          'opponent-finished',
          'game-finished',
          'chat-message',
          'error'
        ]);
      }
    };
  }, []); // Exécuter une seule fois au montage

  // Configurer les listeners socket une seule fois
  // IMPORTANT: Nettoyer les anciens listeners avant d'ajouter les nouveaux pour éviter les doublons
  useEffect(() => {
    if (!socketRef.current) {
      return;
    }

    const socket = socketRef.current;
    
    // Si les listeners ont déjà été configurés, ne pas les reconfigurer
    // Mais nettoyer d'abord pour éviter les doublons
    if (listenersSetupRef.current) {
      return;
    }
    
    listenersSetupRef.current = true;
    
    // Nettoyer les anciens listeners pour éviter les doublons
    const eventsToClean = [
      'matchmaking-match-found',
      'room-joined',
      'player-joined',
      'player-left',
      'game-started',
      'opponent-update',
      'opponent-finished',
      'game-finished',
      'chat-message',
      'error',
      'disconnect',
      'reconnect'
    ];
    eventsToClean.forEach(event => socket.off(event));

    // Configurer tous les listeners socket
    
    // LISTENER SPÉCIAL : Pour les rooms matchmaking, écouter matchmaking-match-found
    // Les joueurs sont déjà dans la room (ajoutés par createMatchmakingRoom), pas besoin de join-room
    // Cet événement est envoyé juste après la création de la room matchmaking
    socket.on('matchmaking-match-found', (data) => {
      // Vérifier que c'est bien la room actuelle
      if (data.roomId !== roomId) {
        console.warn('⚠️ matchmaking-match-found reçu pour une autre room:', data.roomId, 'actuelle:', roomId);
        return;
      }
      console.log('✅ Matchmaking match found:', data);
      setText(data.text);
      setPlayers(data.players);
      setGameStatus('waiting');
      if (data.chatMessages) {
        setChatMessages(data.chatMessages);
      }
      // Marquer comme ayant rejoint pour éviter d'appeler join-room
      hasJoinedRoomRef.current = true;
    });

    socket.on('room-joined', (data) => {
      console.log('✅ Room joined:', data);
      // IMPORTANT: Marquer qu'on a rejoint pour éviter les appels multiples à join-room
      hasJoinedRoomRef.current = true;
      setText(data.text);
      setPlayers(data.players);
      // Ne pas changer le statut si on rejoint une room finished (le statut sera mis à jour par game-finished)
      if (gameStatus !== 'finished') {
        setGameStatus('waiting'); // Passer à 'waiting' une fois la room jointe
      }
      if (data.chatMessages) {
        setChatMessages(data.chatMessages);
      }
    });

    socket.on('player-joined', (data) => {
      console.log('👤 Player joined:', data);
      setPlayers(data.players);
    });

    socket.on('player-left', (data) => {
      console.log('👋 Player left:', data);
      setPlayers(data.players);
    });

    // Erreur lors du lancement de la partie (retour serveur)
    socket.on('start-error', (err) => {
      const message = (err && err.message) ? err.message : 'Unable to start the game. Please try again.';
      console.error('❌ start-error received:', err);
      console.error('❌ Error details:', {
        message: err?.message,
        roomId,
        gameStatus,
        playersCount: players.length,
        isCreator,
        socketConnected: socketRef.current?.connected
      });
      toast.error(message);
      setGameStatus('waiting');
    });

    socket.on('game-started', (data) => {
      try {
        console.log('🎮 game-started event received:', {
          hasData: !!data,
          hasText: !!(data?.text),
          textLength: data?.text?.length,
          textType: typeof data?.text,
          startTime: data?.startTime,
          mode: data?.mode,
          timerDuration: data?.timerDuration,
          difficulty: data?.difficulty,
          roomId,
          gameStatus
        });
        
        // Vérification de sécurité : s'assurer que data existe
        if (!data) {
          console.error('❌ game-started: data is undefined or null');
          toast.error('Invalid game data received. Please refresh the page.');
          setGameStatus('waiting');
          return;
        }

        setGameStatus('playing');
        
        // Vérifier que startTime existe avant de l'utiliser
        if (data.startTime !== undefined && data.startTime !== null) {
          setStartTime(data.startTime);
          startTimeRef.current = data.startTime; // Stocker aussi dans la ref
        } else {
          // Utiliser Date.now() comme fallback si startTime n'est pas fourni
          const fallbackStartTime = Date.now();
          setStartTime(fallbackStartTime);
          startTimeRef.current = fallbackStartTime;
          console.warn('⚠️ game-started: startTime missing, using fallback');
        }
        
        setTypingStartTime(null); // Réinitialiser le temps de début de frappe
        typingStartTimeRef.current = null; // Réinitialiser aussi la ref
        setOpponentTypingStartTime(null); // Réinitialiser le temps de début de frappe de l'adversaire
        opponentTypingStartTimeRef.current = null; // Réinitialiser aussi la ref
        
        // Mettre à jour le texte si une nouvelle langue a été choisie
        // IMPORTANT: Vérifier que le texte est valide (non vide, string)
        // Pour les rooms matchmaking, le texte peut déjà être défini via matchmaking-match-found
        // Donc on ne retourne une erreur que si le texte n'existe ni dans data ni dans le state actuel
        if (data.text && typeof data.text === 'string' && data.text.trim().length > 0) {
          setText(data.text);
        } else if (!text || text.trim().length === 0) {
          // Si le texte n'est pas dans data ET n'existe pas déjà dans le state, c'est une erreur
          console.error('❌ game-started: Invalid or missing text:', data.text, 'current text:', text);
          toast.error('Invalid game text received. Please refresh the page.');
          setGameStatus('waiting');
          return;
        }
        // Sinon, le texte existe déjà dans le state (via matchmaking-match-found), on continue
        
        // Mettre à jour le mode et les paramètres
        if (data.mode) {
          setBattleMode(data.mode);
        }
        if (data.timerDuration !== undefined && data.timerDuration !== null) {
          setTimerDuration(data.timerDuration);
          setTimeLeft(data.timerDuration);
        }
        if (data.difficulty) {
          setPhraseDifficulty(data.difficulty);
        }
        setInput(''); // Réinitialiser l'input
        lastErrorCountRef.current = 0; // Réinitialiser le compteur d'erreurs
      
      // Arrêter l'interval précédent s'il existe
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      // Annuler les calculs de stats en cours
      if (statsUpdateRef.current) {
        cancelAnimationFrame(statsUpdateRef.current);
        statsUpdateRef.current = null;
      }
      
        // Démarrer le timer si mode timer
        if (data.mode === 'timer' && data.timerDuration) {
          setTimeLeft(data.timerDuration);
          timerIntervalRef.current = setInterval(() => {
            setTimeLeft((prev) => {
              if (prev <= 1) {
                // Finir automatiquement quand le timer atteint 0
                if (socketRef.current) {
                  // Utiliser les refs pour accéder aux valeurs actuelles dans le callback
                  // IMPORTANT: Ne pas utiliser les valeurs de closure (input, errors) car elles sont obsolètes
                  const typingStart = typingStartTimeRef.current;
                  const currentInput = inputRef.current?.value || '';
                  const currentErrors = lastErrorCountRef.current || 0;
                  
                  if (typingStart && currentInput.length > 0) {
                    const finalTime = (Date.now() - typingStart) / 1000 / 60;
                    const wordsTyped = currentInput.trim().split(/\s+/).filter(w => w.length > 0).length;
                    const finalWpm = finalTime > 0 ? Math.round(wordsTyped / finalTime) : 0;
                    const finalAccuracy = currentInput.length > 0 ? Math.round(((currentInput.length - currentErrors) / currentInput.length) * 100) : 100;
                    // IMPORTANT: Inclure les erreurs et les caractères pour les résultats complets
                    socketRef.current.emit('finish-game', {
                      wpm: finalWpm,
                      accuracy: finalAccuracy,
                      errors: currentErrors,
                      characters: currentInput.length
                    });
                  } else {
                    // Si l'utilisateur n'a pas commencé à taper, envoyer 0
                    socketRef.current.emit('finish-game', {
                      wpm: 0,
                      accuracy: 100,
                      errors: 0,
                      characters: 0
                    });
                  }
                }
                if (timerIntervalRef.current) {
                  clearInterval(timerIntervalRef.current);
                  timerIntervalRef.current = null;
                }
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
        }
        
        // L'enregistrement des stats se fera dans handleInputChange et opponent-update
        // Pas besoin d'interval ici car on met à jour à chaque frappe
        
        if (inputRef.current) {
          inputRef.current.focus();
        }
      } catch (error) {
        // Capturer toute erreur dans le handler game-started
        console.error('❌ Error in game-started handler:', error);
        console.error('Error stack:', error.stack);
        toast.error('An error occurred while starting the game. Please refresh the page.');
        setGameStatus('waiting');
      }
    });

    // Handler pour opponent-update
    // Ce handler est appelé très fréquemment (à chaque frappe de l'adversaire)
    socket.on('opponent-update', (data) => {
      try {
        // Vérification de sécurité : s'assurer que data existe
        if (!data) {
          console.warn('⚠️ opponent-update: data is undefined or null');
          return;
        }

        // Mettre à jour les stats immédiatement
        // Utiliser une ref pour éviter de chercher dans players à chaque fois
        setOpponentStats({
          wpm: data.wpm || 0,
          accuracy: data.accuracy || 100,
          progress: data.progress || 0
        });
        
        // Détecter la première frappe de l'adversaire (quand wpm > 0 ou progress > 0)
        // Utiliser TOUJOURS le startTime de la partie pour synchroniser les deux joueurs
        if ((data.wpm > 0 || data.progress > 0) && !opponentTypingStartTimeRef.current && startTimeRef.current) {
          setOpponentTypingStartTime(startTimeRef.current);
          opponentTypingStartTimeRef.current = startTimeRef.current;
        }
      } catch (error) {
        console.error('❌ Error in opponent-update handler:', error);
        // Ne pas bloquer l'application pour une erreur dans opponent-update
      }
    });

    socket.on('opponent-finished', (data) => {
      setOpponentStats({
        wpm: data.wpm,
        accuracy: data.accuracy,
        progress: 100
      });
      
      // Notification visuelle quand l'adversaire termine
      if (gameStatus === 'playing') {
        toast.info('Opponent finished! Complete your text to see results.', 3000);
      }
    });

    socket.on('game-finished', (data) => {
      setGameStatus('finished');
      setResults(data.results);
      if (data.eloChanges) {
        setEloChanges(data.eloChanges);
        
        // Rafraîchir les données utilisateur si connecté pour mettre à jour les ELO
        // Vérifier qu'un token existe avant de faire la requête
        const token = localStorage.getItem('token');
        if ((userId || currentUser?.id) && token) {
          const refreshUserData = async () => {
            try {
              const userData = await authService.getCurrentUser();
              setCurrentUser(userData);
              
              // Émettre un événement pour rafraîchir le profil et le leaderboard
              window.dispatchEvent(new CustomEvent('elo-updated', { 
                detail: { userId: userData.id } 
              }));
            } catch (error) {
              // Erreur gérée par apiService - silencieuse si 401 (utilisateur non connecté)
            }
          };
          
          // Rafraîchir après un court délai pour laisser le temps au serveur de sauvegarder
          setTimeout(refreshUserData, 500);
        }
      }
      // Arrêter l'interval d'enregistrement
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    });

    socket.on('chat-message', (message) => {
      setChatMessages(prev => [...prev, message]);
      // Auto-scroll chat vers le bas
      setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
      }, 100);
    });

    socket.on('error', (error) => {
      console.error('❌ Socket error:', error);
      toast.error(error.message || 'An error occurred');
      
      // Ne pas rediriger immédiatement, laisser Socket.IO tenter de se reconnecter
      // La redirection se fera seulement si la reconnexion échoue définitivement
      socket.once('reconnect_failed', () => {
        toast.error('Connection lost. Redirecting to home...');
        setTimeout(() => {
          navigate('/');
        }, 2000);
      });
    });
    
    // Gérer les déconnexions avec reconnexion automatique
    socket.on('disconnect', (reason) => {
      console.warn('⚠️ Socket disconnected:', reason);
      if (reason === 'io server disconnect') {
        // Le serveur a déconnecté, reconnecter manuellement
        socket.connect();
      }
      // Pour les autres raisons (transport close, etc.), Socket.IO se reconnectera automatiquement
    });
    
    // Logger les reconnexions réussies
    socket.on('reconnect', (attemptNumber) => {
      console.log(`✅ Socket reconnected after ${attemptNumber} attempt(s)`);
      toast.success('Connection restored');
      
      // Réessayer de rejoindre la room après reconnexion
      if (playerName && roomId && hasJoinedRoomRef.current) {
        console.log('🔄 Rejoining room after reconnection...');
        hasJoinedRoomRef.current = false; // Permettre de rejoindre à nouveau
        socket.emit('join-room', { 
          roomId, 
          playerName,
          userId: userId || currentUser?.id || null
        });
      }
    });

    // Nettoyage des listeners sera fait dans le premier useEffect
    return () => {
      listenersSetupRef.current = false;
    };
  }, []); // Exécuter une seule fois

  // Joindre la room une fois que le playerName est défini
  // IMPORTANT : Pour les rooms matchmaking, ne PAS appeler join-room car les joueurs sont déjà dans la room
  useEffect(() => {
    // Attendre que le nom soit défini et que le socket soit prêt
    if (!playerName || !socketRef.current || hasJoinedRoomRef.current) {
      return;
    }

    // CAS SPÉCIAL : Rooms matchmaking
    // Les joueurs sont déjà dans la room (créée par createMatchmakingRoom)
    // On attend l'événement matchmaking-match-found
    // Mais si l'événement est déjà passé ou perdu, on peut appeler join-room pour se synchroniser
    if (matchmaking) {
      console.log('🎮 Room matchmaking détectée - En attente de matchmaking-match-found...');
      
      // Attendre un peu pour voir si matchmaking-match-found arrive
      // Si après 1 seconde on n'a toujours pas reçu l'événement, appeler join-room (reconnexion)
      const timeoutId = setTimeout(() => {
        if (!hasJoinedRoomRef.current && socketRef.current && socketRef.current.connected) {
          console.log('⏱️ matchmaking-match-found non reçu après 1s - Tentative de synchronisation via join-room');
          hasJoinedRoomRef.current = true; // Marquer avant l'appel pour éviter les doublons
          socketRef.current.emit('join-room', { 
            roomId, 
            playerName,
            userId: userId || currentUser?.id || null
          });
        }
      }, 1000);
      
      return () => clearTimeout(timeoutId);
    }

    const socket = socketRef.current;

    // CAS NORMAL : Room 1v1 manuelle - doit appeler join-room
    // IMPORTANT: Marquer immédiatement qu'on essaie de joindre pour éviter les appels multiples
    // Cela empêche le useEffect de se déclencher plusieurs fois si les dépendances changent
    hasJoinedRoomRef.current = true;
    
    const handleJoinRoom = () => {
      // Vérifier une dernière fois (sécurité supplémentaire)
      // Ne pas appeler si on a déjà rejoint (double vérification)
      if (!socket || !socket.connected || hasJoinedRoomRef.current === false) {
        if (!socket || !socket.connected) {
          console.warn('⚠️ Socket not connected, cannot join room');
        }
        hasJoinedRoomRef.current = false; // Réinitialiser si pas connecté
        return;
      }

      // Vérifier qu'on n'a pas déjà reçu room-joined (protection supplémentaire)
      if (gameStatus !== 'connecting' && players.length > 0) {
        console.log('⚠️ Already joined room, skipping join-room call');
        return;
      }

      console.log('🔌 Joining room:', roomId, 'as', playerName, '(userId:', userId || currentUser?.id || 'guest', ')');
      socket.emit('join-room', { 
        roomId, 
        playerName,
        userId: userId || currentUser?.id || null
      });
    };

    // Essayer de joindre immédiatement ou après connexion
    if (socket.connected) {
      handleJoinRoom();
    } else {
      // IMPORTANT: Ne pas ajouter plusieurs listeners 'connect'
      // Vérifier qu'on n'a pas déjà un listener en attente
      socket.once('connect', () => {
        handleJoinRoom();
      });
    }

    // Nettoyage: réinitialiser le flag si on quitte la room
    return () => {
      // Ne pas réinitialiser hasJoinedRoomRef ici car on veut éviter les appels multiples
      // Il sera réinitialisé quand le composant se démonte complètement
    };
  }, [roomId, playerName, userId, currentUser?.id, matchmaking]); // Retirer navigate des dépendances car il ne change pas

  // Nettoyage des intervalles et timeouts
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (inputRef.current && gameStatus === 'playing') {
      inputRef.current.focus();
    }
  }, [gameStatus]);

  // Auto-scroll chat vers le bas quand de nouveaux messages arrivent
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Fonction pour envoyer un message de chat
  const handleSendChatMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !socketRef.current || sendingMessage) return;
    
    // Vérifier que le socket est connecté avant d'émettre
    if (!socketRef.current.connected) {
      toast.error('Not connected to server. Please wait...');
      return;
    }
    
    setSendingMessage(true);
    const messageText = chatInput.trim();
    setChatInput(''); // Vider l'input immédiatement pour meilleure UX
    
    socketRef.current.emit('chat-message', {
      roomId,
      message: messageText,
      username: currentUser?.username || playerName
    });
    
    // Réinitialiser le loading après un court délai (le message apparaîtra via chat-message event)
    setTimeout(() => {
      setSendingMessage(false);
    }, 500);
  };

  // Formater l'heure du message
  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const handleStartGame = () => {
    try {
      console.log('🎮 handleStartGame called:', {
        roomId,
        playersCount: players.length,
        gameStatus,
        isCreator,
        socketConnected: socketRef.current?.connected,
        battleMode,
        selectedLanguage,
        timerDuration,
        phraseDifficulty
      });
      
      // Vérifications de base
      if (players.length !== 2) {
        console.warn('⚠️ Cannot start game: waiting for opponent', { playersCount: players.length });
        toast.warning('Waiting for opponent...');
        return;
      }
      
      if (!socketRef.current) {
        console.error('❌ Cannot start game: socket not initialized');
        toast.error('Socket not initialized. Please refresh the page.');
        return;
      }
      
      // Vérifier que le socket est connecté avant d'émettre
      if (!socketRef.current.connected) {
        console.warn('⚠️ Socket not connected, waiting for connection...');
        toast.error('Not connected to server. Please wait...');
        // Attendre la reconnexion avec un timeout
        const timeout = setTimeout(() => {
          console.error('❌ Connection timeout while waiting to start game');
          toast.error('Connection timeout. Please try again.');
        }, 10000);
        
        socketRef.current.once('connect', () => {
          clearTimeout(timeout);
          console.log('✅ Socket reconnected, retrying start-game');
          if (socketRef.current && socketRef.current.connected) {
            const startData = { 
              roomId, 
              language: selectedLanguage,
              mode: battleMode,
              timerDuration: battleMode === 'timer' ? timerDuration : null,
              difficulty: battleMode === 'phrases' ? phraseDifficulty : null
            };
            console.log('🎮 Emitting start-game after reconnect:', startData);
            socketRef.current.emit('start-game', startData, (ack) => {
              console.log('📨 start-game ack received:', ack);
              if (ack && ack.ok === false) {
                console.error('❌ start-game failed:', ack.message);
                toast.error(ack.message || 'Unable to start the game. Please refresh the page.');
              }
            });
          }
        });
        return;
      }
      
      // Émettre l'événement
      const startData = { 
        roomId, 
        language: selectedLanguage,
        mode: battleMode,
        timerDuration: battleMode === 'timer' ? timerDuration : null,
        difficulty: battleMode === 'phrases' ? phraseDifficulty : null
      };
      console.log('🎮 Emitting start-game:', startData);
      socketRef.current.emit('start-game', startData, (ack) => {
        console.log('📨 start-game ack received:', ack);
        if (ack && ack.ok === false) {
          console.error('❌ start-game failed:', ack.message);
          toast.error(ack.message || 'Unable to start the game. Please refresh the page.');
        } else if (ack && ack.ok === true) {
          console.log('✅ start-game acknowledged by server');
        }
      });
    } catch (error) {
      console.error('❌ Error in handleStartGame:', error);
      console.error('❌ Error stack:', error.stack);
      toast.error('An error occurred. Please try again.');
    }
  };

  const handleInputChange = useCallback((e) => {
    try {
      if (gameStatus !== 'playing') return;
      
        // Vérification de sécurité : s'assurer que text est valide
        if (!text || typeof text !== 'string') {
          console.error('❌ handleInputChange: text is invalid', {
            text,
            textType: typeof text,
            textLength: text?.length,
            gameStatus,
            roomId
          });
          toast.error('Invalid game text. Please refresh the page.');
          setGameStatus('waiting');
          return;
        }
      
      const value = e.target.value;
      
      // Définir le temps de début de frappe à la première frappe
      if (value.length > 0 && !typingStartTime) {
        const now = Date.now();
        setTypingStartTime(now);
        typingStartTimeRef.current = now; // Mettre à jour aussi la ref
      }
      
      if (value.length <= text.length) {
      // Mise à jour immédiate de l'input pour réduire l'input lag
      setInput(value);
      
      // OPTIMISATION : Calcul incrémental des erreurs (O(1) au lieu de O(n))
      // Ne vérifier que les nouveaux caractères ou les corrections
      let errorCount = lastErrorCountRef.current;
      if (value.length > input.length) {
        // Nouveau caractère ajouté - vérifier seulement les nouveaux
        for (let i = input.length; i < value.length; i++) {
          if (value[i] !== text[i]) {
            errorCount++;
          }
        }
        // Vérifier les corrections dans la partie déjà tapée (si l'utilisateur corrige)
        for (let i = 0; i < input.length; i++) {
          if (input[i] !== text[i] && value[i] === text[i]) {
            // Une erreur a été corrigée
            errorCount = Math.max(0, errorCount - 1);
          }
        }
      } else if (value.length < input.length) {
        // Caractère supprimé - recalculer depuis le début (rare mais nécessaire)
        errorCount = 0;
        for (let i = 0; i < value.length; i++) {
          if (value[i] !== text[i]) {
            errorCount++;
          }
        }
      }
      lastErrorCountRef.current = errorCount;
      setErrors(errorCount);

      // OPTIMISATION : Calculer les stats de manière throttlée avec requestAnimationFrame
      // Cela évite de bloquer le thread principal et améliore la fluidité
      if (typingStartTime) {
        // Annuler le calcul précédent s'il existe
        if (statsUpdateRef.current) {
          cancelAnimationFrame(statsUpdateRef.current);
        }
        
        // Déférer les calculs de stats pour ne pas bloquer l'input
        statsUpdateRef.current = requestAnimationFrame(() => {
          const timeElapsed = (Date.now() - typingStartTimeRef.current) / 1000 / 60;
          
          // Calcul optimisé : utiliser errorCount déjà calculé
          const correctChars = value.length - errorCount;
          
          // WPM basé uniquement sur les caractères corrects - empêche le spam du clavier
          // Un mot = 5 caractères (standard typing test)
          const wordsTyped = correctChars / 5;
          const wpm = timeElapsed > 0 ? Math.round(wordsTyped / timeElapsed) : 0;
          
          // Accuracy : (caractères corrects / total) * 100
          const accuracy = value.length > 0 
            ? Math.round((correctChars / value.length) * 100)
            : 100;
          // Vérification de sécurité : éviter division par zéro
          const progress = text.length > 0 ? Math.round((value.length / text.length) * 100) : 0;
          
          setMyStats({ wpm, accuracy, progress });
          
          // Envoyer la mise à jour au serveur (throttling géré côté serveur)
          // Vérifier que le socket est connecté avant d'émettre
          if (socketRef.current && socketRef.current.connected) {
            socketRef.current.emit('update-progress', {
              progress,
              wpm,
              accuracy
            });
          }
        });

        // Auto-scroll pour suivre la position de frappe
        // Optimisation : utiliser requestAnimationFrame pour décaler le scroll et éviter les lags
        if (textContainerRef.current) {
          requestAnimationFrame(() => {
            try {
              const container = textContainerRef.current;
              if (!container) return;
              
              const currentCharElement = container.querySelector(`span:nth-child(${value.length + 1})`);
              if (currentCharElement) {
                const containerRect = container.getBoundingClientRect();
                const charRect = currentCharElement.getBoundingClientRect();
                const charTop = charRect.top - containerRect.top + container.scrollTop;
                const charBottom = charTop + charRect.height;
                
                // Scroll si le caractère courant est en dehors de la zone visible
                if (charTop < container.scrollTop + 50) {
                  container.scrollTop = Math.max(0, charTop - 50);
                } else if (charBottom > container.scrollTop + container.clientHeight - 50) {
                  container.scrollTop = charBottom - container.clientHeight + 50;
                }
              }
            } catch (scrollError) {
              // Ignorer les erreurs de scroll pour ne pas bloquer l'application
              console.warn('⚠️ Error in auto-scroll:', scrollError);
            }
          });
        }
      }

        // Vérifier si terminé
        if (value === text && typingStartTime) {
          // Utiliser typingStartTime pour le calcul du WPM final (temps réel de frappe)
          const finalTime = (Date.now() - typingStartTimeRef.current) / 1000 / 60;
          const correctChars = text.length - errorCount;
          const wordsTyped = correctChars / 5;
          const finalWpm = finalTime > 0 ? Math.round(wordsTyped / finalTime) : 0;
          const finalAccuracy = Math.round((correctChars / text.length) * 100);
          
          // Notification de fin
          toast.success('You finished! Waiting for opponent...', 2000);
          
          // Vérifier que le socket est connecté avant d'émettre
          // IMPORTANT: Inclure les erreurs et les caractères pour les résultats complets
          if (socketRef.current && socketRef.current.connected) {
            socketRef.current.emit('finish-game', {
              wpm: finalWpm,
              accuracy: finalAccuracy,
              errors: errorCount,
              characters: value.length
            });
          } else if (socketRef.current) {
            // Si pas connecté, attendre la reconnexion
            socketRef.current.once('connect', () => {
              socketRef.current.emit('finish-game', {
                wpm: finalWpm,
                accuracy: finalAccuracy,
                errors: errorCount,
                characters: value.length
              });
            });
          }
        }
      }
    } catch (error) {
      // Capturer toute erreur dans handleInputChange pour éviter de crasher l'application
      console.error('❌ Error in handleInputChange:', error);
      console.error('Error stack:', error.stack);
      // Ne pas afficher de toast pour éviter de spammer l'utilisateur
      // L'erreur est loggée pour le debugging
    }
  }, [gameStatus, text, input, typingStartTime, errors]);

  // Raccourcis clavier pour BattleRoom
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Enter : Relancer une nouvelle partie (seulement si le match est terminé)
      // IMPORTANT: ENTER fonctionne même si l'input est focus quand le jeu est terminé
      // Cela permet de relancer facilement avec ENTER depuis n'importe où
      if (e.key === 'Enter' && gameStatus === 'finished') {
        e.preventDefault();
        // Appeler la même fonction que le bouton "Play Again"
        if (location.state?.matchmaking) {
          navigate('/matchmaking');
        } else {
          navigate('/battle');
        }
        return; // Sortir tôt pour éviter les autres handlers
      }
      
      // Ne pas activer les autres raccourcis si on est en train de taper dans un input
      // (sauf ENTER qui est géré ci-dessus)
      if (e.target.matches('input, textarea') || e.target.isContentEditable) {
        return;
      }
      
      // Esc : Focus sur l'input de frappe (si en attente ou en jeu)
      if (e.key === 'Escape' && gameStatus !== 'finished') {
        e.preventDefault();
        if (inputRef.current && (gameStatus === 'waiting' || gameStatus === 'playing')) {
          inputRef.current.focus();
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameStatus, navigate, location.state]);

  // OPTIMISATION : Mémoriser renderText avec useMemo pour éviter de recalculer à chaque render
  // Cela améliore significativement les performances lors de la frappe
  // IMPORTANT: Ajouter des vérifications de sécurité pour éviter les erreurs si text est undefined
  const renderText = useMemo(() => {
    // Vérification de sécurité : s'assurer que text est valide
    if (!text || typeof text !== 'string') {
      console.warn('⚠️ renderText: text is invalid, using empty string');
      return <span className="text-text-secondary">Loading text...</span>;
    }
    
    try {
      return text.split('').map((char, index) => {
        if (index < input.length) {
          const isCorrect = input[index] === char;
          return (
            <span key={index} className={isCorrect ? 'char-correct' : 'char-incorrect'}>
              {char}
            </span>
          );
        } else if (index === input.length) {
          return (
            <span key={index} className="char-current">
              {char}
            </span>
          );
        } else {
          return (
            <span key={index} className="char-pending">
              {char}
            </span>
          );
        }
      });
    } catch (error) {
      console.error('❌ Error in renderText:', error);
      return <span className="text-text-secondary">Error rendering text. Please refresh the page.</span>;
    }
  }, [text, input]);

  const myPlayer = players.find(p => p.name === playerName || (p.userId && p.userId === (userId || currentUser?.id)));
  const opponent = players.find(p => p.name !== playerName && (!p.userId || p.userId !== (userId || currentUser?.id)));

  // Écran de chargement
  if (gameStatus === 'connecting' || !playerName) {
    return (
      <>
        <Modal isOpen={showNameModal} onClose={() => navigate('/battle')} title="Choose your name">
          <div className="space-y-4">
            <p className="text-text-secondary text-sm">
              Enter your name to join this battle room
            </p>
            <input
              type="text"
              value={tempPlayerName}
              onChange={(e) => setTempPlayerName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleNameSubmit()}
              className="input-modern w-full"
              placeholder="Enter your name"
              autoFocus
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => navigate('/battle')}
                className="px-4 py-2 text-text-secondary hover:text-text-primary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleNameSubmit}
                className="btn-primary"
              >
                Join Room
              </button>
            </div>
          </div>
        </Modal>
        <div className="h-full w-full flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="relative w-16 h-16 mx-auto">
              <div className="absolute inset-0 border-4 border-accent-primary/20 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-transparent border-t-accent-primary rounded-full animate-spin"></div>
            </div>
            <p className="text-text-primary">Connecting to room...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="h-full w-full flex flex-col overflow-hidden p-4 sm:p-6">
        <div className="bg-bg-secondary/40 backdrop-blur-sm rounded-lg p-6 lg:p-8 flex-1 min-h-0 flex flex-col">
          {/* Layout amélioré : jeu principal, chat en bas sur mobile, à droite sur desktop */}
          <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-6">
            {/* Colonne principale : jeu */}
            <div className="flex-1 min-w-0 flex flex-col">
              {/* En-tête sobre */}
              <div className="mb-6 pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h1 className="text-xl font-semibold text-text-primary" style={{ fontFamily: 'Inter' }}>
                      Battle #{roomId}
                    </h1>
                    {matchmaking && (
                      <div className={`px-2 py-1 rounded text-xs font-semibold ${
                        ranked 
                          ? 'bg-accent-primary/20 text-accent-primary border border-accent-primary/30' 
                          : 'bg-text-secondary/20 text-text-secondary border border-text-secondary/30'
                      }`}>
                        {ranked ? '🏆 Ranked' : '🎮 Unrated'}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-text-secondary">
                    {players.map((player, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${player.name === playerName ? 'bg-accent-primary' : 'bg-text-secondary/50'}`}></div>
                        <span>{player.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

          {gameStatus === 'waiting' && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-6 max-w-md w-full">
                {/* Liste des joueurs - Design amélioré */}
                <div className="space-y-4">
                  <h3 className="text-text-primary text-base font-semibold uppercase tracking-wider mb-4 flex items-center justify-center gap-2">
                    <span className="w-1 h-6 bg-gradient-to-b from-accent-primary to-transparent rounded-full"></span>
                    Players
                  </h3>
                  <div className="space-y-3">
                    {players.map((player, index) => (
                      <div 
                        key={index}
                        className={`bg-bg-secondary/60 backdrop-blur-sm rounded-lg p-4 flex items-center justify-between border transition-all ${
                          player.name === playerName 
                            ? 'border-accent-primary/30 bg-accent-primary/5' 
                            : 'border-border-secondary/30'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full transition-all ${
                            player.name === playerName 
                              ? 'bg-accent-primary shadow-lg shadow-accent-primary/50' 
                              : 'bg-text-secondary/50'
                          }`}></div>
                          <span className={`font-medium ${
                            player.name === playerName ? 'text-text-primary' : 'text-text-secondary'
                          }`}>{player.name}</span>
                          {player.name === playerName && (
                            <span className="text-xs px-2 py-0.5 bg-accent-primary/20 text-accent-primary rounded-full font-medium">
                              You
                            </span>
                          )}
                        </div>
                        {player.name === playerName && (
                          <span className="text-xs px-3 py-1.5 bg-accent-primary/20 text-accent-primary rounded-full font-semibold border border-accent-primary/30">
                            ✓ Ready
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Message d'attente ou bouton start - Design amélioré */}
                {players.length === 1 ? (
                  <div className="space-y-4 bg-bg-secondary/40 backdrop-blur-sm rounded-lg p-6 border border-border-secondary/30">
                    <div className="relative w-16 h-16 mx-auto">
                      <div className="absolute inset-0 border-4 border-accent-primary/20 rounded-full"></div>
                      <div className="absolute inset-0 border-4 border-transparent border-t-accent-primary rounded-full animate-spin"></div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-text-primary text-lg font-semibold">
                        Waiting for opponent...
                      </p>
                      <p className="text-text-secondary text-sm">
                        Share the room ID to invite a friend:
                      </p>
                      <div 
                        className="inline-flex items-center gap-2 px-4 py-2 bg-bg-primary/50 backdrop-blur-sm rounded-xl border border-border-secondary/30 cursor-pointer hover:bg-bg-primary/70 hover:border-accent-primary/30 transition-all group"
                        role="button"
                        tabIndex={0}
                        aria-label="Copy room ID to clipboard"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(roomId);
                            toast.success('Room ID copied to clipboard!');
                          } catch (err) {
                            toast.error('Failed to copy room ID');
                          }
                        }}
                        onKeyDown={async (e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            try {
                              await navigator.clipboard.writeText(roomId);
                              toast.success('Room ID copied to clipboard!');
                            } catch (err) {
                              toast.error('Failed to copy room ID');
                            }
                          }
                        }}
                        title="Click to copy"
                      >
                        <span className="font-mono text-accent-primary group-hover:text-accent-hover transition-colors font-semibold">{roomId}</span>
                        <svg className="w-4 h-4 text-text-secondary group-hover:text-accent-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                ) : (
                      <div className="space-y-4 bg-bg-secondary/40 backdrop-blur-sm rounded-xl p-6 border border-accent-primary/20 overflow-visible">
                    <div className="space-y-3">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-accent-primary animate-pulse"></div>
                        <p className="text-text-primary text-lg font-semibold">
                          Both players ready!
                        </p>
                        <div className="w-2 h-2 rounded-full bg-accent-primary animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                      </div>
                      {isCreator ? (
                        <p className="text-text-secondary text-sm">
                          Configure the battle settings below and click start when you're ready
                        </p>
                      ) : (
                        <p className="text-text-secondary text-sm">
                          Waiting for room creator to start the battle...
                        </p>
                      )}
                    </div>
                    {players.length === 2 && isCreator && (
                      <div className="space-y-4 overflow-visible">
                        {/* Sélecteur de mode - Design harmonisé */}
                        <div>
                          <label className="block text-text-secondary text-sm mb-2 font-medium">
                            Battle Mode
                          </label>
                          <select
                            value={battleMode}
                            onChange={(e) => setBattleMode(e.target.value)}
                            className="w-full p-3 bg-bg-secondary/80 backdrop-blur-sm border border-border-secondary/40 rounded-lg text-text-primary focus:outline-none focus:border-accent-primary/60 focus:ring-2 focus:ring-accent-primary/20 focus:ring-offset-2 focus:ring-offset-bg-secondary/40 transition-all hover:bg-bg-secondary font-medium appearance-none cursor-pointer"
                            aria-label="Select battle mode"
                            style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                          >
                            <option value="timer" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>Duel Classique (Timer)</option>
                            <option value="phrases" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>Phrases (Difficulté)</option>
                          </select>
                        </div>

                        {/* Options selon le mode */}
                        {battleMode === 'timer' && (
                          <div>
                            <label className="block text-text-secondary text-sm mb-2 font-medium">
                              Duration
                            </label>
                            <select
                              value={timerDuration}
                              onChange={(e) => setTimerDuration(parseInt(e.target.value))}
                              className="w-full p-3 bg-bg-secondary/80 backdrop-blur-sm border border-border-secondary/40 rounded-lg text-text-primary focus:outline-none focus:border-accent-primary/60 focus:ring-2 focus:ring-accent-primary/20 focus:ring-offset-2 focus:ring-offset-bg-secondary/40 transition-all hover:bg-bg-secondary font-medium appearance-none cursor-pointer"
                              aria-label="Select duration"
                              style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                            >
                              <option value={60} style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>60 seconds</option>
                              <option value={30} style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>30 seconds</option>
                              <option value={10} style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>10 seconds</option>
                            </select>
                          </div>
                        )}

                        {battleMode === 'phrases' && (
                          <div>
                            <label className="block text-text-secondary text-sm mb-2 font-medium">
                              Difficulty
                            </label>
                            <select
                              value={phraseDifficulty}
                              onChange={(e) => setPhraseDifficulty(e.target.value)}
                              className="w-full p-3 bg-bg-secondary/80 backdrop-blur-sm border border-border-secondary/40 rounded-lg text-text-primary focus:outline-none focus:border-accent-primary/60 focus:ring-2 focus:ring-accent-primary/20 focus:ring-offset-2 focus:ring-offset-bg-secondary/40 transition-all hover:bg-bg-secondary font-medium appearance-none cursor-pointer"
                              aria-label="Select difficulty"
                              style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                            >
                              <option value="easy" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>Facile</option>
                              <option value="medium" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>Moyen</option>
                              <option value="hard" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>Difficile</option>
                              <option value="hardcore" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>Hardcore</option>
                            </select>
                          </div>
                        )}

                        {/* Sélecteur de langue pour l'host - Design harmonisé */}
                        <div>
                          <label className="block text-text-secondary text-sm mb-2 font-medium">
                            Select Language
                          </label>
                          <select
                            value={selectedLanguage}
                            onChange={(e) => setSelectedLanguage(e.target.value)}
                            className="w-full p-3 bg-bg-secondary/80 backdrop-blur-sm border border-border-secondary/40 rounded-lg text-text-primary focus:outline-none focus:border-accent-primary/60 focus:ring-2 focus:ring-accent-primary/20 focus:ring-offset-2 focus:ring-offset-bg-secondary/40 transition-all hover:bg-bg-secondary font-medium appearance-none cursor-pointer"
                            style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                          >
                            {Object.entries(languages).map(([code, lang]) => (
                              <option key={code} value={code} style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                                {lang.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <button
                          onClick={handleStartGame}
                          className="bg-accent-primary hover:bg-accent-hover text-accent-text font-semibold py-3 px-8 rounded-xl transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg shadow-accent-primary/30 w-full border border-accent-primary/40"
                          aria-label="Start the battle"
                          disabled={players.length !== 2}
                        >
                          {players.length === 2 ? 'Start Battle' : 'Waiting for opponent...'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {gameStatus === 'playing' && (
            <>
              {/* Timer pour le mode timer */}
              {battleMode === 'timer' && timeLeft !== null && (
                <div className="mb-4 text-center">
                  <div className="inline-block bg-bg-primary/30 backdrop-blur-sm rounded-lg px-6 py-3">
                    <div className="text-3xl font-bold text-text-primary" style={{ fontFamily: 'JetBrains Mono' }}>
                      {timeLeft}s
                    </div>
                  </div>
                </div>
              )}
              
              {/* Stats des joueurs - Design amélioré et plus visuel */}
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                {/* Stats du joueur actuel */}
                <div className="bg-bg-secondary/60 backdrop-blur-sm rounded-lg p-5 border border-accent-primary/30 shadow-lg shadow-accent-primary/10">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-accent-primary animate-pulse"></div>
                      <span className="text-text-primary text-sm font-semibold">{myPlayer?.name || 'You'}</span>
                    </div>
                    <span className="text-xs px-2 py-1 bg-accent-primary/20 text-accent-primary rounded-full font-medium">You</span>
                  </div>
                  <div className="flex items-center justify-between gap-4 mb-3">
                    <div className="text-3xl font-bold text-accent-primary" style={{ fontFamily: 'JetBrains Mono' }}>{myStats.wpm}</div>
                    <div className="text-base text-text-secondary font-medium">
                      <span className="text-text-primary">{myStats.accuracy}</span>% acc
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-text-secondary mb-1">
                      <span>Progress</span>
                      <span className="font-mono">{Math.round(myStats.progress)}%</span>
                    </div>
                    <div className="w-full bg-text-secondary/20 rounded-full h-2.5 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-accent-primary to-accent-secondary h-2.5 rounded-full transition-all duration-300 shadow-sm"
                        style={{ width: `${Math.min(myStats.progress, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                
                {/* Stats de l'adversaire */}
                {opponent && opponent.name && (
                  <div className="bg-bg-secondary/60 backdrop-blur-sm rounded-lg p-5 border border-border-secondary/30">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-text-secondary/50"></div>
                        <span className="text-text-primary text-sm font-semibold">{opponent.name}</span>
                      </div>
                      {/* Lien vers le profil de l'adversaire - Vérifications de sécurité */}
                      {opponent && isValidUserId(opponent.userId) && opponent.name && (
                        <button
                          onClick={() => {
                            try {
                              if (navigate && typeof navigate === 'function' && opponent && opponent.userId && opponent.name) {
                                navigateToProfile(navigate, opponent.userId, opponent.name || opponent.username);
                              }
                            } catch (error) {
                              console.error('Error navigating to profile:', error);
                            }
                          }}
                          className="text-xs px-2 py-1 bg-bg-primary/50 hover:bg-accent-primary/20 text-accent-primary hover:text-accent-primary rounded-full font-medium transition-colors border border-border-secondary/30 hover:border-accent-primary/30"
                          title="View opponent profile"
                        >
                          👤 Profile
                        </button>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-4 mb-3">
                      <div className="text-3xl font-bold text-text-primary" style={{ fontFamily: 'JetBrains Mono' }}>{opponentStats.wpm}</div>
                      <div className="text-base text-text-secondary font-medium">
                        <span className="text-text-primary">{opponentStats.accuracy}</span>% acc
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs text-text-secondary mb-1">
                        <span>Progress</span>
                        <span className="font-mono">{Math.round(opponentStats.progress)}%</span>
                      </div>
                      <div className="w-full bg-text-secondary/20 rounded-full h-2.5 overflow-hidden">
                        <div 
                          className="bg-text-secondary/60 h-2.5 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(opponentStats.progress, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div 
                ref={textContainerRef}
                className="mb-6 typing-text bg-bg-primary/30 backdrop-blur-sm p-6 rounded-lg" 
                style={{ minHeight: '180px', maxHeight: '280px', overflowY: 'auto', scrollBehavior: 'smooth' }}
              >
                {renderText()}
              </div>

              <div className="mb-6">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={handleInputChange}
                  disabled={gameStatus === 'finished'}
                  className="input-modern text-lg"
                  placeholder={gameStatus === 'finished' ? 'Game finished' : 'Start typing...'}
                  style={{ fontFamily: 'JetBrains Mono' }}
                />
              </div>
            </>
          )}

          {gameStatus === 'finished' && results && (
            <MatchResults
              players={players}
              results={results}
              eloChanges={eloChanges}
              playerName={playerName}
              userId={userId}
              currentUser={currentUser}
              onPlayAgain={() => {
                // Relancer le matchmaking ou créer une nouvelle room
                if (location.state?.matchmaking) {
                  navigate('/matchmaking');
                } else {
                  navigate('/battle');
                }
              }}
              onBackToLobby={() => navigate('/')}
            />
          )}
            </div>

            {/* Colonne droite : Chat - Design amélioré */}
            <div className="lg:w-80 lg:flex-shrink-0 flex flex-col">
              <div className="bg-bg-secondary/60 backdrop-blur-sm rounded-xl border border-border-secondary/30 flex-1 min-h-0 flex flex-col shadow-lg">
                {/* En-tête du chat */}
                <div className="p-4 border-b border-border-secondary/30">
                  <h3 className="text-text-primary font-semibold flex items-center gap-2" style={{ fontFamily: 'Inter' }}>
                    <span className="w-1 h-4 bg-gradient-to-b from-accent-primary to-transparent rounded-full"></span>
                    Chat
                  </h3>
                </div>

                {/* Messages du chat */}
                <div 
                  ref={chatContainerRef}
                  className="flex-1 overflow-y-auto p-4 space-y-3"
                  style={{ scrollBehavior: 'smooth' }}
                >
                  {chatMessages.length === 0 ? (
                    <div className="text-text-secondary text-sm text-center py-8">
                      No messages yet. Start the conversation!
                    </div>
                  ) : (
                    chatMessages.map((msg) => {
                      // Trouver le joueur correspondant au message pour obtenir son userId
                      const player = msg && msg.username ? players.find(p => p.name === msg.username) : null;
                      const isMe = msg && msg.username && (msg.username === playerName || (player?.userId && player.userId === (userId || currentUser?.id)));
                      
                      return (
                        <div key={msg.id} className={`flex gap-3 p-2 rounded-lg transition-all ${isMe ? 'bg-accent-primary/5' : 'hover:bg-bg-primary/20'}`}>
                          {/* Avatar cliquable si le joueur a un userId - Design amélioré */}
                          {player && isValidUserId(player.userId) && msg && msg.username ? (
                            <button
                              onClick={() => {
                                try {
                                  if (navigate && typeof navigate === 'function' && player && player.userId && msg && msg.username) {
                                    navigateToProfile(navigate, player.userId, msg.username);
                                  }
                                } catch (error) {
                                  console.error('Error navigating to profile:', error);
                                }
                              }}
                              className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all hover:scale-110 ${
                                isMe 
                                  ? 'bg-accent-primary/30 text-accent-primary border-2 border-accent-primary/40' 
                                  : 'bg-accent-primary/20 text-accent-primary hover:bg-accent-primary/30 border border-border-secondary/30'
                              }`}
                              title="View profile"
                            >
                              {msg && msg.username && msg.username.length > 0 ? msg.username[0].toUpperCase() : '?'}
                            </button>
                          ) : (
                            <div className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${
                              isMe 
                                ? 'bg-accent-primary/30 text-accent-primary border-2 border-accent-primary/40' 
                                : 'bg-accent-primary/20 text-accent-primary border border-border-secondary/30'
                            }`}>
                              {msg && msg.username && msg.username.length > 0 ? msg.username[0].toUpperCase() : '?'}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline gap-2 mb-1.5">
                              {/* Nom d'utilisateur cliquable avec tooltip si le joueur a un userId - Vérifications de sécurité */}
                              {player && isValidUserId(player.userId) && !isMe && msg && msg.username ? (
                                <UserTooltip userId={player.userId} username={msg.username}>
                                  <button
                                    onClick={() => {
                                      try {
                                        if (navigate && typeof navigate === 'function' && player && player.userId && msg && msg.username) {
                                          navigateToProfile(navigate, player.userId, msg.username);
                                        }
                                      } catch (error) {
                                        console.error('Error navigating to profile:', error);
                                      }
                                    }}
                                    className={`text-sm font-semibold hover:text-accent-primary transition-colors cursor-pointer ${
                                      isMe ? 'text-accent-primary' : 'text-text-primary'
                                    }`}
                                    title="View profile"
                                  >
                                    {msg && msg.username ? msg.username : 'Unknown'}
                                  </button>
                                </UserTooltip>
                              ) : (
                                <span className={`text-sm font-semibold ${isMe ? 'text-accent-primary' : 'text-text-primary'}`}>
                                  {msg && msg.username ? msg.username : 'Unknown'} {isMe && <span className="text-xs opacity-70">(you)</span>}
                                </span>
                              )}
                              <span className="text-text-secondary text-xs">{formatMessageTime(msg.timestamp)}</span>
                            </div>
                            <div className={`text-sm break-words leading-relaxed ${isMe ? 'text-text-primary' : 'text-text-secondary'}`}>
                              {msg.message}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Input du chat - Design amélioré */}
                <form onSubmit={handleSendChatMessage} className="p-4 border-t border-border-secondary/30" aria-label="Send a chat message">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 px-4 py-2.5 bg-bg-primary/50 backdrop-blur-sm border border-border-secondary/30 rounded-xl text-text-primary text-sm focus:outline-none focus:border-accent-primary/50 focus:ring-2 focus:ring-accent-primary/20 transition-all placeholder:text-text-secondary/50 disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Chat message"
                      disabled={gameStatus === 'playing'}
                    />
                    <button
                      type="submit"
                      disabled={!chatInput.trim() || gameStatus === 'playing' || sendingMessage}
                      className="px-4 py-2 bg-accent-primary hover:bg-accent-hover text-accent-text font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center gap-2"
                      aria-label="Send message"
                    >
                      {sendingMessage ? (
                        <>
                          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Sending...</span>
                        </>
                      ) : (
                        'Send'
                      )}
                    </button>
                  </div>
                  {gameStatus === 'playing' && (
                    <p className="text-text-secondary text-xs mt-2">Chat disabled during game</p>
                  )}
                </form>
              </div>
            </div>
          </div>
        </div>
    </div>
  )
}
