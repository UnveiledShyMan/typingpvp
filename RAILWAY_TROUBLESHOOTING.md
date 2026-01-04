# Dépannage Railway - "Application failed to respond"

## 🔍 Diagnostic étape par étape

### 1. Vérifier les logs Railway (PRIORITÉ #1)

1. Allez sur votre dashboard Railway
2. Sélectionnez votre service backend
3. Cliquez sur l'onglet **Logs**
4. **Copiez-collez les dernières lignes d'erreur** (surtout les erreurs en rouge)

Les erreurs courantes à chercher :
- `Error: Cannot find module 'xxx'` → Dépendances manquantes
- `Error: listen EADDRINUSE` → Port déjà utilisé
- `SyntaxError` → Erreur de syntaxe dans le code
- `ReferenceError: xxx is not defined` → Variable non définie
- `TypeError: Cannot read property 'xxx'` → Erreur d'exécution

---

## ✅ Configuration Railway requise

### Root Directory
Dans **Settings** → **Root Directory**, vérifiez :
- Si vous avez un fichier `railway.json` à la racine : laissez **vide** ou mettez `.`
- Si vous n'avez pas `railway.json` : mettez `server`

### Start Command
Dans **Settings** → **Start Command**, vérifiez :
- Si vous avez `railway.json` : laissez **vide** (Railway utilise le fichier)
- Sinon : `cd server && node index.js`

### Build Command
- Laissez **vide** (Railway installe automatiquement avec `npm install`)

---

## 🔧 Problèmes courants et solutions

### Problème 1 : "Cannot find module 'express'"

**Cause :** Les dépendances ne sont pas installées

**Solution :**
1. Vérifiez que `server/package.json` existe
2. Railway devrait installer automatiquement, mais vérifiez les logs de build
3. Si nécessaire, ajoutez dans `railway.json` :
```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "cd server && npm install"
  }
}
```

### Problème 2 : "Error: listen EADDRINUSE"

**Cause :** Le port est déjà utilisé

**Solution :**
- Railway définit automatiquement `PORT` via `process.env.PORT`
- Ne définissez PAS `PORT` manuellement dans les variables d'environnement
- Le code doit utiliser : `const PORT = process.env.PORT || 3001;`

### Problème 3 : Le serveur démarre mais crash immédiatement

**Causes possibles :**
1. Variables d'environnement manquantes
2. Erreur dans le code au démarrage
3. Problème avec les imports/exports

**Solution :**
1. Vérifiez les logs pour l'erreur exacte
2. Vérifiez que toutes les variables d'environnement sont définies :
   - `JWT_SECRET` (obligatoire)
   - `CLIENT_URL` (obligatoire)
   - `NODE_ENV=production` (recommandé)
3. Testez localement avec les mêmes variables :
```bash
cd server
export JWT_SECRET=test
export CLIENT_URL=http://localhost:5173
export NODE_ENV=production
node index.js
```

### Problème 4 : "Application failed to respond" sans erreur dans les logs

**Causes possibles :**
1. Le serveur ne démarre pas du tout
2. Le serveur crash avant d'écrire dans les logs
3. Railway ne trouve pas le bon fichier à exécuter

**Solution :**
1. Vérifiez que `server/index.js` existe
2. Vérifiez que `server/package.json` existe et contient `"main": "index.js"`
3. Vérifiez le Root Directory dans Railway Settings
4. Vérifiez que le Start Command est correct

---

## 📋 Checklist de configuration Railway

### Variables d'environnement (Settings → Variables)

Cochez que toutes ces variables sont définies :

- [ ] **JWT_SECRET** = `jazieouazhejiahwzjehazI123123H1H23H321H` (ou votre propre clé)
- [ ] **CLIENT_URL** = `https://typingpvp.com` (ou votre URL frontend)
- [ ] **NODE_ENV** = `production`
- [ ] **PORT** = (ne PAS définir, Railway le définit automatiquement)
- [ ] **HOST** = (optionnel, laissez vide)

### Configuration du service

- [ ] **Root Directory** : vide (si `railway.json` existe) ou `server`
- [ ] **Start Command** : vide (si `railway.json` existe) ou `cd server && node index.js`
- [ ] **Build Command** : vide
- [ ] Le service est **exposé publiquement** (Settings → Generate Domain)

---

## 🧪 Tester localement avant de déployer

Avant de déployer sur Railway, testez localement avec les mêmes conditions :

```bash
# Dans le dossier server/
cd server

# Installer les dépendances
npm install

# Tester avec les variables d'environnement
export JWT_SECRET=jazieouazhejiahwzjehazI123123H1H23H321H
export CLIENT_URL=https://typingpvp.com
export NODE_ENV=production
export PORT=3001

# Démarrer le serveur
node index.js
```

Si ça fonctionne localement mais pas sur Railway, le problème est dans la configuration Railway.

---

## 📝 Vérification du fichier railway.json

Le fichier `railway.json` à la racine doit contenir :

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "cd server && npm install"
  },
  "deploy": {
    "startCommand": "cd server && node index.js",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

Si ce fichier existe, Railway l'utilise automatiquement et vous n'avez pas besoin de configurer Root Directory ou Start Command dans l'interface.

---

## 🚨 Actions immédiates à faire MAINTENANT

1. **Vérifiez les logs Railway** et copiez-collez l'erreur exacte
2. **Vérifiez les variables d'environnement** dans Settings → Variables
3. **Vérifiez la configuration** dans Settings → Service
4. **Testez localement** avec les mêmes variables

Si vous voyez une erreur spécifique dans les logs, envoyez-la et je pourrai vous aider à la résoudre !

