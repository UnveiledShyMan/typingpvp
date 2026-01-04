# Résumé de Configuration - TypingPVP

## 🎯 Architecture Simple

```
Client React → Serveur Node.js → PostgreSQL (Plesk)
```

- **Client** : Interface utilisateur (React)
- **Serveur** : API + logique métier (Node.js)
- **PostgreSQL** : Base de données (Plesk)

Le client ne se connecte JAMAIS directement à PostgreSQL. Il fait des requêtes HTTP au serveur.

## 📋 Pour Plesk (Production)

### 1. Variables d'environnement dans Plesk Node.js

```
NODE_ENV=production
PORT=3001
HOST=0.0.0.0

# PostgreSQL (depuis Plesk > Databases)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=votre_nom_db
DB_USER=votre_user_db
DB_PASSWORD=votre_password_db

# JWT
JWT_SECRET=votre_secret_long_et_aleatoire

# URL du site (IMPORTANT)
CLIENT_URL=https://typingpvp.com
```

### 2. Configuration Plesk

- **Application Startup File** : `app.js`
- **Application Mode** : `production`

### 3. Ce que fait `app.js`

1. ✅ Installe les dépendances serveur si nécessaire
2. ✅ Build le client React si `client/dist/` n'existe pas
3. ✅ Crée automatiquement `client/.env.production` avec `VITE_API_URL=CLIENT_URL`
4. ✅ Initialise la base de données PostgreSQL si nécessaire
5. ✅ Démarre le serveur Node.js
6. ✅ Le serveur sert les fichiers du client depuis `client/dist/`

**Tout est automatique !**

## 🔧 Si le client a été buildé avec la mauvaise URL

Si vous voyez "Network error: Failed to fetch. Please make sure the server is running on https://typingpvp-production.up.railway.app" :

### Solution 1 : Rebuild automatique (recommandé)

Supprimez `client/dist/` et redémarrez l'app dans Plesk. `app.js` rebuild automatiquement avec la bonne URL.

```bash
# Sur Plesk (SSH)
cd /var/www/vhosts/typingpvp.com/httpdocs
rm -rf client/dist
# Puis redémarrez dans Plesk Node.js
```

### Solution 2 : Build manuel

```bash
# Sur Plesk (SSH)
cd client
echo 'VITE_API_URL=https://typingpvp.com' > .env.production
npm run build
# Puis redémarrez dans Plesk Node.js
```

## 💻 Développement Local

```bash
npm run dev
```

Cela lance :
- Serveur sur `http://localhost:3001`
- Client sur `http://localhost:5173`

Le client pointe automatiquement vers `http://localhost:3001`

## ✅ Vérifications

1. **API fonctionne** : `https://typingpvp.com/api/health` → `{"status":"ok"}`
2. **Client s'affiche** : `https://typingpvp.com` → Interface React
3. **Base de données** : Vérifiez les logs dans Plesk Node.js

## 📁 Fichiers Importants

- **`app.js`** : Point d'entrée pour Plesk (production)
- **`start.js`** : Point d'entrée pour développement
- **`server/index.js`** : Serveur Express + Socket.io
- **`server/db/connection.js`** : Configuration PostgreSQL
- **`README_SIMPLE.md`** : Documentation complète

