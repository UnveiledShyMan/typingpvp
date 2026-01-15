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
    <div className="h-full w-full flex flex-col overflow-hidden p-4 sm:p-6">
      <div className="ui-section mb-6">
        <h1 className="text-3xl sm:text-4xl font-bold text-text-primary mb-2 ui-title" style={{ fontFamily: 'Inter', letterSpacing: '-0.02em' }}>
          1v1 Rooms
        </h1>
        <p className="text-text-secondary text-sm ui-subtitle">
          Create a private room or join a friend instantly.
        </p>
      </div>

      <div className="flex-1 min-h-0">
        <div className="max-w-5xl mx-auto w-full">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-6">
              {/* Identité joueur - simple, clair, aligné avec la main page */}
              <div className="bg-bg-secondary/40 backdrop-blur-sm rounded-lg p-6 border border-border-secondary/40 ui-card ui-fade-up">
                <div className="text-text-secondary text-xs uppercase tracking-wider mb-2">Player</div>
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
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-text-secondary text-sm mb-1">Playing as</p>
                      <p className="text-text-primary font-semibold text-lg">{user.username}</p>
                    </div>
                    <div className="text-xs px-3 py-1 rounded-full bg-bg-primary/50 text-text-secondary">
                      Logged in
                    </div>
                  </div>
                )}
              </div>

              {/* Create Room */}
              <div className="bg-bg-primary/30 backdrop-blur-sm rounded-lg p-6 border border-border-secondary/30 ui-card ui-card-hover ui-fade-up">
                <h2 className="text-xl font-semibold text-text-primary mb-2">Create room</h2>
                <p className="text-text-secondary text-sm mb-4">
                  Share the room ID to start a private duel.
                </p>
                <button
                  onClick={handleCreateRoom}
                  className="btn-primary w-full ui-press"
                >
                  Create Room
                </button>
                {createdRoomId && (
                  <div className="mt-4 p-4 bg-bg-secondary/40 backdrop-blur-sm rounded-lg border border-border-secondary/30">
                    <p className="text-text-primary mb-2 text-sm">Room created</p>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={createdRoomId}
                        readOnly
                        className="flex-1 p-2 bg-bg-secondary/60 backdrop-blur-sm border border-border-secondary/40 rounded-lg text-text-primary font-mono text-sm"
                      />
                      <button
                        onClick={copyRoomId}
                        className="bg-accent-primary hover:bg-accent-hover text-accent-text px-4 py-2 rounded text-sm font-semibold transition-colors ui-press"
                      >
                        Copy
                      </button>
                    </div>
                    <p className="text-text-secondary text-xs mt-2">
                      Share this ID with your opponent.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              {/* Join Room */}
              <div className="bg-bg-primary/30 backdrop-blur-sm rounded-lg p-6 border border-border-secondary/30 ui-card ui-card-hover ui-fade-up">
                <h2 className="text-xl font-semibold text-text-primary mb-2">Join room</h2>
                <p className="text-text-secondary text-sm mb-4">
                  Paste a room ID and jump straight in.
                </p>
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
                    className="btn-primary w-full ui-press"
                  >
                    Join Room
                  </button>
                </div>
              </div>

              {/* Tips */}
              <div className="bg-bg-secondary/30 backdrop-blur-sm rounded-lg p-6 border border-border-secondary/30 ui-card ui-fade-up">
                <div className="text-text-secondary text-xs uppercase tracking-wider mb-2">Tips</div>
                <ul className="space-y-2 text-sm text-text-secondary">
                  <li>Use the same room ID for rematches.</li>
                  <li>Invite friends via chat or Discord.</li>
                  <li>Want ranked? Use matchmaking.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
