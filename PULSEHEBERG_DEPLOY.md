# Guide de déploiement sur PulseHeberg

## 📋 Informations importantes

### Version Node.js
- **Version actuelle sur votre machine** : v22.11.0
- **Version recommandée pour PulseHeberg** : Node.js v18.x ou v20.x (v22 devrait aussi fonctionner)
- Vérifiez la version supportée par PulseHeberg dans leur documentation

## 📁 Structure des fichiers à déployer

### Option 1 : Déploiement avec fichiers statiques servis par le backend (Recommandé)

```
votre-compte-pulseheberg/
├── server/                    # Dossier principal du serveur Node.js
│   ├── index.js              # ⚠️ Fichier principal (point d'entrée)
│   ├── package.json          # ⚠️ Important pour npm install
│   ├── routes/               # Dossier des routes API
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── rankings.js
│   │   ├── me.js
│   │   ├── friends.js
│   │   └── matches.js
│   ├── models/               # Modèles de données
│   │   └── User.js
│   ├── middleware/           # Middleware Express
│   │   └── auth.js
│   ├── utils/                # Utilitaires
│   │   ├── elo.js
│   │   └── ranks.js
│   ├── db.js                 # Base de données (en mémoire)
│   └── node_modules/         # ⚠️ Généré par npm install (ne pas uploader)
│
└── client-dist/              # Dossier du client buildé (après npm run build)
    └── (contenu de client/dist/)
```

### Fichiers à UPLOADER dans le dossier `server/` :

```
✅ À UPLOADER :
- index.js
- package.json
- db.js
- routes/ (tout le dossier)
- models/ (tout le dossier)
- middleware/ (tout le dossier)
- utils/ (tout le dossier)

❌ NE PAS UPLOADER :
- node_modules/ (sera généré sur le serveur)
- *.log
- .env
- .git/
```

### Fichiers du CLIENT (après build) :

1. **Build le client localement** :
   ```bash
   cd client
   npm install
   npm run build
   ```

2. **Uploader le contenu de `client/dist/`** :
   - Soit dans un dossier `client-dist/` à la racine
   - Soit dans un sous-dossier public configuré dans PulseHeberg
   - Soit servir depuis le backend (voir Option 2)

## 🚀 Étapes de déploiement

### Étape 1 : Préparer le client (Build)

```bash
cd client
npm install
npm run build
```

Cela crée le dossier `client/dist/` avec tous les fichiers statiques optimisés.

### Étape 2 : Préparer le serveur

1. **Compresser les fichiers du serveur** :
   - Sélectionner tous les fichiers du dossier `server/`
   - EXCLURE `node_modules/`
   - Créer une archive ZIP

2. **Fichiers à inclure dans l'archive** :
   ```
   server/
   ├── index.js
   ├── package.json
   ├── db.js
   ├── routes/
   ├── models/
   ├── middleware/
   └── utils/
   ```

### Étape 3 : Upload sur PulseHeberg

1. **Via FTP/SFTP ou panneau de contrôle** :
   - Connecter-vous à votre compte PulseHeberg
   - Uploader l'archive ZIP du serveur
   - Extraire les fichiers dans le dossier prévu pour Node.js

2. **Ou uploader directement** :
   - Créer le dossier `server/` sur le serveur
   - Uploader tous les fichiers un par un ou via FTP

### Étape 4 : Configuration sur PulseHeberg

#### Variables d'environnement à configurer :

Dans le panneau de contrôle PulseHeberg, définir :

```
NODE_ENV=production
PORT=3001 (ou le port fourni par PulseHeberg)
JWT_SECRET=votre-secret-jwt-tres-securise-changez-moi
CLIENT_URL=https://votre-domaine.com
```

#### Point d'entrée de l'application :

- **Fichier principal** : `index.js`
- **Dossier de travail** : `server/` (ou le dossier où vous avez uploadé les fichiers)

### Étape 5 : Installation des dépendances

Via SSH ou le terminal fourni par PulseHeberg :

```bash
cd server
npm install --production
```

Cela installe toutes les dépendances listées dans `package.json`.

### Étape 6 : Démarrer l'application

PulseHeberg devrait démarrer automatiquement l'application, mais si besoin :

```bash
npm start
# ou
node index.js
```

### Étape 7 : Configuration du client

**Option A : Servir le client depuis le backend** (Recommandé pour débuter)

Modifier `server/index.js` pour servir les fichiers statiques (à ajouter avant les routes API) :

```javascript
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import express from 'express';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Servir les fichiers statiques du client
app.use(express.static(join(__dirname, '../client-dist')));

// Routes API
app.use('/api/auth', authRoutes);
// ... autres routes

// Route catch-all : servir index.html pour toutes les routes non-API
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, '../client-dist/index.html'));
});
```

Puis uploader le contenu de `client/dist/` dans `client-dist/` à la racine.

**Option B : Client sur sous-domaine ou dossier public**

1. Configurer `VITE_API_URL` avant le build :
   - Créer `client/.env.production` :
     ```
     VITE_API_URL=https://votre-domaine.com
     ```

2. Rebuild :
   ```bash
   cd client
   npm run build
   ```

3. Uploader `client/dist/` dans le dossier public configuré

## 📝 Checklist de déploiement

- [ ] Build du client réalisé (`npm run build` dans `client/`)
- [ ] Fichiers du serveur préparés (sans `node_modules/`)
- [ ] Fichiers uploadés sur PulseHeberg
- [ ] Variables d'environnement configurées
- [ ] Dépendances installées (`npm install --production`)
- [ ] Application démarrée
- [ ] Client accessible et fonctionnel
- [ ] API accessible et fonctionnelle
- [ ] Socket.io fonctionne (pour les parties multijoueurs)

## ⚠️ Notes importantes

1. **Base de données** : Actuellement en mémoire, les données seront perdues au redémarrage. Pour la production, migrer vers MongoDB ou PostgreSQL.

2. **HTTPS** : Assurez-vous que PulseHeberg fournit HTTPS pour votre domaine.

3. **CORS** : Vérifiez que `CLIENT_URL` dans les variables d'environnement correspond à votre domaine réel.

4. **Port** : PulseHeberg peut assigner un port spécifique. Vérifiez dans leur documentation ou utilisez `process.env.PORT` (déjà configuré dans le code).

5. **JWT_SECRET** : Utilisez un secret fort et unique en production (générez avec `openssl rand -base64 32`).

## 🔧 Commandes utiles

```bash
# Vérifier la version Node.js
node --version

# Build le client
cd client && npm run build

# Tester le serveur localement
cd server && npm install && node index.js

# Installer les dépendances en production
npm install --production
```

## 📞 Support

En cas de problème :
1. Vérifier les logs dans le panneau PulseHeberg
2. Vérifier que tous les fichiers sont bien uploadés
3. Vérifier les variables d'environnement
4. Vérifier que le port est correctement configuré

