import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToastContext } from '../contexts/ToastContext'
import { useUser } from '../contexts/UserContext'
import { getSocket, cleanupSocket } from '../services/socketService'
import { normalizeSocketErrorMessage } from '../utils/normalizeSocketErrorMessage'

export default function Battle() {
  const [roomId, setRoomId] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [createdRoomId, setCreatedRoomId] = useState('');
  const navigate = useNavigate();
  const socketRef = useRef(null);
  const { toast } = useToastContext();
  const { user } = useUser(); // Utiliser UserContext au lieu de fetch manuel

  // Initialiser le nom du joueur avec le username de l'utilisateur connecté
  useEffect(() => {
    if (user) {
      setPlayerName(user.username);
    }
  }, [user]);

  useEffect(() => {
    // Utiliser le service centralisé de socket
    socketRef.current = getSocket(false);
    const socket = socketRef.current;

    // Écouter les événements de création de room
    socket.on('room-created', (data) => {
      console.log('✅ Room created:', data.roomId);
      setCreatedRoomId(data.roomId);
    });

    socket.on('error', (error) => {
      const message = normalizeSocketErrorMessage(error, 'An error occurred');
      console.error('❌ Socket error in Battle:', error);
      toast.error(message);
    });

    // Nettoyage: retirer seulement les listeners spécifiques à ce composant
    return () => {
      if (socket) {
        cleanupSocket(socket, ['room-created', 'error']);
      }
    };
  }, [toast]);

  const handleCreateRoom = () => {
    const name = user ? user.username : playerName;
    if (!name.trim()) {
      toast.warning('Please enter a name');
      return;
    }
    if (socketRef.current) {
      socketRef.current.emit('create-room');
    }
  };

  const handleJoinRoom = () => {
    const name = user ? user.username : playerName;
    if (!name.trim()) {
      toast.warning('Please enter a name');
      return;
    }
    if (!roomId.trim()) {
      toast.warning('Please enter a room ID');
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
      toast.success('Room ID copied to clipboard!');
    }
  };

  return (
    <div className="h-full w-full flex items-center justify-center overflow-hidden">
      <div className="w-full max-w-2xl mx-auto">
        <div className="bg-bg-secondary/40 backdrop-blur-sm rounded-lg p-6 sm:p-8 lg:p-10">
          <div className="mb-6 text-center">
            <h1 className="text-3xl sm:text-4xl font-bold text-text-primary mb-2" style={{ fontFamily: 'Inter', letterSpacing: '-0.02em' }}>1v1 Battle</h1>
            <p className="text-text-secondary/70 text-xs sm:text-sm">Challenge a friend or join a room</p>
          </div>

          <div className="space-y-4 sm:space-y-6">
            {!user && (
              <div>
                <label className="block text-text-primary mb-2 text-sm">Your name</label>
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  className="input-modern"
                  placeholder="Enter your name"
                />
              </div>
            )}
            {user && (
              <div className="p-4 bg-bg-primary/30 backdrop-blur-sm rounded-lg">
                <p className="text-text-secondary text-sm mb-1">Playing as</p>
                <p className="text-text-primary font-semibold text-lg">{user.username}</p>
              </div>
            )}

            <div className="pt-6 mt-6 border-t border-text-secondary/5">
              <h2 className="text-xl font-semibold text-text-primary mb-4">Create room</h2>
              <button
                onClick={handleCreateRoom}
                className="btn-primary w-full"
              >
                Create Room
              </button>
              {createdRoomId && (
                <div className="mt-4 p-4 bg-bg-primary/30 backdrop-blur-sm rounded-lg">
                  <p className="text-text-primary mb-2 text-sm">Room created!</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={createdRoomId}
                      readOnly
                      className="flex-1 p-2 bg-bg-secondary/40 backdrop-blur-sm border-none rounded-lg text-text-primary font-mono text-sm"
                    />
                    <button
                      onClick={copyRoomId}
                      className="bg-accent-primary hover:bg-accent-hover text-accent-text px-4 rounded text-sm font-semibold transition-colors"
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

            <div className="pt-6 mt-6 border-t border-text-secondary/5">
              <h2 className="text-xl font-semibold text-text-primary mb-4">Join room</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-text-primary mb-2 text-sm">Room ID</label>
                  <input
                    type="text"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                    className="input-modern font-mono uppercase"
                    placeholder="Enter room ID"
                  />
                </div>
                <button
                  onClick={handleJoinRoom}
                  className="btn-primary w-full"
                >
                  Join Room
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
