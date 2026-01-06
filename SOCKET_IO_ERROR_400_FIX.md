# Correction Erreurs 400 Socket.IO - Session Invalide

## Problème

Les erreurs HTTP 400 (Bad Request) persistent même après l'augmentation des timeouts. Ces erreurs indiquent que la session Socket.IO (sid) est devenue invalide ou expirée.

**Exemple d'erreur** :
```
GET https://typingpvp.com/socket.io/?EIO=4&transport=polling&t=le7hs2n0&sid=Wg3nUaeKziNHCYYaAAAA 400 (Bad Request)
```

## Cause

Les erreurs HTTP 400 dans Socket.IO polling peuvent survenir quand :
1. La session (sid) a expiré sur le serveur (timeout)
2. Le reverse proxy a un timeout plus court que le serveur Socket.IO
3. Socket.IO ne détecte pas toujours ces erreurs 400 comme nécessitant une reconnexion automatique

## Solution Appliquée

### 1. Timeouts Encore Augmentés

**Serveur** (`server/index.js`) :
- `pingTimeout`: 60s → **90s** (90 secondes)
- `pingInterval`: 25s → **30s** (30 secondes)
- `connectTimeout`: 45s → **60s** (60 secondes)

**Client** (`client/src/services/socketService.js`) :
- `timeout`: 45s → **60s** (60 secondes)

### 2. Détection Automatique des Erreurs 400

Le client détecte maintenant automatiquement les erreurs 400 et force une reconnexion :

```javascript
socket.on('connect_error', (error) => {
  // Si erreur 400, forcer reconnexion
  if (error.message.includes('400') || error.message.includes('Bad Request')) {
    socket.disconnect();
    socket.connect();
  }
});
```

### 3. Interception des Erreurs de Transport

Les erreurs HTTP 400 peuvent aussi se produire au niveau du transport (polling) sans déclencher automatiquement une reconnexion. On intercepte ces erreurs :

```javascript
socket.io.on('error', (error) => {
  if (error.message && error.message.includes('400')) {
    // Forcer reconnexion
    socket.disconnect();
    socket.connect();
  }
});
```

### 4. Recréation Automatique du Socket

Si le socket reste déconnecté plus de 5 secondes, il est automatiquement recréé :

```javascript
if (socketInstance && !socketInstance.connected) {
  setTimeout(() => {
    if (!socketInstance.connected) {
      socketInstance.disconnect();
      socketInstance = null;
      socketInstance = createSocket();
    }
  }, 5000);
}
```

### 5. Logs Serveur Améliorés

Le serveur vérifie maintenant si la session existe vraiment quand il reçoit une erreur 400 :

```javascript
if (res.statusCode === 400 && req.query?.sid) {
  const session = io.engine.clients.get(req.query.sid);
  if (!session) {
    console.error('❌ Session non trouvée - Session expirée');
  }
}
```

## Résultat Attendu

1. **Timeouts plus longs** : Les sessions devraient durer plus longtemps (90s au lieu de 60s)
2. **Reconnexion automatique** : Les erreurs 400 déclenchent maintenant une reconnexion immédiate
3. **Résilience améliorée** : Le socket est recréé automatiquement s'il reste déconnecté

## Notes Importantes

- **Redémarrage nécessaire** : Le serveur doit être redémarré pour que les nouveaux timeouts prennent effet
- **Configuration Apache** : Si les erreurs persistent, vérifier que le timeout Apache est supérieur à 90 secondes
- **Monitoring** : Surveiller les logs pour voir si les erreurs 400 diminuent

## Configuration Apache Recommandée

Si les erreurs persistent, ajouter dans la configuration Apache :

```apache
ProxyTimeout 120
Timeout 120
```

Ces valeurs doivent être supérieures au `pingTimeout` (90s) du serveur Socket.IO.

