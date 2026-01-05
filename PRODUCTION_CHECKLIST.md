# Checklist de Vérification Production - Socket.io

## ✅ Corrections Appliquées

### 1. Configuration Socket.io Serveur
- ✅ CORS amélioré pour accepter les connexions depuis le même domaine en production
- ✅ Route catch-all modifiée pour ne pas bloquer `/socket.io/`
- ✅ Logging détaillé des requêtes Socket.io en production
- ✅ Routes de diagnostic ajoutées (`/socket.io/test` et `/api/socket-health`)

### 2. Configuration Client
- ✅ Service centralisé de socket avec détection automatique de l'URL
- ✅ Gestion des erreurs améliorée avec logs détaillés
- ✅ Configuration optimisée pour production (polling uniquement)

### 3. Gestion des Erreurs
- ✅ Logs détaillés côté serveur et client
- ✅ Gestion des erreurs 400/502 avec diagnostic
- ✅ Routes de santé pour vérifier l'état du serveur

## 🔍 Vérifications à Faire en Production

### 1. Variables d'Environnement dans Plesk
Vérifiez que ces variables sont définies :
```
CLIENT_URL=https://typingpvp.com
NODE_ENV=production
PORT=3001 (ou le port configuré dans Plesk)
HOST=0.0.0.0
```

### 2. Test des Routes de Diagnostic
Après redémarrage du serveur, testez :
- `https://typingpvp.com/api/health` → doit retourner `{"status":"ok"}`
- `https://typingpvp.com/api/socket-health` → doit retourner les infos Socket.io
- `https://typingpvp.com/socket.io/test` → doit retourner les infos de test

### 3. Vérification des Logs
Dans Plesk → Logs → Node.js Application Logs, vérifiez :
- ✅ Message "Serveur démarré avec succès"
- ✅ Liste des origines Socket.io autorisées
- ✅ Pas d'erreurs de connexion Socket.io

### 4. Test dans le Navigateur
1. Ouvrez la console du navigateur (F12)
2. Allez sur `/battle` et créez une room
3. Vérifiez les logs dans la console :
   - `🔧 URL API détectée automatiquement (production): https://typingpvp.com`
   - `🔌 Création d'une nouvelle connexion socket vers: https://typingpvp.com`
   - `✅ Socket connecté: [socket-id]`

### 5. Vérification des Erreurs
Si vous voyez encore des erreurs 400/502 :
1. Vérifiez que le serveur Node.js est démarré dans Plesk
2. Vérifiez les logs du serveur pour voir les erreurs exactes
3. Vérifiez que le port dans Plesk correspond à celui dans les variables d'environnement
4. Vérifiez qu'il n'y a pas de proxy/reverse proxy qui bloque Socket.io

## 🚨 Problèmes Connus et Solutions

### Erreur 400 Bad Request
**Cause possible** : Le serveur rejette la requête Socket.io
**Solution** :
- Vérifiez les logs du serveur pour voir l'erreur exacte
- Vérifiez que CORS est correctement configuré
- Vérifiez que la route catch-all ne bloque pas Socket.io

### Erreur 502 Bad Gateway
**Cause possible** : Le serveur backend n'est pas accessible
**Solution** :
- Vérifiez que le serveur Node.js est démarré dans Plesk
- Vérifiez que le port est correct
- Vérifiez qu'il n'y a pas de problème de routage/proxy

### Connexions en boucle
**Cause possible** : Le client essaie de se reconnecter en boucle
**Solution** :
- Vérifiez que le service centralisé de socket est utilisé partout
- Vérifiez que les listeners sont correctement nettoyés
- Vérifiez les logs pour voir pourquoi la connexion échoue

## 📝 Notes Importantes

1. **Redémarrage requis** : Après chaque modification, redémarrez le serveur Node.js dans Plesk
2. **Build du client** : Si vous modifiez le code client, le build sera fait automatiquement par `app.js`
3. **Logs** : Les logs sont votre meilleur ami pour diagnostiquer les problèmes
4. **Polling uniquement** : Socket.io est configuré pour utiliser uniquement polling (pas WebSocket) pour compatibilité avec Plesk

## 🔄 Prochaines Étapes

Si les problèmes persistent après ces vérifications :
1. Partagez les logs du serveur (Plesk → Logs → Node.js Application Logs)
2. Partagez les logs de la console du navigateur
3. Partagez le résultat de `/api/socket-health`

