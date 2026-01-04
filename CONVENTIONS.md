# Conventions de Nommage et Architecture

## Structure du Projet

```
lahaine/
├── client/                 # Application React (Frontend)
│   ├── src/
│   │   ├── components/     # Composants réutilisables
│   │   ├── pages/          # Pages/Écrans de l'application
│   │   ├── hooks/          # Hooks React personnalisés
│   │   ├── services/       # Services (API, Socket, etc.)
│   │   ├── constants/      # Constantes et configurations
│   │   ├── utils/          # Fonctions utilitaires
│   │   ├── data/           # Données statiques
│   │   └── styles/         # Styles globaux
│   └── package.json
│
└── server/                 # API Node.js/Express (Backend)
    ├── routes/             # Routes API
    ├── models/             # Modèles de données
    ├── middleware/         # Middlewares Express
    ├── services/           # Services métier
    ├── utils/              # Utilitaires backend
    ├── scripts/            # Scripts utilitaires
    └── package.json
```

## Conventions de Nommage

### Fichiers et Dossiers

#### Frontend (React)
- **Composants** : PascalCase
  - ✅ `MainPage.jsx`, `BattleRoom.jsx`, `LanguageSelector.jsx`
  - ✅ `CompetitionIcon.jsx`, `SwordIcon.jsx`
  
- **Hooks personnalisés** : camelCase avec préfixe `use`
  - ✅ `useAuth.js`, `useSocket.js`, `useTyping.js`
  
- **Services** : camelCase
  - ✅ `apiService.js`, `socketService.js`, `authService.js`
  
- **Constantes** : camelCase
  - ✅ `routes.js`, `socketEvents.js`, `apiEndpoints.js`
  
- **Utilitaires** : camelCase
  - ✅ `elo.js`, `ranks.js`, `formatUtils.js`
  
- **Données statiques** : camelCase
  - ✅ `languages.js`, `config.js`

#### Backend (Node.js)
- **Fichiers** : camelCase
  - ✅ `auth.js`, `users.js`, `elo.js`
  
- **Routes** : camelCase (pluriel pour les ressources)
  - ✅ `auth.js`, `users.js`, `rankings.js`, `me.js`
  
- **Modèles** : PascalCase
  - ✅ `User.js`, `Room.js`, `Competition.js`
  
- **Services** : camelCase
  - ✅ `authService.js`, `matchmakingService.js`

### Variables et Fonctions

#### JavaScript/React
- **Composants React** : PascalCase
  ```jsx
  export default function BattleRoom() { }
  export default function MainPage() { }
  ```
  
- **Fonctions** : camelCase
  ```javascript
  const fetchCurrentUser = async () => { }
  const handleSubmit = () => { }
  const calculateWPM = () => { }
  ```
  
- **Constantes** : UPPER_SNAKE_CASE ou camelCase selon le contexte
  ```javascript
  const API_URL = 'http://localhost:3001';
  const MAX_PLAYERS = 50;
  const TIME_LIMIT = 60;
  ```
  
- **Variables** : camelCase
  ```javascript
  const [activeSection, setActiveSection] = useState('solo');
  const playerName = 'John';
  const gameStatus = 'waiting';
  ```
  
- **États React** : camelCase avec préfixe approprié
  ```javascript
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  ```

#### Backend
- **Variables** : camelCase
  ```javascript
  const userId = req.user.id;
  const matchmakingQueue = new Map();
  ```
  
- **Fonctions** : camelCase
  ```javascript
  function getUserById(id) { }
  async function createUser() { }
  function calculateNewMMR() { }
  ```

### Événements Socket.io

**Format** : `kebab-case` (minuscules avec tirets)
- ✅ `join-room`, `create-room`, `game-started`
- ✅ `competition-joined`, `competition-started`
- ✅ `update-progress`, `finish-game`
- ❌ `joinRoom`, `createRoom`, `gameStarted`

### Routes API

**Format** : RESTful avec kebab-case ou camelCase
- ✅ `/api/auth/login`
- ✅ `/api/users/:id`
- ✅ `/api/rankings/:language`
- ✅ `/api/me`

### Types de Données

#### États de Jeu
- `waiting` : En attente de joueurs
- `starting` : Démarrage (countdown)
- `playing` : En cours
- `finished` : Terminé

#### Statuts de Room/Competition
- `waiting` : En attente
- `starting` : Démarrage
- `playing` : En cours
- `finished` : Terminé

## Standards de Code

### Importations
Ordre recommandé :
1. React et hooks
2. Bibliothèques tierces
3. Composants locaux
4. Services/Utils
5. Constantes
6. Types (si TypeScript)

```javascript
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { io } from 'socket.io-client'

import LanguageSelector from '../components/LanguageSelector'
import { fetchCurrentUser } from '../services/authService'
import { API_ENDPOINTS } from '../constants/routes'
```

### Exportations
- **Composants** : `export default function ComponentName() { }`
- **Fonctions utilitaires** : `export function functionName() { }` ou `export const functionName = () => { }`
- **Constantes** : `export const CONSTANT_NAME = 'value';`

### Gestion d'Erreurs
- Utiliser `try/catch` pour les opérations async
- Logger les erreurs : `console.error('Error context:', error)`
- Afficher des messages utilisateur clairs

### Commentaires
- Commenter les logiques complexes
- Utiliser des commentaires JSDoc pour les fonctions importantes
- Éviter les commentaires évidents

## Structure des Composants

### Composant Page
```jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import Header from '../components/Header'
import { fetchData } from '../services/apiService'

export default function PageName() {
  // 1. États
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  
  // 2. Hooks
  const navigate = useNavigate()
  
  // 3. Effects
  useEffect(() => {
    loadData()
  }, [])
  
  // 4. Handlers
  const handleAction = () => { }
  
  // 5. Render
  return (
    <div>
      {/* JSX */}
    </div>
  )
}
```

## Configuration Android/Play Store

### Noms d'Application
- **Nom affiché** : "TypingPVP" ou "Typing PVP"
- **Package name** : `com.typingpvp.app` (format reverse domain)
- **App ID** : Identifiant unique dans le Play Store

### Versioning
- Format : `MAJOR.MINOR.PATCH` (Semantic Versioning)
- Exemple : `1.0.0`, `1.1.0`, `1.1.1`
- Backend et Frontend peuvent avoir des versions différentes mais doivent être compatibles

### Variables d'Environnement
- Utiliser des fichiers `.env` pour la configuration
- Ne jamais commiter les secrets
- Documenter les variables nécessaires dans `.env.example`

## Checklist de Préparation Play Store

- [ ] Nomenclature cohérente dans tout le projet
- [ ] Structure de dossiers organisée
- [ ] Services centralisés (API, Socket)
- [ ] Hooks réutilisables
- [ ] Constantes centralisées
- [ ] Gestion d'erreurs cohérente
- [ ] Documentation complète
- [ ] Configuration environnement
- [ ] Tests (optionnel mais recommandé)
- [ ] Performance optimisée
- [ ] Accessibilité (a11y)
- [ ] Responsive design (mobile-first)

