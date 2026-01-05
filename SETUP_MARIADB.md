# Guide de Setup MariaDB - TypingPVP

Guide rapide pour configurer MariaDB depuis zéro.

## 📋 Prérequis

1. **MariaDB installé** (version 10.3 ou supérieure)
2. **Node.js** avec npm

## 🚀 Installation rapide

### 1. Installer mysql2

```bash
cd server
npm install mysql2
```

### 2. Configurer `.env`

Dans votre fichier `.env` à la racine du projet :

```env
# Base de données MariaDB
DB_HOST=localhost
DB_PORT=3306
DB_NAME=typingpvp
DB_USER=root
DB_PASSWORD=votre_mot_de_passe
DB_SSL=false

# Autres variables...
PORT=3001
HOST=0.0.0.0
CLIENT_URL=http://localhost:5173
SERVE_CLIENT=false
JWT_SECRET=votre_secret_jwt
# etc.
```

### 3. Créer la base de données

Connectez-vous à MariaDB :

```bash
mysql -u root -p
```

Puis exécutez :

```sql
CREATE DATABASE typingpvp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

### 4. Initialiser le schéma

```bash
# Option 1 : Via le script Node.js
node server/db/init.js

# Option 2 : Via la ligne de commande MariaDB
mysql -u root -p typingpvp < server/db/schema-mariadb.sql
```

### 5. Exécuter les migrations (optionnel)

Si vous avez besoin des fonctionnalités OAuth, Discord, etc. :

```bash
npm run migrate add_oauth
npm run migrate add_preferences
npm run migrate add_discord_links
```

### 6. Tester la connexion

```bash
# Démarrer le serveur
npm run dev
```

Vous devriez voir dans les logs :
```
📊 Configuration base de données MariaDB:
  Host: localhost
  Port: 3306
  Database: typingpvp
  ...
✅ Nouvelle connexion MariaDB établie
```

## ✅ Vérification

Vérifiez que les tables ont été créées :

```sql
mysql -u root -p typingpvp
SHOW TABLES;
```

Vous devriez voir :
- `users`
- `matches`
- `user_matches`
- `discord_links` (si migration exécutée)

## 🎉 C'est prêt !

Votre application est maintenant configurée avec MariaDB. Vous pouvez créer des comptes et utiliser toutes les fonctionnalités.

## 📝 Notes importantes

- **Port par défaut** : 3306 (au lieu de 5432 pour PostgreSQL)
- **Charset** : `utf8mb4` pour supporter tous les caractères Unicode
- **JSON** : MariaDB utilise `JSON` (pas `JSONB` comme PostgreSQL)
- **Tableaux** : Les tableaux PostgreSQL `TEXT[]` sont convertis en `JSON` dans MariaDB

## 🆘 Dépannage

### Erreur de connexion

Vérifiez que :
- MariaDB est démarré : `sudo systemctl status mariadb` (Linux) ou vérifiez les services Windows
- Les identifiants dans `.env` sont corrects
- Le port 3306 est accessible

### Erreur "Table doesn't exist"

Exécutez le script d'initialisation :
```bash
node server/db/init.js
```

### Erreur de syntaxe SQL

Assurez-vous d'utiliser les migrations `-mariadb.sql` et non les versions PostgreSQL.

