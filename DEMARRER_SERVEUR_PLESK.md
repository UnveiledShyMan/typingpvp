# Comment démarrer le serveur Node.js sur Plesk

## 🔍 Diagnostic : Le serveur ne démarre pas

Si `https://typingpvp.com/api/health` ne fonctionne pas, le serveur Node.js n'est pas démarré.

## ✅ Étapes pour démarrer le serveur

### 1. Vérifier la configuration Plesk Node.js

Dans Plesk :
1. Allez dans **Domains** → **typingpvp.com** → **Node.js**
2. Vérifiez :
   - **Application Root** : `/var/www/vhosts/typingpvp.com/httpdocs` (ou votre chemin)
   - **Application Startup File** : `app.js`
   - **Application Mode** : `production`
   - **Node.js version** : v18 ou supérieur

### 2. Vérifier les variables d'environnement

Dans la section **Environment Variables**, vous DEVEZ avoir au minimum :

```
NODE_ENV=production
PORT=3001
HOST=0.0.0.0
SERVE_CLIENT=true
CLIENT_URL=https://typingpvp.com

# PostgreSQL (récupérez depuis Plesk > Databases)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=votre_nom_db
DB_USER=votre_user_db
DB_PASSWORD=votre_password_db

# JWT (générez avec: openssl rand -hex 32)
JWT_SECRET=votre_secret_jwt_long_et_aleatoire
```

**Important :**
- `DB_NAME`, `DB_USER`, `DB_PASSWORD` : Récupérez depuis **Databases** → PostgreSQL dans Plesk
- `JWT_SECRET` : Doit être une chaîne longue et aléatoire
- `SERVE_CLIENT=true` : Nécessaire pour que le serveur serve le client

### 3. Activer Node.js

1. Cliquez sur **Enable Node.js** (bouton en haut)
2. Cliquez sur **Restart App** (ou **Restart Application**)

### 4. Vérifier les logs

Dans la section **Logs** de Plesk Node.js, vous devriez voir :

```
🚀 Démarrage de TypingPVP...
✅ Dépendances serveur installées
✅ Client déjà buildé
✅ Base de données initialisée avec succès
Démarrage du serveur...
Server running on 0.0.0.0:3001
```

### 5. Si vous voyez des erreurs dans les logs

#### Erreur : "Cannot find module"
- Les dépendances ne sont pas installées
- Solution : Vérifiez que `server/node_modules` existe, sinon les logs devraient montrer l'installation

#### Erreur : "Cannot connect to database"
- Les variables d'environnement `DB_*` sont incorrectes
- Solution : Vérifiez les identifiants PostgreSQL dans Plesk

#### Erreur : "Port already in use"
- Le port 3001 est déjà utilisé
- Solution : Changez `PORT=3002` (ou autre port) dans les variables d'environnement

#### Erreur : "EADDRINUSE"
- Même problème que ci-dessus
- Solution : Changez le port dans les variables d'environnement

### 6. Tester que le serveur fonctionne

Une fois le serveur démarré :

1. **Test API** : `https://typingpvp.com/api/health`
   - Doit retourner : `{"status":"ok"}`

2. **Test client** : `https://typingpvp.com`
   - Doit afficher l'interface React

## 🔧 Vérifications rapides

### Le serveur est-il démarré ?

Dans les logs Plesk Node.js, cherchez :
- ✅ `Server running on 0.0.0.0:3001` → Le serveur est démarré
- ❌ Aucune ligne "Server running" → Le serveur ne démarre pas

### Les fichiers sont-ils présents ?

Via SSH (si vous y avez accès) :
```bash
cd /var/www/vhosts/typingpvp.com/httpdocs
ls -la app.js          # Doit exister
ls -la server/index.js # Doit exister
ls -la server/package.json # Doit exister
```

### Les dépendances sont-elles installées ?

Via SSH :
```bash
cd /var/www/vhosts/typingpvp.com/httpdocs/server
ls -la node_modules    # Doit exister et contenir des dossiers
```

## ⚠️ Problèmes courants

### 1. Node.js n'est pas activé

**Symptôme** : Rien ne se passe
**Solution** : Cliquez sur **Enable Node.js** dans Plesk

### 2. Application Startup File incorrect

**Symptôme** : Erreur "Cannot find module app.js"
**Solution** : Vérifiez que **Application Startup File** = `app.js`

### 3. Application Root incorrect

**Symptôme** : Erreur "Cannot find module"
**Solution** : Vérifiez que **Application Root** pointe vers le bon dossier (où se trouve `app.js`)

### 4. Variables d'environnement manquantes

**Symptôme** : Erreur de connexion à la base de données
**Solution** : Vérifiez que toutes les variables `DB_*` sont définies

### 5. Base de données non initialisée

**Symptôme** : Erreur "relation 'users' does not exist"
**Solution** : Normalement `app.js` initialise automatiquement. Sinon, connectez-vous en SSH et exécutez :
```bash
cd /var/www/vhosts/typingpvp.com/httpdocs/server
node db/init.js
```

## 📞 Si rien ne fonctionne

1. **Vérifiez les logs complets** dans Plesk Node.js
2. **Vérifiez que Node.js est bien installé** dans Plesk (versions disponibles)
3. **Vérifiez les permissions** des fichiers (doivent être lisibles)
4. **Essayez de démarrer manuellement** via SSH (si possible) :
   ```bash
   cd /var/www/vhosts/typingpvp.com/httpdocs
   node app.js
   ```

## ✅ Checklist de démarrage

- [ ] Node.js activé dans Plesk
- [ ] Application Root correct
- [ ] Application Startup File = `app.js`
- [ ] Variables d'environnement définies (DB_*, JWT_SECRET, etc.)
- [ ] Base de données PostgreSQL créée
- [ ] Logs montrent "Server running on 0.0.0.0:3001"
- [ ] `https://typingpvp.com/api/health` retourne `{"status":"ok"}`

