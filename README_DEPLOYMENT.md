# Guide de déploiement TypingPVP

## 🚀 Démarrage rapide

### Installation de toutes les dépendances

```bash
npm run install:all
```

Cette commande installe les dépendances pour :
- Le projet racine
- Le client (React/Vite)
- Le serveur (Node.js/Express)

### Démarrage en développement

```bash
npm run dev
```

Cette commande démarre :
- **Serveur API** sur `http://localhost:3001`
- **Client React** sur `http://localhost:5173`

Les deux processus tournent en parallèle et communiquent automatiquement.

## 📋 Scripts disponibles

### Installation
- `npm run install:all` - Installe toutes les dépendances (racine, client, serveur)

### Développement
- `npm run dev` - Démarre serveur + client en parallèle (ports différents)
- `npm run dev:server` - Démarre uniquement le serveur (port 3001)
- `npm run dev:client` - Démarre uniquement le client (port 5173)

### Production
- `npm start` - Démarre serveur + client (même comportement que `npm run dev`)
- `npm run start:server` - Démarre uniquement le serveur
- `npm run start:client` - Démarre uniquement le client

### Build
- `npm run build` - Build le client pour la production
- `npm run build:client` - Alias de `npm run build`

## 🔧 Configuration des ports

### Par défaut
- **Serveur API** : Port `3001`
- **Client** : Port `5173`

### Personnaliser les ports

Via variables d'environnement :

```bash
PORT=3002 npm run dev          # Serveur sur port 3002
CLIENT_PORT=5174 npm run dev   # Client sur port 5174
```

Ou dans un fichier `.env` :
```
PORT=3002
CLIENT_PORT=5174
```

## 🌐 Architecture

### Mode développement (npm run dev)
- Serveur et client sont **séparés** sur des ports différents
- Le client fait des requêtes API vers le serveur
- Hot reload activé pour le client (Vite)
- Pas de conflit de ports

### Mode production (Plesk)
- Le serveur peut servir le client (si `SERVE_CLIENT=true`)
- Ou le client peut être servi séparément (nginx, etc.)
- Configuration via `app.js` pour Plesk

## 📦 Structure

```
typingpvp/
├── app.js              # Point d'entrée pour Plesk (auto-install, build, init DB)
├── start.js            # Script pour démarrer serveur + client séparément
├── package.json        # Scripts npm principaux
├── client/             # Application React
│   ├── package.json    # Scripts client
│   └── vite.config.js  # Configuration Vite (port 5173)
└── server/             # API Node.js
    ├── package.json    # Scripts serveur
    └── index.js        # Serveur Express (port 3001)
```

## 🔍 Vérification

### Vérifier que tout fonctionne

1. **Serveur API** : http://localhost:3001/api/health
   - Devrait retourner : `{"status":"ok"}`

2. **Client** : http://localhost:5173
   - Devrait afficher l'interface React

3. **Communication** : Le client devrait pouvoir se connecter au serveur
   - Vérifiez la console du navigateur pour les erreurs CORS

## ⚠️ Troubleshooting

### Port déjà utilisé

Si un port est déjà utilisé, changez-le via les variables d'environnement :
```bash
PORT=3002 CLIENT_PORT=5174 npm run dev
```

### Erreur "Cannot find module"

Exécutez :
```bash
npm run install:all
```

### Le client ne se connecte pas au serveur

Vérifiez que :
1. Le serveur est bien démarré sur le port 3001
2. Le client a `VITE_API_URL=http://localhost:3001` dans son `.env`
3. CORS est bien configuré dans le serveur

