# Fix: Erreurs Socket.IO 400 avec Phusion Passenger

## Problème Identifié

Vous utilisez **Phusion Passenger** (visible dans les headers: `x-powered-by: Phusion Passenger(R) 6.1.0`).

**Le problème** : Phusion Passenger peut redémarrer votre application Node.js périodiquement, ce qui **tue toutes les sessions Socket.IO en mémoire**. Quand une session est perdue, les requêtes suivantes avec ce `sid` génèrent des erreurs **400 (Bad Request)**.

## Causes Possibles

1. **Passenger redémarre l'application** (déploiement, idle timeout, crash)
2. **Les sessions Socket.IO sont stockées en mémoire** (perdues au redémarrage)
3. **Le client essaie d'utiliser une session invalide** (cookie `io` différent du `sid` dans l'URL)

## Solutions

### Solution 1 : Désactiver l'Idle Timeout de Passenger (RECOMMANDÉ)

Dans votre configuration Plesk, désactivez l'idle timeout pour éviter que Passenger tue l'application :

**Via `.htaccess` ou configuration Passenger** :
```apache
PassengerMaxInstances 1
PassengerMinInstances 1
PassengerMaxPreloaderIdleTime 0
```

### Solution 2 : Utiliser un Process Manager Stable (ALTERNATIVE)

Au lieu de Passenger, utilisez PM2 ou directement Node.js avec un reverse proxy :

1. **PM2** : Gère mieux les applications Node.js avec Socket.IO
2. **Node.js direct** : Plus de contrôle, mais nécessite une configuration nginx/Apache manuelle

### Solution 3 : Améliorer la Gestion des Sessions Expirées (DÉJÀ IMPLÉMENTÉ)

Le code actuel force déjà une reconnexion automatique lors des erreurs 400. C'est la meilleure approche à court terme.

## Configuration Passenger Recommandée

Si vous devez utiliser Passenger, configurez-le ainsi :

1. **Désactiver l'idle timeout** :
   - Dans Plesk : Node.js Settings → Passenger Idle Timeout → 0 (désactivé)

2. **Augmenter les timeouts** :
   - Passenger Max Request Time → 300 secondes
   - Passenger Pool Idle Time → 0 (pas de timeout)

3. **Stabiliser l'application** :
   - Passenger Min Instances → 1
   - Passenger Max Instances → 1 (pour Socket.IO, une instance est mieux)

## Vérification

Pour vérifier si Passenger redémarre l'application, ajoutez ce log dans `server/index.js` :

```javascript
// Au démarrage du serveur
console.log('🚀 Serveur démarré à:', new Date().toISOString());
console.log('📊 Process ID:', process.pid);
```

Si vous voyez ce message plusieurs fois dans les logs, c'est que Passenger redémarre l'application.

## Solution Immédiate

Les corrections déjà appliquées (reconnexion automatique sur erreur 400) devraient masquer le problème pour l'utilisateur, mais la cause racine reste : Passenger redémarre l'application.

**Action recommandée** : Désactivez l'idle timeout dans la configuration Passenger de Plesk.
