// Routes de l'application
export const ROUTES = {
  HOME: '/',
  SOLO: '/solo',
  BATTLE: '/battle',
  BATTLE_ROOM: '/battle/:roomId',
  RANKINGS: '/rankings',
  COMPETITIONS: '/competitions',
  COMPETITION_ROOM: '/competition/:competitionId',
  MATCHMAKING: '/matchmaking',
  PROFILE: '/profile',
  LOGIN: '/login',
  REGISTER: '/register',
};

// Routes API
export const API_ENDPOINTS = {
  HEALTH: '/api/health',
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
  },
  USERS: {
    BASE: '/api/users',
    BY_ID: (id) => `/api/users/${id}`,
  },
  ME: '/api/me',
  RANKINGS: {
    BASE: '/api/rankings',
    BY_LANGUAGE: (language) => `/api/rankings/${language}`,
  },
};

// Sections de navigation
export const NAVIGATION_SECTIONS = {
  SOLO: 'solo',
  BATTLE: 'battle',
  RANKINGS: 'rankings',
  COMPETITIONS: 'competitions',
  MATCHMAKING: 'matchmaking',
  PROFILE: 'profile',
};

