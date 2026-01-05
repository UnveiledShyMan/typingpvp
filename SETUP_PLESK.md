# Guide d'Installation Automatique pour Plesk

Guide pour installer et configurer TypingPVP sur Plesk en une seule commande.

## 🚀 Installation Automatique

### Option 1 : Script Node.js (Recommandé)

```bash
npm run setup
```

ou

```bash
node setup-plesk.js
```

### Option 2 : Script Bash (Linux/Mac)

```bash
chmod +x setup-plesk.sh
./setup-plesk.sh
```

## 📋 Ce que fait le script automatiquement

Le script `setup-plesk.js` exécute automatiquement :

1. **Installation des dépendances**
   - Dépendances racine (`npm install`)
   - Dépendances serveur (`cd server && npm install`)
   - Dépendances client (`cd client && npm install`)

2. **Configuration**
   - Vérifie/crée le fichier `.env` depuis `.env.example`
   - Affiche un avertissement si `.env` doit être configuré

3. **Base de données**
   - Crée la base de données MariaDB si elle n'existe pas
   - Initialise le schéma complet
   - Exécute toutes les migrations nécessaires (OAuth, Preferences, Discord)

4. **Build du client** (optionnel)
   - Build le client React pour la production
   - Peut être ignoré avec `--skip-build`

## ⚙️ Configuration Requise

### 1. Fichier `.env`

Créez un fichier `.env` à la racine du projet avec :

```env
# Base de données MariaDB
DB_HOST=localhost
DB_PORT=3306
DB_NAME=typingpvp
DB_USER=votre_utilisateur_mariadb
DB_PASSWORD=votre_mot_de_passe
DB_SSL=false

# Serveur
PORT=3001
HOST=0.0.0.0
CLIENT_URL=https://votre-domaine.com
SERVE_CLIENT=true

# JWT
JWT_SECRET=votre_secret_jwt_tres_long_et_aleatoire

# OAuth Google (optionnel)
GOOGLE_CLIENT_ID=votre_client_id
GOOGLE_CLIENT_SECRET=votre_client_secret

# URLs
SITE_URL=https://votre-domaine.com
LOGO_URL=https://votre-domaine.com/logo.svg
```

### 2. Base de données MariaDB

Assurez-vous que :
- MariaDB est installé et démarré
- Vous avez les identifiants de connexion (host, port, user, password)
- L'utilisateur a les permissions pour créer des bases de données

## 📝 Utilisation sur Plesk

### 1. Upload des fichiers

Uploadez tous les fichiers du projet sur votre serveur Plesk.

### 2. Configuration Node.js dans Plesk

1. Allez dans **Node.js** dans Plesk
2. Créez une nouvelle application Node.js
3. Configurez :
   - **Document root** : `/httpdocs` ou votre dossier
   - **Application root** : `/httpdocs` (même dossier)
   - **Application startup file** : `app.js` ou `server/index.js`
   - **Node.js version** : 18.x ou supérieur

### 3. Variables d'environnement dans Plesk

Dans les paramètres Node.js de Plesk, ajoutez toutes les variables de votre `.env` :
- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`
- etc.

### 4. Exécuter le script de setup

Dans le terminal Plesk ou via SSH :

```bash
cd /path/to/your/project
npm run setup
```

### 5. Démarrer l'application

Dans Plesk Node.js, démarrez l'application. Elle devrait maintenant fonctionner !

## 🔧 Commandes Utiles

```bash
# Setup complet (dépendances + base de données + build)
npm run setup

# Setup uniquement de la base de données
npm run setup:db

# Build du client uniquement
cd client && npm run build

# Démarrer en développement
npm run dev

# Démarrer en production
npm start
```

## ⚠️ Dépannage

### Erreur de connexion à la base de données

- Vérifiez que MariaDB est démarré
- Vérifiez les identifiants dans `.env`
- Vérifiez que l'utilisateur a les permissions nécessaires

### Erreur "mysql2 not found"

```bash
cd server
npm install mysql2
```

### Erreur lors du build du client

```bash
cd client
npm install
npm run build
```

### Tables manquantes

```bash
npm run setup:db
```

## 📚 Documentation

- `SETUP_MARIADB.md` - Guide détaillé pour MariaDB
- `MIGRATION_MARIADB.md` - Guide de migration (si nécessaire)

## ✅ Checklist de Déploiement

- [ ] Fichiers uploadés sur Plesk
- [ ] Node.js configuré dans Plesk
- [ ] Variables d'environnement configurées dans Plesk
- [ ] `.env` configuré avec les bons identifiants
- [ ] `npm run setup` exécuté avec succès
- [ ] Application démarrée dans Plesk
- [ ] Site accessible et fonctionnel

## 🎉 C'est prêt !

Votre application TypingPVP est maintenant installée et configurée sur Plesk !

