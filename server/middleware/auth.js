import jwt from 'jsonwebtoken';
import { getUserById } from '../db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  jwt.verify(token, JWT_SECRET, async (err, decoded) => {
    if (err) {
      console.warn('⚠️ Token invalide:', err.message);
      return res.status(403).json({ error: 'Invalid token' });
    }

    try {
      // Ajouter un timeout pour éviter les blocages
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Database query timeout')), 10000); // 10 secondes
      });

      const userPromise = getUserById(decoded.userId);
      const user = await Promise.race([userPromise, timeoutPromise]);

      if (!user) {
        console.warn('⚠️ Utilisateur non trouvé pour userId:', decoded.userId);
        return res.status(403).json({ error: 'User not found' });
      }

      req.user = user;
      next();
    } catch (error) {
      console.error('❌ Erreur dans authenticateToken:', error.message);
      console.error('Stack:', error.stack);
      
      // Si c'est un timeout, retourner 504 Gateway Timeout
      if (error.message === 'Database query timeout') {
        return res.status(504).json({ error: 'Database timeout. Please try again.' });
      }
      
      return res.status(500).json({ error: 'Internal server error' });
    }
  });
}

export function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    jwt.verify(token, JWT_SECRET, async (err, decoded) => {
      if (!err && decoded) {
        try {
          const user = await getUserById(decoded.userId);
          if (user) {
            req.user = user;
          }
        } catch (error) {
          console.error('Error in optionalAuth:', error);
          // En mode optional, on continue même en cas d'erreur
        }
      }
      next();
    });
  } else {
    next();
  }
}

