import { useState, useEffect, useRef } from 'react'
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom'
import { io } from 'socket.io-client'
import LogoIconSmall from '../components/icons/LogoIconSmall'

export default function BattleRoom() {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { playerName, userId, isCreator, matchmaking } = location.state || {};
  
  const [text, setText] = useState('');
  const [input, setInput] = useState('');
  const [players, setPlayers] = useState([]);
  const [gameStatus, setGameStatus] = useState('waiting'); // waiting, playing, finished
  const [startTime, setStartTime] = useState(null);
  const [myStats, setMyStats] = useState({ wpm: 0, accuracy: 100, progress: 0 });
  const [opponentStats, setOpponentStats] = useState({ wpm: 0, accuracy: 100, progress: 0 });
  const [results, setResults] = useState(null);
  const [errors, setErrors] = useState(0);
  const [currentUser, setCurrentUser] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const inputRef = useRef(null);
  const socketRef = useRef(null);
  const textContainerRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Récupérer l'utilisateur courant si userId est fourni
  useEffect(() => {
    if (userId || matchmaking) {
      const fetchUser = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;
        
        try {
          const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
          const response = await fetch(`${API_URL}/api/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (response.ok) {
            const userData = await response.json();
            setCurrentUser(userData);
          }
        } catch (error) {
          console.error('Error fetching user:', error);
        }
      };
      fetchUser();
    }
  }, [userId, matchmaking]);

  useEffect(() => {
    if (!playerName) {
      navigate('/battle');
      return;
    }

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    socketRef.current = io(apiUrl, {
      transports: ['polling'], // Utiliser polling pour Plesk
      upgrade: false, // Empêcher l'upgrade vers WebSocket
      reconnection: true
    });
    const socket = socketRef.current;

    // Pour les rooms matchmaking, envoyer userId pour permettre la reconnexion
    socket.emit('join-room', { 
      roomId, 
      playerName,
      userId: userId || currentUser?.id || null
    });

    socket.on('room-joined', (data) => {
      setText(data.text);
      setPlayers(data.players);
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
      alert(error.message);
      window.location.href = '/';
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
      socketRef.current.emit('start-game', { roomId });
    }
  };

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
      if (value === text && startTime) {
        const finalTime = (Date.now() - startTime) / 1000 / 60;
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

  return (
    <div className="page-container p-4 lg:p-8">
        <div className="bg-bg-secondary rounded-lg p-6 lg:p-10 border border-border-primary shadow-lg relative overflow-hidden">
          {/* Layout en deux colonnes : jeu à gauche, chat à droite */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
            {/* Colonne principale : jeu */}
            <div className="min-w-0">
          {/* Effet de fond éthéré amélioré */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent-primary rounded-full blur-3xl animate-pulse-subtle"></div>
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent-secondary rounded-full blur-3xl animate-pulse-subtle" style={{ animationDelay: '1s' }}></div>
          </div>
          
          <div className="relative z-10">
          <div className="mb-8 text-center">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="w-1 h-8 bg-gradient-to-b from-accent-primary to-transparent rounded-full"></div>
              <h1 className="text-3xl font-bold text-text-primary" style={{ fontFamily: 'Inter', letterSpacing: '-0.02em' }}>
                <span className="text-accent-primary">BATTLE</span> #{roomId}
              </h1>
              <div className="w-1 h-8 bg-gradient-to-b from-accent-primary to-transparent rounded-full"></div>
            </div>
            <div className="flex justify-center gap-4 text-text-secondary text-sm">
              {players.map((player, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${player.name === playerName ? 'bg-accent-primary' : 'bg-text-secondary'}`}></div>
                  <span>{player.name}</span>
                </div>
              ))}
            </div>
          </div>

          {gameStatus === 'waiting' && (
            <div className="text-center py-12">
              <p className="text-text-primary text-lg mb-4">
                {players.length === 1 ? 'Waiting for opponent...' : 'Both players ready!'}
              </p>
              {players.length === 2 && isCreator && (
                <button
                  onClick={handleStartGame}
                  className="bg-accent-primary hover:bg-accent-hover text-bg-primary font-semibold py-3 px-8 rounded transition-colors"
                >
                  start
                </button>
              )}
              {players.length === 2 && !isCreator && (
                <p className="text-text-secondary">Waiting for room creator...</p>
              )}
            </div>
          )}

          {gameStatus === 'playing' && (
            <>
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div className="bg-bg-primary rounded p-4 border border-accent-primary/30">
                  <div className="text-text-primary mb-3 font-semibold text-sm">{myPlayer?.name} (you)</div>
                  <div className="flex gap-6 text-text-primary">
                    <div>
                      <div className="text-3xl font-bold" style={{ fontFamily: 'JetBrains Mono' }}>{myStats.wpm}</div>
                      <div className="text-text-secondary text-xs mt-1">wpm</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold" style={{ fontFamily: 'JetBrains Mono' }}>{myStats.accuracy}%</div>
                      <div className="text-text-secondary text-xs mt-1">acc</div>
                    </div>
                    <div className="flex-1">
                      <div className="text-text-secondary text-xs mb-1">progress</div>
                      <div className="w-full bg-text-secondary/20 rounded-full h-1.5">
                        <div 
                          className="bg-accent-primary h-1.5 rounded-full transition-all"
                          style={{ width: `${myStats.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {opponent && (
                  <div className="bg-bg-primary rounded p-4 border border-text-secondary/30">
                    <div className="text-text-primary mb-3 font-semibold text-sm">{opponent.name}</div>
                    <div className="flex gap-6 text-text-primary">
                      <div>
                        <div className="text-3xl font-bold" style={{ fontFamily: 'JetBrains Mono' }}>{opponentStats.wpm}</div>
                        <div className="text-text-secondary text-xs mt-1">wpm</div>
                      </div>
                      <div>
                        <div className="text-3xl font-bold" style={{ fontFamily: 'JetBrains Mono' }}>{opponentStats.accuracy}%</div>
                        <div className="text-text-secondary text-xs mt-1">acc</div>
                      </div>
                      <div className="flex-1">
                        <div className="text-text-secondary text-xs mb-1">progress</div>
                        <div className="w-full bg-text-secondary/20 rounded-full h-1.5">
                          <div 
                            className="bg-text-secondary h-1.5 rounded-full transition-all"
                            style={{ width: `${opponentStats.progress}%` }}
                          ></div>
                        </div>
                      </div>
                      </div>
                    </div>
                  )}
                </div>

                <div 
                  ref={textContainerRef}
                  className="mb-6 typing-text bg-bg-card p-8 rounded-lg relative overflow-hidden border border-border-secondary" 
                  style={{ minHeight: '200px', maxHeight: '300px', overflowY: 'auto', scrollBehavior: 'smooth' }}
                >
                  <div className="absolute inset-0 pointer-events-none shimmer-effect"></div>
                  <div className="relative z-10">
                    {renderText()}
                  </div>
                </div>

              <div className="mb-6">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={handleInputChange}
                  className="w-full p-4 bg-bg-card border border-border-secondary rounded-lg text-text-primary text-lg focus:outline-none focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20 transition-all"
                  placeholder="Start typing..."
                  style={{ fontFamily: 'JetBrains Mono' }}
                />
              </div>
            </>
          )}

          {gameStatus === 'finished' && results && (
            <div className="text-center py-8">
              <h2 className="text-2xl font-bold text-text-primary mb-6">finished</h2>
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                {players.map((player) => {
                  const result = results[player.id];
                  const isWinner = result && (!opponent || !results[opponent.id] || result.wpm > results[opponent.id].wpm);
                  return (
                    <div
                      key={player.id}
                      className={`bg-bg-primary rounded p-6 border-2 ${
                        isWinner ? 'border-accent-primary' : 'border-text-secondary/20'
                      }`}
                    >
                      {isWinner && (
                        <div className="text-2xl mb-2">🏆</div>
                      )}
                      <div className="text-lg font-bold text-text-primary mb-4">
                        {player.name === playerName ? `${player.name} (you)` : player.name}
                      </div>
                      {result && (
                        <div className="space-y-2 text-text-primary">
                          <div className="text-3xl font-bold" style={{ fontFamily: 'JetBrains Mono' }}>{result.wpm} wpm</div>
                          <div className="text-text-secondary">{result.accuracy}% accuracy</div>
                          <div className="text-text-secondary">{Math.round(result.time)}s</div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
                <button
                  onClick={() => window.location.href = '/'}
                  className="bg-gradient-to-r from-accent-primary to-accent-hover hover:from-accent-hover hover:to-accent-primary text-bg-primary font-semibold py-3 px-8 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  NEW BATTLE
                </button>
            </div>
          )}
          </div>
            </div>

            {/* Colonne droite : Chat */}
            <div className="lg:border-l lg:border-text-secondary/10 lg:pl-6">
              <div className="bg-bg-primary rounded-lg border border-text-secondary/10 h-full flex flex-col" style={{ minHeight: '500px', maxHeight: 'calc(100vh - 200px)' }}>
                {/* En-tête du chat */}
                <div className="p-4 border-b border-text-secondary/10">
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
                <form onSubmit={handleSendChatMessage} className="p-4 border-t border-text-secondary/10">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 px-3 py-2 bg-bg-secondary border border-text-secondary/20 rounded-lg text-text-primary text-sm focus:outline-none focus:border-accent-primary/50 transition-colors"
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
