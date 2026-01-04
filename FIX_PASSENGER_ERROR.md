# Correction de l'erreur Passenger

## 🔍 Erreur

```
Could not spawn process for application: The application process exited prematurely.
Error ID: bca913b9
```

## 🎯 Cause

L'application Node.js s'arrête prématurément au démarrage. Causes possibles :

1. **Pool PostgreSQL fermé prématurément** (CORRIGÉ)
   - `app.js` fermait le pool après `checkDatabase()` et `initDatabase()`
   - Le pool est partagé avec l'application et ne doit pas être fermé

2. **Variables d'environnement manquantes**
   - `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` manquants
   - `JWT_SECRET` manquant

3. **Erreur de connexion à la base de données**
   - Identifiants PostgreSQL incorrects
   - Base de données n'existe pas
   - PostgreSQL n'est pas démarré

4. **Dépendances non installées**
   - `server/node_modules` n'existe pas
   - Installation des dépendances a échoué

## ✅ Correction appliquée

Le fichier `app.js` a été corrigé :
- Supprimé `pool.end()` dans `checkDatabase()`
- Supprimé `pool.end()` dans `initDatabase()`

Le pool PostgreSQL est partagé avec l'application et ne doit pas être fermé manuellement.

## 🔧 Vérifications à faire

### 1. Variables d'environnement dans Plesk

Vérifiez que toutes ces variables sont définies :

```
NODE_ENV=production
PORT=3001
HOST=0.0.0.0
SERVE_CLIENT=true
CLIENT_URL=https://typingpvp.com
DB_HOST=localhost
DB_PORT=5432
DB_NAME=votre_nom_db
DB_USER=votre_user_db
DB_PASSWORD=votre_password_db
JWT_SECRET=votre_secret_jwt_long_et_aleatoire
```

### 2. Vérifier les logs dans Plesk

Dans Plesk Node.js, regardez les logs. Vous devriez voir :
- Les erreurs détaillées
- Les messages de démarrage

### 3. Vérifier la base de données

Dans Plesk :
1. Allez dans **Databases** → PostgreSQL
2. Vérifiez que la base de données existe
3. Vérifiez les identifiants (nom, utilisateur, mot de passe)

### 4. Vérifier les dépendances (via SSH si possible)

```bash
cd /var/www/vhosts/jeremymastering.com/typingpvp.com/server
ls -la node_modules
```

Si `node_modules` n'existe pas ou est vide, les dépendances ne sont pas installées.

## 🚀 Redémarrer l'application

1. Dans Plesk Node.js, cliquez sur **Restart App**
2. Regardez les logs pour voir les nouvelles erreurs (s'il y en a)
3. Vérifiez que le serveur démarre : `Server running on 0.0.0.0:3001`

## ⚠️ Si l'erreur persiste

### Vérifier le fichier d'erreur Passenger

Le message d'erreur mentionne :
```
Error details saved to: /tmp/passenger-error-5MnlM1.html
```

Via SSH (si vous y avez accès), vous pouvez consulter ce fichier :
```bash
cat /tmp/passenger-error-*.html
```

Cela vous donnera plus de détails sur l'erreur.

### Vérifier les logs système

Via SSH :
```bash
cd /var/www/vhosts/jeremymastering.com/typingpvp.com
node app.js
```

Cela vous permettra de voir l'erreur directement dans le terminal.

### Causes courantes

1. **DB_NAME, DB_USER, DB_PASSWORD incorrects**
   - Vérifiez dans Plesk > Databases > PostgreSQL
   - Copiez exactement les valeurs

2. **Base de données n'existe pas**
   - Créez la base de données dans Plesk

3. **PostgreSQL n'est pas démarré**
   - Vérifiez dans Plesk que PostgreSQL est actif

4. **JWT_SECRET manquant ou trop court**
   - Doit être une chaîne longue (minimum 32 caractères recommandé)
   - Générez avec : `openssl rand -hex 32`

5. **Dépendances non installées**
   - Vérifiez que `server/node_modules` existe
   - Si absent, Plesk devrait les installer automatiquement au démarrage

## ✅ Checklist

- [ ] `app.js` corrigé (pool.end() supprimé)
- [ ] Toutes les variables d'environnement définies
- [ ] Base de données PostgreSQL existe
- [ ] Identifiants PostgreSQL corrects
- [ ] Dépendances installées (`server/node_modules` existe)
- [ ] Application redémarrée dans Plesk
- [ ] Logs vérifiés dans Plesk Node.js
- [ ] Serveur démarre : `Server running on 0.0.0.0:3001`

