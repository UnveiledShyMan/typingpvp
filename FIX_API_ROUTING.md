# Correction du problème de routage API

## 🔍 Problème

Le client reçoit du HTML (`<!doctype`) au lieu de JSON lors des requêtes API.

**Erreur :** `Network error: Unexpected token '<', "<!doctype "... is not valid JSON. Please make sure the server is running on https://typingpvp.com`

## 🎯 Cause

Les requêtes vers `/api/*` retournent `index.html` au lieu de traiter les routes API.

Cela peut être dû à :
1. Le serveur Node.js n'est pas démarré sur Plesk
2. Plesk ne route pas correctement les requêtes `/api/*` vers Node.js
3. Le reverse proxy de Plesk ne est pas configuré correctement

## ✅ Solutions

### Solution 1 : Vérifier que le serveur Node.js est démarré

Dans Plesk :
1. Allez dans **Domains** → **typingpvp.com** → **Node.js**
2. Vérifiez que **Enable Node.js** est activé
3. Vérifiez les logs pour voir si le serveur démarre correctement
4. Cliquez sur **Restart App**

### Solution 2 : Vérifier la configuration Plesk Node.js

**Application Startup File :** `app.js`

**Variables d'environnement :**
```
NODE_ENV=production
PORT=3001
HOST=0.0.0.0
SERVE_CLIENT=true
CLIENT_URL=https://typingpvp.com
# ... autres variables DB_*, JWT_SECRET
```

### Solution 3 : Tester l'API directement

Ouvrez dans votre navigateur :
```
https://typingpvp.com/api/health
```

**Résultat attendu :** `{"status":"ok"}` (JSON)

**Si vous voyez du HTML :** Le serveur Node.js ne répond pas, ou Plesk ne route pas correctement.

### Solution 4 : Vérifier les logs Plesk

Dans Plesk Node.js, regardez les logs. Vous devriez voir :
```
🚀 Démarrage de TypingPVP...
✅ Dépendances serveur installées
✅ Client déjà buildé
✅ Base de données initialisée avec succès
Démarrage du serveur...
Server running on 0.0.0.0:3001
```

### Solution 5 : Configuration Plesk pour reverse proxy

Par défaut, Plesk Node.js devrait automatiquement router toutes les requêtes vers Node.js, y compris `/api/*`.

Si ce n'est pas le cas, vous pouvez configurer un reverse proxy manuellement dans Plesk :
1. Allez dans **Domains** → **typingpvp.com** → **Apache & nginx Settings**
2. Dans **Additional directives for nginx**, ajoutez :
```nginx
location /api {
    proxy_pass http://localhost:3001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}
```

**Note :** Normalement, ce n'est pas nécessaire car Plesk Node.js gère cela automatiquement.

## 🔧 Vérification rapide

1. **API fonctionne ?** : `https://typingpvp.com/api/health` → doit retourner `{"status":"ok"}`
2. **Client s'affiche ?** : `https://typingpvp.com` → doit afficher l'interface React
3. **Serveur démarré ?** : Vérifiez les logs dans Plesk Node.js

## ⚠️ Important

Si `https://typingpvp.com/api/health` retourne du HTML au lieu de JSON, c'est que :
- Le serveur Node.js n'est pas démarré
- Ou Plesk ne route pas correctement les requêtes vers Node.js

Dans ce cas, le problème n'est pas dans le code, mais dans la configuration Plesk.

