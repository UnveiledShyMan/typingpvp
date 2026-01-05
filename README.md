# TypingPVP

Application de dactylographie compétitive avec système MMR/ELO, battles 1v1, compétitions multijoueurs et matchmaking automatique.

## 🚀 Fonctionnalités

- **Mode Solo** : Entraînez-vous seul avec statistiques détaillées
- **Battles 1v1** : Défiez vos amis en temps réel
- **Matchmaking** : Trouvez des adversaires de niveau similaire automatiquement
- **Compétitions** : Participez à des compétitions multijoueurs (jusqu'à 100 joueurs)
- **Classements** : Consultez les classements par langue
- **Système MMR/ELO** : Progression compétitive avec rangs (Bronze → Challenger)
- **Profils** : Statistiques détaillées, bio, avatar

## 📁 Structure du Projet

Voir [STRUCTURE.md](./STRUCTURE.md) pour la structure détaillée.

```
lahaine/
├── client/          # Application React (Frontend)
└── server/          # API Node.js/Express (Backend)
```

## 🛠️ Technologies

### Frontend
- React 18
- React Router
- Socket.io Client
- Tailwind CSS
- Recharts
- Vite

### Backend
- Node.js
- Express
- Socket.io
- JWT
- bcryptjs

## 🚦 Démarrage Rapide

### Prérequis
- Node.js 18+
- npm ou yarn
- MariaDB (ou MySQL)

### Installation

```bash
# Installer les dépendances
npm install

# Installer les dépendances client
cd client
npm install

# Installer les dépendances serveur
cd ../server
npm install
```

### Développement

#### Mode Local (Recommandé pour le développement)

```bash
# Démarrer le serveur et le client en parallèle (un seul terminal)
npm run dev:local
```

Cette commande lance automatiquement :
- Le serveur sur http://localhost:3001 (avec nodemon pour le rechargement automatique)
- Le client sur http://localhost:5173 (avec Vite pour le hot-reload)

#### Mode Manuel (Deux terminaux)

```bash
# Terminal 1 : Démarrer le serveur
cd server
npm run dev

# Terminal 2 : Démarrer le client
cd client
npm run dev
```

L'application sera disponible sur :
- Frontend : http://localhost:5173
- Backend : http://localhost:3001

### Production

```bash
# Build du client
cd client
npm run build

# Démarrer le serveur en production
cd ../server
npm start
```

### Déploiement sur Plesk

1. **Configuration dans Plesk Node.js** :
   - **Fichier de démarrage** : `app.js` (à la racine du projet)
   - **Port** : Laissé vide ou défini automatiquement par Plesk
   - **Mode d'exécution** : `production`

2. **Variables d'environnement dans Plesk** :
   ```
   DB_HOST=votre_host_mariadb
   DB_PORT=3306
   DB_NAME=votre_nom_db
   DB_USER=votre_user_db
   DB_PASSWORD=votre_mot_de_passe
   JWT_SECRET=votre_secret_jwt
   CLIENT_URL=https://typingpvp.com
   NODE_ENV=production
   ```
   ⚠️ **Important** : Ne définissez PAS `SERVE_CLIENT` manuellement, il est défini automatiquement par `app.js`.

3. **Build du client** :
   - Assurez-vous que le dossier `client/dist` existe après le build
   - Le serveur vérifie automatiquement sa présence au démarrage

4. **Vérification** :
   - Consultez les logs dans Plesk pour vérifier que le serveur démarre correctement
   - Vérifiez que le message `✅ Serveur démarré avec succès` apparaît dans les logs
   - En cas d'erreur 502, vérifiez les logs pour identifier le problème

## 📚 Documentation

- [STRUCTURE.md](./STRUCTURE.md) - Structure détaillée du projet
- [CONVENTIONS.md](./CONVENTIONS.md) - Conventions de nommage et standards
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Architecture du système

## 🔧 Configuration

### Variables d'Environnement

Créez un fichier `.env` dans `client/` :
```
VITE_API_URL=http://localhost:3001
```

Créez un fichier `.env` dans `server/` :
```
PORT=3001
JWT_SECRET=your-secret-key-change-in-production
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

## 📱 Android / Play Store

Le projet est structuré pour faciliter la conversion en application Android :
- Architecture modulaire
- Services centralisés
- Configuration claire
- Documentation complète

Voir [STRUCTURE.md](./STRUCTURE.md) pour les prochaines étapes.

## 🎨 Direction Artistique

Design moderne avec palette de couleurs cyberpunk/synthwave :
- Violet/Cyan comme couleurs principales
- Effets de glow et animations subtiles
- Interface épurée et immersive

## 📝 Licence

MIT

## 👥 Auteurs

TypingPVP Team
