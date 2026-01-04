# Configuration Railway - Backend

## Variables d'environnement requises sur Railway

Pour que le backend fonctionne correctement sur Railway, vous devez configurer ces variables d'environnement dans le tableau de bord Railway :

### Variables obligatoires :

1. **PORT** (optionnel, Railway définit automatiquement)
   - Railway définit automatiquement `PORT`, mais vous pouvez le laisser vide

2. **HOST** (optionnel)
   - Par défaut : `0.0.0.0`
   - Laissez vide si vous n'êtes pas sûr

3. **CLIENT_URL**
   - **IMPORTANT** : URL de votre frontend (Plesk)
   - Exemple : `https://typingpvp.com`
   - Utilisé pour CORS et Socket.io

4. **JWT_SECRET**
   - Clé secrète pour signer les tokens JWT
   - Utilisez une chaîne aléatoire complexe
   - Exemple : `jazieouazhejiahwzjehazI123123H1H23H321H`

5. **NODE_ENV**
   - `production`

### Comment configurer sur Railway :

1. Allez sur votre projet Railway
2. Sélectionnez votre service backend
3. Allez dans l'onglet **Variables**
4. Ajoutez chaque variable :
   - **CLIENT_URL** = `https://typingpvp.com` (ou votre URL frontend)
   - **JWT_SECRET** = `jazieouazhejiahwzjehazI123123H1H23H321H`
   - **NODE_ENV** = `production`

## Vérifier que le serveur fonctionne

### 1. Vérifier les logs Railway

Dans Railway, allez dans l'onglet **Logs** et vérifiez :
- Le serveur démarre sans erreur
- Vous voyez : `Server running on 0.0.0.0:XXXX` (XXXX est le port)

### 2. Tester l'endpoint health

Ouvrez dans votre navigateur :
```
https://typingpvp-production.up.railway.app/api/health
```

Vous devriez voir :
```json
{"status":"ok"}
```

Si vous voyez une erreur 404 ou "Cannot GET /api/health", le serveur n'est pas démarré correctement.

### 3. Vérifier CORS

Si le serveur répond mais que le frontend a des erreurs CORS, vérifiez :
- `CLIENT_URL` est bien configuré avec l'URL EXACTE de votre frontend
- L'URL ne se termine PAS par un `/`
- L'URL utilise `https://` (pas `http://`)

## Problèmes courants

### Erreur "Failed to fetch"

**Causes possibles :**
1. Le serveur Railway n'est pas démarré
2. Les variables d'environnement ne sont pas configurées
3. Le port n'est pas correctement configuré
4. CORS bloque les requêtes

**Solutions :**
1. Vérifiez les logs Railway
2. Vérifiez que toutes les variables d'environnement sont définies
3. Testez `/api/health` directement dans le navigateur
4. Vérifiez que `CLIENT_URL` correspond exactement à l'URL de votre frontend

### Le serveur démarre mais ne répond pas

- Vérifiez que Railway a bien exposé le service
- Vérifiez que le port est bien configuré
- Vérifiez les logs pour des erreurs de démarrage

### Erreurs CORS

- Vérifiez que `CLIENT_URL` est défini correctement
- Vérifiez que l'URL ne contient pas de `/` à la fin
- Vérifiez que l'URL utilise le bon protocole (`https://`)

## Structure des fichiers sur Railway

Le backend doit être dans le dossier `server/` :
```
server/
  ├── index.js
  ├── package.json
  ├── routes/
  ├── models/
  └── ...
```

Railway doit être configuré pour :
- **Root Directory** : `server` (ou laisser vide si vous avez un fichier `railway.json`)
- **Start Command** : `npm start` (ou `node index.js`)
- **Build Command** : `npm install` (optionnel, Railway le fait automatiquement)

## Commandes utiles

### Vérifier les variables d'environnement

Dans les logs Railway, le serveur devrait afficher les variables chargées (si vous ajoutez un `console.log`).

### Redéployer

Après avoir modifié les variables d'environnement, Railway redéploie automatiquement. Si ce n'est pas le cas, allez dans l'onglet **Settings** et cliquez sur **Redeploy**.

