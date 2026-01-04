# Configuration PulseHeberg pour le Backend Node.js

## 📋 Configuration complète

### Paramètres dans PulseHeberg

1. **Root Directory** : `.` (racine du projet, donc `typingpvp`)

2. **Fichier de démarrage de l'app** : `server/index.js`
   - Ou dans certains panneaux : **Start Command** : `cd server && node index.js`
   - Ou : **Start Command** : `npm start` (utilise le script du package.json racine)

3. **Build Command** (si nécessaire) : 
   - `cd server && npm install`
   - Ou : `npm run install:all` (installe tout)

4. **Port** : 
   - PulseHeberg définit automatiquement `process.env.PORT`
   - Votre code utilise déjà `process.env.PORT || 3001` ✅

## 🎯 Configuration recommandée

### Option 1 : Utiliser le script npm (Recommandé)

**Dans PulseHeberg :**
- **Root Directory** : `.` (racine)
- **Start Command** : `npm start`
  - Cela exécute : `cd server && node index.js` (défini dans votre `package.json` racine)

### Option 2 : Commande directe

**Dans PulseHeberg :**
- **Root Directory** : `.` (racine)
- **Start Command** : `cd server && node index.js`

### Option 3 : Root dans server/

**Dans PulseHeberg :**
- **Root Directory** : `server`
- **Start Command** : `node index.js`
- **Build Command** : `npm install`

## 🔧 Variables d'environnement à configurer

Dans PulseHeberg, ajoutez ces variables d'environnement :

```
NODE_ENV=production
PORT=3001 (ou laisser PulseHeberg gérer automatiquement)
JWT_SECRET=votre-secret-jwt-fort-et-securise-changez-moi
CLIENT_URL=https://votre-domaine-client.com
```

## 📝 Résumé rapide

**Configuration minimale :**
- **Root Directory** : `.`
- **Start Command** : `npm start`
- **Variables d'environnement** : `NODE_ENV=production`, `JWT_SECRET=...`

C'est tout ! Votre `package.json` racine a déjà le script `start` qui fait `cd server && node index.js`.

## ✅ Vérification

Après le déploiement, testez :
- `https://votre-domaine-pulseheberg.com/api/rankings` (devrait retourner du JSON)
- `https://votre-domaine-pulseheberg.com/api/me` (avec token, devrait retourner les infos utilisateur)

