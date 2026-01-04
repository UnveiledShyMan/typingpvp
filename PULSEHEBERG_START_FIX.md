# Solution : Dépendances non installées sur PulseHeberg

## ❌ Problème

```
Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'express'
```

**Cause** : Les dépendances npm ne sont pas installées dans le dossier `server/` avant le démarrage.

## ✅ Solution

### Option 1 : Ajouter une commande de build (Recommandé)

Dans PulseHeberg, configurez :

1. **Root Directory** : `.` (racine)
2. **Build Command** : `cd server && npm install`
3. **Start Command** : `npm start`

### Option 2 : Installer dans la commande start

Dans PulseHeberg, configurez :

1. **Root Directory** : `.` (racine)
2. **Start Command** : `cd server && npm install && node index.js`

### Option 3 : Utiliser le script install:all (si disponible)

Dans PulseHeberg, configurez :

1. **Root Directory** : `.` (racine)
2. **Build Command** : `npm run install:all`
3. **Start Command** : `npm start`

## 🎯 Configuration recommandée pour PulseHeberg

**Build Command** :
```
cd server && npm install
```

**Start Command** :
```
npm start
```

OU (tout en un) :

**Start Command** :
```
cd server && npm install && node index.js
```

## 📝 Explication

PulseHeberg doit installer les dépendances avant de démarrer l'application. Les dépendances sont listées dans `server/package.json` et doivent être installées dans le dossier `server/` pour que Node.js puisse les trouver.

## 🔍 Vérification

Après configuration, PulseHeberg devrait :
1. Exécuter `cd server && npm install` (installe les dépendances)
2. Exécuter `npm start` (démarre l'application)

Les logs devraient montrer :
- L'installation des packages npm
- Puis : `Server running on port XXXX`

