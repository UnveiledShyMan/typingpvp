# Structure du Projet - TypingPVP

## Vue d'ensemble

Application de dactylographie compétitive avec système MMR/ELO, battles 1v1, compétitions multijoueurs et matchmaking automatique.

## Architecture

```
lahaine/
├── client/                          # Application React (Frontend)
│   ├── src/
│   │   ├── components/             # Composants réutilisables
│   │   │   ├── icons/              # Icônes SVG
│   │   │   ├── Header.jsx          # Header (ancien, peut être supprimé)
│   │   │   ├── LanguageSelector.jsx
│   │   │   ├── Layout.jsx          # Layout (ancien, peut être supprimé)
│   │   │   └── Sidebar.jsx         # Sidebar (ancien, peut être supprimé)
│   │   │
│   │   ├── pages/                  # Pages/Écrans
│   │   │   ├── MainPage.jsx        # Page principale (one-page app)
│   │   │   ├── Solo.jsx            # Mode solo
│   │   │   ├── Battle.jsx          # Création/rejoindre battle
│   │   │   ├── BattleRoom.jsx      # Room de battle 1v1
│   │   │   ├── Competitions.jsx    # Liste des compétitions
│   │   │   ├── CompetitionRoom.jsx # Room de compétition
│   │   │   ├── Matchmaking.jsx     # Matchmaking automatique
│   │   │   ├── Rankings.jsx        # Classements
│   │   │   ├── Profile.jsx         # Profil utilisateur
│   │   │   ├── Login.jsx           # Connexion
│   │   │   ├── Register.jsx        # Inscription
│   │   │   └── Home.jsx            # Home (ancien, peut être supprimé)
│   │   │
│   │   ├── hooks/                  # Hooks React personnalisés
│   │   │   └── useAuth.js          # Hook d'authentification
│   │   │
│   │   ├── services/               # Services métier
│   │   │   ├── apiService.js       # Service API REST
│   │   │   └── socketService.js    # Service Socket.io
│   │   │
│   │   ├── constants/              # Constantes et configurations
│   │   │   ├── routes.js           # Routes de navigation
│   │   │   ├── socketEvents.js     # Événements Socket.io
│   │   │   └── gameConfig.js       # Configuration du jeu
│   │   │
│   │   ├── utils/                  # Utilitaires
│   │   │   ├── elo.js              # Utilitaires ELO (client)
│   │   │   └── ranks.js            # Utilitaires rangs (client)
│   │   │
│   │   ├── data/                   # Données statiques
│   │   │   └── languages.js        # Mots par langue
│   │   │
│   │   ├── App.jsx                 # Composant racine
│   │   ├── main.jsx                # Point d'entrée
│   │   └── index.css               # Styles globaux
│   │
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
│
└── server/                          # API Node.js/Express (Backend)
    ├── routes/                      # Routes API REST
    │   ├── auth.js                 # Authentification
    │   ├── users.js                # Utilisateurs
    │   ├── rankings.js             # Classements
    │   └── me.js                   # Endpoint /me
    │
    ├── models/                      # Modèles de données
    │   └── User.js                 # Modèle User
    │
    ├── middleware/                  # Middlewares Express
    │   └── auth.js                 # Middleware d'authentification JWT
    │
    ├── services/                    # Services métier (à créer)
    │
    ├── utils/                       # Utilitaires backend
    │   ├── elo.js                  # Calcul ELO/MMR
    │   └── ranks.js                # Système de rangs
    │
    ├── scripts/                     # Scripts utilitaires
    │   └── seedUsers.js            # Seed de base de données
    │
    ├── db.js                        # Base de données (en mémoire)
    ├── index.js                     # Point d'entrée serveur
    └── package.json
```

## Flux de Données

### Authentification
1. User → `Login.jsx` / `Register.jsx`
2. → `authService.login()` / `authService.register()`
3. → Backend `/api/auth/login` ou `/api/auth/register`
4. → Token JWT stocké dans `localStorage`
5. → `useAuth` hook met à jour l'état utilisateur

### Battle 1v1
1. User → `Battle.jsx` → Créer/Rejoindre room
2. → Socket.io `create-room` / `join-room`
3. → Backend crée/ajoute à la room
4. → `BattleRoom.jsx` → Gameplay en temps réel
5. → Socket.io `update-progress` / `finish-game`
6. → Backend calcule résultats et met à jour MMR

### Matchmaking
1. User → `Matchmaking.jsx` → Join queue
2. → Socket.io `join-matchmaking`
3. → Backend trouve match basé sur MMR
4. → Socket.io `matchmaking-match-found`
5. → Redirection vers `BattleRoom.jsx`

### Compétitions
1. User → `Competitions.jsx` → Créer/Rejoindre compétition
2. → Socket.io `create-competition` / `join-competition`
3. → Backend crée/gère compétition
4. → `CompetitionRoom.jsx` → Gameplay multijoueur
5. → Socket.io `competition-progress` / `competition-finished`
6. → Backend calcule classement en temps réel

## Technologies

### Frontend
- **React 18** : Bibliothèque UI
- **React Router** : Routage
- **Socket.io Client** : Communication temps réel
- **Tailwind CSS** : Styling
- **Recharts** : Graphiques
- **Vite** : Build tool

### Backend
- **Node.js** : Runtime
- **Express** : Framework web
- **Socket.io** : WebSockets
- **JWT** : Authentification
- **bcryptjs** : Hash passwords
- **nanoid** : Génération d'IDs

## Conventions de Nommage

Voir `CONVENTIONS.md` pour les détails complets.

### Résumé
- **Composants** : PascalCase (`BattleRoom.jsx`)
- **Hooks** : camelCase avec `use` (`useAuth.js`)
- **Services** : camelCase (`apiService.js`)
- **Constantes** : camelCase (`routes.js`)
- **Événements Socket** : kebab-case (`join-room`)
- **Routes API** : RESTful (`/api/users/:id`)

## Points d'Entrée

### Frontend
- `client/src/main.jsx` → `App.jsx` → `MainPage.jsx`

### Backend
- `server/index.js` → Express + Socket.io

## Configuration

### Variables d'Environnement

**Frontend** (`.env`):
```
VITE_API_URL=http://localhost:3001
```

**Backend** (`.env`):
```
PORT=3001
JWT_SECRET=your-secret-key-change-in-production
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

## Prochaines Étapes pour Android

1. ✅ Structure organisée
2. ✅ Constantes centralisées
3. ✅ Services centralisés
4. ✅ Hooks réutilisables
5. ⏳ Refactoriser les composants pour utiliser les services
6. ⏳ Ajouter gestion d'erreurs globale
7. ⏳ Optimiser pour mobile (responsive)
8. ⏳ Configuration pour build Android (React Native ou PWA)
9. ⏳ Tests unitaires
10. ⏳ Documentation API

## Checklist Play Store

- [x] Structure de dossiers organisée
- [x] Nomenclature cohérente
- [x] Services centralisés
- [x] Constantes centralisées
- [x] Documentation
- [ ] Gestion d'erreurs cohérente
- [ ] Tests
- [ ] Performance optimisée
- [ ] Accessibilité
- [ ] Responsive design (mobile-first)
- [ ] Configuration build Android

