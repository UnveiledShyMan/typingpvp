# Configuration Plesk Node.js pour TypingPVP

## 🎯 Configuration rapide

### 1. Dans Plesk Node.js

1. Allez dans **Domains** → **typingpvp.com** → **Node.js**
2. Configurez :
   - **Application Root** : Chemin vers votre projet (ex: `/var/www/vhosts/typingpvp.com/httpdocs`)
   - **Application Startup File** : `app.js`
   - **Application Mode** : `production`
   - **Application URL** : `https://typingpvp.com`

### 2. Variables d'environnement

Dans la section **Environment Variables**, ajoutez :

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
- Récupérez `DB_NAME`, `DB_USER`, `DB_PASSWORD` depuis **Databases** → PostgreSQL dans Plesk
- `JWT_SECRET` : Générez une chaîne aléatoire longue (ex: `openssl rand -hex 32`)
- `CLIENT_URL` : URL complète de votre site

### 3. Démarrer l'application

Cliquez sur **Enable Node.js** puis **Restart App**

## 🔧 Ce que fait app.js

Le fichier `app.js` est le point d'entrée principal. Il :

1. ✅ Vérifie et installe les dépendances du serveur si nécessaire
2. ✅ Build le client React si `client/dist/` n'existe pas
3. ✅ Vérifie si la base de données est initialisée (tables existent)
4. ✅ Initialise la base de données automatiquement si nécessaire
5. ✅ Démarre le serveur Node.js

**Tout est automatique !** Vous n'avez qu'à configurer les variables d'environnement.

## 🔍 Vérifications

### Logs dans Plesk

Regardez les logs dans Plesk Node.js. Vous devriez voir :
```
🚀 Démarrage de TypingPVP...
✅ Dépendances serveur installées
✅ Client déjà buildé (ou build en cours)
✅ Base de données initialisée avec succès
Démarrage du serveur...
Server running on 0.0.0.0:3001
```

### Tester l'API

Ouvrez dans votre navigateur :
```
https://typingpvp.com/api/health
```

Vous devriez voir : `{"status":"ok"}`

## 🔄 Mises à jour

### Après modification du code

1. **Si vous modifiez le client** : Le client sera rebuildé automatiquement au prochain démarrage (si `client/dist/` n'existe pas)
2. **Si vous modifiez le serveur** : Cliquez sur **Restart App** dans Plesk Node.js
3. **Si vous ajoutez des dépendances** : Les dépendances seront installées automatiquement

### Build manuel du client (optionnel)

Si vous voulez forcer un rebuild du client :

```bash
cd client
npm install
npm run build
```

Puis redémarrez l'app dans Plesk.

## ⚠️ Troubleshooting

### Le serveur ne démarre pas

- Vérifiez les logs dans Plesk Node.js
- Vérifiez que toutes les variables d'environnement sont définies
- Vérifiez que PostgreSQL est démarré et accessible

### Erreur "Cannot find module"

- Les dépendances sont installées automatiquement au premier démarrage
- Si l'erreur persiste, vérifiez les logs pour voir si l'installation a échoué

### Erreur de connexion à la base de données

- Vérifiez les identifiants PostgreSQL dans Plesk
- Vérifiez que la base de données existe
- Vérifiez que `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` sont corrects

### Le client ne s'affiche pas

- Vérifiez les logs pour voir si le build du client a réussi
- Le build se fait automatiquement au démarrage si `client/dist/` n'existe pas
- Si nécessaire, build manuellement : `cd client && npm run build`

### Port déjà utilisé

- Changez le `PORT` dans les variables d'environnement (ex: 3002, 3003)
- Ou arrêtez l'application qui utilise le port

