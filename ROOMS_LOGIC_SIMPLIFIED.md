# Logique des Rooms Simplifiée

## Vue d'ensemble

Une room 1v1 est simplement :
- **Une URL unique** (ID généré avec `nanoid(8)`)
- **Deux joueurs maximum** qui peuvent rejoindre
- **Un état** : `waiting` → `playing` → `finished`

## Flux Simplifié

### 1. Création d'une Room
```
Client: emit('create-room')
Serveur: 
  - Génère un roomId (ex: "abc123xy")
  - Crée un objet room avec status='waiting'
  - Retourne le roomId au client
Client: Navigue vers /battle/${roomId}
Client: Appelle join-room (même le créateur doit rejoindre)
```

**Pourquoi le créateur doit aussi rejoindre ?**
- Logique unifiée : tout le monde utilise `join-room`
- Pas besoin de passer playerName/userId à `create-room`
- Simple : créer = obtenir une URL, rejoindre = s'ajouter à la room

**Code correspondant** (lignes 424-444):
```javascript
socket.on('create-room', (data) => {
  const roomId = nanoid(8);  // URL unique
  const text = getRandomText();
  const room = {
    id: roomId,
    text: text,
    players: [],
    status: 'waiting',
    // ...
  };
  rooms.set(roomId, room);
  socket.join(roomId);
  socket.emit('room-created', { roomId, text });
});
```

### 2. Rejoindre une Room (Cas Principal - Simple)
```
Client: emit('join-room', { roomId, playerName, userId })
Serveur:
  - Vérifie que la room existe
  - Vérifie qu'elle est en 'waiting'
  - Vérifie qu'il y a moins de 2 joueurs
  - Ajoute le joueur
  - Notifie tous les joueurs de la room
```

**Code correspondant** (cas simple, lignes 550-571):
```javascript
// CAS SIMPLE : Room normale en attente
if (!room.matchmaking && room.status === 'waiting') {
  // Vérifier reconnexion
  if (existingPlayer) { /* reconnect */ return; }
  
  // Vérifier si pleine
  if (room.players.length >= 2) {
    socket.emit('error', { message: 'Room is full' });
    return;
  }
  
  // Ajouter le joueur
  const player = { id: socket.id, name: playerName, ... };
  room.players.push(player);
  socket.join(roomId);
  socket.emit('room-joined', { ... });
}
```

## Cas Spéciaux (Nécessaires mais Gardés Séparés)

### 1. Matchmaking Rooms
- Logique plus complexe car les joueurs sont déjà assignés
- Reconnexion automatique si le joueur fait déjà partie de la room

### 2. Reconnexion Pendant le Jeu
- Si un joueur se déconnecte puis reconnecte
- Met à jour son `socket.id` mais garde ses stats

### 3. Room Terminée
- Permet de voir les résultats même après la fin
- Lecture seule pour les nouveaux visiteurs

## Simplifications Appliquées

### Avant (Complexe)
- Logique imbriquée avec beaucoup de duplication
- Vérifications répétées dans plusieurs endroits
- Difficile de comprendre le flux principal

### Après (Simplifié)
- Helper `findExistingPlayer()` pour éviter la duplication
- Cas séparés clairement :
  1. **Matchmaking** (logique complexe nécessaire)
  2. **Room simple waiting** (cas principal, très simple)
  3. **Reconnexion playing** (cas spécial)
  4. **Room finished** (cas spécial)
- Code plus lisible et maintenable

## Ce Qui a Été Conservé

- **Support du matchmaking** : Nécessaire pour les duels automatiques
- **Reconnexions** : Important pour l'UX (réseau instable)
- **Voir les résultats** : Fonctionnalité utile

## Ce Qui a Été Simplifié

- **Logique principale** : Cas simple maintenant très clair
- **Duplication** : Helper pour éviter le code répété
- **Structure** : Cas séparés clairement au lieu d'imbriqués

## Résultat

Pour un duel 1v1 simple :
- **Créer une room** = Générer un ID, c'est tout
- **Rejoindre** = Vérifier qu'il y a de la place, ajouter le joueur
- **C'est tout !**

Les cas spéciaux (matchmaking, reconnexions) sont gardés mais séparés clairement pour ne pas compliquer la logique principale.

