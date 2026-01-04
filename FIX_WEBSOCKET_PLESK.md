# Correction des WebSockets Socket.io sur Plesk

## 🔍 Problème

Les connexions WebSocket Socket.io échouent :
```
WebSocket connection to 'wss://typingpvp.com/socket.io/?EIO=4&transport=websocket&sid=...' failed
```

## 🎯 Cause

Plesk/nginx ne proxie pas correctement les WebSockets vers le serveur Node.js, ou la configuration Socket.io n'est pas adaptée pour Plesk.

## ✅ Solutions

### Solution 1 : Forcer Socket.io à utiliser polling (Recommandé pour Plesk)

Modifier `client/src/services/socketService.js` pour forcer l'utilisation de polling :

```javascript
export function createSocket() {
  return io(API_URL, {
    transports: ['polling'], // Forcer polling au lieu de websocket
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
  });
}
```

**Avantages :**
- Fonctionne toujours, même si WebSockets ne sont pas supportés
- Plus compatible avec les proxies/reverse proxy
- Pas besoin de configuration supplémentaire

**Inconvénients :**
- Légèrement plus lent que WebSockets (mais négligeable)
- Plus de requêtes HTTP

### Solution 2 : Configurer nginx pour les WebSockets (Avancé)

Si vous voulez utiliser WebSockets, vous devez configurer nginx dans Plesk :

1. Allez dans **Domains** → **typingpvp.com** → **Apache & nginx Settings**
2. Dans **Additional directives for nginx**, ajoutez :

```nginx
location /socket.io {
    proxy_pass http://localhost:3001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
}
```

**Note :** Cette configuration devrait être gérée automatiquement par Plesk Node.js, mais parfois elle ne l'est pas.

### Solution 3 : Utiliser polling avec fallback WebSocket (Hybride)

Permettre les deux transports, avec polling en priorité :

```javascript
export function createSocket() {
  return io(API_URL, {
    transports: ['polling', 'websocket'], // Essayer polling d'abord, puis websocket
    upgrade: true,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
  });
}
```

## 🔧 Modification recommandée

Pour Plesk, la **Solution 1 (polling uniquement)** est la plus simple et la plus fiable.

### Fichier à modifier : `client/src/services/socketService.js`

Remplacer :
```javascript
transports: ['websocket', 'polling'],
```

Par :
```javascript
transports: ['polling'],
```

## 📝 Fichiers à modifier

1. `client/src/services/socketService.js` - Service centralisé (RECOMMANDÉ)
2. Vérifier aussi les fichiers qui créent des sockets directement :
   - `client/src/pages/Battle.jsx`
   - `client/src/pages/Matchmaking.jsx`
   - `client/src/pages/BattleRoom.jsx`
   - `client/src/pages/CompetitionRoom.jsx`
   - `client/src/pages/Competitions.jsx`

## ✅ Après modification

1. Rebuild le client : `cd client && npm run build`
2. Redéployer `client/dist/` sur Plesk (ou laisser `app.js` rebuilder automatiquement)
3. Redémarrer l'application dans Plesk
4. Tester : Les sockets devraient fonctionner avec polling

## 🔍 Vérification

Dans la console du navigateur, vous devriez voir :
- Plus d'erreurs WebSocket
- Les connexions Socket.io fonctionnent (via polling)
- Les fonctionnalités en temps réel (matchmaking, rooms, etc.) fonctionnent

## ⚠️ Note

Socket.io avec polling fonctionne très bien et est souvent plus fiable que WebSockets dans des environnements avec reverse proxy. La différence de performance est négligeable pour la plupart des applications.

