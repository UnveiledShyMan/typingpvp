/**
 * Constantes centralisées de l'application
 * Évite les "magic numbers" et les valeurs en dur
 */

// Timing
export const TIME_LIMIT = 60; // Secondes pour le test Solo
export const DEBOUNCE_DELAY = 500; // ms pour la recherche
export const RETRY_DELAY = 1000; // ms pour retry API
export const MAX_RETRIES = 2; // Nombre de tentatives pour retry API

// Typing
export const CHARS_PER_WORD = 5; // Standard pour calcul WPM
export const MIN_TEXT_LENGTH = 300; // Mots initiaux pour Solo
export const ADDITIONAL_TEXT_LENGTH = 100; // Mots ajoutés quand nécessaire
export const TEXT_GENERATION_THRESHOLD = 50; // Caractères restants avant génération

// UI
export const TOAST_DURATION = 4000; // ms pour les toasts
export const ANIMATION_DURATION = 300; // ms pour les animations
export const SKELETON_ANIMATION_DURATION = 1500; // ms pour skeleton loaders

// API
export const DEFAULT_RANKINGS_LIMIT = 100;
export const DEFAULT_MATCHES_LIMIT = 10;
export const DEFAULT_FRIENDS_LIMIT = 50;

// ELO
export const DEFAULT_MMR = 1000; // MMR initial
export const K_FACTOR = 32; // Facteur K pour calcul ELO

// Pagination
export const ITEMS_PER_PAGE = 20;

