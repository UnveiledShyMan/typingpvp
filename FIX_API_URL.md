# Fix : Erreur "Network error: Failed to fetch" - URL API incorrecte

## ❌ Problème

Le client essaie de se connecter à `http://localhost:3001` au lieu de l'URL Railway du backend.

**Cause** : Le client a été buildé avec la valeur par défaut de `VITE_API_URL`. Les variables d'environnement Vite sont intégrées au moment du build, pas au runtime.

## ✅ Solution

### 1. Créer le fichier `.env.production`

Créez un fichier `client/.env.production` avec l'URL de votre backend Railway :

```
VITE_API_URL=https://votre-backend-railway.up.railway.app
```

**⚠️ Important** : Remplacez `votre-backend-railway.up.railway.app` par votre vraie URL Railway !

Pour trouver votre URL Railway :
1. Allez sur https://railway.app
2. Sélectionnez votre projet backend
3. Onglet "Settings" → "Networking"
4. Copiez l'URL du domaine (ex: `typingpvp-production.up.railway.app`)

### 2. Rebuild le client

Après avoir créé `.env.production`, rebuild le client :

```bash
cd client
npm run build
```

Cela va générer un nouveau dossier `client/dist/` avec la bonne URL API intégrée.

### 3. Uploader les nouveaux fichiers

**Option A : Via FTP/File Manager Plesk**

1. Uploader tout le contenu de `client/dist/` (les nouveaux fichiers buildés)
2. Remplacer les anciens fichiers dans le Document Root de Plesk

**Option B : Via Git (si vous commitez dist/)**

```bash
git add client/dist client/.env.production
git commit -m "Rebuild client with Railway API URL"
git push
```

Puis sur Plesk, faire un pull Git.

## 🔍 Vérification

Après le rebuild et upload :

1. Ouvrez votre site sur Plesk
2. Ouvrez la console du navigateur (F12)
3. Essayez de vous inscrire
4. Vérifiez dans l'onglet Network que les requêtes vont vers l'URL Railway (pas localhost:3001)

## 📝 Structure du fichier .env.production

Le fichier `client/.env.production` doit contenir :

```
VITE_API_URL=https://votre-vraie-url-railway.up.railway.app
```

**Sans espaces**, **sans guillemets**, juste l'URL directement.

## 🚨 Note importante

- Les variables Vite commencent par `VITE_`
- Elles sont intégrées au moment du **build**, pas au runtime
- Il faut **rebuilder** à chaque fois que vous changez l'URL
- Le fichier `.env.production` est utilisé uniquement lors du build en production

## ✅ Après correction

Une fois rebuildé et uploadé, votre site sur Plesk devrait se connecter correctement au backend Railway !

