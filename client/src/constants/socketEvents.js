// Événements Socket.io - Rooms (1v1)
export const ROOM_EVENTS = {
  // Client -> Server
  CREATE_ROOM: 'create-room',
  JOIN_ROOM: 'join-room',
  START_GAME: 'start-game',
  UPDATE_PROGRESS: 'update-progress',
  FINISH_GAME: 'finish-game',
  
  // Server -> Client
  ROOM_CREATED: 'room-created',
  ROOM_JOINED: 'room-joined',
  PLAYER_JOINED: 'player-joined',
  PLAYER_LEFT: 'player-left',
  GAME_STARTED: 'game-started',
  OPPONENT_UPDATE: 'opponent-update',
  OPPONENT_FINISHED: 'opponent-finished',
  GAME_FINISHED: 'game-finished',
  ERROR: 'error',
};

// Événements Socket.io - Matchmaking
export const MATCHMAKING_EVENTS = {
  // Client -> Server
  JOIN_MATCHMAKING: 'join-matchmaking',
  LEAVE_MATCHMAKING: 'leave-matchmaking',
  
  // Server -> Client
  MATCHMAKING_MATCH_FOUND: 'matchmaking-match-found',
  MATCHMAKING_QUEUE_UPDATE: 'matchmaking-queue-update',
};

// Événements Socket.io - Competitions
export const COMPETITION_EVENTS = {
  // Client -> Server
  GET_COMPETITIONS: 'get-competitions',
  CREATE_COMPETITION: 'create-competition',
  JOIN_COMPETITION: 'join-competition',
  START_COMPETITION: 'start-competition',
  COMPETITION_PROGRESS: 'competition-progress',
  COMPETITION_FINISHED: 'competition-finished',
  
  // Server -> Client
  COMPETITIONS_LIST: 'competitions-list',
  COMPETITION_CREATED: 'competition-created',
  COMPETITION_JOINED: 'competition-joined',
  COMPETITION_UPDATED: 'competition-updated',
  COMPETITION_STARTING: 'competition-starting',
  COMPETITION_COUNTDOWN: 'competition-countdown',
  COMPETITION_STARTED: 'competition-started',
  COMPETITION_LEADERBOARD: 'competition-leaderboard',
  COMPETITION_ENDED: 'competition-ended',
  COMPETITION_ERROR: 'competition-error',
};

// Événements généraux
export const GENERAL_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  ERROR: 'error',
};

