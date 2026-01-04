# Guide de Dépannage

## Erreur "Network error. Please try again."

Cette erreur apparaît généralement lorsque le serveur backend n'est pas démarré ou n'est pas accessible.

### Solution 1: Vérifier que le serveur est démarré

1. Ouvrez un terminal dans le dossier `server/`
2. Démarrez le serveur :
   ```bash
   npm run dev
   ```
   ou
   ```bash
   npm start
   ```

3. Vous devriez voir :
   ```
   Server running on port 3001
   🌱 Seeding users...
   ```

### Solution 2: Vérifier l'URL de l'API

Par défaut, l'API est accessible sur `http://localhost:3001`.

Si vous utilisez une URL différente, créez un fichier `.env` dans `client/` :
```
VITE_API_URL=http://localhost:3001
```

### Solution 3: Vérifier que le port 3001 est libre

Sur Windows, vérifiez si le port est utilisé :
```powershell
netstat -an | findstr :3001
```

Si le port est déjà utilisé par un autre processus, vous pouvez :
- Changer le port dans `server/index.js` :
  ```javascript
  const PORT = process.env.PORT || 3002; // Changez 3001 en 3002
  ```
- Ou arrêter le processus qui utilise le port 3001

### Solution 4: Vérifier la console du navigateur

Ouvrez la console du navigateur (F12) et regardez les erreurs détaillées. Le message d'erreur devrait maintenant inclure plus de détails sur le problème.

### Solution 5: Vérifier CORS

Si vous accédez au site depuis une autre URL que `http://localhost:5173`, vérifiez la configuration CORS dans `server/index.js`.

## Le serveur ne démarre pas

### Erreur: "Cannot find module"

Installez les dépendances :
```bash
cd server
npm install
```

### Erreur: "Port already in use"

Changez le port dans `server/index.js` ou arrêtez le processus qui utilise le port.

## Le compte test ne fonctionne pas

Le compte test est créé automatiquement au démarrage du serveur (en développement).

Identifiants du compte test :
- **Username** : `test`
- **Password** : `test123`

Si le compte test n'existe pas, redémarrez le serveur. Le script `seedUsers` crée automatiquement le compte au démarrage.

## Problèmes de connexion Socket.io

Si vous avez des problèmes avec les battles, matchmaking ou compétitions :

1. Vérifiez que le serveur Socket.io est bien démarré
2. Vérifiez la console du navigateur pour les erreurs de connexion
3. Vérifiez que l'URL Socket.io correspond à l'URL du serveur

## Commandes utiles

### Démarrer le serveur
```bash
cd server
npm run dev  # Mode développement (avec nodemon)
# ou
npm start    # Mode production
```

### Démarrer le client
```bash
cd client
npm run dev
```

### Build de production
```bash
cd client
npm run build
```

## Structure des URLs

- **Client (dev)** : http://localhost:5173
- **Serveur (API)** : http://localhost:3001
- **API Health Check** : http://localhost:3001/api/health

## Logs utiles

Dans la console du serveur, vous devriez voir :
- `Server running on port 3001`
- `🌱 Seeding users...`
- `✅ Created user: test (MMR: ...)`
- `✨ Seeding complete!`
- `User connected: [socket-id]` (quand un client se connecte)

