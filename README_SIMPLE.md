# Configuration Simple - TypingPVP

## 🎯 Architecture

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Client    │  HTTP   │    Serveur   │   SQL   │ PostgreSQL  │
│   (React)   │ ──────> │  (Node.js)   │ ──────> │   (Plesk)   │
└─────────────┘         └──────────────┘         └─────────────┘
```

**Important :**
- Le client (React) NE se connecte PAS directement à PostgreSQL
- Le client fait des requêtes HTTP au serveur Node.js
- Le serveur Node.js se connecte à PostgreSQL

## 📋 Configuration Plesk (Production)

### 1. Variables d'environnement dans Plesk Node.js

```
NODE_ENV=production
PORT=3001
HOST=0.0.0.0

# PostgreSQL (récupérez depuis Plesk > Databases)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=votre_nom_db
DB_USER=votre_user_db
DB_PASSWORD=votre_password_db

# JWT (générez avec: openssl rand -hex 32)
JWT_SECRET=votre_secret_jwt_long_et_aleatoire

# URL du site
CLIENT_URL=https://typingpvp.com
```

### 2. Configuration Plesk Node.js

- **Application Root** : `/var/www/vhosts/typingpvp.com/httpdocs` (ou votre chemin)
- **Application Startup File** : `app.js`
- **Application Mode** : `production`

### 3. Comment ça marche

1. Plesk exécute `app.js`
2. `app.js` :
   - Installe les dépendances si nécessaire
   - Build le client React si `client/dist/` n'existe pas
   - Initialise la base de données PostgreSQL si nécessaire
   - Démarre le serveur Node.js
3. Le serveur :
   - Écoute sur le port 3001
   - Sert les fichiers du client depuis `client/dist/`
   - Se connecte à PostgreSQL avec les variables d'environnement
   - Expose l'API sur `/api/*`

### 4. Build manuel du client (si besoin)

Si vous voulez rebuilder le client avec la bonne URL :

```bash
cd client
echo 'VITE_API_URL=https://typingpvp.com' > .env.production
npm install
npm run build
```

Puis redémarrez l'app dans Plesk.

## 💻 Développement Local

### Option 1 : Serveur + Client séparés (recommandé)

```bash
npm run dev
```

Cela lance :
- Serveur Node.js sur `http://localhost:3001`
- Client React sur `http://localhost:5173`

Le client est automatiquement configuré pour pointer vers `http://localhost:3001`

### Option 2 : Serveur seulement

```bash
npm run dev:server
```

### Option 3 : Client seulement

```bash
npm run dev:client
```

**Variables d'environnement pour dev :**

Créez `client/.env.local` :
```
VITE_API_URL=http://localhost:3001
```

Créez `server/.env` (ou variables système) :
```
NODE_ENV=development
PORT=3001
HOST=0.0.0.0
DB_HOST=localhost
DB_PORT=5432
DB_NAME=typingpvp_dev
DB_USER=postgres
DB_PASSWORD=votre_password
JWT_SECRET=dev_secret_change_in_production
```

## 🔧 Fichiers Principaux

- **`app.js`** : Point d'entrée pour Plesk (production)
- **`start.js`** : Point d'entrée pour développement local (serveur + client)
- **`server/index.js`** : Serveur Express + Socket.io
- **`server/db/connection.js`** : Configuration PostgreSQL
- **`client/.env.production`** : Variables d'environnement pour build production
- **`client/.env.local`** : Variables d'environnement pour développement

## ❓ Questions Fréquentes

### Le client essaie de se connecter à Railway

**Solution :** Le client a été buildé avec l'ancienne URL Railway. Rebuild avec la bonne URL :

```bash
cd client
echo 'VITE_API_URL=https://typingpvp.com' > .env.production
npm run build
```

### Erreur de connexion à la base de données

**Vérifiez :**
1. Les variables d'environnement `DB_*` dans Plesk
2. Que PostgreSQL est démarré
3. Que la base de données existe
4. Que les identifiants sont corrects

### Le client ne s'affiche pas

**Vérifiez :**
1. Les logs dans Plesk Node.js
2. Que `client/dist/index.html` existe
3. Si nécessaire, build manuel : `cd client && npm run build`

### Port déjà utilisé

Changez le `PORT` dans les variables d'environnement (ex: 3002, 3003)

