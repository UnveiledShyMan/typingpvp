# Architecture du Système Compétitif

## Structure créée

### Backend

1. **Modèles** (`server/models/`)
   - `User.js` : Modèle utilisateur avec MMR par langue, stats, avatar, bio

2. **Base de données** (`server/db.js`)
   - Stockage en mémoire (facilement migrable vers MongoDB/PostgreSQL)
   - Fonctions CRUD pour les utilisateurs
   - Fonction de classement par langue

3. **Système ELO** (`server/utils/elo.js`)
   - Calcul MMR basé sur le système ELO
   - Rangs comme League of Legends (Bronze → Challenger)
   - K-factor de 32 (standard)

4. **Routes API**
   - `/api/auth` : Inscription/Connexion (JWT)
   - `/api/users/:id` : Profil utilisateur
   - `/api/rankings/:language` : Classements par langue

5. **Middleware**
   - Authentification JWT
   - Protection des routes

### Frontend

1. **Pages**
   - `Rankings.jsx` : Classement par langue avec tableaux
   - `Profile.jsx` : Profil utilisateur avec stats, MMR, bio, avatar

2. **Utilitaires**
   - `utils/elo.js` : Fonctions client pour afficher les rangs

## Fonctionnalités implémentées

✅ Système MMR/ELO par langue  
✅ Classements par langue  
✅ Profils utilisateurs (bio, avatar)  
✅ Authentification JWT  
✅ Rangs comme League of Legends  

## À implémenter

❌ Pages Login/Signup  
❌ Upload d'avatar  
❌ Intégration MMR dans les battles (mise à jour après match)  
❌ Système de compétitions multijoueurs  
❌ Matchmaking automatique  

## Prochaines étapes

1. Créer pages Login/Signup
2. Intégrer MMR dans les battles (mettre à jour après chaque match)
3. Créer système de lobby/compétitions multijoueurs
4. Ajouter upload d'images pour avatars

