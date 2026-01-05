import express from 'express';
import { createUser, getUserByUsername, getUserByEmail, getUserByProviderId, verifyPassword, updateUser } from '../db.js';
import jwt from 'jsonwebtoken';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Inscription
router.post('/register', async (req, res) => {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/4e8be7e1-4a17-4ae6-97b8-582b4a7c2335',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth.js:9',message:'register entry',data:{username:req.body?.username,email:req.body?.email,hasPassword:!!req.body?.password},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
  // #endregion
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUserByUsername = await getUserByUsername(username);
    if (existingUserByUsername) {
      return res.status(400).json({ error: 'Username already taken' });
    }

    const existingUserByEmail = await getUserByEmail(email);
    if (existingUserByEmail) {
      return res.status(400).json({ error: 'Email already taken' });
    }

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/4e8be7e1-4a17-4ae6-97b8-582b4a7c2335',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth.js:28',message:'before createUser',data:{username,email},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    const user = await createUser(username, email, password);
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/4e8be7e1-4a17-4ae6-97b8-582b4a7c2335',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth.js:30',message:'after createUser',data:{userId:user?.id,hasUser:!!user,userKeys:user?Object.keys(user):[]},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    
    // Générer un token JWT
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/4e8be7e1-4a17-4ae6-97b8-582b4a7c2335',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth.js:33',message:'before jwt sign',data:{userId:user?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/4e8be7e1-4a17-4ae6-97b8-582b4a7c2335',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth.js:35',message:'before response',data:{hasToken:!!token,userFields:{id:user?.id,username:user?.username,email:user?.email,avatar:user?.avatar,bio:user?.bio,hasMMR:!!user?.mmr,hasStats:!!user?.stats}},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        mmr: user.mmr,
        stats: user.stats
      }
    });
  } catch (error) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/4e8be7e1-4a17-4ae6-97b8-582b4a7c2335',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth.js:48',message:'register catch',data:{errorMessage:error?.message,errorCode:error?.code,errorStack:error?.stack?.substring(0,200)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    console.error('Register error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Connexion
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Missing credentials' });
    }

    const user = await getUserByUsername(username) || await getUserByEmail(username);

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValid = await verifyPassword(user, password);

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Générer un token JWT
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        mmr: user.mmr,
        stats: user.stats
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Route pour obtenir l'URL de redirection OAuth Google
router.get('/oauth/google', (req, res) => {
  const redirectUri = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/oauth/callback`;
  
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return res.status(500).json({ error: 'Google OAuth not configured' });
  }
  
  const scope = 'openid email profile';
  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}&access_type=offline&prompt=consent`;
  res.redirect(googleAuthUrl);
});

// Échange le code OAuth contre un token et crée/connecte l'utilisateur
router.post('/oauth/exchange', async (req, res) => {
  try {
    const { code, provider } = req.body;
    const redirectUri = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/oauth/callback`;

    if (!code || !provider) {
      return res.status(400).json({ error: 'Missing code or provider' });
    }

    let userInfo = null;
    let providerId = null;

    if (provider === 'google') {
      // Échanger le code contre un token d'accès Google
      const clientId = process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        return res.status(500).json({ error: 'Google OAuth not configured' });
      }

      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code'
        })
      });

      const tokenData = await tokenResponse.json();
      if (!tokenResponse.ok) {
        return res.status(400).json({ error: tokenData.error || 'Failed to exchange token' });
      }

      // Récupérer les informations utilisateur
      const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` }
      });

      const googleUser = await userResponse.json();
      providerId = googleUser.id;
      userInfo = {
        email: googleUser.email,
        username: googleUser.name || googleUser.email.split('@')[0],
        avatar: googleUser.picture
      };
    } else {
      return res.status(400).json({ error: 'Invalid provider. Only Google is supported.' });
    }

    // Vérifier si l'utilisateur existe déjà avec ce provider
    let user = await getUserByProviderId(provider, providerId);

    if (!user) {
      // Si l'utilisateur n'existe pas, vérifier s'il existe avec cet email
      if (userInfo.email) {
        const existingUser = await getUserByEmail(userInfo.email);
        if (existingUser) {
          // Lier le compte OAuth au compte existant
          existingUser.provider = provider;
          existingUser.providerId = providerId;
          if (userInfo.avatar && !existingUser.avatar) {
            existingUser.avatar = userInfo.avatar;
          }
          await updateUser(existingUser);
          user = existingUser;
        }
      }

      // Si toujours pas d'utilisateur, créer un nouveau compte
      if (!user) {
        // Générer un username unique
        let finalUsername = userInfo.username || `user_${providerId.substring(0, 8)}`;
        let usernameAttempts = 0;
        while (await getUserByUsername(finalUsername) && usernameAttempts < 10) {
          finalUsername = `${userInfo.username || 'user'}_${providerId.substring(0, 6)}_${usernameAttempts}`;
          usernameAttempts++;
        }

        user = await createUser(
          finalUsername,
          userInfo.email,
          null, // Pas de mot de passe pour OAuth
          provider,
          providerId,
          userInfo.avatar
        );
      }
    } else {
      // Mettre à jour l'avatar si fourni et différent
      if (userInfo.avatar && userInfo.avatar !== user.avatar) {
        user.avatar = userInfo.avatar;
        await updateUser(user);
      }
    }

    // Générer un token JWT
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        mmr: user.mmr,
        stats: user.stats
      }
    });
  } catch (error) {
    console.error('OAuth exchange error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// OAuth Callback - Crée ou connecte un utilisateur via OAuth (ancienne méthode, gardée pour compatibilité)
router.post('/oauth/callback', async (req, res) => {
  try {
    const { provider, providerId, email, username, avatar } = req.body;

    if (!provider || !providerId) {
      return res.status(400).json({ error: 'Missing provider information' });
    }

    // Vérifier si l'utilisateur existe déjà avec ce provider
    let user = await getUserByProviderId(provider, providerId);

    if (!user) {
      // Si l'utilisateur n'existe pas, vérifier s'il existe avec cet email
      if (email) {
        const existingUser = await getUserByEmail(email);
        if (existingUser) {
          // Lier le compte OAuth au compte existant
          existingUser.provider = provider;
          existingUser.providerId = providerId;
          if (avatar && !existingUser.avatar) {
            existingUser.avatar = avatar;
          }
          await updateUser(existingUser);
          user = existingUser;
        }
      }

      // Si toujours pas d'utilisateur, créer un nouveau compte
      if (!user) {
        // Générer un username unique si non fourni
        let finalUsername = username || `user_${providerId.substring(0, 8)}`;
        let usernameAttempts = 0;
        while (await getUserByUsername(finalUsername) && usernameAttempts < 10) {
          finalUsername = `${username || 'user'}_${providerId.substring(0, 6)}_${usernameAttempts}`;
          usernameAttempts++;
        }

        user = await createUser(
          finalUsername,
          email,
          null, // Pas de mot de passe pour OAuth
          provider,
          providerId,
          avatar
        );
      }
    } else {
      // Mettre à jour l'avatar si fourni et différent
      if (avatar && avatar !== user.avatar) {
        user.avatar = avatar;
        await updateUser(user);
      }
    }

    // Générer un token JWT
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        mmr: user.mmr,
        stats: user.stats
      }
    });
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

