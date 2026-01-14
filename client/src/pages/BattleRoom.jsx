import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom'
import LogoIconSmall from '../components/icons/LogoIconSmall'
import ShareButtons from '../components/ShareButtons'
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
import { normalizeSocketErrorMessage } from '../utils/normalizeSocketErrorMessage'

export default function BattleRoom() {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  // Protection : s'assurer que location.state existe avant de destructurer
  // IMPORTANT: Éviter complètement la destructuration pour éviter les erreurs TDZ lors de la minification
  // Le problème "Cannot access 'Ye' before initialization" vient du fait que la destructuration crée
  // des variables qui peuvent être réorganisées par le minificateur et utilisées avant d'être déclarées.
  // Solution: Ne jamais destructurer location.state, utiliser directement location.state.property partout
  const locationStateRef = useRef({});
  
  const { toast } = useToastContext();
  const { user: currentUserFromContext } = useUser();
  
  // Vérifier que navigate est bien une fonction (sécurité supplémentaire)
  if (!navigate || typeof navigate !== 'function') {
    console.error('BattleRoom: navigate is not a valid function');
    return <div>Error: Navigation not available</div>;
  }
  
  // IMPORTANT: NE JAMAIS modifier les refs en dehors des useEffect car cela peut causer des problèmes TDZ
  // lors de la minification. Les refs seront mises à jour uniquement dans les useEffect suivants.
  
  // Mettre à jour la ref quand location.state change
  // Éviter l'optional chaining dans les dépendances pour éviter les problèmes de minification
  useEffect(() => {
    const newLocationState = (location && location.state) ? location.state : {};
    locationStateRef.current = newLocationState;
  }, [location]);
  
  // État pour gérer le pseudo si l'utilisateur rejoint via un lien direct
  const [showNameModal, setShowNameModal] = useState(false);
  const [tempPlayerName, setTempPlayerName] = useState('');
  // IMPORTANT: Éviter de calculer la valeur initiale de playerName en dehors de useState
  // car cela peut créer un problème TDZ si les variables utilisées ne sont pas encore initialisées.
  // Utiliser une valeur par défaut et mettre à jour dans un useEffect immédiatement après.
  const [playerName, setPlayerName] = useState('');
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
  // UI: message d'état simple pour rendre le flow en ligne clair et fluide.
  // Cette structure centralise les messages visibles (connexion, attente, erreurs).
  const [battleStatus, setBattleStatus] = useState({
    type: 'info',
    message: 'Connecting to server...',
    visible: true
  });
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
  const [rematchReady, setRematchReady] = useState(false); // État pour savoir si le joueur veut rematcher
  const [opponentRematchReady, setOpponentRematchReady] = useState(false); // État pour savoir si l'adversaire veut rematcher
  const [isFocused, setIsFocused] = useState(false); // Pour le style seamless comme Solo
  const progressIntervalRef = useRef(null);
  const timerIntervalRef = useRef(null); // Ref pour le timer du mode timer
  const inputRef = useRef(null);
  // OPTIMISATION : Cache pour les calculs WPM (évite recalculs inutiles)
  const lastWpmCalculationRef = useRef({ time: 0, wpm: 0, accuracy: 100 });
  const socketRef = useRef(null);
  // Timeout pour masquer certains messages d'état automatiquement.
  const battleStatusTimeoutRef = useRef(null);
  const textContainerRef = useRef(null);
  const hasJoinedRoomRef = useRef(false); // Ref pour éviter de joindre plusieurs fois
  const listenersSetupRef = useRef(null); // Ref pour stocker la configuration des listeners (roomId-matchmaking)
  const lastErrorCountRef = useRef(0); // Ref pour le calcul incrémental des erreurs (optimisation O(1))
  const statsUpdateRef = useRef(null); // Ref pour throttler les calculs de stats avec requestAnimationFrame
  // Refs pour éviter les closures obsolètes dans les listeners socket
  // IMPORTANT: Initialiser TOUTES les refs avec des valeurs par défaut STABLES pour éviter les problèmes TDZ
  // Ne pas utiliser de variables destructurées ou calculées dans l'initialisation car le minificateur
  // peut les réorganiser et créer un problème d'ordre. Les valeurs seront mises à jour dans les useEffect suivants.
  const matchmakingRef = useRef(false); // Valeur par défaut, sera mise à jour
  const gameStatusRef = useRef('connecting'); // gameStatus n'existe pas encore, valeur par défaut
  const roomIdRef = useRef(''); // roomId sera mis à jour dans useEffect
  const playerNameRef = useRef(''); // playerName sera mis à jour dans useEffect
  const userIdRef = useRef(null); // userId sera mis à jour dans useEffect
  
  // IMPORTANT: NE JAMAIS modifier les refs en dehors des useEffect car cela peut causer des problèmes TDZ
  // lors de la minification. Les refs seront initialisées avec des valeurs par défaut et mises à jour
  // dans le useEffect suivant qui s'exécute immédiatement après le montage.

  /**
   * Afficher un message d'état court et lisible.
   * Objectif: guider l'utilisateur pendant les transitions (connexion, attente, erreurs).
   */
  const showBattleStatus = useCallback((message, type = 'info', autoHideMs = null) => {
    if (!message || typeof message !== 'string') return;

    // Nettoyer l'ancien timeout pour éviter les effets de bord.
    if (battleStatusTimeoutRef.current) {
      clearTimeout(battleStatusTimeoutRef.current);
      battleStatusTimeoutRef.current = null;
    }

    setBattleStatus({
      type,
      message,
      visible: true
    });

    // Auto-hide optionnel pour les messages temporaires.
    if (autoHideMs && Number.isFinite(autoHideMs)) {
      battleStatusTimeoutRef.current = setTimeout(() => {
        setBattleStatus(prev => ({
          ...prev,
          visible: false
        }));
      }, autoHideMs);
    }
  }, []);

  // Mapper le type d'état vers un style visuel simple et cohérent.
  const getBattleStatusClasses = (type) => {
    if (type === 'error') {
      return 'bg-text-error/10 text-text-error border border-text-error/30';
    }
    if (type === 'warning') {
      return 'bg-bg-secondary/60 text-text-secondary border border-border-secondary/40';
    }
    if (type === 'success') {
      return 'bg-accent-primary/15 text-accent-primary border border-accent-primary/30';
    }
    return 'bg-bg-secondary/50 text-text-secondary border border-border-secondary/40';
  };

  // IMPORTANT: Initialiser playerName dès le premier render pour éviter les problèmes TDZ
  // Ce useEffect s'exécute immédiatement après le montage et initialise playerName avec la bonne valeur
  // IMPORTANT: Utiliser directement location.state au lieu de variables destructurées pour éviter les problèmes TDZ
  useEffect(() => {
    // Utiliser directement location.state pour éviter d'utiliser des variables destructurées
    // qui pourraient causer un problème TDZ lors de la minification
    if (!playerName) {
      const locationStateForInit = (location && location.state) ? location.state : {};
      const locationPlayerName = (locationStateForInit && locationStateForInit.playerName) || '';
      const contextUsername = (currentUserFromContext && currentUserFromContext.username) || '';
      const newPlayerName = locationPlayerName || contextUsername || '';
      if (newPlayerName) {
        setPlayerName(newPlayerName);
      }
    }
  }, []); // S'exécuter une seule fois au montage - ne pas inclure location dans les dépendances pour éviter TDZ
  
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
    // IMPORTANT: Utiliser currentLocationState directement au lieu de userId et matchmaking destructurés
    // pour éviter les problèmes TDZ lors de la minification
    const currentLocationStateForUser = (location && location.state) ? location.state : {};
    const hasUserId = currentLocationStateForUser.userId || null;
    const hasMatchmaking = currentLocationStateForUser.matchmaking === true;
    
    // Vérifier si un token existe avant de faire la requête
    const token = localStorage.getItem('token');
    if ((hasUserId || hasMatchmaking || currentUserFromContext) && token) {
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
  }, [location, currentUserFromContext, playerName]);

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
          'error'
        ]);
      }
    };
  }, []); // Exécuter une seule fois au montage

  // IMPORTANT: Mettre à jour toutes les refs dans un seul useEffect pour éviter les problèmes TDZ
  // Ce useEffect s'exécute immédiatement après le montage et chaque fois que les valeurs changent.
  // IMPORTANT: Ne pas utiliser les variables destructurées (matchmaking, userId) dans les dépendances
  // car elles peuvent causer un problème TDZ lors de la minification
  // Utiliser directement location et les états React dans les dépendances
  useEffect(() => {
    // Récupérer les valeurs directement depuis location.state et les états pour éviter TDZ
    const currentLocationStateFromHook = (location && location.state) ? location.state : {};
    const currentMatchmakingValue = (currentLocationStateFromHook && currentLocationStateFromHook.matchmaking === true) ? true : false;
    const currentGameStatusValue = gameStatus || 'connecting';
    const currentRoomIdValue = roomId || '';
    const currentPlayerNameValue = playerName || '';
    const currentUserIdValue = (currentLocationStateFromHook && currentLocationStateFromHook.userId) || null;
    
    matchmakingRef.current = currentMatchmakingValue;
    gameStatusRef.current = currentGameStatusValue;
    roomIdRef.current = currentRoomIdValue;
    playerNameRef.current = currentPlayerNameValue;
    userIdRef.current = currentUserIdValue;
    
    // Si matchmaking ou roomId change, réinitialiser le flag pour reconfigurer les listeners
    const currentConfig = `${currentRoomIdValue || 'no-room'}-${currentMatchmakingValue}`;
    if (listenersSetupRef.current && listenersSetupRef.current !== currentConfig) {
      listenersSetupRef.current = null;
    }
  }, [location, gameStatus, roomId, playerName]);

  // Configurer les listeners socket une seule fois
  // IMPORTANT: Nettoyer les anciens listeners avant d'ajouter les nouveaux pour éviter les doublons
  // Réinitialiser le flag si on change de room ou de mode matchmaking pour reconfigurer les listeners
  useEffect(() => {
    if (!socketRef.current) {
      return;
    }

    const socket = socketRef.current;
    
    // Nettoyer les anciens listeners AVANT de vérifier le flag
    // Cela évite les doublons si le composant est remonté avec un nouveau roomId ou matchmaking
    const eventsToClean = [
      'matchmaking-error',
      'matchmaking-match-found',
      'room-joined',
      'player-joined',
      'player-left',
      'game-started',
      'opponent-update',
      'opponent-finished',
      'game-finished',
      'error',
      'disconnect',
      'reconnect'
    ];
    eventsToClean.forEach(event => socket.off(event));
    
    // Si les listeners ont déjà été configurés pour cette configuration, ne pas les reconfigurer
    // Vérifier que la configuration n'a pas changé (roomId ou matchmaking)
    // IMPORTANT: Utiliser location.state directement au lieu de matchmaking destructuré pour éviter TDZ
    const currentLocationStateForConfig = (location && location.state) ? location.state : {};
    const currentMatchmakingForConfig = currentLocationStateForConfig.matchmaking === true ? true : false;
    const currentConfig = `${roomId || 'no-room'}-${currentMatchmakingForConfig}`;
    if (listenersSetupRef.current && listenersSetupRef.current === currentConfig) {
      return;
    }
    
    listenersSetupRef.current = currentConfig;

    // Configurer tous les listeners socket
    // Listener simple pour signaler une connexion active côté UI.
    socket.on('connect', () => {
      showBattleStatus('Connected. Preparing room...', 'info', 1500);
    });
    
    // LISTENER SPÉCIAL : Pour les rooms matchmaking, écouter matchmaking-match-found
    // Les joueurs sont déjà dans la room (ajoutés par createMatchmakingRoom), pas besoin de join-room
    // Cet événement est envoyé juste après la création de la room matchmaking
    socket.on('matchmaking-match-found', (data) => {
      console.log('🔵 matchmaking-match-found event received at:', new Date().toISOString());
      console.log('🔵 Raw data:', data);
      try {
        // UX: indiquer immédiatement que le match est trouvé.
        showBattleStatus('Match found. Preparing room...', 'success', 2000);
        // Vérification de sécurité : s'assurer que toast est disponible
        if (!toast || typeof toast.error !== 'function') {
          console.error('❌ matchmaking-match-found: toast is not available');
          return;
        }
        
        // Vérification de sécurité : s'assurer que data existe et contient les propriétés nécessaires
        if (!data) {
          console.error('❌ matchmaking-match-found: data is undefined or null');
          toast.error('Invalid match data received. Please try again.');
          return;
        }
        
        if (!data.roomId) {
          console.error('❌ matchmaking-match-found: data.roomId is missing');
          toast.error('Invalid room ID received. Please try again.');
          return;
        }
        
        if (!data.text || typeof data.text !== 'string' || data.text.trim().length === 0) {
          console.error('❌ matchmaking-match-found: data.text is invalid');
          toast.error('Invalid game text received. Please try again.');
          return;
        }
        
        if (!data.players || !Array.isArray(data.players) || data.players.length === 0) {
          console.error('❌ matchmaking-match-found: data.players is invalid');
          toast.error('Invalid players data received. Please try again.');
          return;
        }
        
        // Vérifier que tous les players ont les propriétés nécessaires
        const validPlayers = data.players.filter(p => p && p.name && typeof p.name === 'string' && p.name.trim().length > 0);
        if (validPlayers.length === 0) {
          console.error('❌ matchmaking-match-found: No valid players in data.players');
          toast.error('Invalid players data received. Please try again.');
          return;
        }
        
        // Utiliser les refs pour avoir les valeurs à jour
        const currentMatchmaking = matchmakingRef.current;
        const currentGameStatus = gameStatusRef.current;
        const currentRoomId = roomIdRef.current;
        
        // Vérifier si on est en mode matchmaking (location.state peut ne pas être encore défini)
        // Éviter l'optional chaining pour éviter les problèmes de minification
        const currentLocationStateForListener = locationStateRef.current || (location && location.state) || {};
        const isMatchmakingMode = currentMatchmaking === true || currentLocationStateForListener.matchmaking === true;
        
        console.log('📨 matchmaking-match-found reçu:', { 
          dataRoomId: data.roomId, 
          currentRoomId: currentRoomId,
          roomIdFromParams: roomId,
          hasJoined: hasJoinedRoomRef.current,
          matchmaking: currentMatchmaking,
          matchmakingFromState: currentLocationStateForListener.matchmaking,
          isMatchmakingMode: isMatchmakingMode,
          gameStatus: currentGameStatus
        });
        
        // PRIORITÉ 1 : Si on est en mode matchmaking et en "connecting", TOUJOURS traiter l'événement
        // Cela couvre le cas où on arrive depuis Matchmaking (l'événement peut arriver avant que roomId soit défini)
        if (isMatchmakingMode && currentGameStatus === 'connecting') {
          console.log('✅ Matchmaking match found lors de l\'arrivée depuis Matchmaking (priorité 1):', data.roomId);
          // Mettre à jour les états directement (React batching les mises à jour automatiquement)
          try {
            // Marquer comme ayant rejoint d'abord pour éviter d'appeler join-room
            hasJoinedRoomRef.current = true;
            // Mettre à jour les états de manière synchrone
            setText(data.text);
            setPlayers(validPlayers);
            setGameStatus('waiting');
            // Réinitialiser le scroll du conteneur de texte au début
            if (textContainerRef.current) {
              textContainerRef.current.scrollTop = 0;
            }
          } catch (stateError) {
            console.error('❌ Error updating states:', stateError);
            console.error('❌ State error details:', {
              name: stateError?.name,
              message: stateError?.message,
              stack: stateError?.stack
            });
            toast.error('Error updating game state. Please refresh the page.');
          }
          return;
        }
        
        // PRIORITÉ 2 : Si le roomId correspond à la room actuelle, traiter l'événement normalement
        // Cela couvre le cas où l'événement arrive après que roomId soit défini
        if (data.roomId === currentRoomId || data.roomId === roomId) {
          console.log('✅ Matchmaking match found pour la room actuelle (priorité 2):', data.roomId);
          // Mettre à jour les états directement (React batching les mises à jour automatiquement)
          try {
            // Marquer comme ayant rejoint pour éviter d'appeler join-room
            hasJoinedRoomRef.current = true;
            // Mettre à jour les états de manière synchrone
            setText(data.text);
            setPlayers(validPlayers);
            setGameStatus('waiting');
            // Réinitialiser le scroll du conteneur de texte au début
            if (textContainerRef.current) {
              textContainerRef.current.scrollTop = 0;
            }
          } catch (stateError) {
            console.error('❌ Error updating states:', stateError);
            toast.error('Error updating game state. Please refresh the page.');
          }
          return;
        }
        
        // PRIORITÉ 3 : Si c'est une nouvelle room ET qu'on est déjà dans une partie active (Play Again)
        // Ne naviguer que si on a déjà rejoint une room ET qu'on n'est pas en "connecting"
        if (currentRoomId && data.roomId !== currentRoomId && hasJoinedRoomRef.current && currentGameStatus !== 'connecting') {
          console.log('✅ Nouveau match trouvé depuis une room existante, navigation vers la nouvelle room:', data.roomId);
          // Vérification de sécurité pour navigate et playerName
          if (!navigate || typeof navigate !== 'function') {
            console.error('❌ navigate is not available');
            toast.error('Navigation error. Please refresh the page.');
            return;
          }
          const currentPlayerName = playerNameRef.current || playerName;
          if (!currentPlayerName) {
            console.error('❌ playerName is not defined');
            toast.error('Player name missing. Please refresh the page.');
            return;
          }
          navigate(`/battle/${data.roomId}`, {
            state: {
              playerName: currentPlayerName,
              userId: userIdRef.current || ((location && location.state && location.state.userId) || null) || currentUser?.id || null,
              isCreator: false,
              matchmaking: true,
              ranked: data.ranked !== undefined ? data.ranked : (((location && location.state && location.state.ranked) !== undefined) ? location.state.ranked : true),
              existingSocket: true
            }
          });
          return;
        }
        
        // Cas par défaut : ignorer l'événement si le roomId ne correspond pas
        console.warn('⚠️ matchmaking-match-found ignoré:', { 
          dataRoomId: data.roomId, 
          currentRoomId: currentRoomId,
          roomIdFromParams: roomId,
          reason: 'RoomId mismatch and not in connecting state',
          isMatchmakingMode,
          currentGameStatus
        });
      } catch (error) {
        // Capturer toute erreur dans le handler pour éviter de crasher l'application
        console.error('❌ Error in matchmaking-match-found handler:', error);
        console.error('❌ Error details:', {
          name: error?.name,
          message: error?.message,
          stack: error?.stack,
          errorString: error?.toString(),
          data: data
        });
        // Afficher l'erreur dans un console.group pour plus de visibilité
        console.group('🔴 MATCHMAKING MATCH FOUND ERROR');
        console.error('Error object:', error);
        console.error('Error message:', error?.message);
        console.error('Error stack:', error?.stack);
        console.error('Error data:', data);
        console.groupEnd();
        if (toast && typeof toast.error === 'function') {
          const message = normalizeSocketErrorMessage(
            error,
            'An error occurred while processing the match. Please try again.'
          );
          toast.error(message);
          // UX: garder un message visible même si le toast est fermé.
          showBattleStatus(message, 'error');
        }
      }
    });

    // Erreurs spécifiques au matchmaking (ex: adversaire déconnecté, texte invalide)
    socket.on('matchmaking-error', (error) => {
      const message = normalizeSocketErrorMessage(error, 'Matchmaking failed. Please try again.');
      console.error('❌ matchmaking-error received:', error);
      toast.error(message);
      // UX: message visible pour expliquer l'échec.
      showBattleStatus(message, 'error');
      setGameStatus('waiting');
    });

    socket.on('room-joined', (data) => {
      console.log('✅ Room joined:', data);
      // UX: mise à jour de l'état affiché selon le nombre de joueurs.
      const playerCount = Array.isArray(data?.players) ? data.players.length : 0;
      if (playerCount < 2) {
        showBattleStatus('Waiting for opponent...', 'info');
      } else {
        showBattleStatus('Opponent found. Ready to start.', 'success', 2500);
      }
      // IMPORTANT: Marquer qu'on a rejoint pour éviter les appels multiples à join-room
      hasJoinedRoomRef.current = true;
      setText(data.text);
      setPlayers(data.players);
      // Ne pas changer le statut si on rejoint une room finished (le statut sera mis à jour par game-finished)
      if (gameStatus !== 'finished') {
        setGameStatus('waiting'); // Passer à 'waiting' une fois la room jointe
      }
    });

    socket.on('player-joined', (data) => {
      console.log('👤 Player joined:', data);
      setPlayers(data.players);
      // UX: signaler que l'adversaire est prêt.
      const playerCount = Array.isArray(data?.players) ? data.players.length : 0;
      if (playerCount >= 2) {
        showBattleStatus('Opponent joined. You can start the game.', 'success', 3000);
      }
    });

    socket.on('player-left', (data) => {
      console.log('👋 Player left:', data);
      setPlayers(data.players);
      // UX: prévenir si l'adversaire quitte.
      if ((data?.players?.length || 0) < 2 && gameStatusRef.current !== 'finished') {
        showBattleStatus('Opponent left the room. Waiting for reconnection...', 'warning');
      }
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
        isCreator: (location && location.state && location.state.isCreator) || false,
        socketConnected: socketRef.current?.connected
      });
      toast.error(message);
      // UX: message persistant pour expliquer le refus de démarrage.
      showBattleStatus(message, 'error');
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
          gameStatus,
          currentText: text,
          currentTextLength: text?.length
        });
        
        // Vérification de sécurité : s'assurer que data existe
        if (!data) {
          console.error('❌ game-started: data is undefined or null');
          toast.error('Invalid game data received. Please refresh the page.');
          setGameStatus('waiting');
          return;
        }

        console.log('✅ Setting gameStatus to playing');
        setGameStatus('playing');
        // UX: confirmer le démarrage de la partie.
        showBattleStatus('Game started. Good luck!', 'success', 2000);
        
        // Réinitialiser le scroll du conteneur de texte au début
        if (textContainerRef.current) {
          textContainerRef.current.scrollTop = 0;
        }
        
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
        console.log('📝 Processing text:', {
          hasDataText: !!(data.text),
          dataTextType: typeof data.text,
          dataTextLength: data.text?.length,
          hasCurrentText: !!(text),
          currentTextType: typeof text,
          currentTextLength: text?.length
        });
        
        try {
          if (data.text && typeof data.text === 'string' && data.text.trim().length > 0) {
            console.log('✅ Setting text from data.text');
            setText(data.text);
          } else if (!text || text.trim().length === 0) {
            // Si le texte n'est pas dans data ET n'existe pas déjà dans le state, c'est une erreur
            console.error('❌ game-started: Invalid or missing text:', {
              dataText: data.text,
              dataTextType: typeof data.text,
              currentText: text,
              currentTextType: typeof text
            });
            toast.error('Invalid game text received. Please refresh the page.');
            setGameStatus('waiting');
            return;
          } else {
            console.log('✅ Using existing text from state');
          }
        } catch (textError) {
          console.error('❌ Error setting text:', textError);
          throw textError; // Re-throw pour être capturé par le catch principal
        }
        // Sinon, le texte existe déjà dans le state (via matchmaking-match-found), on continue
        
        // Mettre à jour le mode et les paramètres
        console.log('⚙️ Updating game settings');
        try {
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
        } catch (settingsError) {
          console.error('❌ Error updating settings:', settingsError);
          throw settingsError;
        }
      
        // Arrêter l'interval précédent s'il existe
        console.log('🛑 Cleaning up previous intervals');
        try {
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
          }
          // Annuler les calculs de stats en cours
          if (statsUpdateRef.current) {
            cancelAnimationFrame(statsUpdateRef.current);
            statsUpdateRef.current = null;
          }
        } catch (cleanupError) {
          console.warn('⚠️ Error during cleanup:', cleanupError);
          // Ne pas throw ici, ce n'est pas critique
        }
      
        // Démarrer le timer si mode timer
        console.log('⏱️ Setting up timer:', { mode: data.mode, timerDuration: data.timerDuration });
        if (data.mode === 'timer' && data.timerDuration) {
          try {
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
          console.log('✅ Timer interval set');
          } catch (timerError) {
            console.error('❌ Error setting up timer:', timerError);
            throw timerError;
          }
        }
        
        // L'enregistrement des stats se fera dans handleInputChange et opponent-update
        // Pas besoin d'interval ici car on met à jour à chaque frappe
        
        console.log('🎯 Focusing input field');
        try {
          if (inputRef.current) {
            inputRef.current.focus();
            console.log('✅ Input focused');
          } else {
            console.warn('⚠️ inputRef.current is null, cannot focus');
          }
        } catch (focusError) {
          console.warn('⚠️ Error focusing input:', focusError);
          // Ne pas throw ici, ce n'est pas critique
        }
        
        console.log('✅ game-started handler completed successfully');
      } catch (error) {
        // Capturer toute erreur dans le handler game-started
        console.error('❌ Error in game-started handler:', error);
        console.error('❌ Error name:', error?.name);
        console.error('❌ Error message:', error?.message);
        console.error('❌ Error stack:', error?.stack);
        console.error('❌ Error toString:', error?.toString());
        console.error('❌ Full error object:', error);
        
        // Afficher l'erreur dans un groupe console pour plus de visibilité
        console.group('🔴 GAME-STARTED ERROR');
        console.error('Error:', error);
        console.error('Error details:', {
          name: error?.name,
          message: error?.message,
          stack: error?.stack
        });
        console.groupEnd();
        
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
        // IMPORTANT: Utiliser locationStateRef.current au lieu de userId destructuré pour éviter TDZ
        const currentLocationStateForElo = locationStateRef.current || (location && location.state) || {};
        const currentUserIdForElo = (currentLocationStateForElo && currentLocationStateForElo.userId) || null;
        if ((currentUserIdForElo || currentUser?.id) && token) {
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

    socket.on('error', (error) => {
      const message = normalizeSocketErrorMessage(error, 'An error occurred');
      console.error('❌ Socket error:', error);
      toast.error(message);
      // UX: garder un message visible même si le toast disparaît.
      showBattleStatus(message, 'error');
      
      // Ne pas rediriger immédiatement, laisser Socket.IO tenter de se reconnecter
      // La redirection se fera seulement si la reconnexion échoue définitivement
      socket.once('reconnect_failed', () => {
        toast.error('Connection lost. Redirecting to home...');
        setTimeout(() => {
          navigate('/');
        }, 2000);
      });
    });

    // Écouter les événements de rematch
    socket.on('rematch-ready', (data) => {
      console.log('🔄 Opponent ready for rematch:', data);
      // data contient { playerId, ready: true }
      // Si ce n'est pas notre socket.id, c'est l'adversaire qui est prêt
      if (data.playerId !== socket.id) {
        setOpponentRematchReady(true);
        toast.info('Opponent is ready for rematch!');
      }
    });

    socket.on('rematch-start', (data) => {
      console.log('🎮 Rematch starting:', data);
      // Réinitialiser les états pour la nouvelle partie
      setRematchReady(false);
      setOpponentRematchReady(false);
      setInput('');
      setErrors(0);
      setMyStats({ wpm: 0, accuracy: 100, progress: 0 });
      setOpponentStats({ wpm: 0, accuracy: 100, progress: 0 });
      setResults(null);
      setEloChanges({});
      
      // Réinitialiser le scroll du conteneur de texte au début
      if (textContainerRef.current) {
        textContainerRef.current.scrollTop = 0;
      }
      
      // Mettre à jour le texte et démarrer la partie
      if (data.text) {
        setText(data.text);
      }
      setGameStatus('playing');
      setStartTime(data.startTime || Date.now());
      typingStartTimeRef.current = Date.now();
      setTypingStartTime(Date.now());
      
      // Réinitialiser le timer si nécessaire
      if (data.mode === 'timer' && data.timerDuration) {
        setTimeLeft(data.timerDuration);
        // Démarrer le timer
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
        }
        timerIntervalRef.current = setInterval(() => {
          setTimeLeft(prev => {
            if (prev === null || prev <= 1) {
              clearInterval(timerIntervalRef.current);
              timerIntervalRef.current = null;
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
      
      // Focus sur l'input
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    });
    
    // Gérer les déconnexions avec reconnexion automatique
    socket.on('disconnect', (reason) => {
      console.warn('⚠️ Socket disconnected:', reason);
      // UX: informer l'utilisateur qu'une reconnexion est en cours.
      showBattleStatus('Connection lost. Reconnecting...', 'warning');
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
      // UX: confirmer le retour de la connexion.
      showBattleStatus('Connection restored.', 'success', 2000);
      
      // Réessayer de rejoindre la room après reconnexion
      // IMPORTANT: Utiliser locationStateRef.current au lieu de userId destructuré pour éviter TDZ
      if (playerName && roomId && hasJoinedRoomRef.current) {
        console.log('🔄 Rejoining room after reconnection...');
        hasJoinedRoomRef.current = false; // Permettre de rejoindre à nouveau
        const currentLocationStateForRejoin = locationStateRef.current || (location && location.state) || {};
        const currentUserIdForRejoin = (currentLocationStateForRejoin && currentLocationStateForRejoin.userId) || null;
        socket.emit('join-room', { 
          roomId, 
          playerName,
          userId: currentUserIdForRejoin || currentUser?.id || null
        });
      }
    });

    // Nettoyage des listeners sera fait dans le premier useEffect (cleanupSocket)
    // Ne pas réinitialiser le flag ici car on veut garder la trace de la configuration
    return () => {
      // Les listeners seront nettoyés par cleanupSocket dans le premier useEffect
      // Ne pas réinitialiser listenersSetupRef ici car on veut le garder pour éviter les doublons
    };
  }, [roomId, location, showBattleStatus]); // Reconfigurer si roomId ou matchmaking change (même si undefined)

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
    // IMPORTANT: Utiliser currentLocationState directement au lieu de matchmaking destructuré pour éviter TDZ
    const currentLocationStateForJoin = (location && location.state) ? location.state : {};
    const isMatchmakingRoom = currentLocationStateForJoin.matchmaking === true;
    const currentUserIdForJoin = currentLocationStateForJoin.userId || null;
    
    if (isMatchmakingRoom) {
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
            userId: currentUserIdForJoin || currentUser?.id || null
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

      // IMPORTANT: Utiliser locationStateRef.current au lieu de userId destructuré pour éviter TDZ
      const currentLocationStateForJoinRoom = locationStateRef.current || (location && location.state) || {};
      const currentUserIdForJoinRoom = (currentLocationStateForJoinRoom && currentLocationStateForJoinRoom.userId) || null;
      console.log('🔌 Joining room:', roomId, 'as', playerName, '(userId:', currentUserIdForJoinRoom || currentUser?.id || 'guest', ')');
      socket.emit('join-room', { 
        roomId, 
        playerName,
        userId: currentUserIdForJoinRoom || currentUser?.id || null
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
  }, [roomId, playerName, location, currentUser?.id]); // Utiliser location au lieu de userId et matchmaking destructurés pour éviter TDZ

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
      // Nettoyage du timeout d'état UI pour éviter les fuites.
      if (battleStatusTimeoutRef.current) {
        clearTimeout(battleStatusTimeoutRef.current);
        battleStatusTimeoutRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (inputRef.current && gameStatus === 'playing') {
      inputRef.current.focus();
    }
  }, [gameStatus]);


  const handleStartGame = () => {
    try {
      console.log('🎮 handleStartGame called:', {
        roomId,
        playersCount: players.length,
        gameStatus,
        isCreator: (location && location.state && location.state.isCreator) || false,
        socketConnected: socketRef.current?.connected,
        battleMode,
        selectedLanguage,
        timerDuration,
        phraseDifficulty
      });
      
      // Vérifications de base
      const currentPlayers = Array.isArray(players) ? players : [];
      if (currentPlayers.length !== 2) {
        console.warn('⚠️ Cannot start game: waiting for opponent', { playersCount: currentPlayers.length });
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
        // UX: expliquer la tentative de reconnexion avant le démarrage.
        showBattleStatus('Waiting for connection to start the game...', 'warning');
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
      // UX: indiquer que le démarrage est en cours.
      showBattleStatus('Starting the game...', 'info');
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

      // OPTIMISATION : Calculer les stats de manière throttlée avec cache
      // Ne recalculer que toutes les 100ms (10 FPS pour stats) au lieu de chaque frame
      // Cela réduit les calculs de 90% et améliore la performance
      if (typingStartTime) {
        const now = Date.now();
        const timeSinceLastCalc = now - lastWpmCalculationRef.current.time;
        
        // Ne recalculer que toutes les 100ms (10 FPS pour stats)
        if (timeSinceLastCalc >= 100) {
          // Annuler le calcul précédent s'il existe
          if (statsUpdateRef.current) {
            cancelAnimationFrame(statsUpdateRef.current);
          }
          
          // Déférer les calculs de stats pour ne pas bloquer l'input
          statsUpdateRef.current = requestAnimationFrame(() => {
            const timeElapsed = (now - typingStartTimeRef.current) / 1000 / 60;
            
            // Protection division par zéro
            if (timeElapsed > 0) {
              // Calcul optimisé : utiliser errorCount déjà calculé
              const correctChars = value.length - errorCount;
              
              // WPM basé uniquement sur les caractères corrects - empêche le spam du clavier
              // Un mot = 5 caractères (standard typing test)
              const wordsTyped = correctChars / 5;
              const wpm = Math.round(wordsTyped / timeElapsed);
              
              // Accuracy : (caractères corrects / total) * 100
              const accuracy = value.length > 0 
                ? Math.round((correctChars / value.length) * 100)
                : 100;
              
              // Mettre à jour le cache
              lastWpmCalculationRef.current = { time: now, wpm, accuracy };
              
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
            }
          });
        } else {
          // Utiliser les valeurs en cache pour le progress (seule valeur qui change souvent)
          const progress = text.length > 0 ? Math.round((value.length / text.length) * 100) : 0;
          setMyStats({
            wpm: lastWpmCalculationRef.current.wpm,
            accuracy: lastWpmCalculationRef.current.accuracy,
            progress
          });
        }

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
      if (e.key === 'Enter' && gameStatus === 'finished' && results) {
        e.preventDefault();
        // Appeler la même fonction que le bouton "Play Again" (rematch si possible)
        // Utiliser locationStateRef.current au lieu de location.state pour éviter les problèmes d'initialisation
        // Éviter l'optional chaining pour éviter les problèmes de minification
        const currentLocationStateForRematch = locationStateRef.current || (location && location.state) || {};
        if (!currentLocationStateForRematch.matchmaking && socketRef.current && socketRef.current.connected && roomId) {
          // Demander un rematch si on est dans une room (pas de matchmaking)
          if (!rematchReady) {
            setRematchReady(true);
            socketRef.current.emit('request-rematch', { roomId });
            toast.info('Waiting for opponent to accept rematch...');
          }
        } else {
          // Relancer le matchmaking automatiquement
          if (currentLocationStateForRematch.matchmaking) {
            handlePlayAgainMatchmaking();
          } else {
            navigate('/battle');
          }
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
  }, [gameStatus, navigate, results, rematchReady, roomId, handlePlayAgainMatchmaking]); // Retirer location.state des dépendances pour éviter les problèmes d'initialisation

  // OPTIMISATION : Mémoriser renderText avec useMemo pour éviter de recalculer à chaque render
  // Cela améliore significativement les performances lors de la frappe
  // IMPORTANT: Ajouter des vérifications de sécurité pour éviter les erreurs si text est undefined
  const renderText = useMemo(() => {
    console.log('🖼️ renderText useMemo called:', {
      hasText: !!text,
      textType: typeof text,
      textLength: text?.length,
      inputLength: input?.length,
      inputType: typeof input
    });
    
    // Vérification de sécurité : s'assurer que text est valide
    if (!text || typeof text !== 'string') {
      console.warn('⚠️ renderText: text is invalid, using empty string', {
        text,
        textType: typeof text
      });
      return <span className="text-text-secondary">Loading text...</span>;
    }
    
    // Vérification de sécurité : s'assurer que input est valide
    if (input === undefined || input === null) {
      console.warn('⚠️ renderText: input is invalid, using empty string');
      const safeInput = '';
      try {
        return text.split('').map((char, index) => {
          if (index < safeInput.length) {
            const isCorrect = safeInput[index] === char;
            return (
              <span key={index} className={isCorrect ? 'char-correct' : 'char-incorrect'}>
                {char}
              </span>
            );
          } else if (index === safeInput.length) {
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
        console.error('❌ Error in renderText (safeInput fallback):', error);
        return <span className="text-text-secondary">Error rendering text. Please refresh the page.</span>;
      }
    }
    
    try {
      const safeInput = typeof input === 'string' ? input : '';
      const result = text.split('').map((char, index) => {
        if (index < safeInput.length) {
          const isCorrect = safeInput[index] === char;
          return (
            <span key={index} className={isCorrect ? 'char-correct' : 'char-incorrect'}>
              {char}
            </span>
          );
        } else if (index === safeInput.length) {
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
      console.log('✅ renderText completed successfully, elements:', result.length);
      return result;
    } catch (error) {
      console.error('❌ Error in renderText:', error);
      console.error('Error details:', {
        name: error?.name,
        message: error?.message,
        stack: error?.stack,
        text: text,
        textType: typeof text,
        input: input,
        inputType: typeof input
      });
      return <span className="text-text-secondary">Error rendering text. Please refresh the page.</span>;
    }
  }, [text, input]);

  // Vérification de sécurité : s'assurer que players est un tableau
  const safePlayers = Array.isArray(players) ? players : [];
  // Protection supplémentaire : vérifier que currentUser existe avant d'utiliser son id
  // IMPORTANT: Utiliser locationStateRef.current au lieu de useMemo pour éviter les problèmes TDZ
  // locationStateRef.current est mis à jour dans un useEffect, donc il est toujours disponible
  // et ne cause pas de problème d'ordre lors de la minification
  const currentLocationStateFromRef = locationStateRef.current || {};
  const currentUserIdFromState = (currentLocationStateFromRef && currentLocationStateFromRef.userId) || null;
  const currentUserId = currentUser?.id || currentUserIdFromState || null;
  const myPlayer = safePlayers.find(p => {
    if (!p) return false;
    const playerMatchesName = p.name === playerName;
    const playerMatchesUserId = p.userId && currentUserId && p.userId === currentUserId;
    return playerMatchesName || playerMatchesUserId;
  });
  const opponent = safePlayers.find(p => {
    if (!p) return false;
    const playerNotMatchesName = p.name !== playerName;
    const playerNotMatchesUserId = !p.userId || !currentUserId || p.userId !== currentUserId;
    return playerNotMatchesName && playerNotMatchesUserId;
  });

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

  // Fonction pour relancer le matchmaking automatiquement
  const handlePlayAgainMatchmaking = useCallback(() => {
    if (!socketRef.current || !socketRef.current.connected) {
      toast.error('Not connected to server. Please wait...');
      return;
    }

    // Récupérer les paramètres du match précédent depuis location.state ou utiliser des valeurs par défaut
    const language = selectedLanguage || 'en';
    const mmr = currentUser ? (currentUser.mmr?.[language] || 1000) : 1000;
    // IMPORTANT: Utiliser directement location.state.ranked au lieu de ranked destructuré pour éviter TDZ
    const locationStateForRanked = (location && location.state) ? location.state : {};
    const isRanked = (locationStateForRanked.ranked !== undefined) ? locationStateForRanked.ranked : true;

    // Vérifier que l'utilisateur est connecté pour ranked
    if (isRanked && !currentUser) {
      toast.error('You must be logged in to play ranked matches');
      return;
    }

    // Réinitialiser l'état pour le nouveau match
    setGameStatus('connecting');
    setResults(null);
    setEloChanges({});
    setRematchReady(false);
    setOpponentRematchReady(false);
    setPlayers([]);
    setText('');
    setInput('');
    setMyStats({ wpm: 0, accuracy: 100, progress: 0 });
    setOpponentStats({ wpm: 0, accuracy: 100, progress: 0 });
    hasJoinedRoomRef.current = false;
    
    // Réinitialiser le scroll du conteneur de texte au début
    if (textContainerRef.current) {
      textContainerRef.current.scrollTop = 0;
    }

    // Émettre join-matchmaking avec les mêmes paramètres
    socketRef.current.emit('join-matchmaking', {
      userId: currentUser ? currentUser.id : null,
      username: currentUser ? currentUser.username : playerName,
      language: language,
      mmr: mmr,
      ranked: isRanked
    });

    toast.info('Searching for a new opponent...');
  }, [socketRef, selectedLanguage, currentUser, location, playerName, toast]); // Utiliser location au lieu de ranked pour éviter TDZ

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden bg-bg-primary">
      {/* Header cohérent avec MainPage */}
      <header 
        className="w-full bg-bg-primary/60 backdrop-blur-md relative flex-shrink-0"
        style={{
          background: 'rgba(10, 14, 26, 0.6)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          zIndex: 100
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo et titre */}
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-2 sm:gap-3 cursor-pointer group"
              >
                <LogoIconSmall 
                  className="w-6 h-6 sm:w-7 sm:h-7 text-text-primary/80 group-hover:text-accent-primary transition-all duration-200" 
                  stroke="currentColor"
                />
                <h1 
                  className="text-base sm:text-xl font-bold text-text-primary/90 group-hover:text-accent-primary transition-all duration-200 whitespace-nowrap"
                  style={{ fontFamily: 'Inter', letterSpacing: '-0.02em' }}
                >
                  typingpvp.com
                </h1>
              </button>
              <div className="h-6 w-px bg-border-secondary/40 mx-2"></div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-semibold text-text-primary" style={{ fontFamily: 'Inter' }}>
                  {((currentLocationStateFromRef && currentLocationStateFromRef.matchmaking) === true) ? 'Competitive Match' : (roomId ? `Battle #${roomId.slice(0, 8)}` : 'Battle')}
                </h2>
                {((currentLocationStateFromRef && currentLocationStateFromRef.matchmaking) === true) && (
                  <div className={`px-2 py-0.5 rounded-full text-xs font-bold border ${
                    (currentLocationStateFromRef && currentLocationStateFromRef.ranked) === true
                      ? 'bg-accent-primary/20 text-accent-primary border-accent-primary/50' 
                      : 'bg-bg-secondary/60 text-text-secondary border-border-secondary/40'
                  }`}>
                    {(currentLocationStateFromRef && currentLocationStateFromRef.ranked) === true ? '🏆 Ranked' : '🎮 Unrated'}
                  </div>
                )}
              </div>
            </div>

            {/* Players info */}
            <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm flex-shrink-0">
              {safePlayers.filter(p => p && p.name && typeof p.name === 'string').map((player, index) => (
                <div key={player.name || index} className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-full bg-bg-secondary/60 backdrop-blur-sm border border-border-secondary/30">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    playerName && player.name === playerName 
                      ? 'bg-accent-primary animate-pulse' 
                      : 'bg-text-secondary/60'
                  }`}></div>
                  <span className={`font-medium truncate max-w-[80px] sm:max-w-[120px] ${
                    playerName && player.name === playerName ? 'text-accent-primary' : 'text-text-secondary'
                  }`}>{player.name || 'Unknown'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Main content - ONEPAGE sans scroll */}
      <main className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <div className="flex-1 min-h-0 flex flex-col max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          {/* Statut global pour guider l'utilisateur pendant le flow en ligne */}
          {battleStatus.visible && battleStatus.message && (
            <div className="mb-4">
              <div className={`px-4 py-2 rounded-lg text-sm font-medium ${getBattleStatusClasses(battleStatus.type)}`}>
                {battleStatus.message}
              </div>
            </div>
          )}

          {gameStatus === 'waiting' && safePlayers && safePlayers.length > 0 && playerName && (
            <div className="flex-1 flex items-center justify-center min-h-0 overflow-y-auto">
              <div className="text-center space-y-4 sm:space-y-6 max-w-2xl w-full py-4">
                {/* Liste des joueurs - Design compétitif moderne */}
                <div className="space-y-3">
                  <h3 className="text-text-primary text-base sm:text-lg font-bold uppercase tracking-wider mb-4 flex items-center justify-center gap-2">
                    <span className="w-1.5 h-6 bg-gradient-to-b from-accent-primary to-accent-secondary rounded-full"></span>
                    <span>Players</span>
                    <span className="w-1.5 h-6 bg-gradient-to-b from-accent-primary to-accent-secondary rounded-full"></span>
                  </h3>
                  <div className="space-y-3">
                    {safePlayers.filter(p => p && p.name && typeof p.name === 'string').map((player, index) => (
                      <div 
                        key={player.name || index}
                        className={`backdrop-blur-sm rounded-2xl p-5 flex items-center justify-between border-2 transition-all duration-300 transform hover:scale-[1.02] ${
                          player.name === playerName 
                            ? 'bg-gradient-to-r from-accent-primary/20 via-accent-primary/15 to-accent-primary/20 border-accent-primary/50 shadow-xl shadow-accent-primary/20' 
                            : 'bg-gradient-to-r from-bg-primary/40 via-bg-primary/30 to-bg-primary/40 border-border-secondary/40 shadow-lg'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-4 h-4 rounded-full transition-all ${
                            player.name === playerName 
                              ? 'bg-accent-primary shadow-lg shadow-accent-primary/60 animate-pulse' 
                              : 'bg-text-secondary/60'
                          }`}></div>
                          <span className={`font-bold text-base ${
                            player.name === playerName ? 'text-text-primary' : 'text-text-secondary'
                          }`}>{player.name || 'Unknown'}</span>
                          {playerName && player.name === playerName && (
                            <span className="text-xs px-3 py-1 bg-gradient-to-r from-accent-primary/30 to-accent-secondary/30 text-accent-primary rounded-full font-bold border border-accent-primary/40 shadow-lg">
                              You
                            </span>
                          )}
                        </div>
                        {playerName && player.name === playerName && (
                          <span className="text-xs px-4 py-2 bg-gradient-to-r from-green-500/30 to-green-400/30 text-green-400 rounded-full font-bold border-2 border-green-500/40 shadow-lg flex items-center gap-1">
                            <span>✓</span>
                            <span>Ready</span>
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Message d'attente ou bouton start - Design compétitif moderne */}
                {safePlayers.length === 1 ? (
                  <div className="space-y-4 sm:space-y-6 bg-gradient-to-br from-bg-secondary/70 via-bg-secondary/50 to-bg-secondary/70 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-6 sm:p-8 border-2 border-border-secondary/40 shadow-2xl">
                    <div className="relative w-16 h-16 sm:w-20 sm:h-20 mx-auto">
                      <div className="absolute inset-0 border-4 border-accent-primary/20 rounded-full"></div>
                      <div className="absolute inset-0 border-4 border-transparent border-t-accent-primary rounded-full animate-spin"></div>
                      <div className="absolute inset-2 border-4 border-transparent border-r-accent-secondary rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
                      <div className="absolute inset-4 border-4 border-transparent border-b-accent-primary/40 rounded-full animate-spin" style={{ animationDuration: '2s' }}></div>
                    </div>
                    <div className="space-y-3 text-center">
                      <p className="text-text-primary text-xl sm:text-2xl font-bold">
                        Waiting for opponent... ⏳
                      </p>
                      <p className="text-text-secondary text-sm sm:text-base font-medium">
                        Share the room ID to invite a friend:
                      </p>
                      <div 
                        className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-bg-primary/60 via-bg-primary/50 to-bg-primary/60 backdrop-blur-sm rounded-2xl border-2 border-accent-primary/30 cursor-pointer hover:bg-gradient-to-r hover:from-accent-primary/20 hover:via-accent-primary/15 hover:to-accent-primary/20 hover:border-accent-primary/50 transition-all duration-300 group transform hover:scale-105 active:scale-95 shadow-lg"
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
                        <span className="font-mono text-accent-primary group-hover:text-accent-hover transition-colors font-bold text-lg">{roomId}</span>
                        <svg className="w-5 h-5 text-text-secondary group-hover:text-accent-primary transition-all transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                ) : (
                      <div className="space-y-4 sm:space-y-6 bg-gradient-to-br from-bg-secondary/60 via-bg-secondary/40 to-bg-secondary/60 backdrop-blur-sm rounded-2xl p-6 sm:p-8 border-2 border-accent-primary/30 shadow-2xl overflow-visible">
                    <div className="space-y-3 text-center">
                      <div className="flex items-center justify-center gap-2 sm:gap-3">
                        <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-accent-primary animate-pulse shadow-lg shadow-accent-primary/50"></div>
                        <p className="text-text-primary text-lg sm:text-xl font-bold">
                          Both players ready! ⚔️
                        </p>
                        <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-accent-primary animate-pulse shadow-lg shadow-accent-primary/50" style={{ animationDelay: '0.5s' }}></div>
                      </div>
                      {((currentLocationStateFromRef && currentLocationStateFromRef.isCreator) === true) ? (
                        <p className="text-text-secondary text-sm sm:text-base font-medium">
                          Configure the battle settings below and click start when you're ready
                        </p>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-text-secondary text-sm sm:text-base font-medium">
                            Waiting for room creator to start the battle...
                          </p>
                          <div className="flex items-center justify-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-accent-primary animate-bounce" style={{ animationDelay: '0s' }}></div>
                            <div className="w-2 h-2 rounded-full bg-accent-primary animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            <div className="w-2 h-2 rounded-full bg-accent-primary animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                          </div>
                        </div>
                      )}
                    </div>
                    {safePlayers.length === 2 && ((currentLocationStateFromRef && currentLocationStateFromRef.isCreator) === true) && (
                      <div className="space-y-3 sm:space-y-4 overflow-visible">
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
                          className="bg-gradient-to-r from-accent-primary via-accent-primary to-accent-secondary hover:from-accent-hover hover:via-accent-hover hover:to-accent-hover text-accent-text font-bold py-3 sm:py-4 px-8 sm:px-10 rounded-xl sm:rounded-2xl transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-2xl shadow-accent-primary/40 w-full border-2 border-accent-primary/50 text-base sm:text-lg relative overflow-hidden group"
                          aria-label="Start the battle"
                          disabled={safePlayers.length !== 2}
                        >
                          {/* Effet de brillance au survol */}
                          <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></span>
                          <span className="relative z-10 flex items-center justify-center gap-2">
                            <span>⚔️</span>
                            <span>{safePlayers.length === 2 ? 'Start Battle' : 'Waiting for opponent...'}</span>
                            <span>⚔️</span>
                          </span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {gameStatus === 'playing' && text && safePlayers && (
            <div className="flex-1 flex flex-col items-center justify-center min-h-0 overflow-hidden">
              {/* Timer pour le mode timer - Design époustouflant et responsive */}
              {battleMode === 'timer' && timeLeft !== null && (
                <div className="mb-2 sm:mb-4 text-center px-2 flex-shrink-0">
                  <div className="relative inline-block w-full max-w-xs">
                    {/* Effet de glow animé */}
                    <div className={`absolute inset-0 rounded-2xl sm:rounded-3xl blur-xl sm:blur-2xl ${
                      timeLeft <= 10 
                        ? 'bg-red-500/30 animate-pulse' 
                        : 'bg-accent-primary/20 animate-pulse'
                    }`} style={{ 
                      transform: 'scale(1.1)',
                      animation: timeLeft <= 10 ? 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite' : 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                    }}></div>
                    <div className="relative bg-gradient-to-br from-bg-primary/90 via-bg-primary/80 to-bg-primary/90 backdrop-blur-xl rounded-xl sm:rounded-2xl px-4 py-3 sm:px-6 sm:py-4 border-2 border-accent-primary/40 shadow-2xl">
                      <div className={`text-4xl sm:text-5xl font-bold ${
                        timeLeft <= 10 ? 'text-red-400' : 'text-accent-primary'
                      }`} style={{ 
                        fontFamily: 'JetBrains Mono', 
                        textShadow: timeLeft <= 10 
                          ? '0 0 20px rgba(248, 113, 113, 0.8), 0 0 40px rgba(248, 113, 113, 0.4)' 
                          : '0 0 15px rgba(251, 191, 36, 0.6), 0 0 30px rgba(251, 191, 36, 0.3)',
                        filter: timeLeft <= 10 ? 'drop-shadow(0 0 8px rgba(248, 113, 113, 0.8))' : 'none'
                      }}>
                        {timeLeft}
                      </div>
                      <div className="text-xs font-semibold text-text-secondary mt-1 uppercase tracking-wider">
                        {timeLeft <= 10 ? '⚠️ Time Running Out!' : 'Seconds Remaining'}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Stats des joueurs - Design moderne et compétitif, optimisé mobile */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3 mb-3 sm:mb-4 w-full max-w-5xl px-2 flex-shrink-0">
                {/* Stats du joueur actuel - Design compétitif moderne */}
                <div className="relative bg-gradient-to-br from-accent-primary/10 via-accent-primary/5 to-transparent backdrop-blur-xl rounded-xl sm:rounded-2xl p-3 sm:p-4 border-2 border-accent-primary/30 shadow-2xl shadow-accent-primary/20 transform transition-all duration-300 hover:scale-[1.01] hover:border-accent-primary/50">
                  {/* Effet de glow pour le joueur actif */}
                  <div className="absolute inset-0 rounded-xl sm:rounded-2xl bg-accent-primary/5 blur-xl"></div>
                  <div className="relative">
                    <div className="flex items-center justify-between mb-2 sm:mb-3">
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-accent-primary animate-pulse shadow-lg shadow-accent-primary/60"></div>
                          <div className="absolute inset-0 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-accent-primary animate-ping opacity-30"></div>
                        </div>
                        <span className="text-text-primary text-sm sm:text-base font-bold truncate max-w-[100px] sm:max-w-none">{myPlayer?.name || 'You'}</span>
                      </div>
                      <span className="px-2 py-0.5 sm:px-3 sm:py-1 bg-gradient-to-r from-accent-primary/40 to-accent-secondary/40 text-accent-primary rounded-full text-xs font-bold border border-accent-primary/50 shadow-lg flex-shrink-0">
                        YOU
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between gap-2 sm:gap-3 mb-2 sm:mb-3">
                      <div>
                        <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-accent-primary" style={{ 
                          fontFamily: 'JetBrains Mono', 
                          textShadow: '0 0 15px rgba(251, 191, 36, 0.5), 0 0 30px rgba(251, 191, 36, 0.2)',
                          filter: 'drop-shadow(0 0 8px rgba(251, 191, 36, 0.4))'
                        }}>
                          {myStats.wpm}
                        </div>
                        <div className="text-xs text-text-secondary font-medium mt-0.5">WPM</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl sm:text-2xl md:text-3xl font-bold text-text-primary" style={{ fontFamily: 'JetBrains Mono' }}>
                          {myStats.accuracy.toFixed(1)}%
                        </div>
                        <div className="text-xs text-text-secondary font-medium mt-0.5">Accuracy</div>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs text-text-secondary font-medium">
                        <span>Progress</span>
                        <span className="font-mono font-bold text-text-primary">{Math.round(myStats.progress)}%</span>
                      </div>
                      <div className="w-full bg-bg-primary/50 rounded-full h-2 overflow-hidden shadow-inner border border-border-secondary/20">
                        <div 
                          className="bg-gradient-to-r from-accent-primary via-accent-secondary to-accent-primary h-2 rounded-full transition-all duration-300 shadow-lg shadow-accent-primary/40"
                          style={{ width: `${Math.min(myStats.progress, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Stats de l'adversaire - Design compétitif moderne, optimisé mobile */}
                {opponent && opponent.name && (
                  <div className="relative bg-gradient-to-br from-bg-secondary/60 via-bg-secondary/40 to-bg-secondary/60 backdrop-blur-xl rounded-xl sm:rounded-2xl p-3 sm:p-4 border-2 border-border-secondary/30 shadow-xl transform transition-all duration-300 hover:scale-[1.01] hover:border-border-secondary/50">
                    <div className="relative">
                      <div className="flex items-center justify-between mb-2 sm:mb-3">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-text-secondary/60 flex-shrink-0"></div>
                          <span className="text-text-primary text-sm sm:text-base font-bold truncate">{opponent.name}</span>
                        </div>
                        {/* Lien vers le profil de l'adversaire */}
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
                            className="px-2 py-1 sm:px-2.5 sm:py-1 bg-bg-primary/60 hover:bg-accent-primary/20 text-accent-primary hover:text-accent-primary rounded-full text-xs font-bold transition-all border border-border-secondary/30 hover:border-accent-primary/40 hover:scale-105 flex-shrink-0 min-h-[32px] min-w-[32px] flex items-center justify-center"
                            title="View opponent profile"
                          >
                            <span className="hidden sm:inline text-xs">👤</span>
                            <span className="sm:hidden">👤</span>
                          </button>
                        )}
                      </div>
                      <div className="flex items-baseline justify-between gap-2 sm:gap-3 mb-2 sm:mb-3">
                        <div>
                          <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-text-primary" style={{ fontFamily: 'JetBrains Mono' }}>
                            {opponentStats.wpm}
                          </div>
                          <div className="text-xs text-text-secondary font-medium mt-0.5">WPM</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xl sm:text-2xl md:text-3xl font-bold text-text-primary" style={{ fontFamily: 'JetBrains Mono' }}>
                            {opponentStats.accuracy.toFixed(1)}%
                          </div>
                          <div className="text-xs text-text-secondary font-medium mt-0.5">Accuracy</div>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs text-text-secondary font-medium">
                          <span>Progress</span>
                          <span className="font-mono font-bold text-text-primary">{Math.round(opponentStats.progress)}%</span>
                        </div>
                        <div className="w-full bg-bg-primary/50 rounded-full h-2 overflow-hidden shadow-inner border border-border-secondary/20">
                          <div 
                            className="bg-gradient-to-r from-text-secondary/50 via-text-secondary/60 to-text-secondary/50 h-2 rounded-full transition-all duration-300 shadow-md"
                            style={{ width: `${Math.min(opponentStats.progress, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Zone de texte seamless - Style Monkeytype universel comme Solo, optimisé mobile */}
              <div className="relative w-full max-w-5xl mx-auto flex-1 min-h-0 flex flex-col px-2 sm:px-0">
                {/* Container avec effet de focus visuel */}
                <div className={`relative rounded-xl sm:rounded-2xl p-3 sm:p-4 flex-1 min-h-0 flex flex-col transition-all duration-300 ${
                  isFocused 
                    ? 'bg-bg-secondary/40 backdrop-blur-xl border-2 border-accent-primary/30 shadow-2xl shadow-accent-primary/10' 
                    : 'bg-bg-secondary/20 backdrop-blur-sm border-2 border-border-secondary/20 shadow-lg'
                }`}>
                  <div 
                    ref={textContainerRef}
                    onClick={() => {
                      if (gameStatus === 'playing' && inputRef.current) {
                        inputRef.current.focus();
                      }
                    }}
                    onContextMenu={(e) => e.preventDefault()}
                    onDragStart={(e) => e.preventDefault()}
                    className={`typing-text bg-transparent rounded-lg w-full flex-1 min-h-0 overflow-y-auto cursor-text relative transition-all duration-300 ${
                      isFocused ? 'typing-area-focused' : 'typing-area-unfocused'
                    }`}
                    style={{ 
                      scrollBehavior: 'smooth',
                      width: '100%',
                      maxWidth: '100%',
                      padding: 0,
                      fontSize: 'clamp(0.875rem, 3vw, 1.25rem)', // Responsive font size: min 0.875rem, max 1.25rem
                      lineHeight: '1.8',
                      fontFamily: 'JetBrains Mono'
                    }}
                  >
                    {renderText}
                  </div>

                  {/* Input invisible - Style Monkeytype (on tape directement sur le texte) */}
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={handleInputChange}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    disabled={gameStatus === 'finished'}
                    className="absolute opacity-0 pointer-events-none"
                    placeholder=""
                    style={{ fontFamily: 'JetBrains Mono' }}
                    autoFocus={gameStatus === 'playing'}
                  />
                  
                  {/* Indicateur de focus subtil */}
                  {isFocused && (
                    <div className="absolute inset-0 rounded-2xl bg-accent-primary/5 pointer-events-none animate-pulse"></div>
                  )}
                </div>
              </div>
            </div>
          )}

          {gameStatus === 'finished' && results && safePlayers && safePlayers.length > 0 && (
            <div className="flex-1 min-h-0 overflow-y-auto">
              <MatchResults
                players={safePlayers.filter(p => p && p.name)}
                results={results}
                eloChanges={eloChanges || {}}
                playerName={playerName || ''}
                userId={currentUserIdFromState || null}
                currentUser={currentUser || null}
                onPlayAgain={() => {
        // Demander un rematch si on est dans une room (pas de matchmaking)
        // Utiliser locationStateRef.current au lieu de location.state pour éviter les problèmes d'initialisation
        // Éviter l'optional chaining pour éviter les problèmes de minification
        const currentLocationState = locationStateRef.current || (location && location.state) || {};
        if (!currentLocationState.matchmaking && socketRef.current && socketRef.current.connected && roomId) {
          if (!rematchReady) {
            setRematchReady(true);
            socketRef.current.emit('request-rematch', { roomId });
            toast.info('Waiting for opponent to accept rematch...');
          }
        } else {
          // Relancer le matchmaking automatiquement
          if (currentLocationState.matchmaking) {
            handlePlayAgainMatchmaking();
          } else {
            navigate('/battle');
          }
        }
                }}
                onBackToLobby={() => navigate('/')}
                rematchReady={rematchReady}
                opponentRematchReady={opponentRematchReady}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
