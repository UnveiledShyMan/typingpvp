# Solution pour le build sur PulseHeberg

## ❌ Problème

```
sh: 1: vite: not found
```

**Cause** : Les dépendances npm ne sont pas installées dans le dossier `client/` avant le build.

## ✅ Solutions

### Solution 1 : Modifier le script de build (Recommandé)

Modifiez le `package.json` à la racine pour installer les dépendances avant de build :

```json
{
  "scripts": {
    "build": "cd client && npm install && npm run build"
  }
}
```

Ou créez un script spécifique pour PulseHeberg :

```json
{
  "scripts": {
    "build": "cd client && npm install && npm run build",
    "build:client": "cd client && npm install && npm run build"
  }
}
```

### Solution 2 : Utiliser un script de build personnalisé

Créez un fichier `build.sh` à la racine :

```bash
#!/bin/bash
cd client
npm install
npm run build
```

Puis dans PulseHeberg, configurez :
- **Build Command** : `bash build.sh` ou `chmod +x build.sh && ./build.sh`

### Solution 3 : Configuration PulseHeberg complète

Dans le panneau PulseHeberg, configurez :

1. **Root Directory** : `client` (si vous voulez build seulement le client)
   - **Build Command** : `npm install && npm run build`
   - **Output Directory** : `dist`

2. **OU Root Directory** : `.` (racine du projet)
   - **Build Command** : `cd client && npm install && npm run build`
   - **Output Directory** : `client/dist`

### Solution 4 : Utiliser un fichier de configuration PulseHeberg

Créez un fichier `.pulseheberg` ou configurez dans le panneau :

```
Build Command: npm run install:all && npm run build
```

Et ajoutez dans `package.json` à la racine :

```json
{
  "scripts": {
    "install:all": "npm install && cd client && npm install",
    "build": "cd client && npm run build"
  }
}
```

## 🚀 Configuration recommandée pour PulseHeberg

### Option A : Build du client uniquement

**Dans PulseHeberg :**
- **Root Directory** : `client`
- **Build Command** : `npm install && npm run build`
- **Output Directory** : `dist`
- **Start Command** : (vide, car c'est juste un build statique)

### Option B : Build depuis la racine

**Dans PulseHeberg :**
- **Root Directory** : `.` (racine)
- **Build Command** : `cd client && npm install && npm run build`
- **Output Directory** : `client/dist`

## 📝 Modification à faire

Modifiez votre `package.json` à la racine :

```json
{
  "scripts": {
    "build": "cd client && npm install && npm run build",
    "install:all": "npm install && cd client && npm install && cd ../server && npm install"
  }
}
```

## 🔍 Vérification

Après modification, testez localement :

```bash
cd client
npm install
npm run build
```

Si ça fonctionne localement, ça devrait fonctionner sur PulseHeberg.

## 💡 Alternative : Utiliser Vercel pour le frontend

Si PulseHeberg pose trop de problèmes pour le build du client, utilisez **Vercel** pour le frontend (gratuit et optimisé pour React/Vite) :

1. **Vercel** : https://vercel.com
2. **"Add New Project"**
3. **Importer depuis GitHub** : `UnveiledShyMan/typingpvp`
4. **Configuration** :
   - Root Directory : `client`
   - Build Command : `npm run build`
   - Output Directory : `dist`
   - Install Command : `npm install`

Vercel est spécialement conçu pour les apps React/Vite et gère automatiquement tout ça !

