# Configuration Plesk pour TypingPVP

## 📋 Prérequis

1. Node.js installé sur le serveur (v18 ou supérieur)
2. PostgreSQL installé et configuré
3. Base de données PostgreSQL créée dans Plesk

## 🚀 Étapes de configuration

### 1. Déployer le code

Uploader tous les fichiers du projet dans le répertoire de votre domaine :
- Exemple : `/var/www/vhosts/typingpvp.com/httpdocs/`

### 2. Builder le client (première fois)

```bash
chmod +x build.sh
./build.sh
```

### 3. Initialiser la base de données

```bash
cd server
node db/init.js
```

### 4. Configurer Node.js dans Plesk

1. Allez dans **Domains** → **typingpvp.com** → **Node.js**
2. **Application Root** : Chemin vers votre projet (ex: `/var/www/vhosts/typingpvp.com/httpdocs`)
3. **Application Startup File** : `server/index.js`
4. **Application Mode** : `production`
5. **Application URL** : `https://typingpvp.com` (ou votre domaine)

### 5. Variables d'environnement

Dans Plesk Node.js, section **Environment Variables**, ajoutez :

```
NODE_ENV=production
PORT=3001
HOST=0.0.0.0
DB_HOST=localhost
DB_PORT=5432
DB_NAME=votre_nom_db_postgresql
DB_USER=votre_utilisateur_db
DB_PASSWORD=votre_mot_de_passe_db
JWT_SECRET=votre_secret_jwt_aleatoire_et_securise
CLIENT_URL=https://typingpvp.com
```

**Important** :
- `DB_NAME`, `DB_USER`, `DB_PASSWORD` : Récupérez ces informations depuis **Databases** → PostgreSQL dans Plesk
- `JWT_SECRET` : Générez une chaîne aléatoire longue et sécurisée
- `CLIENT_URL` : URL complète de votre site (avec https://)

### 6. Démarrer l'application

Dans Plesk Node.js, cliquez sur **Enable Node.js** puis **Restart App**

## 🔍 Vérifications

### Tester la connexion à la base de données

```bash
cd server
node db/test-connection.js
```

### Vérifier que le serveur démarre

Regardez les logs dans Plesk Node.js. Vous devriez voir :
```
Server running on 0.0.0.0:3001
```

### Tester l'API

Ouvrez dans votre navigateur :
```
https://typingpvp.com/api/health
```

Vous devriez voir : `{"status":"ok"}`

## 🔄 Mises à jour futures

Quand vous modifiez le code :

1. **Si vous modifiez le client (React)** :
   ```bash
   ./build.sh
   ```

2. **Si vous modifiez le serveur** :
   - Dans Plesk Node.js, cliquez sur **Restart App**

3. **Si vous ajoutez des dépendances** :
   ```bash
   cd server
   npm install
   cd ../client
   npm install
   ```

## ⚠️ Troubleshooting

### Le serveur ne démarre pas

- Vérifiez les logs dans Plesk Node.js
- Vérifiez que toutes les variables d'environnement sont définies
- Vérifiez que PostgreSQL est démarré et accessible

### Erreur de connexion à la base de données

- Vérifiez les identifiants PostgreSQL dans Plesk
- Testez la connexion avec `node db/test-connection.js`
- Vérifiez que la base de données est bien créée

### Le client ne s'affiche pas

- Vérifiez que `./build.sh` a bien été exécuté
- Vérifiez que `client/dist/` existe et contient des fichiers
- Vérifiez les logs du serveur Node.js

### Port déjà utilisé

- Changez le `PORT` dans les variables d'environnement
- Ou arrêtez l'application qui utilise le port

