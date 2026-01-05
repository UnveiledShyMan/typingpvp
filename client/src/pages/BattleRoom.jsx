import { useState, useEffect, useRef } from 'react'
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom'
import { io } from 'socket.io-client'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import LogoIconSmall from '../components/icons/LogoIconSmall'
import { useToastContext } from '../contexts/ToastContext'
import { authService } from '../services/apiService'
import { useUser } from '../contexts/UserContext'
import Modal from '../components/Modal'
import { languages } from '../data/languages'
import { generateText } from '../data/languages'
import { generatePhraseText } from '../data/phrases'

export default function BattleRoom() {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { playerName: initialPlayerName, userId, isCreator, matchmaking } = location.state || {};
  const { toast } = useToastContext();
  const { user: currentUserFromContext } = useUser();
  
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
  // Séries temporelles pour les graphiques
  const [myTimeSeries, setMyTimeSeries] = useState([]);
  const [opponentTimeSeries, setOpponentTimeSeries] = useState([]);
  const progressIntervalRef = useRef(null);
  const inputRef = useRef(null);
  const socketRef = useRef(null);
  const textContainerRef = useRef(null);
  const chatContainerRef = useRef(null);

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
  useEffect(() => {
    if (userId || matchmaking || currentUserFromContext) {
      const fetchUser = async () => {
        try {
          const userData = await authService.getCurrentUser();
          setCurrentUser(userData);
          if (!playerName && userData) {
            setPlayerName(userData.username);
          }
        } catch (error) {
          // Erreur gérée par apiService
          setCurrentUser(null);
        }
      };
      fetchUser();
    }
  }, [userId, matchmaking, currentUserFromContext]);

  // Gérer la soumission du nom
  const handleNameSubmit = () => {
    if (!tempPlayerName.trim()) {
      toast.warning('Please enter a name');
      return;
    }
    setPlayerName(tempPlayerName.trim());
    setShowNameModal(false);
  };

  useEffect(() => {
    if (!playerName) {
      return; // Attendre que le nom soit défini
    }

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    
    // Si on vient du matchmaking, essayer de réutiliser le socket existant si possible
    // Sinon créer un nouveau socket
    if (!socketRef.current || !socketRef.current.connected) {
      socketRef.current = io(apiUrl, {
        transports: ['polling'], // Utiliser polling pour Plesk
        upgrade: false, // Empêcher l'upgrade vers WebSocket
        reconnection: true,
        forceNew: true // Forcer une nouvelle connexion pour éviter les problèmes
      });
    }
    const socket = socketRef.current;

    // Attendre que le socket soit connecté avant d'émettre join-room
    const handleJoinRoom = () => {
      if (socket.connected) {
        socket.emit('join-room', { 
          roomId, 
          playerName,
          userId: userId || currentUser?.id || null
        });
      } else {
        // Si pas encore connecté, attendre la connexion
        socket.once('connect', () => {
          socket.emit('join-room', { 
            roomId, 
            playerName,
            userId: userId || currentUser?.id || null
          });
        });
      }
    };

    // Essayer de joindre immédiatement ou après connexion
    if (socket.connected) {
      handleJoinRoom();
    } else {
      socket.once('connect', handleJoinRoom);
    }

    socket.on('room-joined', (data) => {
      setText(data.text);
      setPlayers(data.players);
      setGameStatus('waiting'); // Passer à 'waiting' une fois la room jointe
      if (data.chatMessages) {
        setChatMessages(data.chatMessages);
      }
    });

    socket.on('player-joined', (data) => {
      setPlayers(data.players);
    });

    socket.on('player-left', (data) => {
      setPlayers(data.players);
    });

    socket.on('game-started', (data) => {
      setGameStatus('playing');
      setStartTime(data.startTime);
      setTypingStartTime(null); // Réinitialiser le temps de début de frappe
      typingStartTimeRef.current = null; // Réinitialiser aussi la ref
      setOpponentTypingStartTime(null); // Réinitialiser le temps de début de frappe de l'adversaire
      opponentTypingStartTimeRef.current = null; // Réinitialiser aussi la ref
      // Mettre à jour le texte si une nouvelle langue a été choisie
      if (data.text) {
        setText(data.text);
      }
      // Mettre à jour le mode et les paramètres
      if (data.mode) {
        setBattleMode(data.mode);
      }
      if (data.timerDuration) {
        setTimerDuration(data.timerDuration);
        setTimeLeft(data.timerDuration);
      }
      if (data.difficulty) {
        setPhraseDifficulty(data.difficulty);
      }
      setInput(''); // Réinitialiser l'input
      setMyTimeSeries([]);
      setOpponentTimeSeries([]);
      
      // Arrêter l'interval précédent s'il existe
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      
      // Démarrer le timer si mode timer
      if (data.mode === 'timer' && data.timerDuration) {
        setTimeLeft(data.timerDuration);
        timerIntervalRef.current = setInterval(() => {
          setTimeLeft((prev) => {
            if (prev <= 1) {
              // Finir automatiquement quand le timer atteint 0
              if (socketRef.current) {
                // Utiliser la ref pour accéder à la valeur actuelle dans le callback
                const typingStart = typingStartTimeRef.current;
                if (typingStart && input.length > 0) {
                  const finalTime = (Date.now() - typingStart) / 1000 / 60;
                  const wordsTyped = input.trim().split(/\s+/).filter(w => w.length > 0).length;
                  const finalWpm = finalTime > 0 ? Math.round(wordsTyped / finalTime) : 0;
                  const finalAccuracy = input.length > 0 ? Math.round(((input.length - errors) / input.length) * 100) : 100;
                  socketRef.current.emit('finish-game', {
                    wpm: finalWpm,
                    accuracy: finalAccuracy
                  });
                } else {
                  // Si l'utilisateur n'a pas commencé à taper, envoyer 0
                  socketRef.current.emit('finish-game', {
                    wpm: 0,
                    accuracy: 100
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
    });

    socket.on('opponent-update', (data) => {
      const opponent = players.find(p => p.id === data.playerId);
      if (opponent) {
        setOpponentStats({
          wpm: data.wpm,
          accuracy: data.accuracy,
          progress: data.progress
        });
        
        // Détecter la première frappe de l'adversaire (quand wpm > 0 ou progress > 0)
        if ((data.wpm > 0 || data.progress > 0) && !opponentTypingStartTime) {
          const now = Date.now();
          setOpponentTypingStartTime(now);
          opponentTypingStartTimeRef.current = now;
        }
        
        // Ajouter aux séries temporelles pour le graphique en temps réel
        // Utiliser le temps depuis la première frappe de l'adversaire
        const typingStart = opponentTypingStartTimeRef.current;
        if (typingStart) {
          const currentSecond = Math.floor((Date.now() - typingStart) / 1000);
          setOpponentTimeSeries((prev) => {
            const existing = prev.findIndex((item) => item.second === currentSecond);
            const newData = { 
              second: currentSecond, 
              wpm: data.wpm, 
              accuracy: data.accuracy 
            };
            if (existing >= 0) {
              const updated = [...prev];
              updated[existing] = newData;
              return updated;
            }
            return [...prev, newData].sort((a, b) => a.second - b.second);
          });
        }
      }
    });

    socket.on('opponent-finished', (data) => {
      setOpponentStats({
        wpm: data.wpm,
        accuracy: data.accuracy,
        progress: 100
      });
    });

    socket.on('game-finished', (data) => {
      setGameStatus('finished');
      setResults(data.results);
      if (data.eloChanges) {
        setEloChanges(data.eloChanges);
        
        // Rafraîchir les données utilisateur si connecté pour mettre à jour les ELO
        if (userId || currentUser?.id) {
          const refreshUserData = async () => {
            try {
              const userData = await authService.getCurrentUser();
              setCurrentUser(userData);
              
              // Émettre un événement pour rafraîchir le profil et le leaderboard
              window.dispatchEvent(new CustomEvent('elo-updated', { 
                detail: { userId: userData.id } 
              }));
            } catch (error) {
              // Erreur gérée par apiService
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
      toast.error(error.message);
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
    });

    return () => {
      socket.off('room-joined');
      socket.off('player-joined');
      socket.off('player-left');
      socket.off('game-started');
      socket.off('opponent-update');
      socket.off('opponent-finished');
      socket.off('game-finished');
      socket.off('chat-message');
      socket.off('error');
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      socket.disconnect();
    };
  }, [roomId, playerName, currentUser]);

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
    if (!chatInput.trim() || !socketRef.current) return;
    
    socketRef.current.emit('chat-message', {
      roomId,
      message: chatInput.trim(),
      username: currentUser?.username || playerName
    });
    
    setChatInput('');
  };

  // Formater l'heure du message
  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const handleStartGame = () => {
    if (players.length === 2 && socketRef.current) {
      socketRef.current.emit('start-game', { 
        roomId, 
        language: selectedLanguage,
        mode: battleMode,
        timerDuration: battleMode === 'timer' ? timerDuration : null,
        difficulty: battleMode === 'phrases' ? phraseDifficulty : null
      });
    }
  };

  const handleInputChange = (e) => {
    if (gameStatus !== 'playing') return;
    
    const value = e.target.value;
    
    // Définir le temps de début de frappe à la première frappe
    if (value.length > 0 && !typingStartTime) {
      const now = Date.now();
      setTypingStartTime(now);
      typingStartTimeRef.current = now; // Mettre à jour aussi la ref
    }
    
    if (value.length <= text.length) {
      setInput(value);
      
      // Calculer les erreurs
      let errorCount = 0;
      for (let i = 0; i < value.length; i++) {
        if (value[i] !== text[i]) {
          errorCount++;
        }
      }
      setErrors(errorCount);

      // Calculer les stats - utiliser typingStartTime au lieu de startTime pour le WPM
      if (typingStartTime) {
        const timeElapsed = (Date.now() - typingStartTime) / 1000 / 60;
        const wordsTyped = value.trim().split(/\s+/).filter(w => w.length > 0).length;
        const wpm = timeElapsed > 0 ? Math.round(wordsTyped / timeElapsed) : 0;
        const accuracy = value.length > 0 
          ? Math.round(((value.length - errorCount) / value.length) * 100)
          : 100;
        const progress = Math.round((value.length / text.length) * 100);
        
        setMyStats({ wpm, accuracy, progress });
        
        // Enregistrer dans les séries temporelles pour le graphique
        // Utiliser le temps depuis le début de la frappe
        const currentSecond = Math.floor((Date.now() - typingStartTime) / 1000);
        setMyTimeSeries((prev) => {
          const existing = prev.findIndex((item) => item.second === currentSecond);
          const newData = { second: currentSecond, wpm, accuracy };
          if (existing >= 0) {
            const updated = [...prev];
            updated[existing] = newData;
            return updated;
          }
          return [...prev, newData].sort((a, b) => a.second - b.second);
        });
        
        // Envoyer la mise à jour au serveur
        if (socketRef.current) {
          socketRef.current.emit('update-progress', {
            progress,
            wpm,
            accuracy
          });
        }

        // Auto-scroll pour suivre la position de frappe
        if (textContainerRef.current) {
          const container = textContainerRef.current;
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
        }
      }

      // Vérifier si terminé
      if (value === text && typingStartTime) {
        const finalTime = (Date.now() - typingStartTime) / 1000 / 60;
        const finalWpm = finalTime > 0 ? Math.round(text.trim().split(/\s+/).filter(w => w.length > 0).length / finalTime) : 0;
        const finalAccuracy = Math.round(((text.length - errorCount) / text.length) * 100);
        
        if (socketRef.current) {
          socketRef.current.emit('finish-game', {
            wpm: finalWpm,
            accuracy: finalAccuracy
          });
        }
      }
    }
  };

  const renderText = () => {
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
  };

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
                  <h1 className="text-xl font-semibold text-text-primary" style={{ fontFamily: 'Inter' }}>
                    Battle #{roomId}
                  </h1>
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
              <div className="text-center space-y-6 max-w-md">
                {/* Liste des joueurs */}
                <div className="space-y-3">
                  <h3 className="text-text-secondary text-sm font-medium uppercase tracking-wider mb-4">
                    Players
                  </h3>
                  <div className="space-y-2">
                    {players.map((player, index) => (
                      <div 
                        key={index}
                        className="bg-bg-primary/30 backdrop-blur-sm rounded-lg p-4 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${
                            player.name === playerName ? 'bg-accent-primary' : 'bg-text-secondary/50'
                          }`}></div>
                          <span className="text-text-primary font-medium">{player.name}</span>
                          {player.name === playerName && (
                            <span className="text-xs text-text-secondary">(You)</span>
                          )}
                        </div>
                        {player.name === playerName && (
                          <span className="text-xs px-2 py-1 bg-accent-primary/20 text-accent-primary rounded">
                            Ready
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Message d'attente ou bouton start */}
                {players.length === 1 ? (
                  <div className="space-y-3">
                    <div className="relative w-12 h-12 mx-auto">
                      <div className="absolute inset-0 border-3 border-accent-primary/20 rounded-full"></div>
                      <div className="absolute inset-0 border-3 border-transparent border-t-accent-primary rounded-full animate-spin"></div>
                    </div>
                    <p className="text-text-primary text-lg font-medium">
                      Waiting for opponent...
                    </p>
                    <p className="text-text-secondary text-sm">
                      Share the room ID: <span className="font-mono text-accent-primary">{roomId}</span>
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <p className="text-text-primary text-lg font-medium">
                        Both players ready!
                      </p>
                      {isCreator ? (
                        <p className="text-text-secondary text-sm">
                          Click start when you're ready to begin
                        </p>
                      ) : (
                        <p className="text-text-secondary text-sm">
                          Waiting for room creator to start...
                        </p>
                      )}
                    </div>
                    {players.length === 2 && isCreator && (
                      <div className="space-y-4">
                        {/* Sélecteur de mode */}
                        <div>
                          <label className="block text-text-secondary text-sm mb-2 font-medium">
                            Battle Mode
                          </label>
                          <select
                            value={battleMode}
                            onChange={(e) => setBattleMode(e.target.value)}
                            className="bg-bg-primary/50 backdrop-blur-sm border-none text-text-primary px-4 py-2.5 rounded-lg focus:outline-none focus:bg-bg-primary/70 transition-colors font-medium w-full"
                          >
                            <option value="timer" className="bg-bg-primary">Duel Classique (Timer)</option>
                            <option value="phrases" className="bg-bg-primary">Phrases (Difficulté)</option>
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
                              className="bg-bg-primary/50 backdrop-blur-sm border-none text-text-primary px-4 py-2.5 rounded-lg focus:outline-none focus:bg-bg-primary/70 transition-colors font-medium w-full"
                            >
                              <option value={60} className="bg-bg-primary">60 seconds</option>
                              <option value={30} className="bg-bg-primary">30 seconds</option>
                              <option value={10} className="bg-bg-primary">10 seconds</option>
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
                              className="bg-bg-primary/50 backdrop-blur-sm border-none text-text-primary px-4 py-2.5 rounded-lg focus:outline-none focus:bg-bg-primary/70 transition-colors font-medium w-full"
                            >
                              <option value="easy" className="bg-bg-primary">Facile</option>
                              <option value="medium" className="bg-bg-primary">Moyen</option>
                              <option value="hard" className="bg-bg-primary">Difficile</option>
                              <option value="hardcore" className="bg-bg-primary">Hardcore</option>
                            </select>
                          </div>
                        )}

                        {/* Sélecteur de langue pour l'host */}
                        <div>
                          <label className="block text-text-secondary text-sm mb-2 font-medium">
                            Select Language
                          </label>
                          <select
                            value={selectedLanguage}
                            onChange={(e) => setSelectedLanguage(e.target.value)}
                            className="bg-bg-primary/50 backdrop-blur-sm border-none text-text-primary px-4 py-2.5 rounded-lg focus:outline-none focus:bg-bg-primary/70 transition-colors font-medium w-full"
                          >
                            {Object.entries(languages).map(([code, lang]) => (
                              <option key={code} value={code} className="bg-bg-primary">
                                {lang.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <button
                          onClick={handleStartGame}
                          className="bg-accent-primary hover:bg-accent-hover text-bg-primary font-semibold py-3 px-8 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg shadow-accent-primary/20 w-full"
                        >
                          Start Battle
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
              
              {/* Stats des joueurs - design sobre */}
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div className="bg-bg-primary/30 backdrop-blur-sm rounded-lg p-4">
                  <div className="text-text-primary mb-2 text-sm font-medium">{myPlayer?.name || 'You'}</div>
                  <div className="flex items-center justify-between gap-4">
                    <div className="text-2xl font-bold text-text-primary" style={{ fontFamily: 'JetBrains Mono' }}>{myStats.wpm}</div>
                    <div className="text-sm text-text-secondary">{myStats.accuracy}%</div>
                    <div className="flex-1 ml-2">
                      <div className="w-full bg-text-secondary/10 rounded-full h-2">
                        <div 
                          className="bg-accent-primary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(myStats.progress, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {opponent && (
                  <div className="bg-bg-primary/30 backdrop-blur-sm rounded-lg p-4">
                    <div className="text-text-primary mb-2 text-sm font-medium">{opponent.name}</div>
                    <div className="flex items-center justify-between gap-4">
                      <div className="text-2xl font-bold text-text-primary" style={{ fontFamily: 'JetBrains Mono' }}>{opponentStats.wpm}</div>
                      <div className="text-sm text-text-secondary">{opponentStats.accuracy}%</div>
                      <div className="flex-1 ml-2">
                        <div className="w-full bg-text-secondary/10 rounded-full h-2">
                          <div 
                            className="bg-text-secondary/50 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(opponentStats.progress, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Graphique de progression en temps réel */}
              {(myTimeSeries.length > 0 || opponentTimeSeries.length > 0) && (
                <div className="mb-6 bg-bg-primary/30 backdrop-blur-sm rounded-lg p-4">
                  <div className="text-text-secondary text-xs mb-3 font-medium">Live Progress - Depuis la première frappe</div>
                  <ResponsiveContainer width="100%" height={150}>
                    <LineChart data={(() => {
                      // Fusionner les deux séries en combinant par seconde depuis la première frappe
                      const maxSecond = Math.max(
                        myTimeSeries.length > 0 ? Math.max(...myTimeSeries.map(d => d.second)) : 0,
                        opponentTimeSeries.length > 0 ? Math.max(...opponentTimeSeries.map(d => d.second)) : 0
                      );
                      const chartData = [];
                      for (let i = 0; i <= maxSecond; i++) {
                        const myData = myTimeSeries.find(d => d.second === i);
                        const oppData = opponentTimeSeries.find(d => d.second === i);
                        chartData.push({
                          time: i,
                          me: myData?.wpm || null,
                          opponent: oppData?.wpm || null
                        });
                      }
                      return chartData;
                    })()}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#646669" opacity={0.3} />
                      <XAxis 
                        dataKey="time" 
                        stroke="#646669"
                        style={{ fontSize: '11px' }}
                        domain={['dataMin', 'dataMax']}
                      />
                      <YAxis 
                        stroke="#646669"
                        style={{ fontSize: '11px' }}
                        domain={[0, 'auto']}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1e1e1e', 
                          border: '1px solid #646669',
                          borderRadius: '8px',
                          color: '#e8e8e8'
                        }}
                        formatter={(value, name) => {
                          if (value === null || value === undefined) return ['-', name];
                          return [value + ' WPM', name];
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      <Line 
                        type="monotone" 
                        dataKey="me" 
                        stroke="#00ff9f" 
                        strokeWidth={2.5}
                        dot={false}
                        name={myPlayer?.name || 'You'}
                        connectNulls={false}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="opponent" 
                        stroke="#ff6b6b" 
                        strokeWidth={2.5}
                        dot={false}
                        name={opponent?.name || 'Opponent'}
                        connectNulls={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

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
                  className="input-modern text-lg"
                  placeholder="Start typing..."
                  style={{ fontFamily: 'JetBrains Mono' }}
                />
              </div>
            </>
          )}

          {gameStatus === 'finished' && results && (
            <div className="py-8">
              {/* Résultats finaux - design sobre */}
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                {players.map((player) => {
                  const result = results[player.id];
                  const isMe = player.name === playerName || (player.userId && player.userId === (userId || currentUser?.id));
                  const isWinner = result && players.length === 2 && (
                    !results[players.find(p => p.id !== player.id)?.id] || 
                    result.wpm > results[players.find(p => p.id !== player.id)?.id]?.wpm ||
                    (result.wpm === results[players.find(p => p.id !== player.id)?.id]?.wpm && result.accuracy > results[players.find(p => p.id !== player.id)?.id]?.accuracy)
                  );
                  const eloChange = eloChanges[player.id];
                  
                  return (
                    <div
                      key={player.id}
                      className={`bg-bg-primary/30 backdrop-blur-sm rounded-lg p-6 ${
                        isWinner ? 'ring-2 ring-accent-primary/30' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="text-lg font-semibold text-text-primary">
                          {isMe ? 'You' : player.name}
                        </div>
                        {isWinner && <span className="text-xl">🏆</span>}
                      </div>
                      
                      {result && (
                        <div className="space-y-3">
                          <div className="flex items-baseline gap-3">
                            <span className="text-4xl font-bold text-text-primary" style={{ fontFamily: 'JetBrains Mono' }}>{result.wpm}</span>
                            <span className="text-text-secondary text-sm">wpm</span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-text-secondary">
                            <span>{result.accuracy}% accuracy</span>
                            <span>{Math.round(result.time / 1000)}s</span>
                          </div>
                          {eloChange !== undefined && (
                            <div className={`text-sm font-semibold ${eloChange >= 0 ? 'text-accent-secondary' : 'text-red-400'}`}>
                              ELO: {eloChange >= 0 ? '+' : ''}{eloChange}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Graphique de fin de partie */}
              {(myTimeSeries.length > 0 || opponentTimeSeries.length > 0) && (
                <div className="mb-8 bg-bg-primary/30 backdrop-blur-sm rounded-lg p-6">
                  <div className="text-text-primary mb-4 text-sm font-semibold">Match Performance</div>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={(() => {
                      // Fusionner les deux séries en combinant par seconde depuis la première frappe de chacun
                      const maxSecond = Math.max(
                        myTimeSeries.length > 0 ? Math.max(...myTimeSeries.map(d => d.second)) : 0,
                        opponentTimeSeries.length > 0 ? Math.max(...opponentTimeSeries.map(d => d.second)) : 0
                      );
                      const chartData = [];
                      for (let i = 0; i <= maxSecond; i++) {
                        const myData = myTimeSeries.find(d => d.second === i);
                        const oppData = opponentTimeSeries.find(d => d.second === i);
                        chartData.push({
                          time: i,
                          me: myData?.wpm || null, // null pour ne pas afficher de point si pas de données
                          opponent: oppData?.wpm || null
                        });
                      }
                      return chartData;
                    })()}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#646669" opacity={0.2} />
                      <XAxis 
                        dataKey="time" 
                        stroke="#646669"
                        label={{ value: 'Temps depuis première frappe (s)', position: 'insideBottom', offset: -5, style: { fill: '#646669', fontSize: '12px' } }}
                        domain={['dataMin', 'dataMax']}
                      />
                      <YAxis 
                        stroke="#646669"
                        label={{ value: 'WPM', angle: -90, position: 'insideLeft', style: { fill: '#646669', fontSize: '12px' } }}
                        domain={[0, 'auto']}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1e1e1e', 
                          border: '1px solid #646669',
                          borderRadius: '8px',
                          color: '#e8e8e8'
                        }}
                        formatter={(value, name) => {
                          if (value === null || value === undefined) return ['-', name];
                          return [value + ' WPM', name];
                        }}
                      />
                      <Legend 
                        wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                        iconType="line"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="me" 
                        stroke="#00ff9f" 
                        strokeWidth={3}
                        dot={false}
                        activeDot={{ r: 5, fill: '#00ff9f' }}
                        name={myPlayer?.name || 'You'}
                        connectNulls={false}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="opponent" 
                        stroke="#ff6b6b" 
                        strokeWidth={3}
                        dot={false}
                        activeDot={{ r: 5, fill: '#ff6b6b' }}
                        name={opponent?.name || 'Opponent'}
                        connectNulls={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              <div className="text-center">
                <button
                  onClick={() => navigate('/')}
                  className="bg-accent-primary hover:bg-accent-hover text-bg-primary font-semibold py-3 px-8 rounded-lg transition-colors"
                >
                  New Battle
                </button>
              </div>
            </div>
          )}
            </div>

            {/* Colonne droite : Chat */}
            <div className="lg:w-80 lg:flex-shrink-0 flex flex-col">
              <div className="bg-bg-primary/30 backdrop-blur-sm rounded-lg flex-1 min-h-0 flex flex-col">
                {/* En-tête du chat */}
                <div className="p-4">
                  <h3 className="text-text-primary font-semibold" style={{ fontFamily: 'Inter' }}>Chat</h3>
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
                    chatMessages.map((msg) => (
                      <div key={msg.id} className="flex gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent-primary/20 flex items-center justify-center text-accent-primary text-xs font-bold">
                          {msg.username[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2 mb-1">
                            <span className="text-text-primary text-sm font-semibold">{msg.username}</span>
                            <span className="text-text-secondary text-xs">{formatMessageTime(msg.timestamp)}</span>
                          </div>
                          <div className="text-text-secondary text-sm break-words">{msg.message}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Input du chat */}
                <form onSubmit={handleSendChatMessage} className="p-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 px-3 py-2 input-modern text-sm"
                      disabled={gameStatus === 'playing'}
                    />
                    <button
                      type="submit"
                      disabled={!chatInput.trim() || gameStatus === 'playing'}
                      className="px-4 py-2 bg-accent-primary hover:bg-accent-hover text-bg-primary font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      Send
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
