# Clarification Architecture - Plesk

## ✅ Sur Plesk : UN SEUL serveur Node.js

Sur Plesk, vous n'avez **PAS besoin** de deux serveurs séparés.

### Architecture Plesk (Production)

```
┌─────────────────────────────────────┐
│   Serveur Node.js (port 3001)      │
│   (app.js → server/index.js)       │
├─────────────────────────────────────┤
│  - API : /api/*                    │
│  - Client : fichiers depuis        │
│    client/dist/ (fichiers statiques)│
└─────────────────────────────────────┘
```

**Un seul processus Node.js qui fait tout !**

### Comment ça marche

1. **Plesk démarre** : `app.js`
2. **app.js démarre** : `server/index.js`
3. **server/index.js** (avec `SERVE_CLIENT=true`) :
   - Sert l'API sur `/api/*`
   - Sert les fichiers statiques depuis `client/dist/`
   - Route catch-all pour React Router

## ❌ Architecture développement local (2 serveurs)

En développement local seulement, on utilise 2 serveurs séparés :

```
Serveur Node.js (port 3001)  →  API seulement
Client Vite (port 5173)      →  Interface React
```

Mais sur Plesk, c'est **UN SEUL serveur** qui fait tout.

## 🔧 Configuration Plesk

### Variables d'environnement

```
NODE_ENV=production
PORT=3001
HOST=0.0.0.0
SERVE_CLIENT=true          ← IMPORTANT : Le serveur sert aussi le client
CLIENT_URL=https://typingpvp.com
DB_HOST=localhost
DB_PORT=5432
DB_NAME=votre_nom_db
DB_USER=votre_user_db
DB_PASSWORD=votre_password_db
JWT_SECRET=votre_secret_jwt
```

### Application Startup File

```
app.js
```

**C'est tout !** Pas besoin de configurer deux applications.

## 🔍 Si "ça n'affiche plus rien"

Causes possibles :

1. **Le serveur ne démarre pas**
   - Vérifiez les logs dans Plesk Node.js
   - Cherchez "Server running on 0.0.0.0:3001"

2. **Le client n'est pas buildé**
   - Vérifiez que `client/dist/index.html` existe
   - Si absent, `app.js` devrait le builder automatiquement

3. **SERVE_CLIENT n'est pas défini**
   - Doit être `SERVE_CLIENT=true` dans les variables d'environnement
   - Ou défini automatiquement par `app.js` (ligne 140)

4. **Routes mal configurées**
   - Le serveur doit servir les fichiers statiques AVANT le catch-all
   - Vérifiez l'ordre dans `server/index.js`

## ✅ Checklist

- [ ] Un seul Node.js activé dans Plesk
- [ ] Application Startup File : `app.js`
- [ ] `SERVE_CLIENT=true` dans les variables d'environnement
- [ ] `client/dist/` existe (ou sera buildé automatiquement)
- [ ] Logs montrent "Server running on 0.0.0.0:3001"
- [ ] `https://typingpvp.com` affiche l'interface
- [ ] `https://typingpvp.com/api/health` retourne `{"status":"ok"}`

## 📝 Résumé

**Plesk = 1 serveur Node.js qui fait tout**
- API + Client dans le même processus
- Pas besoin de deux applications Node.js
- Configuration simple : juste `app.js`

