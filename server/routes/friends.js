import express from 'express';
import { getUserById, getAllUsers, updateUser } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Référence à onlineUsers sera injectée depuis index.js
let onlineUsersRef = null;
export function setOnlineUsers(onlineUsers) {
  onlineUsersRef = onlineUsers;
}

function isUserOnline(userId) {
  if (!onlineUsersRef) return false;
  return onlineUsersRef.has(userId) && onlineUsersRef.get(userId).size > 0;
}

// Obtenir la liste d'amis
router.get('/', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    
    if (!user.friends || user.friends.length === 0) {
      return res.json({ friends: [] });
    }
    
    const friendsPromises = user.friends.map(friendId => getUserById(friendId));
    const friends = await Promise.all(friendsPromises);
    
    const friendsList = friends
      .filter(friend => friend !== null && friend !== undefined)
      .map(friend => ({
        id: friend.id,
        username: friend.username,
        avatar: friend.avatar,
        mmr: friend.mmr,
        stats: friend.stats,
        isOnline: isUserOnline(friend.id)
      }));
    
    res.json({ friends: friendsList });
  } catch (error) {
    console.error('Error fetching friends:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Obtenir les demandes d'amis
router.get('/requests', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    
    const sentIds = user.friendRequests?.sent || [];
    const receivedIds = user.friendRequests?.received || [];
    
    const sentPromises = sentIds.map(userId => getUserById(userId));
    const receivedPromises = receivedIds.map(userId => getUserById(userId));
    
    const [sentUsers, receivedUsers] = await Promise.all([
      Promise.all(sentPromises),
      Promise.all(receivedPromises)
    ]);
    
    const sent = sentUsers
      .filter(u => u !== null && u !== undefined)
      .map(u => ({
        id: u.id,
        username: u.username,
        avatar: u.avatar
      }));
    
    const received = receivedUsers
      .filter(u => u !== null && u !== undefined)
      .map(u => ({
        id: u.id,
        username: u.username,
        avatar: u.avatar
      }));
    
    res.json({ sent, received });
  } catch (error) {
    console.error('Error fetching friend requests:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Envoyer une demande d'ami
router.post('/request/:userId', authenticateToken, async (req, res) => {
  try {
    const currentUser = req.user;
    const targetUserId = req.params.userId;
    
    if (currentUser.id === targetUserId) {
      return res.status(400).json({ error: 'Cannot send friend request to yourself' });
    }
    
    const targetUser = await getUserById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Vérifier si déjà amis
    if (currentUser.friends && currentUser.friends.includes(targetUserId)) {
      return res.status(400).json({ error: 'Already friends' });
    }
    
    // Vérifier si une demande existe déjà
    if (currentUser.friendRequests?.sent?.includes(targetUserId)) {
      return res.status(400).json({ error: 'Friend request already sent' });
    }
    
    // Initialiser les structures si elles n'existent pas
    if (!currentUser.friendRequests) {
      currentUser.friendRequests = { sent: [], received: [] };
    }
    if (!targetUser.friendRequests) {
      targetUser.friendRequests = { sent: [], received: [] };
    }
    if (!currentUser.friends) {
      currentUser.friends = [];
    }
    if (!targetUser.friends) {
      targetUser.friends = [];
    }
    
    // Ajouter la demande
    if (!currentUser.friendRequests.sent.includes(targetUserId)) {
      currentUser.friendRequests.sent.push(targetUserId);
    }
    if (!targetUser.friendRequests.received.includes(currentUser.id)) {
      targetUser.friendRequests.received.push(currentUser.id);
    }
    
    // Sauvegarder dans la base de données
    await updateUser(currentUser);
    await updateUser(targetUser);
    
    res.json({ message: 'Friend request sent', user: {
      id: targetUser.id,
      username: targetUser.username,
      avatar: targetUser.avatar
    }});
  } catch (error) {
    console.error('Error sending friend request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Accepter une demande d'ami
router.post('/accept/:userId', authenticateToken, async (req, res) => {
  try {
    const currentUser = req.user;
    const senderUserId = req.params.userId;
    
    const senderUser = await getUserById(senderUserId);
    if (!senderUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Vérifier si la demande existe
    if (!currentUser.friendRequests?.received?.includes(senderUserId)) {
      return res.status(400).json({ error: 'Friend request not found' });
    }
    
    // Initialiser les structures si nécessaire
    if (!currentUser.friends) {
      currentUser.friends = [];
    }
    if (!senderUser.friends) {
      senderUser.friends = [];
    }
    
    // Ajouter comme amis
    if (!currentUser.friends.includes(senderUserId)) {
      currentUser.friends.push(senderUserId);
    }
    if (!senderUser.friends.includes(currentUser.id)) {
      senderUser.friends.push(currentUser.id);
    }
    
    // Retirer des demandes
    if (currentUser.friendRequests) {
      currentUser.friendRequests.received = currentUser.friendRequests.received.filter(id => id !== senderUserId);
      currentUser.friendRequests.sent = currentUser.friendRequests.sent.filter(id => id !== senderUserId);
    }
    if (senderUser.friendRequests) {
      senderUser.friendRequests.sent = senderUser.friendRequests.sent.filter(id => id !== currentUser.id);
      senderUser.friendRequests.received = senderUser.friendRequests.received.filter(id => id !== currentUser.id);
    }
    
    // Sauvegarder dans la base de données
    await updateUser(currentUser);
    await updateUser(senderUser);
    
    res.json({ message: 'Friend request accepted', user: {
      id: senderUser.id,
      username: senderUser.username,
      avatar: senderUser.avatar
    }});
  } catch (error) {
    console.error('Error accepting friend request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Refuser/Retirer une demande d'ami
router.delete('/request/:userId', authenticateToken, async (req, res) => {
  try {
    const currentUser = req.user;
    const targetUserId = req.params.userId;
    
    const targetUser = await getUserById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Retirer des demandes reçues (refuser)
    if (currentUser.friendRequests?.received?.includes(targetUserId)) {
      currentUser.friendRequests.received = currentUser.friendRequests.received.filter(id => id !== targetUserId);
      if (targetUser.friendRequests?.sent) {
        targetUser.friendRequests.sent = targetUser.friendRequests.sent.filter(id => id !== currentUser.id);
      }
    }
    
    // Retirer des demandes envoyées (annuler)
    if (currentUser.friendRequests?.sent?.includes(targetUserId)) {
      currentUser.friendRequests.sent = currentUser.friendRequests.sent.filter(id => id !== targetUserId);
      if (targetUser.friendRequests?.received) {
        targetUser.friendRequests.received = targetUser.friendRequests.received.filter(id => id !== currentUser.id);
      }
    }
    
    // Sauvegarder dans la base de données
    await updateUser(currentUser);
    await updateUser(targetUser);
    
    res.json({ message: 'Friend request removed' });
  } catch (error) {
    console.error('Error removing friend request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Retirer un ami
router.delete('/:userId', authenticateToken, async (req, res) => {
  try {
    const currentUser = req.user;
    const friendUserId = req.params.userId;
    
    const friendUser = await getUserById(friendUserId);
    if (!friendUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Retirer des listes d'amis
    if (currentUser.friends) {
      currentUser.friends = currentUser.friends.filter(id => id !== friendUserId);
    }
    if (friendUser.friends) {
      friendUser.friends = friendUser.friends.filter(id => id !== currentUser.id);
    }
    
    // Sauvegarder dans la base de données
    await updateUser(currentUser);
    await updateUser(friendUser);
    
    res.json({ message: 'Friend removed' });
  } catch (error) {
    console.error('Error removing friend:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Rechercher des utilisateurs (pour ajouter des amis)
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const query = req.query.q || '';
    const currentUser = req.user;
    
    if (query.length < 2) {
      return res.json({ users: [] });
    }
    
    const allUsers = await getAllUsers();
    const searchResults = allUsers
      .filter(user => {
        if (user.id === currentUser.id) return false;
        const username = user.username.toLowerCase();
        return username.includes(query.toLowerCase());
      })
      .slice(0, 10)
      .map(user => {
        const isFriend = currentUser.friends?.includes(user.id) || false;
        const hasSentRequest = currentUser.friendRequests?.sent?.includes(user.id) || false;
        const hasReceivedRequest = currentUser.friendRequests?.received?.includes(user.id) || false;
        
        return {
          id: user.id,
          username: user.username,
          avatar: user.avatar,
          mmr: user.mmr,
          stats: user.stats,
          isFriend,
          hasSentRequest,
          hasReceivedRequest
        };
      });
    
    res.json({ users: searchResults });
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
