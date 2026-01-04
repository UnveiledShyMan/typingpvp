// Configuration du jeu

// Temps de jeu (en secondes)
export const TIME_LIMIT = 60;

// Nombre de mots par défaut pour générer le texte
export const DEFAULT_WORD_COUNT = 200;
export const ADDITIONAL_WORD_COUNT = 50; // Nombre de mots ajoutés quand on approche de la fin

// Limites de compétitions
export const COMPETITION_CONFIG = {
  MIN_PLAYERS: 2,
  MAX_PLAYERS: 100,
  DEFAULT_MAX_PLAYERS: 50,
  AUTO_START_DELAY: 10000, // 10 secondes en millisecondes
  COUNTDOWN_DURATION: 5, // secondes
};

// États de jeu
export const GAME_STATUS = {
  WAITING: 'waiting',
  STARTING: 'starting',
  PLAYING: 'playing',
  FINISHED: 'finished',
};

// Langue par défaut
export const DEFAULT_LANGUAGE = 'en';

// Tokens
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'token',
  USER_DATA: 'userData',
};

