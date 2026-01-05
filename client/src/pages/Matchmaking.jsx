import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { io } from 'socket.io-client'
import { languages } from '../data/languages'
import Modal from '../components/Modal'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function Matchmaking() {
  const [selectedLang, setSelectedLang] = useState('en');
  const [isInQueue, setIsInQueue] = useState(false);
  const [queueTime, setQueueTime] = useState(0);
  const [user, setUser] = useState(null);
  const [guestUsername, setGuestUsername] = useState('');
  const [showGuestWarning, setShowGuestWarning] = useState(false);
  const [showGuestModal, setShowGuestModal] = useState(false);
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
    // Si pas d'utilisateur, demander un pseudo pour joueur invité
    if (!user) {
      setShowGuestModal(true);
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
      
      // NE PAS déconnecter le socket ici - le laisser ouvert pour que BattleRoom puisse l'utiliser
      // Ne pas appeler socket.disconnect() pour permettre la transition vers BattleRoom
      
      // Rediriger vers la battle room
      navigate(`/battle/${data.roomId}`, { 
        state: { 
          playerName: user ? user.username : guestUsername,
          userId: user ? user.id : null,
          isCreator: false,
          matchmaking: true,
          existingSocket: true, // Indicateur pour BattleRoom
          isGuest: !user // Indicateur pour joueur invité
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

  // Gérer le join en tant que guest
  const handleGuestJoin = () => {
    if (!guestUsername.trim()) {
      alert('Please enter a username');
      return;
    }

    setShowGuestModal(false);
    setShowGuestWarning(true);
  };

  const handleConfirmGuestJoin = () => {
    setShowGuestWarning(false);

    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    socketRef.current = io(apiUrl, {
      transports: ['polling'],
      upgrade: false,
      reconnection: true
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      socket.emit('join-matchmaking', {
        userId: null, // Pas d'userId pour les guests
        username: guestUsername.trim(),
        language: selectedLang,
        mmr: 1000 // MMR par défaut pour les guests
      });
    });

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
      
      navigate(`/battle/${data.roomId}`, { 
        state: { 
          playerName: guestUsername.trim(),
          userId: null,
          isCreator: false,
          matchmaking: true,
          existingSocket: true,
          isGuest: true
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

  const userMMR = user ? (user.mmr[selectedLang] || 1000) : 1000;

  return (
    <div className="h-full w-full flex flex-col overflow-hidden p-4 sm:p-6">
      <h1 className="text-3xl sm:text-4xl font-bold text-text-primary mb-4 sm:mb-6 flex-shrink-0" style={{ fontFamily: 'Inter', letterSpacing: '-0.02em' }}>
        Matchmaking
      </h1>

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
              className="px-4 py-2 bg-accent-primary hover:bg-accent-hover text-bg-primary font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
              className="px-4 py-2 bg-accent-primary hover:bg-accent-hover text-bg-primary font-semibold rounded-lg transition-colors"
            >
              I Understand, Continue
            </button>
          </div>
        </div>
      </Modal>

      <div className="flex-1 min-h-0 overflow-y-auto">
      <div className="space-y-6">
        {/* Language Selector */}
        <div className="bg-bg-secondary/40 backdrop-blur-sm rounded-lg p-6">
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
          {user && (
            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="text-text-secondary">Your ELO:</span>
              <span className="text-text-primary font-bold" style={{ fontFamily: 'JetBrains Mono' }}>
                {userMMR}
              </span>
            </div>
          )}
          {!user && (
            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="text-text-secondary">Guest ELO:</span>
              <span className="text-text-primary font-bold" style={{ fontFamily: 'JetBrains Mono' }}>
                1000
              </span>
            </div>
          )}
        </div>

        {/* Queue Status */}
        {isInQueue ? (
          <div className="bg-bg-secondary/40 backdrop-blur-sm rounded-lg p-8 text-center battle-glow">
            <div className="mb-6">
              <div className="inline-flex items-center gap-3 px-4 py-2 bg-bg-primary/40 backdrop-blur-sm rounded-full mb-4">
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
                Find an opponent with similar skill level {user ? `(MMR: ${userMMR})` : '(MMR: 1000)'}
              </p>
              <p className="text-text-secondary/70 text-sm">
                Matchmaking will find you an opponent within ±200 MMR range
              </p>
              {!user && (
                <p className="text-text-error/80 text-xs mt-2">
                  ⚠️ Guest mode: Your progress will not be saved
                </p>
              )}
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
      </div>
    </div>
  )
}
