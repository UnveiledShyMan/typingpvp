# Solution : Port déjà utilisé sur PulseHeberg

## ❌ Problème

```
Error: listen EADDRINUSE: address already in use :::3001
```

**Cause** : Le port 3001 est déjà utilisé, ou PulseHeberg ne fournit pas la variable `PORT` correctement.

## ✅ Solution appliquée

J'ai modifié `server/index.js` pour :
1. Écouter sur `0.0.0.0` (toutes les interfaces) au lieu de localhost
2. Utiliser la variable d'environnement `PORT` fournie par PulseHeberg

## 🔧 Configuration PulseHeberg

### Variables d'environnement à ajouter

Dans PulseHeberg, ajoutez ces variables :

```
NODE_ENV=production
PORT=3001 (ou laissez PulseHeberg le définir automatiquement)
HOST=0.0.0.0 (optionnel, par défaut maintenant)
JWT_SECRET=votre-secret-jwt-fort-et-securise
CLIENT_URL=https://votre-domaine-client.com
```

### Note importante

PulseHeberg devrait définir automatiquement la variable `PORT`. Si le problème persiste :

1. **Vérifiez dans PulseHeberg** que la variable `PORT` est bien définie
2. **Ou définissez-la manuellement** : `PORT=3001` (ou le port fourni par PulseHeberg)
3. **Vérifiez qu'il n'y a pas plusieurs instances** qui tournent en même temps

## 🚀 Après la modification

Le serveur écoutera maintenant sur `0.0.0.0:PORT`, ce qui permet à PulseHeberg de router correctement le trafic vers votre application.

## 📝 Test

Après redémarrage, vous devriez voir dans les logs :
```
Server running on 0.0.0.0:XXXX
```

Où `XXXX` est le port fourni par PulseHeberg.

