import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { io } from 'socket.io-client'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function Battle() {
  const [roomId, setRoomId] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [createdRoomId, setCreatedRoomId] = useState('');
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const socketRef = useRef(null);

  useEffect(() => {
    fetchCurrentUser();
    
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    socketRef.current = io(apiUrl);
    const socket = socketRef.current;

    socket.on('room-created', (data) => {
      setCreatedRoomId(data.roomId);
    });

    socket.on('error', (error) => {
      alert(error.message);
    });

    return () => {
      socket.off('room-created');
      socket.off('error');
      socket.disconnect();
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
        setPlayerName(userData.username);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };

  const handleCreateRoom = () => {
    const name = user ? user.username : playerName;
    if (!name.trim()) {
      alert('Enter a name');
      return;
    }
    if (socketRef.current) {
      socketRef.current.emit('create-room');
    }
  };

  const handleJoinRoom = () => {
    const name = user ? user.username : playerName;
    if (!name.trim()) {
      alert('Enter a name');
      return;
    }
    if (!roomId.trim()) {
      alert('Enter a room ID');
      return;
    }
    navigate(`/battle/${roomId}`, {
      state: {
        playerName: name,
        isCreator: false
      }
    });
  };

  useEffect(() => {
    if (createdRoomId) {
      const name = user ? user.username : playerName;
      navigate(`/battle/${createdRoomId}`, {
        state: {
          playerName: name,
          isCreator: true
        }
      });
    }
  }, [createdRoomId, playerName, user, navigate]);

  const copyRoomId = () => {
    if (createdRoomId) {
      navigator.clipboard.writeText(createdRoomId);
      alert('Room ID copied!');
    }
  };

  return (
    <div className="page-container p-8">
        <div className="bg-bg-secondary rounded-lg p-10 border border-text-secondary/10 shadow-lg">
          <h1 className="text-4xl font-bold text-text-primary mb-10 text-center" style={{ fontFamily: 'Inter', letterSpacing: '-0.02em' }}>1v1</h1>

          <div className="space-y-6">
            {!user && (
              <div>
                <label className="block text-text-primary mb-2 text-sm">Your name</label>
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  className="w-full p-3 bg-bg-primary border border-text-secondary/20 rounded text-text-primary focus:outline-none focus:border-accent-primary"
                  placeholder="Enter your name"
                />
              </div>
            )}
            {user && (
              <div className="p-4 bg-bg-primary rounded border border-text-secondary/20">
                <p className="text-text-secondary text-sm mb-1">Playing as</p>
                <p className="text-text-primary font-semibold">{user.username}</p>
              </div>
            )}

            <div className="border-t border-text-secondary/20 pt-6">
              <h2 className="text-xl font-semibold text-text-primary mb-4">Create room</h2>
              <button
                onClick={handleCreateRoom}
                className="w-full bg-accent-primary hover:bg-accent-hover text-bg-primary font-semibold py-3 px-6 rounded transition-colors"
              >
                create room
              </button>
              {createdRoomId && (
                <div className="mt-4 p-4 bg-bg-primary rounded border border-text-secondary/20">
                  <p className="text-text-primary mb-2 text-sm">Room created!</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={createdRoomId}
                      readOnly
                      className="flex-1 p-2 bg-bg-secondary border border-text-secondary/20 rounded text-text-primary font-mono text-sm"
                    />
                    <button
                      onClick={copyRoomId}
                      className="bg-accent-primary hover:bg-accent-hover text-bg-primary px-4 rounded text-sm font-semibold transition-colors"
                    >
                      copy
                    </button>
                  </div>
                  <p className="text-text-secondary text-xs mt-2">
                    Share this ID with your opponent
                  </p>
                </div>
              )}
            </div>

            <div className="border-t border-text-secondary/20 pt-6">
              <h2 className="text-xl font-semibold text-text-primary mb-4">Join room</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-text-primary mb-2 text-sm">Room ID</label>
                  <input
                    type="text"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                    className="w-full p-3 bg-bg-primary border border-text-secondary/20 rounded text-text-primary font-mono focus:outline-none focus:border-accent-primary uppercase"
                    placeholder="Enter room ID"
                  />
                </div>
                <button
                  onClick={handleJoinRoom}
                  className="w-full bg-accent-primary hover:bg-accent-hover text-bg-primary font-semibold py-3 px-6 rounded transition-colors"
                >
                  join
                </button>
              </div>
            </div>
          </div>
        </div>
    </div>
  )
}
