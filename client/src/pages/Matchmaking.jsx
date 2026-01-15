import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { languages } from '../data/languages'
import Modal from '../components/Modal'
import { useToastContext } from '../contexts/ToastContext'
import { authService } from '../services/apiService'
import { getSocket, cleanupSocket } from '../services/socketService'
import { normalizeSocketErrorMessage } from '../utils/normalizeSocketErrorMessage'

export default function Matchmaking() {
  const [selectedLang, setSelectedLang] = useState('en');
  const [matchType, setMatchType] = useState('ranked'); // 'ranked' ou 'unrated'
  const [isInQueue, setIsInQueue] = useState(false);
  const [queueTime, setQueueTime] = useState(0);
  const [user, setUser] = useState(null);
  const [guestUsername, setGuestUsername] = useState('');
  const [showGuestWarning, setShowGuestWarning] = useState(false);
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    // Charger la préférence depuis localStorage
    const saved = localStorage.getItem('matchmakingSoundEnabled');
    return saved !== null ? saved === 'true' : true; // Par défaut activé
  });
  const socketRef = useRef(null);
  const intervalRef = useRef(null);
  const queueStartTimeRef = useRef(null);
  const navigate = useNavigate();
  const { toast } = useToastContext();
  
  // Fonction pour jouer le son de match trouvé
  const playMatchFoundSound = useCallback(() => {
    if (!soundEnabled) return;
    
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Premier beep
      const oscillator1 = audioContext.createOscillator();
      const gainNode1 = audioContext.createGain();
      
      oscillator1.connect(gainNode1);
      gainNode1.connect(audioContext.destination);
      
      oscillator1.frequency.value = 800;
      oscillator1.type = 'sine';
      
      gainNode1.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode1.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
      
      oscillator1.start(audioContext.currentTime);
      oscillator1.stop(audioContext.currentTime + 0.15);
      
      // Deuxième beep après un court délai
      setTimeout(() => {
        const oscillator2 = audioContext.createOscillator();
        const gainNode2 = audioContext.createGain();
        
        oscillator2.connect(gainNode2);
        gainNode2.connect(audioContext.destination);
        
        oscillator2.frequency.value = 1000;
        oscillator2.type = 'sine';
        
        gainNode2.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
        
        oscillator2.start(audioContext.currentTime);
        oscillator2.stop(audioContext.currentTime + 0.15);
      }, 200);
    } catch (error) {
      console.warn('Could not play match found sound:', error);
    }
  }, [soundEnabled]);
  
  // Sauvegarder la préférence de son
  const toggleSound = useCallback(() => {
    const newValue = !soundEnabled;
    setSoundEnabled(newValue);
    localStorage.setItem('matchmakingSoundEnabled', newValue.toString());
  }, [soundEnabled]);

  useEffect(() => {
    fetchCurrentUser();
    return () => {
      // Nettoyer les listeners mais ne pas déconnecter le socket
      // car il peut être utilisé par BattleRoom après le matchmaking
      if (socketRef.current) {
        cleanupSocket(socketRef.current, [
          'connect',
          'matchmaking-joined',
          'matchmaking-match-found',
          'matchmaking-error'
        ]);
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const fetchCurrentUser = async () => {
    // Ne pas appeler l'API si pas de token (évite les erreurs 401 inutiles)
    const token = localStorage.getItem('token');
    if (!token) {
      setUser(null);
      return;
    }
    
    try {
      const userData = await authService.getCurrentUser();
      setUser(userData);
    } catch (error) {
      // Erreur gérée par apiService (token invalide/expiré)
      setUser(null);
    }
  };

  const handleJoinQueue = () => {
    try {
      // Pour ranked, exiger un utilisateur connecté
      if (matchType === 'ranked' && !user) {
        toast.error('You must be logged in to play ranked matches');
        return;
      }
      
      // Si pas d'utilisateur et unrated, demander un pseudo pour joueur invité
      if (!user && matchType === 'unrated') {
        setShowGuestModal(true);
        return;
      }

      // Utiliser le service centralisé de socket au lieu de créer une nouvelle instance
      socketRef.current = getSocket(false);
      const socket = socketRef.current;
      
      if (!socket) {
        toast.error('Failed to initialize socket. Please refresh the page.');
        return;
      }
      
      // Nettoyer les anciens listeners pour éviter les doublons
      socket.off('matchmaking-joined');
      socket.off('matchmaking-match-found');
      socket.off('matchmaking-error');
      
      const mmr = user ? (user.mmr[selectedLang] || 1000) : 1000;

      // Fonction pour joindre le matchmaking (appelée après connexion)
      const joinMatchmaking = () => {
        if (!socket) return;
        
        if (socket.connected) {
          socket.emit('join-matchmaking', {
            userId: user ? user.id : null,
            username: user ? user.username : null,
            language: selectedLang,
            mmr: mmr,
            ranked: matchType === 'ranked'
          });
        } else {
          // Attendre que le socket soit connecté avec un timeout
          const timeout = setTimeout(() => {
            toast.error('Connection timeout. Please try again.');
          }, 10000);
          
          socket.once('connect', () => {
            clearTimeout(timeout);
            if (socket && socket.connected) {
              socket.emit('join-matchmaking', {
                userId: user ? user.id : null,
                username: user ? user.username : null,
                language: selectedLang,
                mmr: mmr,
                ranked: matchType === 'ranked'
              });
            }
          });
        }
      };

      // Configurer les listeners UNE SEULE FOIS avant de joindre
      socket.on('matchmaking-joined', () => {
        setIsInQueue(true);
        queueStartTimeRef.current = Date.now();
        
        // Timer pour afficher le temps d'attente
        intervalRef.current = setInterval(() => {
          if (queueStartTimeRef.current) {
            setQueueTime(Math.floor((Date.now() - queueStartTimeRef.current) / 1000));
          }
        }, 1000);
      });

      socket.on('matchmaking-match-found', (data) => {
        setIsInQueue(false);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        // Sécurité: vérifier que la roomId est présente avant la navigation.
        if (!data || !data.roomId) {
          toast.error('Match found, but room data is missing. Please try again.');
          return;
        }
        
        // Rediriger vers la battle room
        navigate(`/battle/${data.roomId}`, { 
          state: { 
            playerName: user ? user.username : guestUsername,
            userId: user ? user.id : null,
            isCreator: false,
            matchmaking: true,
            ranked: data.ranked !== undefined ? data.ranked : matchType === 'ranked',
            existingSocket: true, // Indicateur pour BattleRoom
            isGuest: !user // Indicateur pour joueur invité
          } 
        });
      });

      socket.on('matchmaking-error', (error) => {
        const message = normalizeSocketErrorMessage(error, 'An error occurred');
        toast.error(message);
        setIsInQueue(false);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      });

      // Joindre immédiatement si déjà connecté, sinon attendre la connexion
      joinMatchmaking();
    } catch (error) {
      console.error('Error in handleJoinQueue:', error);
      toast.error('An error occurred. Please try again.');
    }
  };

  const handleLeaveQueue = () => {
    try {
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('leave-matchmaking');
        // Nettoyer les listeners spécifiques au matchmaking
        cleanupSocket(socketRef.current, [
          'matchmaking-joined',
          'matchmaking-match-found',
          'matchmaking-error'
        ]);
      }
      setIsInQueue(false);
      setQueueTime(0);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    } catch (error) {
      console.error('Error in handleLeaveQueue:', error);
      // Même en cas d'erreur, nettoyer l'état local
      setIsInQueue(false);
      setQueueTime(0);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Gérer le join en tant que guest
  const handleGuestJoin = () => {
    if (!guestUsername.trim()) {
      toast.warning('Please enter a username');
      return;
    }

    setShowGuestModal(false);
    setShowGuestWarning(true);
  };

  const handleConfirmGuestJoin = () => {
    setShowGuestWarning(false);

    // Utiliser le service centralisé de socket au lieu de créer une nouvelle instance
    socketRef.current = getSocket(false);
    const socket = socketRef.current;
    
    // Nettoyer les anciens listeners pour éviter les doublons
    socket.off('matchmaking-joined');
    socket.off('matchmaking-match-found');
    socket.off('matchmaking-error');

    // Fonction pour joindre le matchmaking en tant que guest (appelée après connexion)
    const joinMatchmakingAsGuest = () => {
      if (socket.connected) {
        socket.emit('join-matchmaking', {
          userId: null, // Pas d'userId pour les guests
          username: guestUsername.trim(),
          language: selectedLang,
          mmr: 1000, // MMR par défaut pour les guests
          ranked: false // Les guests ne peuvent jouer qu'en unrated
        });
      } else {
        // Attendre que le socket soit connecté
        socket.once('connect', joinMatchmakingAsGuest);
      }
    };

    // Configurer les listeners UNE SEULE FOIS avant de joindre
    socket.on('matchmaking-joined', () => {
      setIsInQueue(true);
      queueStartTimeRef.current = Date.now();
      
      intervalRef.current = setInterval(() => {
        if (queueStartTimeRef.current) {
          setQueueTime(Math.floor((Date.now() - queueStartTimeRef.current) / 1000));
        }
      }, 1000);
    });

    socket.on('matchmaking-match-found', (data) => {
      setIsInQueue(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      // Sécurité: vérifier que la roomId est présente avant la navigation.
      if (!data || !data.roomId) {
        toast.error('Match found, but room data is missing. Please try again.');
        return;
      }
      
      // Jouer le son de match trouvé
      playMatchFoundSound();
      
      navigate(`/battle/${data.roomId}`, { 
        state: { 
          playerName: guestUsername.trim(),
          userId: null,
          isCreator: false,
          matchmaking: true,
          ranked: data.ranked !== undefined ? data.ranked : false,
          existingSocket: true,
          isGuest: true
        } 
      });
    });

    socket.on('matchmaking-error', (error) => {
      const message = normalizeSocketErrorMessage(error, 'An error occurred');
      toast.error(message);
      setIsInQueue(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    });

    // Joindre immédiatement si déjà connecté, sinon attendre la connexion
    joinMatchmakingAsGuest();
  };

  const userMMR = user ? (user.mmr[selectedLang] || 1000) : 1000;

  return (
    <div className="h-full w-full flex flex-col overflow-hidden p-4 sm:p-6">
      <div className="mb-6 flex-shrink-0 ui-section">
        <h1 className="text-3xl sm:text-4xl font-bold text-text-primary mb-2 ui-title" style={{ fontFamily: 'Inter', letterSpacing: '-0.02em' }}>
          Matchmaking
        </h1>
        <p className="text-text-secondary text-sm ui-subtitle">
          Find a balanced opponent in seconds.
        </p>
      </div>

      <div className="flex-1 min-h-0">
        <div className="max-w-6xl mx-auto w-full space-y-6">
          {/* Résumé rapide pour rassurer l'utilisateur */}
          <div className="bg-bg-secondary/40 backdrop-blur-sm rounded-lg p-4 border border-border-secondary/40 ui-card ui-card-hover ui-fade-up">
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className="text-text-secondary">Mode:</span>
              <span className="text-text-primary font-semibold">
                {matchType === 'ranked' ? 'Ranked' : 'Unrated'}
              </span>
              <span className="text-text-secondary">Language:</span>
              <span className="text-text-primary font-semibold">
                {languages[selectedLang]?.name || selectedLang.toUpperCase()}
              </span>
              <span className="text-text-secondary">ELO:</span>
              <span className="text-text-primary font-semibold" style={{ fontFamily: 'JetBrains Mono' }}>
                {userMMR}
              </span>
            </div>
            <div className="text-text-secondary text-xs mt-2">
              We search within a fair range to keep matches balanced.
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            {/* Settings */}
            <div className="space-y-6">
              <div className="bg-bg-primary/30 backdrop-blur-sm rounded-lg p-6 border border-border-secondary/30 ui-card ui-card-hover ui-fade-up">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-text-secondary text-xs uppercase tracking-wider">Match Type</div>
                    <div className="text-text-primary font-semibold mt-1">Choose your mode</div>
                  </div>
                  {/* Toggle pour le son */}
                  <button
                    onClick={toggleSound}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-bg-secondary/50 hover:bg-bg-secondary/70 transition-colors text-text-secondary hover:text-text-primary text-xs ui-press"
                    title={soundEnabled ? 'Disable match found sound' : 'Enable match found sound'}
                  >
                    {soundEnabled ? (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                        </svg>
                        <span>Sound On</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                        </svg>
                        <span>Sound Off</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    onClick={() => {
                      if (isInQueue) return;
                      setMatchType('ranked');
                    }}
                    disabled={isInQueue}
                    className={`px-4 py-3 rounded-lg font-semibold transition-all ui-press ${
                      matchType === 'ranked'
                        ? 'bg-accent-primary text-accent-text'
                        : 'bg-bg-secondary text-text-secondary hover:bg-bg-secondary/80'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <span>Ranked</span>
                      <span className="text-xs">🏆</span>
                    </div>
                    <div className="text-xs mt-1 opacity-80">Affects ELO</div>
                  </button>
                  <button
                    onClick={() => {
                      if (isInQueue) return;
                      setMatchType('unrated');
                    }}
                    disabled={isInQueue}
                    className={`px-4 py-3 rounded-lg font-semibold transition-all ui-press ${
                      matchType === 'unrated'
                        ? 'bg-accent-primary text-accent-text'
                        : 'bg-bg-secondary text-text-secondary hover:bg-bg-secondary/80'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <span>Unrated</span>
                      <span className="text-xs">🎮</span>
                    </div>
                    <div className="text-xs mt-1 opacity-80">No ELO change</div>
                  </button>
                </div>

                {matchType === 'ranked' && !user && (
                  <div className="mt-3 text-xs text-text-error bg-text-error/10 rounded p-2">
                    ⚠️ You must be logged in to play ranked matches
                  </div>
                )}
              </div>

              <div className="bg-bg-secondary/40 backdrop-blur-sm rounded-lg p-6 border border-border-secondary/40 ui-card ui-fade-up">
                <label className="block text-text-primary mb-3 text-sm font-medium">Language</label>
                <select
                  value={selectedLang}
                  onChange={(e) => setSelectedLang(e.target.value)}
                  disabled={isInQueue}
                  className="w-full p-3 bg-bg-secondary/80 backdrop-blur-sm border border-border-secondary/40 rounded-lg text-text-primary focus:outline-none focus:border-accent-primary/60 focus:ring-2 focus:ring-accent-primary/20 transition-all hover:bg-bg-secondary font-medium disabled:opacity-50 disabled:cursor-not-allowed appearance-none cursor-pointer"
                  style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                >
                  {Object.entries(languages).map(([code, lang]) => (
                    <option key={code} value={code} style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                      {lang.name}
                    </option>
                  ))}
                </select>
                {user && matchType === 'ranked' && (
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="text-text-secondary">Your ELO:</span>
                    <span className="text-text-primary font-bold" style={{ fontFamily: 'JetBrains Mono' }}>
                      {userMMR}
                    </span>
                  </div>
                )}
                {!user && matchType === 'ranked' && (
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="text-text-secondary">Guest ELO:</span>
                    <span className="text-text-primary font-bold" style={{ fontFamily: 'JetBrains Mono' }}>
                      1000
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Queue card - design épuré et focalisé */}
            <div className="bg-bg-secondary/40 backdrop-blur-sm rounded-lg p-6 sm:p-8 text-center border border-border-secondary/40 ui-card ui-fade-up">
              {isInQueue ? (
                <div className="space-y-5">
                  <div className="relative w-16 h-16 mx-auto">
                    <div className="absolute inset-0 border-4 border-accent-primary/20 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-transparent border-t-accent-primary rounded-full animate-spin"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-3 px-4 py-2 bg-bg-primary/40 backdrop-blur-sm rounded-full">
                      <div className="w-2 h-2 rounded-full bg-accent-primary animate-pulse"></div>
                      <span className="text-text-primary font-medium text-sm">Searching for opponent...</span>
                    </div>
                    <div className="text-4xl font-bold text-text-primary" style={{ fontFamily: 'JetBrains Mono' }}>
                      {formatTime(queueTime)}
                    </div>
                    <div className="text-text-secondary text-sm">Time in queue</div>
                  </div>
                  <button
                    onClick={handleLeaveQueue}
                    className="bg-text-error/20 hover:bg-text-error/30 text-text-error font-semibold py-3 px-8 rounded-lg transition-all duration-200 border border-text-error/30 ui-press"
                  >
                    Cancel Search
                  </button>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent-primary/10 rounded-full">
                    <span className="text-accent-primary text-sm font-medium">Ready to battle?</span>
                  </div>
                  {matchType === 'ranked' && (
                    <div className="space-y-2">
                      <p className="text-text-primary font-medium">
                        Your ELO: <span className="text-accent-primary font-bold" style={{ fontFamily: 'JetBrains Mono' }}>{userMMR}</span>
                      </p>
                      <p className="text-text-secondary text-sm">
                        Matchmaking finds opponents within a fair range.
                      </p>
                    </div>
                  )}
                  {matchType === 'unrated' && (
                    <p className="text-text-secondary text-sm">
                      Play for fun without affecting your ELO.
                    </p>
                  )}
                  {!user && (
                    <div className="bg-text-error/10 border border-text-error/20 rounded-lg p-3">
                      <p className="text-text-error text-xs">
                        ⚠️ Guest mode: Your progress will not be saved.
                      </p>
                    </div>
                  )}
                  <button
                    onClick={handleJoinQueue}
                    className="bg-accent-primary hover:bg-accent-hover text-accent-text font-semibold py-4 px-10 rounded-lg transition-all duration-200 shadow-lg shadow-accent-primary/20 text-lg ui-press"
                  >
                    Find Match
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal pour demander le pseudo guest */}
      <Modal 
        isOpen={showGuestModal} 
        onClose={() => setShowGuestModal(false)}
        title="Play as Guest"
      >
        <div className="space-y-4">
          <p className="text-text-secondary text-sm">
            Enter a username to play as a guest. Your progress will not be saved.
          </p>
          <input
            type="text"
            value={guestUsername}
            onChange={(e) => setGuestUsername(e.target.value)}
            placeholder="Username"
            maxLength={20}
            className="input-modern"
            onKeyPress={(e) => {
              if (e.key === 'Enter' && guestUsername.trim()) {
                handleGuestJoin();
              }
            }}
            autoFocus
          />
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setShowGuestModal(false)}
              className="px-4 py-2 text-text-secondary hover:text-text-primary transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleGuestJoin}
              disabled={!guestUsername.trim()}
              className="px-4 py-2 bg-accent-primary hover:bg-accent-hover text-accent-text font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal d'avertissement pour les guests */}
      <Modal 
        isOpen={showGuestWarning} 
        onClose={() => setShowGuestWarning(false)}
        title="Guest Mode Warning"
        showCloseButton={false}
      >
        <div className="space-y-4">
          <div className="bg-text-error/10 rounded-lg p-4">
            <p className="text-text-primary text-sm leading-relaxed">
              <strong className="text-text-error">Important:</strong> You are playing as a guest. 
              Your progression, statistics, and match history will <strong>not be saved</strong>.
            </p>
          </div>
          <p className="text-text-secondary text-sm">
            To save your progress and compete on the leaderboard, please create an account.
          </p>
          <div className="flex gap-3 justify-end pt-2">
            <button
              onClick={() => {
                setShowGuestWarning(false);
                setShowGuestModal(true);
              }}
              className="px-4 py-2 text-text-secondary hover:text-text-primary transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmGuestJoin}
              className="px-4 py-2 bg-accent-primary hover:bg-accent-hover text-accent-text font-semibold rounded-lg transition-colors"
            >
              I Understand, Continue
            </button>
          </div>
        </div>
      </Modal>

    </div>
  )
}
