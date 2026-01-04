# Configuration Railway - Guide Simple

## 🎯 Le problème

Railway ne trouve pas les fichiers du serveur car il cherche à la racine alors que le code est dans `server/`.

## ✅ Solution en 3 étapes

### 1. Dans Railway Dashboard

1. Allez sur https://railway.app
2. Sélectionnez votre projet backend
3. **Settings** → **Service**
4. Trouvez **"Root Directory"**
5. Entrez : `server`
6. Cliquez sur **Save**

### 2. Variables d'environnement

Dans **Settings** → **Variables**, ajoutez :

```
JWT_SECRET=jazieouazhejiahwzjehazI123123H1H23H321H
CLIENT_URL=https://typingpvp.com
NODE_ENV=production
```

**⚠️ Ne PAS définir PORT** - Railway le gère automatiquement

### 3. Vérifier les logs

Dans **Logs**, vous devriez voir :
```
Installing dependencies...
> typing-battle-server@1.0.0 start
> node index.js
Server running on 0.0.0.0:XXXX
```

## 📁 Structure attendue

Avec Root Directory = `server`, Railway cherche :
- `server/package.json` ✅
- `server/index.js` ✅
- `server/node_modules/` (créé automatiquement)

## ❌ Si ça ne fonctionne pas

1. Vérifiez que Root Directory = `server` (pas `/server` ni `server/`)
2. Vérifiez les logs pour l'erreur exacte
3. Assurez-vous que `server/package.json` existe et contient `"main": "index.js"`

