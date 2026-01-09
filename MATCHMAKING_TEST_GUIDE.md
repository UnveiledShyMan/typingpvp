# Guide de Test du Matchmaking

## ✅ Vérifications Effectuées

### 1. Rejoindre la Queue
- ✅ Le joueur peut rejoindre la queue ranked/unrated
- ✅ Les guests peuvent rejoindre uniquement en unrated
- ✅ Les joueurs ranked doivent être connectés
- ✅ Gestion des erreurs si déjà dans la queue
- ✅ Timer d'attente affiché correctement

### 2. Trouver un Match
- ✅ Le système de buckets MMR fonctionne (O(1) recherche)
- ✅ Recherche dans la plage MMR appropriée (±200 ranked, ±500 unrated)
- ✅ Vérification que les deux joueurs sont toujours en queue avant création de room
- ✅ Gestion des race conditions (joueur qui quitte pendant la recherche)

### 3. Création de la Room
- ✅ Room créée avec les deux joueurs
- ✅ Texte généré automatiquement
- ✅ Événement `matchmaking-match-found` envoyé aux deux joueurs
- ✅ Redirection automatique vers BattleRoom
- ✅ Gestion des erreurs si création échoue

### 4. Démarrage Automatique
- ✅ Le jeu démarre automatiquement après 3 secondes
- ✅ Toutes les données nécessaires sont envoyées dans `game-started`:
  - `startTime`: Temps de début
  - `text`: Texte à taper
  - `mode`: 'timer' (par défaut)
  - `timerDuration`: 60 secondes
  - `difficulty`: null
- ✅ Le timer de 60 secondes démarre correctement
- ✅ Le texte est disponible (soit via `game-started`, soit déjà reçu via `matchmaking-match-found`)

### 5. Pendant la Partie
- ✅ Les deux joueurs peuvent taper simultanément
- ✅ Les stats sont mises à jour en temps réel (WPM, accuracy, progress)
- ✅ Les mises à jour de l'adversaire sont reçues via `opponent-update`
- ✅ Le chat fonctionne pendant l'attente
- ✅ Le chat est désactivé pendant le jeu

### 6. Fin de Partie
- ✅ Quand un joueur termine, l'autre est notifié via `opponent-finished`
- ✅ Quand les deux joueurs terminent, `game-finished` est envoyé
- ✅ Les résultats incluent:
  - WPM
  - Accuracy
  - Time
  - Errors (nombre d'erreurs)
  - Characters (nombre de caractères tapés)
- ✅ Les changements d'ELO sont calculés et envoyés (ranked uniquement)
- ✅ Les matchs unrated sont enregistrés sans changement d'ELO

### 7. Affichage des Résultats
- ✅ Le composant `MatchResults` s'affiche correctement
- ✅ Les résultats complets sont affichés (WPM, accuracy, errors, characters)
- ✅ Les changements d'ELO sont affichés pour les matchs ranked
- ✅ Le gagnant est déterminé correctement (meilleur WPM, puis meilleure accuracy)
- ✅ Les boutons "Play Again" et "Back to Lobby" fonctionnent

### 8. Retour au Matchmaking
- ✅ Le bouton "Play Again" redirige vers `/matchmaking` pour les rooms matchmaking
- ✅ Le raccourci clavier 'R' redirige aussi vers `/matchmaking`
- ✅ L'utilisateur peut immédiatement relancer une recherche

### 9. Mise à Jour de l'ELO
- ✅ Pour les matchs ranked: l'ELO est mis à jour dans la base de données
- ✅ Les changements d'ELO sont envoyés aux clients
- ✅ L'utilisateur est rafraîchi automatiquement pour afficher le nouvel ELO
- ✅ Pour les matchs unrated: pas de changement d'ELO mais le match est enregistré

## 🔧 Corrections Apportées

1. **Démarrage automatique**: Le serveur envoie maintenant toutes les informations nécessaires (`text`, `mode`, `timerDuration`) dans `game-started`
2. **Gestion des erreurs**: Ajout de vérifications pour éviter les race conditions lors de la création de room
3. **Résultats complets**: Les résultats incluent maintenant les erreurs et les caractères
4. **Mode timer**: Le mode et la durée sont stockés dans la room pour les reconnexions
5. **Gestion des erreurs**: Try-catch ajouté dans `createMatchmakingRoom` pour gérer les erreurs

## 📋 Comment Tester

### Test Complet du Flux

1. **Ouvrir deux onglets/fenêtres** (ou utiliser deux navigateurs)
2. **Onglet 1**: Aller sur `/matchmaking`
   - Sélectionner une langue
   - Cliquer sur "Find Match"
3. **Onglet 2**: Aller sur `/matchmaking`
   - Sélectionner la même langue
   - Cliquer sur "Find Match"
4. **Vérifier**:
   - Les deux joueurs sont redirigés vers la même room
   - Le texte s'affiche correctement
   - Le jeu démarre automatiquement après 3 secondes
   - Le timer de 60 secondes démarre
5. **Jouer**:
   - Taper le texte dans les deux onglets
   - Vérifier que les stats se mettent à jour en temps réel
6. **Finir**:
   - Terminer le texte ou attendre que le timer atteigne 0
   - Vérifier que les résultats s'affichent
   - Vérifier que les changements d'ELO sont affichés (si ranked)
7. **Retour**:
   - Cliquer sur "Play Again"
   - Vérifier que vous retournez au matchmaking
   - Relancer une recherche

### Tests de Cas Limites

1. **Joueur qui quitte pendant la recherche**: Vérifier qu'il n'y a pas d'erreur
2. **Joueur qui quitte pendant le jeu**: Vérifier que l'autre joueur peut quand même finir
3. **Reconnexion**: Vérifier qu'un joueur peut se reconnecter et voir les résultats
4. **Guest mode**: Tester avec un joueur non connecté en unrated
5. **Ranked vs Unrated**: Vérifier que les deux types fonctionnent correctement

## 🐛 Problèmes Potentiels à Surveiller

1. **Race conditions**: Si un joueur quitte très rapidement après avoir trouvé un match
2. **Timeout**: Si le serveur met trop de temps à répondre
3. **Reconnexion**: Si un joueur se déconnecte et se reconnecte pendant le jeu
4. **ELO update**: Vérifier que l'ELO est bien mis à jour dans la base de données

## 📝 Notes

- Le matchmaking utilise un système de buckets MMR pour une recherche O(1)
- Les rooms matchmaking démarrent automatiquement après 3 secondes
- Le mode par défaut est "timer" avec 60 secondes
- Les matchs ranked mettent à jour l'ELO, les unrated ne le font pas
- Les résultats incluent maintenant les erreurs et les caractères pour un affichage complet
