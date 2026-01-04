# Comment Démarrer le Serveur

## Démarrage Rapide

### 1. Ouvrir un terminal dans le dossier `server/`

```bash
cd server
```

### 2. Installer les dépendances (si pas déjà fait)

```bash
npm install
```

### 3. Démarrer le serveur

**Mode développement** (avec rechargement automatique) :
```bash
npm run dev
```

**Mode production** :
```bash
npm start
```

### 4. Vérifier que le serveur est démarré

Vous devriez voir dans le terminal :
```
Server running on port 3001
🌱 Seeding users...
✅ Created user: test (MMR: ...)
✨ Seeding complete!
```

### 5. Tester l'API

Ouvrez votre navigateur et allez sur :
- http://localhost:3001/api/health

Vous devriez voir :
```json
{"status":"ok"}
```

## Démarrer le Client (Frontend)

Dans un **nouveau terminal** :

```bash
cd client
npm install  # Si pas déjà fait
npm run dev
```

Le client sera accessible sur : http://localhost:5173

## Problèmes Courants

### Le port 3001 est déjà utilisé

Si vous voyez `EADDRINUSE: address already in use :::3001` :

1. Trouvez le processus qui utilise le port :
   ```powershell
   netstat -ano | findstr :3001
   ```

2. Arrêtez le processus, ou changez le port dans `server/index.js` :
   ```javascript
   const PORT = process.env.PORT || 3002; // Changez 3001 en 3002
   ```

### Le serveur ne démarre pas

Vérifiez que vous êtes dans le bon dossier :
```bash
cd server
```

Vérifiez que les dépendances sont installées :
```bash
npm install
```

### Le compte test n'existe pas

Le compte test est créé automatiquement au démarrage du serveur (en développement).

Redémarrez le serveur pour que le script `seedUsers` s'exécute.

## Commandes Utiles

- **Démarrer le serveur** : `npm run dev`
- **Arrêter le serveur** : `Ctrl + C`
- **Voir les logs** : Les logs apparaissent dans le terminal où le serveur est démarré

