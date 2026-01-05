import { useState, useEffect, useRef } from 'react'
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom'
import { io } from 'socket.io-client'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
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
      setMyTimeSeries([]);
      setOpponentTimeSeries([]);
      
      // Arrêter l'interval précédent s'il existe
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
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
        
        // Ajouter aux séries temporelles pour le graphique en temps réel
        if (startTime) {
          const currentSecond = Math.floor((Date.now() - startTime) / 1000);
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
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
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
        
        // Enregistrer dans les séries temporelles pour le graphique
        const currentSecond = Math.floor((Date.now() - startTime) / 1000);
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
        <div className="bg-bg-secondary/50 rounded-lg p-6 lg:p-8 border border-text-secondary/10 shadow-lg">
          {/* Layout en deux colonnes : jeu à gauche, chat à droite */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
            {/* Colonne principale : jeu */}
            <div className="min-w-0">
              {/* En-tête sobre */}
              <div className="mb-6 pb-4 border-b border-text-secondary/10">
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
              {/* Stats des joueurs - design sobre */}
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div className="bg-bg-primary/50 rounded-lg p-4 border border-text-secondary/10">
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
                  <div className="bg-bg-primary/50 rounded-lg p-4 border border-text-secondary/10">
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
                <div className="mb-6 bg-bg-primary/30 rounded-lg p-4 border border-text-secondary/10">
                  <div className="text-text-secondary text-xs mb-3 font-medium">Live Progress</div>
                  <ResponsiveContainer width="100%" height={150}>
                    <LineChart data={(() => {
                      // Fusionner les deux séries en combinant par seconde
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
                          me: myData?.wpm || 0,
                          opponent: oppData?.wpm || 0
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
                      />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      <Line 
                        type="monotone" 
                        dataKey="me" 
                        stroke="#00ff9f" 
                        strokeWidth={2}
                        dot={false}
                        name={myPlayer?.name || 'You'}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="opponent" 
                        stroke="#646669" 
                        strokeWidth={2}
                        dot={false}
                        name={opponent?.name || 'Opponent'}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              <div 
                ref={textContainerRef}
                className="mb-6 typing-text bg-bg-primary/30 p-6 rounded-lg border border-text-secondary/10" 
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
                  className="w-full p-4 bg-bg-primary/50 border border-text-secondary/10 rounded-lg text-text-primary text-lg focus:outline-none focus:border-accent-primary/50 transition-all"
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
                      className={`bg-bg-primary/50 rounded-lg p-6 border ${
                        isWinner ? 'border-accent-primary/50' : 'border-text-secondary/10'
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
                <div className="mb-8 bg-bg-primary/30 rounded-lg p-6 border border-text-secondary/10">
                  <div className="text-text-primary mb-4 text-sm font-semibold">Match Performance</div>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={(() => {
                      // Fusionner les deux séries en combinant par seconde
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
                          me: myData?.wpm || 0,
                          opponent: oppData?.wpm || 0
                        });
                      }
                      return chartData;
                    })()}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#646669" opacity={0.2} />
                      <XAxis 
                        dataKey="time" 
                        stroke="#646669"
                        label={{ value: 'Time (s)', position: 'insideBottom', offset: -5, style: { fill: '#646669', fontSize: '12px' } }}
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
                      />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      <Line 
                        type="monotone" 
                        dataKey="me" 
                        stroke="#00ff9f" 
                        strokeWidth={2.5}
                        dot={false}
                        name={myPlayer?.name || 'You'}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="opponent" 
                        stroke="#646669" 
                        strokeWidth={2.5}
                        dot={false}
                        name={opponent?.name || 'Opponent'}
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
