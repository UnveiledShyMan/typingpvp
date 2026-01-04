# Fichiers d'environnement créés

## ⚠️ Important : URL Railway

L'URL `https://typingpvp.railway.internal` est une URL **interne Railway** qui ne fonctionne **pas depuis le navigateur**.

Pour que le client (frontend) puisse se connecter au backend, vous devez utiliser l'URL **publique** Railway.

### Trouver l'URL publique Railway

1. Allez sur https://railway.app
2. Sélectionnez votre projet backend
3. Onglet "Settings" → "Networking" ou "Domains"
4. Copiez l'URL du domaine public (ex: `typingpvp-production.up.railway.app`)

### Correction nécessaire

Modifiez `client/.env.production` pour utiliser l'URL publique :

```
VITE_API_URL=https://votre-url-publique-railway.up.railway.app
```

Puis rebuild le client :
```bash
cd client
npm run build
```

## 📁 Fichiers créés

### 1. `.nodeenv` (à la racine)
Contient toutes les variables (pour référence)

**⚠️ Note** : Ce fichier n'est pas utilisé automatiquement par Node.js ou Vite. C'est juste pour référence.

### 2. `client/.env.production` (pour Vite)
Utilisé par Vite lors du build du client.

**Contient** :
- `VITE_API_URL` : URL du backend Railway

**⚠️ IMPORTANT** : Changez l'URL pour l'URL publique Railway avant de builder !

## 🔐 Sécurité

### Variables qui NE doivent PAS être dans le client

- `JWT_SECRET` : Secret pour signer les tokens (backend uniquement)
- `RAILWAY_TOKEN` : Token Railway (backend uniquement)
- `NODE_ENV` : Géré automatiquement par Vite

Ces variables sont **seulement pour le backend** (Railway) et ne doivent **jamais** être dans le code du client car elles seraient exposées publiquement.

## 📝 Configuration correcte

### Pour le Client (Frontend sur Plesk)

**Fichier** : `client/.env.production`
```
VITE_API_URL=https://votre-url-publique-railway.up.railway.app
```

Puis builder :
```bash
cd client
npm run build
```

### Pour le Backend (Railway)

Dans Railway, ajoutez ces variables d'environnement :

```
NODE_ENV=production
JWT_SECRET=jazieouazhejiahwzjehazI123123H1H23H321H
CLIENT_URL=https://typingpvp.com
```

(RAILWAY_TOKEN n'est généralement pas nécessaire comme variable d'environnement)

## ✅ Checklist

- [ ] Trouver l'URL publique Railway
- [ ] Modifier `client/.env.production` avec l'URL publique
- [ ] Rebuild le client : `cd client && npm run build`
- [ ] Uploader les nouveaux fichiers sur Plesk
- [ ] Vérifier que le site se connecte au backend

