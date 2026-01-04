# Correction de l'URL API du client

## 🔍 Problème

Le client essaie toujours de se connecter à Railway (`https://typingpvp-production.up.railway.app`) alors que vous utilisez maintenant Plesk.

## ✅ Solution

### Option 1 : Rebuild le client avec la bonne URL (Recommandé)

1. **Créer le fichier `.env.production` dans `client/`** :

```bash
cd client
```

Créez le fichier `.env.production` avec ce contenu :

```
VITE_API_URL=https://typingpvp.com
```

(Remplacez `https://typingpvp.com` par votre vraie URL Plesk)

2. **Rebuild le client** :

```bash
npm run build
```

3. **Redéployer** : Uploader le dossier `client/dist/` sur Plesk (si le client est servi séparément)

### Option 2 : Si le serveur sert le client (app.js avec SERVE_CLIENT=true)

Si vous utilisez `app.js` sur Plesk (le serveur sert aussi le client), vous avez deux options :

**A. Utiliser l'URL absolue du domaine** :

Dans `client/.env.production` :
```
VITE_API_URL=https://typingpvp.com
```

Puis rebuild : `cd client && npm run build`

**B. Utiliser une URL relative** (plus simple) :

Modifiez le code pour utiliser une URL relative quand le client est servi par le serveur.

## 🔧 Modification du code pour URL relative (Option B)

Si le client est servi par le même serveur (même domaine), on peut utiliser une URL relative `/api` au lieu de `${API_URL}/api`.

Mais cela nécessiterait de modifier tous les fichiers. L'option A (rebuild avec la bonne URL) est plus simple.

## 📝 Résumé rapide

1. Créer `client/.env.production` avec `VITE_API_URL=https://typingpvp.com`
2. `cd client && npm run build`
3. Redéployer si nécessaire
4. Redémarrer l'app sur Plesk

## ⚠️ Important

Les fichiers `.env*` sont dans `.gitignore` (normal), donc vous devez les créer manuellement sur le serveur ou les ajouter lors du déploiement.

