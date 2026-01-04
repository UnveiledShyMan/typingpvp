import { useState, useEffect, useRef } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { io } from 'socket.io-client'

export default function CompetitionRoom() {
  const { competitionId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { username, userId, isCreator } = location.state || {};
  
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

  useEffect(() => {
    if (!username) {
      navigate('/competitions');
      return;
    }

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    socketRef.current = io(apiUrl);
    const socket = socketRef.current;

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
      alert(error.message);
      navigate('/competitions');
    });

    return () => {
      socket.off('competition-joined');
      socket.off('competition-updated');
      socket.off('competition-starting');
      socket.off('competition-countdown');
      socket.off('competition-started');
      socket.off('competition-leaderboard');
      socket.off('competition-ended');
      socket.off('competition-error');
      socket.disconnect();
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

  const handleInputChange = (e) => {
    if (gameStatus !== 'playing') return;
    
    const value = e.target.value;
    
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

      // Calculer les stats
      if (startTime) {
        const timeElapsed = (Date.now() - startTime) / 1000 / 60;
        const wordsTyped = value.trim().split(/\s+/).filter(w => w.length > 0).length;
        const wpm = timeElapsed > 0 ? Math.round(wordsTyped / timeElapsed) : 0;
        const accuracy = value.length > 0 
          ? Math.round(((value.length - errorCount) / value.length) * 100)
          : 100;
        const progress = Math.round((value.length / text.length) * 100);
        
        setMyStats({ wpm, accuracy, progress });
        
        // Envoyer la mise à jour au serveur
        if (socketRef.current) {
          socketRef.current.emit('competition-progress', {
            progress,
            wpm,
            accuracy
          });
        }

        // Auto-scroll
        if (textContainerRef.current) {
          const container = textContainerRef.current;
          const currentCharElement = container.querySelector(`span:nth-child(${value.length + 1})`);
          if (currentCharElement) {
            const containerRect = container.getBoundingClientRect();
            const charRect = currentCharElement.getBoundingClientRect();
            const charTop = charRect.top - containerRect.top + container.scrollTop;
            const charBottom = charTop + charRect.height;
            
            if (charTop < container.scrollTop + 50) {
              container.scrollTop = Math.max(0, charTop - 50);
            } else if (charBottom > container.scrollTop + container.clientHeight - 50) {
              container.scrollTop = charBottom - container.clientHeight + 50;
            }
          }
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

  const myPosition = leaderboard.findIndex(p => p.name === username) + 1 || players.length;

  return (
    <div className="page-container p-8" style={{ maxWidth: 'min(1280px, calc(100vw - 320px))' }}>
      <div className="bg-bg-secondary rounded-lg p-10 border border-border-primary shadow-lg relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent-primary rounded-full blur-3xl animate-pulse-subtle"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent-secondary rounded-full blur-3xl animate-pulse-subtle" style={{ animationDelay: '1s' }}></div>
        </div>
        
        <div className="relative z-10">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-text-primary mb-2" style={{ fontFamily: 'Inter', letterSpacing: '-0.02em' }}>
              <span className="text-accent-primary">COMPETITION</span> #{competitionId}
            </h1>
            <p className="text-text-secondary text-sm">{players.length} players</p>
          </div>

          {gameStatus === 'waiting' && (
            <div className="text-center py-12">
              <p className="text-text-primary text-lg mb-4">
                Waiting for players... ({players.length} joined)
              </p>
              {isCreator && players.length >= 2 && (
                <p className="text-text-secondary text-sm">Competition will start automatically in 10 seconds...</p>
              )}
            </div>
          )}

          {gameStatus === 'starting' && (
            <div className="text-center py-12">
              <div className="text-6xl font-bold text-accent-primary mb-4" style={{ fontFamily: 'JetBrains Mono' }}>
                {countdown}
              </div>
              <p className="text-text-secondary">Get ready!</p>
            </div>
          )}

          {gameStatus === 'playing' && (
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Zone de frappe */}
              <div className="lg:col-span-2">
                <div className="bg-bg-card rounded-lg p-6 border border-border-secondary mb-4">
                  <div className="flex gap-6 text-text-primary mb-4">
                    <div>
                      <div className="text-2xl font-bold" style={{ fontFamily: 'JetBrains Mono' }}>{myStats.wpm}</div>
                      <div className="text-text-secondary text-xs mt-1">wpm</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold" style={{ fontFamily: 'JetBrains Mono' }}>{myStats.accuracy}%</div>
                      <div className="text-text-secondary text-xs mt-1">acc</div>
                    </div>
                    <div className="flex-1">
                      <div className="text-text-secondary text-xs mb-1">Progress</div>
                      <div className="w-full bg-text-secondary/20 rounded-full h-1.5">
                        <div 
                          className="bg-accent-primary h-1.5 rounded-full transition-all"
                          style={{ width: `${myStats.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div 
                  ref={textContainerRef}
                  className="typing-text bg-bg-card rounded-lg p-6 border border-border-secondary min-h-[200px] max-h-[300px] overflow-y-auto mb-4 text-lg leading-relaxed"
                  style={{ scrollBehavior: 'smooth' }}
                >
                  {renderText()}
                </div>

                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={handleInputChange}
                  className="w-full p-4 bg-bg-card border border-border-secondary rounded-lg text-text-primary focus:outline-none focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20 transition-all text-lg"
                  placeholder="Start typing..."
                  autoFocus
                />
              </div>

              {/* Classement */}
              <div className="lg:col-span-1">
                <div className="bg-bg-card rounded-lg p-4 border border-border-secondary sticky top-4">
                  <h2 className="text-lg font-bold text-text-primary mb-4">Leaderboard</h2>
                  <div className="space-y-2 max-h-[600px] overflow-y-auto">
                    {leaderboard.slice(0, 20).map((player, index) => (
                      <div
                        key={player.id}
                        className={`p-3 rounded-lg border ${
                          player.name === username
                            ? 'bg-accent-primary/10 border-accent-primary/30'
                            : 'bg-bg-secondary border-text-secondary/20'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-text-secondary text-sm font-bold" style={{ fontFamily: 'JetBrains Mono' }}>
                              #{player.position}
                            </span>
                            <span className={`text-sm font-medium ${player.name === username ? 'text-accent-primary' : 'text-text-primary'}`}>
                              {player.name} {player.name === username && '(you)'}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-4 text-xs text-text-secondary">
                          <span style={{ fontFamily: 'JetBrains Mono' }}>{player.wpm} wpm</span>
                          <span style={{ fontFamily: 'JetBrains Mono' }}>{player.accuracy}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {gameStatus === 'finished' && (
            <div className="text-center py-12">
              <h2 className="text-3xl font-bold text-text-primary mb-8">Competition Finished!</h2>
              <div className="bg-bg-primary rounded-lg p-6 border border-text-secondary/20 max-w-2xl mx-auto">
                <div className="space-y-3">
                  {leaderboard.slice(0, 10).map((player, index) => (
                    <div
                      key={player.id}
                      className={`p-4 rounded-lg border flex items-center justify-between ${
                        player.name === username
                          ? 'bg-accent-primary/10 border-accent-primary/30'
                          : 'bg-bg-secondary border-text-secondary/20'
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
              <button
                onClick={() => navigate('/competitions')}
                className="mt-8 bg-accent-primary hover:bg-accent-hover text-bg-primary font-semibold py-3 px-8 rounded-lg transition-colors"
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


