import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { io } from 'socket.io-client'
import { languages } from '../data/languages'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function Competitions() {
  const [competitions, setCompetitions] = useState([]);
  const [selectedLang, setSelectedLang] = useState('en');
  const [user, setUser] = useState(null);
  const socketRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCurrentUser();
    connectSocket();
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
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

  const connectSocket = () => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    socketRef.current = io(apiUrl);

    socketRef.current.on('competitions-list', (data) => {
      setCompetitions(data);
    });

    socketRef.current.emit('get-competitions');
    
    // Rafraîchir la liste toutes les 3 secondes
    const interval = setInterval(() => {
      if (socketRef.current) {
        socketRef.current.emit('get-competitions');
      }
    }, 3000);

    return () => clearInterval(interval);
  };

  const handleCreateCompetition = () => {
    if (!user) {
      alert('Please login to create a competition');
      return;
    }

    if (socketRef.current) {
      socketRef.current.emit('create-competition', {
        language: selectedLang,
        maxPlayers: 50,
        userId: user.id,
        username: user.username
      });

      socketRef.current.once('competition-created', (data) => {
        navigate(`/competition/${data.competitionId}`, {
          state: {
            username: user.username,
            userId: user.id,
            isCreator: true
          }
        });
      });
    }
  };

  const handleJoinCompetition = (competitionId) => {
    if (!user) {
      alert('Please login to join a competition');
      return;
    }

    navigate(`/competition/${competitionId}`, {
      state: {
        username: user.username,
        userId: user.id,
        isCreator: false
      }
    });
  };

  return (
    <div className="page-container p-8">
      <h1 className="text-4xl font-bold text-text-primary mb-8" style={{ fontFamily: 'Inter', letterSpacing: '-0.02em' }}>
        Competitions
      </h1>

      {!user && (
        <div className="bg-bg-secondary rounded-lg border border-text-secondary/10 p-8 text-center shadow-lg mb-6">
          <p className="text-text-secondary text-lg mb-4">Please login to participate in competitions</p>
          <button
            onClick={() => navigate('/')}
            className="bg-accent-primary hover:bg-accent-hover text-bg-primary font-semibold py-2 px-6 rounded-lg transition-colors"
          >
            Go to Login
          </button>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        {/* Create Competition */}
        {user && (
          <div className="bg-bg-secondary rounded-lg border border-text-secondary/10 p-6 shadow-lg">
            <h2 className="text-xl font-bold text-text-primary mb-4">Create Competition</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-text-primary mb-2 text-sm font-medium">Language</label>
                <select
                  value={selectedLang}
                  onChange={(e) => setSelectedLang(e.target.value)}
                  className="w-full p-3 bg-bg-primary border border-text-secondary/20 rounded-lg text-text-primary focus:outline-none focus:border-accent-primary transition-colors font-medium"
                >
                  {Object.entries(languages).map(([code, lang]) => (
                    <option key={code} value={code} className="bg-bg-primary">
                      {lang.name}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleCreateCompetition}
                className="w-full bg-gradient-to-r from-accent-primary to-accent-hover hover:from-accent-hover hover:to-accent-primary text-bg-primary font-semibold py-3 px-6 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                Create Competition
              </button>
            </div>
          </div>
        )}

        {/* Available Competitions */}
        <div className={`${user ? 'md:col-span-2' : 'md:col-span-3'}`}>
          <h2 className="text-xl font-bold text-text-primary mb-4">Available Competitions</h2>
          {competitions.length === 0 ? (
            <div className="bg-bg-secondary rounded-lg border border-text-secondary/10 p-12 text-center shadow-lg">
              <p className="text-text-secondary">No competitions available at the moment</p>
              <p className="text-text-secondary/70 text-sm mt-2">Create one to get started!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {competitions.map((comp) => (
                <div
                  key={comp.id}
                  className="bg-bg-secondary rounded-lg border border-text-secondary/10 p-4 hover:border-accent-primary/30 transition-colors shadow-lg"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-text-primary font-semibold">#{comp.id}</span>
                        <span className="text-text-secondary text-sm">
                          {languages[comp.language]?.name || comp.language.toUpperCase()}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          comp.status === 'waiting'
                            ? 'bg-accent-primary/20 text-accent-primary'
                            : 'bg-text-secondary/20 text-text-secondary'
                        }`}>
                          {comp.status === 'waiting' ? 'Waiting' : 'Starting'}
                        </span>
                      </div>
                      <div className="text-text-secondary text-sm">
                        {comp.playerCount} / {comp.maxPlayers} players
                      </div>
                    </div>
                    {user && (
                      <button
                        onClick={() => handleJoinCompetition(comp.id)}
                        disabled={comp.playerCount >= comp.maxPlayers}
                        className="bg-accent-primary hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-bg-primary font-semibold py-2 px-6 rounded-lg transition-colors"
                      >
                        Join
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
