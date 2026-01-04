import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { io } from 'socket.io-client'
import { languages } from '../data/languages'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function Matchmaking() {
  const [selectedLang, setSelectedLang] = useState('en');
  const [isInQueue, setIsInQueue] = useState(false);
  const [queueTime, setQueueTime] = useState(0);
  const [user, setUser] = useState(null);
  const socketRef = useRef(null);
  const intervalRef = useRef(null);
  const queueStartTimeRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCurrentUser();
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const fetchCurrentUser = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/api/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };

  const handleJoinQueue = () => {
    if (!user) {
      alert('Please login to use matchmaking');
      return;
    }

    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    socketRef.current = io(apiUrl, {
      transports: ['polling'], // Utiliser polling pour Plesk
      upgrade: false, // Empêcher l'upgrade vers WebSocket
      reconnection: true
    });

    const socket = socketRef.current;
    const mmr = user.mmr[selectedLang] || 1000;

    socket.on('connect', () => {
      socket.emit('join-matchmaking', {
        userId: user.id,
        language: selectedLang,
        mmr: mmr
      });
    });

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
      
      // Rediriger vers la battle room
      navigate(`/battle/${data.roomId}`, { 
        state: { 
          playerName: user.username, 
          isCreator: false,
          matchmaking: true 
        } 
      });
    });

    socket.on('matchmaking-error', (error) => {
      alert(error.message);
      setIsInQueue(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    });
  };

  const handleLeaveQueue = () => {
    if (socketRef.current) {
      socketRef.current.emit('leave-matchmaking');
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setIsInQueue(false);
    setQueueTime(0);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const userMMR = user ? (user.mmr[selectedLang] || 1000) : 1000;

  return (
    <div className="page-container p-8">
      <h1 className="text-4xl font-bold text-text-primary mb-8" style={{ fontFamily: 'Inter', letterSpacing: '-0.02em' }}>
        Matchmaking
      </h1>

      {!user && (
        <div className="bg-bg-secondary rounded-lg border border-text-secondary/10 p-8 text-center shadow-lg">
          <p className="text-text-secondary text-lg mb-4">Please login to use matchmaking</p>
          <button
            onClick={() => navigate('/')}
            className="bg-accent-primary hover:bg-accent-hover text-bg-primary font-semibold py-2 px-6 rounded-lg transition-colors"
          >
            Go to Login
          </button>
        </div>
      )}

      {user && (
        <div className="space-y-6">
          {/* Language Selector */}
          <div className="bg-bg-secondary rounded-lg border border-text-secondary/10 p-6 shadow-lg">
            <label className="block text-text-primary mb-3 text-sm font-medium">Language</label>
            <select
              value={selectedLang}
              onChange={(e) => setSelectedLang(e.target.value)}
              disabled={isInQueue}
              className="w-full p-3 bg-bg-primary border border-text-secondary/20 rounded-lg text-text-primary focus:outline-none focus:border-accent-primary transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {Object.entries(languages).map(([code, lang]) => (
                <option key={code} value={code} className="bg-bg-primary">
                  {lang.name}
                </option>
              ))}
            </select>
            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="text-text-secondary">Your ELO:</span>
              <span className="text-text-primary font-bold" style={{ fontFamily: 'JetBrains Mono' }}>
                {userMMR}
              </span>
            </div>
          </div>

          {/* Queue Status */}
          {isInQueue ? (
            <div className="bg-bg-secondary rounded-lg border border-accent-primary/30 p-8 text-center shadow-lg battle-glow">
              <div className="mb-6">
                <div className="inline-flex items-center gap-3 px-4 py-2 bg-bg-primary/50 rounded-full border border-accent-primary/20 mb-4">
                  <div className="w-3 h-3 rounded-full bg-accent-primary animate-pulse"></div>
                  <span className="text-text-primary font-medium">Searching for opponent...</span>
                </div>
                <div className="text-3xl font-bold text-text-primary mb-2" style={{ fontFamily: 'JetBrains Mono' }}>
                  {formatTime(queueTime)}
                </div>
                <div className="text-text-secondary text-sm">Time in queue</div>
              </div>
              <button
                onClick={handleLeaveQueue}
                className="bg-text-error hover:bg-text-error/80 text-bg-primary font-semibold py-3 px-8 rounded-lg transition-colors"
              >
                Cancel Search
              </button>
            </div>
          ) : (
            <div className="bg-bg-secondary rounded-lg border border-text-secondary/10 p-8 text-center shadow-lg">
              <div className="mb-6">
                <p className="text-text-secondary mb-4">
                  Find an opponent with similar skill level (MMR: {userMMR})
                </p>
                <p className="text-text-secondary/70 text-sm">
                  Matchmaking will find you an opponent within ±200 MMR range
                </p>
              </div>
              <button
                onClick={handleJoinQueue}
                className="bg-gradient-to-r from-accent-primary to-accent-hover hover:from-accent-hover hover:to-accent-primary text-bg-primary font-semibold py-4 px-12 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl battle-glow text-lg"
              >
                Find Match
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
