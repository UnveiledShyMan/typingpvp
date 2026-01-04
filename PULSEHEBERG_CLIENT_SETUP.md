# Configuration PulseHeberg pour servir le client (Frontend)

## ✅ Modification effectuée

J'ai modifié `server/index.js` pour servir les fichiers statiques du client (frontend React) depuis le backend.

## 📋 Configuration PulseHeberg

### Build Command

Dans PulseHeberg, configurez :

**Build Command** :
```
npm run build
```

Cela va :
1. Installer les dépendances dans `client/`
2. Builder le client (génère `client/dist/`)

### Start Command

**Start Command** :
```
cd server && npm install && node index.js
```

## 🎯 Comment ça fonctionne

1. **Build** : PulseHeberg build le client → génère `client/dist/`
2. **Start** : Le serveur Node.js démarre et sert les fichiers de `client/dist/`
3. **Routing** : Toutes les routes non-API servent `index.html` (pour React Router)

## 📁 Structure attendue après build

```
typingpvp/
├── client/
│   └── dist/          # Fichiers buildés (générés par npm run build)
│       ├── index.html
│       └── assets/
└── server/
    └── index.js      # Serve les fichiers de client/dist/
```

## 🔧 Variables d'environnement

Dans PulseHeberg, configurez :

```
NODE_ENV=production
PORT=3001 (ou laisser PulseHeberg gérer)
JWT_SECRET=votre-secret-jwt-fort
CLIENT_URL=https://votre-domaine-pulseheberg.com
```

## ✅ Avantages

- ✅ Tout sur un seul domaine (backend + frontend)
- ✅ Pas besoin de configurer CORS complexe
- ✅ Routing React fonctionne correctement
- ✅ Une seule application à gérer

## 🚀 Workflow complet

1. **Build Command** : `npm run build` (build le client)
2. **Start Command** : `cd server && npm install && node index.js` (démarre le serveur)
3. Le serveur sert automatiquement le client depuis `client/dist/`

## 📝 Note

Assurez-vous que le build du client se fait **avant** le démarrage du serveur. C'est pourquoi on utilise une Build Command séparée.

