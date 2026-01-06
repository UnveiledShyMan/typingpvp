# Correction de la Logique des Rooms 1v1

## Problème Identifié

Le système 1v1 manuel et le matchmaking étaient partiellement fusionnés, créant des incohérences :

1. **BattleRoom appelait toujours `join-room`**, même pour les rooms matchmaking où les joueurs sont déjà dans la room
2. **Le serveur devait gérer deux cas différents** dans `join-room`, rendant la logique complexe
3. **Les événements différaient** : `matchmaking-match-found` vs `room-joined`, mais BattleRoom ne gérait que `room-joined`

## Corrections Appliquées

### 1. BattleRoom - Séparation des Deux Systèmes

**Avant** : BattleRoom appelait toujours `join-room` pour tous les types de rooms

**Après** :
- **Rooms matchmaking** : Écoute `matchmaking-match-found` et utilise directement les données
- **Rooms normales** : Appelle `join-room` comme avant
- **Reconnexions** : Si `matchmaking-match-found` n'arrive pas après 1 seconde, appelle `join-room` pour se synchroniser

### 2. Serveur - Simplification de `join-room` pour Matchmaking

**Avant** : Logique complexe pour gérer les rooms matchmaking dans `join-room`

**Après** :
- **Rooms matchmaking** : `join-room` est utilisé SEULEMENT pour les reconnexions
- Les nouveaux joueurs arrivent via `matchmaking-match-found` (déjà dans la room)
- Si un nouveau joueur tente de rejoindre une room matchmaking, erreur explicite

### 3. Flux Clarifié

#### Système 1v1 Manuel (Battle)
```
1. Client: emit('create-room')
2. Serveur: Crée room vide
3. Client: Navigue → BattleRoom
4. Client: emit('join-room') → Serveur: Ajoute joueur
5. 2e joueur: emit('join-room') → Serveur: Ajoute joueur
```

#### Système Matchmaking
```
1. Client: emit('join-matchmaking')
2. Serveur: Trouve match → createMatchmakingRoom()
3. Serveur: Crée room avec 2 joueurs déjà dedans
4. Serveur: Envoie matchmaking-match-found aux 2 joueurs
5. Client: Navigue → BattleRoom
6. BattleRoom: Écoute matchmaking-match-found (ne PAS appeler join-room)
```

#### Reconnexion Matchmaking
```
1. Client: Se reconnecte après déconnexion
2. Client: Navigue → BattleRoom (matchmaking: true)
3. BattleRoom: Si matchmaking-match-found n'arrive pas → emit('join-room')
4. Serveur: Reconnaît le joueur existant → Met à jour socket.id → Envoie room-joined
```

## Résultat

- **Logique plus claire** : Les deux systèmes sont séparés
- **Moins de code dupliqué** : Chaque système a son propre flux
- **Meilleure gestion des erreurs** : Cas d'erreur explicites
- **Reconnexions robustes** : Gérées correctement pour les deux systèmes

## Tests à Effectuer

1. **1v1 Manuel** : Créer une room, rejoindre → Vérifier que tout fonctionne
2. **Matchmaking** : Rejoindre la queue, attendre match → Vérifier que `matchmaking-match-found` est reçu
3. **Reconnexion Matchmaking** : Se déconnecter puis reconnecter → Vérifier que la reconnexion fonctionne

