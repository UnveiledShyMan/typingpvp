import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { getSocket, cleanupSocket } from '../services/socketService'
import { useToastContext } from '../contexts/ToastContext'
import ShareButtons from '../components/ShareButtons'
import UserTooltip from '../components/UserTooltip'
import { navigateToProfile, isValidUserId } from '../utils/profileNavigation'

export default function CompetitionRoom() {
  const { competitionId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { username, userId, isCreator } = location.state || {};
  const { toast } = useToastContext();
  
  const [text, setText] = useState('');
  const [input, setInput] = useState('');
  const [players, setPlayers] = useState([]);
  const [gameStatus, setGameStatus] = useState('waiting'); // waiting, starting, playing, finished
  const [countdown, setCountdown] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [myStats, setMyStats] = useState({ wpm: 0, accuracy: 100, progress: 0 });
  const [leaderboard, setLeaderboard] = useState([]);
  const [errors, setErrors] = useState(0);
  const inputRef = useRef(null);
  const socketRef = useRef(null);
  const textContainerRef = useRef(null);
  const lastErrorCountRef = useRef(0); // Ref pour le calcul incrémental des erreurs (optimisation O(1))
  const statsUpdateRef = useRef(null); // Ref pour throttler les calculs de stats avec requestAnimationFrame

  useEffect(() => {
    if (!username) {
      navigate('/competitions');
      return;
    }

    // Utiliser le service centralisé de socket qui gère correctement l'URL
    socketRef.current = getSocket(false);
    const socket = socketRef.current;
    
    if (!socket) {
      toast.error('Failed to initialize socket connection');
      return;
    }
    
    // Nettoyer les anciens listeners pour éviter les doublons
    cleanupSocket(socket, [
      'competition-joined',
      'competition-updated',
      'competition-starting',
      'competition-countdown',
      'competition-started',
      'competition-ended',
      'competition-leaderboard',
      'competition-error',
      'error'
    ]);

    socket.emit('join-competition', { competitionId, userId, username });

    socket.on('competition-joined', (data) => {
      setText(data.text);
      setPlayers(data.players);
      setGameStatus(data.status);
    });

    socket.on('competition-updated', (data) => {
      setPlayers(data.players);
      if (data.status) setGameStatus(data.status);
    });

    socket.on('competition-starting', (data) => {
      setGameStatus('starting');
      setCountdown(data.countdown);
    });

    socket.on('competition-countdown', (data) => {
      setCountdown(data.countdown);
    });

    socket.on('competition-started', (data) => {
      setGameStatus('playing');
      setStartTime(data.startTime);
      setText(data.text);
      setInput(''); // Réinitialiser l'input
      lastErrorCountRef.current = 0; // Réinitialiser le compteur d'erreurs
      // Annuler les calculs de stats en cours
      if (statsUpdateRef.current) {
        cancelAnimationFrame(statsUpdateRef.current);
        statsUpdateRef.current = null;
      }
      if (inputRef.current) {
        inputRef.current.focus();
      }
    });

    socket.on('competition-leaderboard', (data) => {
      setLeaderboard(data.leaderboard);
    });

    socket.on('competition-ended', (data) => {
      setGameStatus('finished');
      setLeaderboard(data.leaderboard);
    });

    socket.on('competition-error', (error) => {
      toast.error(error.message);
      setTimeout(() => {
        navigate('/competitions');
      }, 2000);
    });

    return () => {
      // Nettoyer les listeners spécifiques à CompetitionRoom, mais ne pas déconnecter le socket
      // car il peut être utilisé par d'autres composants
      cleanupSocket(socket, [
        'competition-joined',
        'competition-updated',
        'competition-starting',
        'competition-countdown',
        'competition-started',
        'competition-leaderboard',
        'competition-ended',
        'competition-error'
      ]);
    };
  }, [competitionId, username, userId, navigate]);

  useEffect(() => {
    if (inputRef.current && gameStatus === 'playing') {
      inputRef.current.focus();
    }
  }, [gameStatus]);

  // Auto-start après 10 secondes si au moins 2 joueurs
  useEffect(() => {
    if (gameStatus === 'waiting' && players.length >= 2 && isCreator) {
      const timer = setTimeout(() => {
        if (socketRef.current) {
          socketRef.current.emit('start-competition', { competitionId });
        }
      }, 10000); // 10 secondes

      return () => clearTimeout(timer);
    }
  }, [gameStatus, players.length, isCreator, competitionId]);

  const handleInputChange = useCallback((e) => {
    if (gameStatus !== 'playing') return;
    
    const value = e.target.value;
    
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
      if (startTime) {
        // Annuler le calcul précédent s'il existe
        if (statsUpdateRef.current) {
          cancelAnimationFrame(statsUpdateRef.current);
        }
        
        // Déférer les calculs de stats pour ne pas bloquer l'input
        statsUpdateRef.current = requestAnimationFrame(() => {
          const timeElapsed = (Date.now() - startTime) / 1000 / 60;
          
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
          const progress = Math.round((value.length / text.length) * 100);
          
          setMyStats({ wpm, accuracy, progress });
          
          // Envoyer la mise à jour au serveur (throttling géré côté serveur)
          if (socketRef.current) {
            socketRef.current.emit('competition-progress', {
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
          });
        }
      }

      // Vérifier si terminé
      if (value === text && startTime) {
        const finalTime = (Date.now() - startTime) / 1000 / 60;
        const finalWpm = finalTime > 0 ? Math.round(text.trim().split(/\s+/).filter(w => w.length > 0).length / finalTime) : 0;
        const finalAccuracy = Math.round(((text.length - errorCount) / text.length) * 100);
        
        if (socketRef.current) {
          socketRef.current.emit('competition-finished', {
            wpm: finalWpm,
            accuracy: finalAccuracy
          });
        }
      }
    }
  }, [gameStatus, text, input, startTime]);

  // OPTIMISATION : Mémoriser renderText avec useMemo pour éviter de recalculer à chaque render
  // Cela améliore significativement les performances lors de la frappe
  const renderText = useMemo(() => {
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
  }, [text, input]);

  // Raccourcis clavier pour CompetitionRoom
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Ne pas activer les raccourcis si on est en train de taper dans un input
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
      
      // R : Retour aux competitions (seulement si le match est terminé)
      if ((e.key === 'r' || e.key === 'R') && gameStatus === 'finished') {
        e.preventDefault();
        navigate('/competitions');
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameStatus, navigate]);

  const myPosition = leaderboard.findIndex(p => p.name === username) + 1 || players.length;

  return (
    <div className="page-container p-8" style={{ maxWidth: 'min(1280px, calc(100vw - 320px))' }}>
      <div className="bg-bg-secondary/40 backdrop-blur-sm rounded-lg p-10 relative overflow-hidden ui-card ui-fade-up">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent-primary rounded-full blur-3xl animate-pulse-subtle"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent-secondary rounded-full blur-3xl animate-pulse-subtle" style={{ animationDelay: '1s' }}></div>
        </div>
        
        <div className="relative z-10">
          <div className="mb-8 text-center ui-section">
            <h1 className="text-3xl font-bold text-text-primary mb-2 ui-title" style={{ fontFamily: 'Inter', letterSpacing: '-0.02em' }}>
              <span className="text-accent-primary">COMPETITION</span> #{competitionId}
            </h1>
            <p className="text-text-secondary text-sm">{players.length} players</p>
          </div>

          {gameStatus === 'waiting' && (
            <div className="text-center py-12">
              <div className="max-w-md mx-auto space-y-6">
                {/* Indicateur visuel d'attente */}
                <div className="relative w-20 h-20 mx-auto">
                  <div className="absolute inset-0 border-4 border-accent-primary/20 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-transparent border-t-accent-primary rounded-full animate-spin"></div>
                </div>
                
                <div className="space-y-3">
                  <p className="text-text-primary text-xl font-semibold">
                    Waiting for players...
                  </p>
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-bg-secondary/60 backdrop-blur-sm rounded-full border border-border-secondary/30">
                    <div className="w-2 h-2 rounded-full bg-accent-primary animate-pulse"></div>
                    <span className="text-text-secondary text-sm">
                      <span className="text-accent-primary font-bold">{players.length}</span> player{players.length !== 1 ? 's' : ''} joined
                    </span>
                  </div>
                  {isCreator && players.length >= 2 && (
                    <div className="bg-accent-primary/10 border border-accent-primary/30 rounded-lg p-4 mt-4">
                      <p className="text-accent-primary text-sm font-medium">
                        Competition will start automatically in 10 seconds...
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {gameStatus === 'starting' && (
            <div className="text-center py-12">
              <div className="space-y-6">
                <div className="relative inline-block">
                  <div className="absolute inset-0 bg-accent-primary/20 rounded-full blur-3xl animate-pulse"></div>
                  <div className="relative text-7xl font-bold text-accent-primary" style={{ fontFamily: 'JetBrains Mono' }}>
                    {countdown}
                  </div>
                </div>
                <p className="text-text-secondary text-lg font-medium">Get ready!</p>
              </div>
            </div>
          )}

          {gameStatus === 'playing' && (
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Zone de frappe */}
              <div className="lg:col-span-2">
                <div className="bg-bg-secondary/60 backdrop-blur-sm rounded-lg p-6 mb-4 border border-border-secondary/30 shadow-lg">
                  <div className="flex gap-6 text-text-primary mb-4">
                    <div className="flex flex-col">
                      <div className="text-3xl font-bold text-accent-primary" style={{ fontFamily: 'JetBrains Mono' }}>{myStats.wpm}</div>
                      <div className="text-text-secondary text-xs mt-1 font-medium">WPM</div>
                    </div>
                    <div className="flex flex-col">
                      <div className="text-3xl font-bold text-accent-secondary" style={{ fontFamily: 'JetBrains Mono' }}>{myStats.accuracy}%</div>
                      <div className="text-text-secondary text-xs mt-1 font-medium">Accuracy</div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-text-secondary text-xs mb-2">
                        <span className="font-medium">Progress</span>
                        <span className="font-mono">{Math.round(myStats.progress)}%</span>
                      </div>
                      <div className="w-full bg-text-secondary/20 rounded-full h-2.5 overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-accent-primary to-accent-secondary h-2.5 rounded-full transition-all shadow-sm"
                          style={{ width: `${myStats.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div 
                  ref={textContainerRef}
                  className="typing-text bg-bg-card/40 backdrop-blur-sm rounded-lg p-6 min-h-[200px] max-h-[300px] overflow-y-auto mb-4 text-lg leading-relaxed scrollbar-on-hover"
                  style={{ scrollBehavior: 'smooth' }}
                >
                  {renderText()}
                </div>

                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={handleInputChange}
                  className="input-modern text-lg"
                  placeholder="Start typing..."
                  autoFocus
                />
              </div>

              {/* Classement - Design amélioré */}
              <div className="lg:col-span-1">
                <div className="bg-bg-secondary/60 backdrop-blur-sm rounded-lg p-5 border border-border-secondary/30 shadow-lg sticky top-4 ui-card">
                  <h2 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
                    <span className="w-1 h-5 bg-gradient-to-b from-accent-primary to-transparent rounded-full"></span>
                    Leaderboard
                  </h2>
                  <div className="space-y-2 max-h-[600px] overflow-y-auto scrollbar-on-hover">
                    {leaderboard.slice(0, 20).map((player, index) => {
                      const isTopThree = player.position <= 3;
                      const isMe = player.name === username;
                      
                      return (
                        <div
                          key={player.id}
                          className={`p-3 rounded-lg border transition-all ${
                            isMe
                              ? 'bg-accent-primary/15 border-accent-primary/40 ring-2 ring-accent-primary/20'
                              : isTopThree
                              ? 'bg-bg-primary/30 border-border-secondary/30'
                              : 'bg-bg-primary/20 border-border-secondary/20'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-bold ${isTopThree ? 'text-accent-primary' : 'text-text-secondary'}`} style={{ fontFamily: 'JetBrains Mono' }}>
                                #{player.position}
                              </span>
                              {player.userId && player.name !== username ? (
                                <UserTooltip userId={player.userId} username={player.name}>
                                  <button
                                    onClick={() => navigateToProfile(navigate, player.userId, player.name)}
                                    className="text-sm font-semibold text-text-primary hover:text-accent-primary transition-colors cursor-pointer"
                                    title="View profile"
                                  >
                                    {player.name}
                                  </button>
                                </UserTooltip>
                              ) : (
                                <span className={`text-sm font-semibold ${isMe ? 'text-accent-primary' : 'text-text-primary'}`}>
                                  {player.name} {isMe && <span className="text-xs">(you)</span>}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-4 text-xs">
                            <span className="text-text-secondary font-medium">
                              <span className="text-text-primary font-bold font-mono">{player.wpm}</span> wpm
                            </span>
                            <span className="text-text-secondary font-medium">
                              <span className="text-text-primary font-bold font-mono">{player.accuracy}%</span> acc
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {gameStatus === 'finished' && (
            <div className="text-center py-12">
              <h2 className="text-3xl font-bold text-text-primary mb-8">Competition Finished!</h2>
              <div className="bg-bg-primary/30 backdrop-blur-sm rounded-lg p-6 max-w-2xl mx-auto">
                <div className="space-y-3">
                  {leaderboard.slice(0, 10).map((player, index) => (
                    <div
                      key={player.id}
                      className={`p-4 rounded-lg flex items-center justify-between ${
                        player.name === username
                          ? 'bg-accent-primary/10 ring-2 ring-accent-primary/30'
                          : 'bg-bg-secondary/40 backdrop-blur-sm'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-2xl font-bold text-text-secondary" style={{ fontFamily: 'JetBrains Mono' }}>
                          #{player.position}
                        </span>
                        <span className={`text-lg font-medium ${player.name === username ? 'text-accent-primary' : 'text-text-primary'}`}>
                          {player.name} {player.name === username && '(you)'}
                        </span>
                      </div>
                      <div className="flex gap-6 text-text-primary">
                        <span style={{ fontFamily: 'JetBrains Mono' }}>{player.wpm} wpm</span>
                        <span style={{ fontFamily: 'JetBrains Mono' }}>{player.accuracy}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Boutons de partage pour le gagnant */}
              {(() => {
                const myResult = leaderboard.find(p => p.name === username);
                const isWinner = myResult && leaderboard.length > 0 && leaderboard[0].name === username;
                
                if (!myResult) return null;
                
                return (
                  <div className="mt-6 flex justify-center">
                    <ShareButtons
                      result={{
                        wpm: myResult.wpm,
                        accuracy: myResult.accuracy,
                        position: myResult.position,
                        isWinner: isWinner,
                        totalPlayers: leaderboard.length
                      }}
                      type="competition"
                    />
                  </div>
                );
              })()}
              
              <button
                onClick={() => navigate('/competitions')}
                className="mt-6 bg-accent-primary hover:bg-accent-hover text-accent-text font-semibold py-3 px-8 rounded-lg transition-colors"
              >
                Back to Competitions
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


