import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { io } from 'socket.io-client'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function Friends() {
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState({ sent: [], received: [] });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('friends'); // 'friends' | 'requests' | 'search'
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();
  const socketRef = useRef(null);

  useEffect(() => {
    fetchCurrentUser();
    
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
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
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const response = await fetch(`${API_URL}/api/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const userData = await response.json();
        setCurrentUser(userData);
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  const connectSocket = () => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    socketRef.current = io(apiUrl);
    
    // Enregistrer l'utilisateur comme en ligne
    if (currentUser) {
      socketRef.current.emit('register-user', { userId: currentUser.id });
    }
    
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
  };

  const fetchFriends = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const response = await fetch(`${API_URL}/api/friends`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setFriends(data.friends || []);
      }
    } catch (error) {
      console.error('Error fetching friends:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFriendRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const response = await fetch(`${API_URL}/api/friends/requests`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setFriendRequests({ sent: data.sent || [], received: data.received || [] });
      }
    } catch (error) {
      console.error('Error fetching friend requests:', error);
    }
  };

  const searchUsers = async (query) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const response = await fetch(`${API_URL}/api/friends/search?q=${encodeURIComponent(query)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.users || []);
      }
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  const handleSendRequest = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const response = await fetch(`${API_URL}/api/friends/request/${userId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        fetchFriendRequests();
        searchUsers(searchQuery);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to send friend request');
      }
    } catch (error) {
      console.error('Error sending friend request:', error);
      alert('Failed to send friend request');
    }
  };

  const handleAcceptRequest = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const response = await fetch(`${API_URL}/api/friends/accept/${userId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        fetchFriends();
        fetchFriendRequests();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to accept friend request');
      }
    } catch (error) {
      console.error('Error accepting friend request:', error);
      alert('Failed to accept friend request');
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
      console.error('Error removing friend request:', error);
    }
  };

  const handleRemoveFriend = async (userId) => {
    if (!confirm('Remove this friend?')) return;
    
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const response = await fetch(`${API_URL}/api/friends/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        fetchFriends();
      }
    } catch (error) {
      console.error('Error removing friend:', error);
    }
  };

  const handleInviteToBattle = (friendId, friendUsername) => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please login to invite friends');
      return;
    }

    if (!socketRef.current || !socketRef.current.connected) {
      // Réconnecter le socket si nécessaire
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      socketRef.current = io(apiUrl);
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
    <div className="page-container p-6 md:p-8">
      <h1 className="text-4xl font-bold text-text-primary mb-8" style={{ fontFamily: 'Inter', letterSpacing: '-0.02em' }}>
        Friends
      </h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-border-secondary">
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
            <span className="ml-2 bg-accent-primary text-bg-primary text-xs font-bold px-2 py-0.5 rounded-full">
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
        <div className="mb-6">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by username..."
            className="w-full p-4 bg-bg-secondary border border-border-secondary rounded-lg text-text-primary focus:outline-none focus:border-accent-primary text-lg"
          />
        </div>
      )}

      {/* Friends List */}
      {activeTab === 'friends' && (
        <div className="bg-bg-secondary rounded-xl border border-border-secondary p-6 shadow-lg">
          {friends.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-text-secondary text-lg mb-4">No friends yet</p>
              <button
                onClick={() => setActiveTab('search')}
                className="bg-accent-primary hover:bg-accent-hover text-bg-primary font-semibold py-2 px-6 rounded-lg transition-colors"
              >
                Add Friends
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {friends.map((friend) => (
                <div
                  key={friend.id}
                  className="bg-bg-primary rounded-lg p-4 border border-border-secondary hover:border-accent-primary/30 transition-all flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    {friend.avatar ? (
                      <img
                        src={friend.avatar}
                        alt={friend.username}
                        className="w-12 h-12 rounded-full object-cover border-2 border-border-secondary"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-accent-primary/20 flex items-center justify-center text-accent-primary font-bold text-lg border-2 border-border-secondary">
                        {friend.username[0].toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="text-text-primary font-semibold">{friend.username}</div>
                      <div className="text-text-secondary text-sm">
                        ELO: <span className="font-mono">{friend.mmr?.en || 1000}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleInviteToBattle(friend.id, friend.username)}
                      className="bg-accent-primary hover:bg-accent-hover text-bg-primary font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
                    >
                      Challenge
                    </button>
                    <button
                      onClick={() => handleRemoveFriend(friend.id)}
                      className="bg-bg-secondary hover:bg-bg-tertiary text-text-secondary hover:text-text-primary font-medium py-2 px-4 rounded-lg transition-colors text-sm border border-border-secondary"
                    >
                      Remove
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
            <div className="bg-bg-secondary rounded-xl border border-border-secondary p-6 shadow-lg">
              <h2 className="text-xl font-bold text-text-primary mb-4">Received Requests</h2>
              <div className="space-y-3">
                {friendRequests.received.map((request) => (
                  <div
                    key={request.id}
                    className="bg-bg-primary rounded-lg p-4 border border-border-secondary hover:border-accent-primary/30 transition-all flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      {request.avatar ? (
                        <img
                          src={request.avatar}
                          alt={request.username}
                          className="w-12 h-12 rounded-full object-cover border-2 border-border-secondary"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-accent-primary/20 flex items-center justify-center text-accent-primary font-bold text-lg border-2 border-border-secondary">
                          {request.username[0].toUpperCase()}
                        </div>
                      )}
                      <div className="text-text-primary font-semibold">{request.username}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleAcceptRequest(request.id)}
                        className="bg-accent-primary hover:bg-accent-hover text-bg-primary font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleRemoveRequest(request.id)}
                        className="bg-bg-secondary hover:bg-bg-tertiary text-text-secondary hover:text-text-primary font-medium py-2 px-4 rounded-lg transition-colors text-sm border border-border-secondary"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sent Requests */}
          {friendRequests.sent.length > 0 && (
            <div className="bg-bg-secondary rounded-xl border border-border-secondary p-6 shadow-lg">
              <h2 className="text-xl font-bold text-text-primary mb-4">Sent Requests</h2>
              <div className="space-y-3">
                {friendRequests.sent.map((request) => (
                  <div
                    key={request.id}
                    className="bg-bg-primary rounded-lg p-4 border border-border-secondary hover:border-accent-primary/30 transition-all flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      {request.avatar ? (
                        <img
                          src={request.avatar}
                          alt={request.username}
                          className="w-12 h-12 rounded-full object-cover border-2 border-border-secondary"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-accent-primary/20 flex items-center justify-center text-accent-primary font-bold text-lg border-2 border-border-secondary">
                          {request.username[0].toUpperCase()}
                        </div>
                      )}
                      <div className="text-text-primary font-semibold">{request.username}</div>
                    </div>
                    <button
                      onClick={() => handleRemoveRequest(request.id)}
                      className="bg-bg-secondary hover:bg-bg-tertiary text-text-secondary hover:text-text-primary font-medium py-2 px-4 rounded-lg transition-colors text-sm border border-border-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {friendRequests.received.length === 0 && friendRequests.sent.length === 0 && (
            <div className="bg-bg-secondary rounded-xl border border-border-secondary p-12 text-center shadow-lg">
              <p className="text-text-secondary">No friend requests</p>
            </div>
          )}
        </div>
      )}

      {/* Search Results */}
      {activeTab === 'search' && (
        <div className="bg-bg-secondary rounded-xl border border-border-secondary p-6 shadow-lg">
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
                  className="bg-bg-primary rounded-lg p-4 border border-border-secondary hover:border-accent-primary/30 transition-all flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.username}
                        className="w-12 h-12 rounded-full object-cover border-2 border-border-secondary"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-accent-primary/20 flex items-center justify-center text-accent-primary font-bold text-lg border-2 border-border-secondary">
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
                        className="bg-bg-secondary hover:bg-bg-tertiary text-text-secondary hover:text-text-primary font-medium py-2 px-4 rounded-lg transition-colors text-sm border border-border-secondary"
                      >
                        Cancel Request
                      </button>
                    ) : user.hasReceivedRequest ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAcceptRequest(user.id)}
                          className="bg-accent-primary hover:bg-accent-hover text-bg-primary font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleRemoveRequest(user.id)}
                          className="bg-bg-secondary hover:bg-bg-tertiary text-text-secondary hover:text-text-primary font-medium py-2 px-4 rounded-lg transition-colors text-sm border border-border-secondary"
                        >
                          Decline
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleSendRequest(user.id)}
                        className="bg-accent-primary hover:bg-accent-hover text-bg-primary font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
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
  )
}

