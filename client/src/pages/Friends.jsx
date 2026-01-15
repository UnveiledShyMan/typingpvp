import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { getSocket, cleanupSocket } from '../services/socketService'
import { useToastContext } from '../contexts/ToastContext'
import { friendsService, authService } from '../services/apiService'
import { useDebounce } from '../hooks/useDebounce'
import { FriendsListSkeleton } from '../components/SkeletonLoader'
import logger from '../utils/logger'
import { API_URL } from '../config/api.js'

export default function Friends() {
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState({ sent: [], received: [] });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('friends'); // 'friends' | 'requests' | 'search'
  const [currentUser, setCurrentUser] = useState(null);
  // Loading states pour les actions
  const [sendingRequest, setSendingRequest] = useState(new Set()); // Set d'IDs en cours d'envoi
  const [acceptingRequest, setAcceptingRequest] = useState(new Set()); // Set d'IDs en cours d'acceptation
  const [removingRequest, setRemovingRequest] = useState(new Set()); // Set d'IDs en cours de suppression
  const [removingFriend, setRemovingFriend] = useState(new Set()); // Set d'IDs en cours de suppression
  const navigate = useNavigate();
  const socketRef = useRef(null);
  const { toast } = useToastContext();
  
  // Debounce la recherche pour éviter trop d'appels API
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  useEffect(() => {
    fetchCurrentUser();
    
    return () => {
      if (socketRef.current) {
        // Nettoyer les listeners spécifiques à Friends, mais ne pas déconnecter le socket
        // car il peut être utilisé par d'autres composants
        cleanupSocket(socketRef.current, [
          'user-online', 
          'user-offline', 
          'register-user',
          'friend-request-received',
          'friend-request-accepted',
          'friend-request-rejected'
        ]);
      }
    };
  }, []);
  
  useEffect(() => {
    if (currentUser) {
      fetchFriends();
      fetchFriendRequests();
      connectSocket();
    }
  }, [currentUser]);

  const fetchCurrentUser = async () => {
    try {
      const userData = await authService.getCurrentUser();
      setCurrentUser(userData);
    } catch (error) {
      // Erreur gérée par apiService
    }
  };

  const connectSocket = () => {
    // Utiliser le service centralisé de socket qui gère correctement l'URL
    socketRef.current = getSocket(false);
    
    // Enregistrer l'utilisateur comme en ligne
    if (currentUser && socketRef.current) {
      socketRef.current.emit('register-user', { userId: currentUser.id });
    }
    
    // Nettoyer les anciens listeners pour éviter les doublons
    if (socketRef.current) {
      socketRef.current.off('user-online');
      socketRef.current.off('user-offline');
      
      // Écouter les changements de statut en ligne des amis
      socketRef.current.on('user-online', ({ userId }) => {
        setFriends(prevFriends => 
          prevFriends.map(friend => 
            friend.id === userId ? { ...friend, isOnline: true } : friend
          )
        );
      });
      
      socketRef.current.on('user-offline', ({ userId }) => {
        setFriends(prevFriends => 
          prevFriends.map(friend => 
            friend.id === userId ? { ...friend, isOnline: false } : friend
          )
        );
      });
    }
  };

  const fetchFriends = async () => {
    try {
      const data = await friendsService.getFriends();
      setFriends(data.friends || []);
    } catch (error) {
      // Erreur gérée par apiService
    } finally {
      setLoading(false);
    }
  };

  const fetchFriendRequests = async () => {
    try {
      const data = await friendsService.getFriendRequests();
      setFriendRequests({ sent: data.sent || [], received: data.received || [] });
    } catch (error) {
      // Erreur gérée par apiService
    }
  };

  // Recherche avec debounce - déclenchée automatiquement quand debouncedSearchQuery change
  useEffect(() => {
    const performSearch = async () => {
      if (debouncedSearchQuery.length < 2) {
        setSearchResults([]);
        return;
      }
      
      setSearchLoading(true);
      try {
        const data = await friendsService.searchUsers(debouncedSearchQuery);
        setSearchResults(data.users || []);
      } catch (error) {
        // Erreur gérée par apiService
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    };

    performSearch();
  }, [debouncedSearchQuery]);

  const handleSendRequest = async (userId) => {
    if (sendingRequest.has(userId)) return; // Éviter les doubles clics
    
    setSendingRequest(prev => new Set(prev).add(userId));
    try {
      await friendsService.sendFriendRequest(userId);
      fetchFriendRequests();
      // Refaire la recherche pour mettre à jour les résultats
      if (debouncedSearchQuery.length >= 2) {
        const data = await friendsService.searchUsers(debouncedSearchQuery);
        setSearchResults(data.users || []);
      }
      toast.success('Demande d\'ami envoyée !');
    } catch (error) {
      // Erreur gérée par apiService
    } finally {
      setSendingRequest(prev => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    }
  };

  const handleAcceptRequest = async (userId) => {
    if (acceptingRequest.has(userId)) return; // Éviter les doubles clics
    
    setAcceptingRequest(prev => new Set(prev).add(userId));
    try {
      await friendsService.acceptFriendRequest(userId);
      fetchFriends();
      fetchFriendRequests();
      toast.success('Demande d\'ami acceptée !');
    } catch (error) {
      // Erreur gérée par apiService
    } finally {
      setAcceptingRequest(prev => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    }
  };

  const handleRemoveRequest = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const response = await fetch(`${API_URL}/api/friends/request/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        fetchFriendRequests();
        searchUsers(searchQuery);
      }
    } catch (error) {
      logger.error('Error removing friend request:', error);
    }
  };

  const handleRemoveFriend = async (userId) => {
    if (!confirm('Remove this friend?')) return;
    if (removingFriend.has(userId)) return; // Éviter les doubles clics
    
    setRemovingFriend(prev => new Set(prev).add(userId));
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const response = await fetch(`${API_URL}/api/friends/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        fetchFriends();
        toast.success('Ami retiré de votre liste');
      }
    } catch (error) {
      logger.error('Error removing friend:', error);
    } finally {
      setRemovingFriend(prev => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    }
  };

  const handleInviteToBattle = (friendId, friendUsername) => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.warning('Please login to invite friends');
      return;
    }

    if (!socketRef.current || !socketRef.current.connected) {
      // Réconnecter le socket si nécessaire
      // Utiliser le service centralisé de socket
      socketRef.current = getSocket(false);
    }

    // Créer une room
    socketRef.current.emit('create-room', {});
    
    socketRef.current.once('room-created', (data) => {
      const roomId = data.roomId;
      
      // Pour l'instant, on navigue directement vers la room
      // L'utilisateur pourra partager le roomId avec son ami
      // TODO: Implémenter un système de notifications Socket.io pour envoyer l'invitation automatiquement
      navigate(`/battle/${roomId}`, {
        state: {
          playerName: currentUser?.username || 'You',
          isCreator: true,
          friendId: friendId,
          friendUsername: friendUsername,
          roomId: roomId
        }
      });
    });
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (activeTab === 'search') {
        searchUsers(searchQuery);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, activeTab]);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="text-text-secondary">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col overflow-hidden p-4 sm:p-6">
      <h1 className="text-3xl sm:text-4xl font-bold text-text-primary mb-4 sm:mb-6 flex-shrink-0 ui-section ui-title" style={{ fontFamily: 'Inter', letterSpacing: '-0.02em' }}>
        Friends
      </h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 sm:mb-6 flex-shrink-0 ui-section">
        <button
          onClick={() => setActiveTab('friends')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'friends'
              ? 'text-accent-primary border-b-2 border-accent-primary'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          Friends ({friends.length})
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`px-4 py-2 font-medium transition-colors relative ${
            activeTab === 'requests'
              ? 'text-accent-primary border-b-2 border-accent-primary'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          Requests
          {friendRequests.received.length > 0 && (
            <span className="ml-2 bg-accent-primary text-accent-text text-xs font-bold px-2 py-0.5 rounded-full">
              {friendRequests.received.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('search')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'search'
              ? 'text-accent-primary border-b-2 border-accent-primary'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          Add Friends
        </button>
      </div>

      {/* Search */}
      {activeTab === 'search' && (
        <div className="mb-4 sm:mb-6 flex-shrink-0 relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by username..."
            className="input-modern text-lg pr-10"
          />
          {searchLoading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-5 h-5 border-2 border-text-secondary border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>
      )}

      {/* Contenu scrollable */}
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-on-hover content-visibility-auto">
      {/* Friends List */}
      {activeTab === 'friends' && (
        <div className="bg-bg-secondary/40 backdrop-blur-sm rounded-lg p-4 sm:p-6 ui-card ui-fade-up">
          {loading ? (
            <FriendsListSkeleton count={5} />
          ) : friends.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-text-secondary text-lg mb-4">No friends yet</p>
              <button
                onClick={() => setActiveTab('search')}
                className="bg-accent-primary hover:bg-accent-hover text-accent-text font-semibold py-2 px-6 rounded-lg transition-colors"
              >
                Add Friends
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {friends.map((friend) => (
                <div
                  key={friend.id}
                  className="bg-bg-primary/30 backdrop-blur-sm rounded-lg p-4 hover:bg-bg-primary/50 transition-all flex items-center justify-between ui-card-hover"
                >
                  <div className="flex items-center gap-4">
                    {friend.avatar ? (
                      <img
                        src={friend.avatar}
                        alt={friend.username}
                        className="w-12 h-12 rounded-full object-cover object-center"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-accent-primary/20 flex items-center justify-center text-accent-primary font-bold text-lg">
                        {friend.username[0].toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="text-text-primary font-semibold">{friend.username}</div>
                        <span
                          className={`w-2 h-2 rounded-full ${friend.isOnline ? 'bg-accent-secondary' : 'bg-text-muted'}`}
                          title={friend.isOnline ? 'Online' : 'Offline'}
                        ></span>
                      </div>
                      <div className="text-text-secondary text-sm">
                        ELO: <span className="font-mono">{friend.mmr?.en || 1000}</span>
                        {friend.isOnline !== undefined && (
                          <span className={`ml-2 text-xs ${friend.isOnline ? 'text-accent-secondary' : 'text-text-muted'}`}>
                            {friend.isOnline ? 'Online' : 'Offline'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleInviteToBattle(friend.id, friend.username)}
                      className="bg-accent-primary hover:bg-accent-hover text-accent-text font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
                    >
                      Challenge
                    </button>
                    <button
                      onClick={() => handleRemoveFriend(friend.id)}
                      disabled={removingFriend.has(friend.id)}
                      className="bg-bg-secondary/40 hover:bg-bg-secondary/60 text-text-secondary hover:text-text-primary font-medium py-2 px-4 rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {removingFriend.has(friend.id) ? (
                        <>
                          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Removing...</span>
                        </>
                      ) : (
                        'Remove'
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Friend Requests */}
      {activeTab === 'requests' && (
        <div className="space-y-6">
          {/* Received Requests */}
          {friendRequests.received.length > 0 && (
            <div className="bg-bg-secondary/40 backdrop-blur-sm rounded-lg p-6 ui-card ui-fade-up">
              <h2 className="text-xl font-bold text-text-primary mb-4">Received Requests</h2>
              <div className="space-y-3">
                {friendRequests.received.map((request) => (
                  <div
                    key={request.id}
                    className="bg-bg-primary/30 backdrop-blur-sm rounded-lg p-4 hover:bg-bg-primary/50 transition-all flex items-center justify-between ui-card-hover"
                  >
                    <div className="flex items-center gap-4">
                      {request.avatar ? (
                        <img
                          src={request.avatar}
                          alt={request.username}
                          className="w-12 h-12 rounded-full object-cover object-center"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-accent-primary/20 flex items-center justify-center text-accent-primary font-bold text-lg">
                          {request.username[0].toUpperCase()}
                        </div>
                      )}
                      <div className="text-text-primary font-semibold">{request.username}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleAcceptRequest(request.id)}
                        disabled={acceptingRequest.has(request.id) || removingRequest.has(request.id)}
                        className="bg-accent-primary hover:bg-accent-hover text-accent-text font-semibold py-2 px-4 rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {acceptingRequest.has(request.id) ? (
                          <>
                            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Accepting...</span>
                          </>
                        ) : (
                          'Accept'
                        )}
                      </button>
                      <button
                        onClick={() => handleRemoveRequest(request.id)}
                        disabled={acceptingRequest.has(request.id) || removingRequest.has(request.id)}
                        className="bg-bg-secondary/40 hover:bg-bg-secondary/60 text-text-secondary hover:text-text-primary font-medium py-2 px-4 rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {removingRequest.has(request.id) ? 'Declining...' : 'Decline'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sent Requests */}
          {friendRequests.sent.length > 0 && (
            <div className="bg-bg-secondary/40 backdrop-blur-sm rounded-lg p-6 ui-card ui-fade-up">
              <h2 className="text-xl font-bold text-text-primary mb-4">Sent Requests</h2>
              <div className="space-y-3">
                {friendRequests.sent.map((request) => (
                  <div
                    key={request.id}
                    className="bg-bg-primary/30 backdrop-blur-sm rounded-lg p-4 hover:bg-bg-primary/50 transition-all flex items-center justify-between ui-card-hover"
                  >
                    <div className="flex items-center gap-4">
                      {request.avatar ? (
                        <img
                          src={request.avatar}
                          alt={request.username}
                          className="w-12 h-12 rounded-full object-cover object-center"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-accent-primary/20 flex items-center justify-center text-accent-primary font-bold text-lg">
                          {request.username[0].toUpperCase()}
                        </div>
                      )}
                      <div className="text-text-primary font-semibold">{request.username}</div>
                    </div>
                    <button
                      onClick={() => handleRemoveRequest(request.id)}
                      className="bg-bg-secondary/40 hover:bg-bg-secondary/60 text-text-secondary hover:text-text-primary font-medium py-2 px-4 rounded-lg transition-colors text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {friendRequests.received.length === 0 && friendRequests.sent.length === 0 && (
            <div className="bg-bg-secondary/40 backdrop-blur-sm rounded-lg p-12 text-center ui-card ui-fade-up">
              <p className="text-text-secondary">No friend requests</p>
            </div>
          )}
        </div>
      )}

      {/* Search Results */}
      {activeTab === 'search' && (
        <div className="bg-bg-secondary/40 backdrop-blur-sm rounded-lg p-6 ui-card ui-fade-up">
          {searchQuery.length < 2 ? (
            <div className="text-center py-12">
              <p className="text-text-secondary">Start typing to search for users...</p>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-text-secondary">No users found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {searchResults.map((user) => (
                <div
                  key={user.id}
                  className="bg-bg-primary/30 backdrop-blur-sm rounded-lg p-4 hover:bg-bg-primary/50 transition-all flex items-center justify-between ui-card-hover"
                >
                  <div className="flex items-center gap-4">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.username}
                        className="w-12 h-12 rounded-full object-cover object-center"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-accent-primary/20 flex items-center justify-center text-accent-primary font-bold text-lg">
                        {user.username[0].toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="text-text-primary font-semibold">{user.username}</div>
                        {user.isOnline && (
                          <span className="w-2 h-2 bg-accent-secondary rounded-full animate-pulse" title="En ligne"></span>
                        )}
                      </div>
                      <div className="text-text-secondary text-sm">
                        ELO: <span className="font-mono">{user.mmr?.en || 1000}</span>
                        {user.isOnline !== undefined && (
                          <span className={`ml-2 text-xs ${user.isOnline ? 'text-accent-secondary' : 'text-text-muted'}`}>
                            {user.isOnline ? 'En ligne' : 'Hors ligne'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div>
                    {user.isFriend ? (
                      <span className="text-text-secondary text-sm">Friends</span>
                    ) : user.hasSentRequest ? (
                      <button
                        onClick={() => handleRemoveRequest(user.id)}
                        className="bg-bg-secondary/40 hover:bg-bg-secondary/60 text-text-secondary hover:text-text-primary font-medium py-2 px-4 rounded-lg transition-colors text-sm"
                      >
                        Cancel Request
                      </button>
                    ) : user.hasReceivedRequest ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAcceptRequest(user.id)}
                          className="bg-accent-primary hover:bg-accent-hover text-accent-text font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleRemoveRequest(user.id)}
                          className="bg-bg-secondary/40 hover:bg-bg-secondary/60 text-text-secondary hover:text-text-primary font-medium py-2 px-4 rounded-lg transition-colors text-sm"
                        >
                          Decline
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleSendRequest(user.id)}
                        className="bg-accent-primary hover:bg-accent-hover text-accent-text font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
                      >
                        Add Friend
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      </div>
    </div>
  )
}

