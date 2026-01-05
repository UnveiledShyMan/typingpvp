/**
 * Configuration centralisée de l'API
 * Tous les appels API doivent utiliser apiService.js qui utilise cette configuration
 */

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    OAUTH_GOOGLE: '/api/auth/oauth/google',
    OAUTH_EXCHANGE: '/api/auth/oauth/exchange',
  },
  USERS: {
    ME: '/api/me',
    BY_ID: (id) => `/api/users/${id}`,
    PREFERENCES: '/api/me/preferences',
  },
  RANKINGS: {
    BY_LANGUAGE: (language) => `/api/rankings/${language}`,
  },
  FRIENDS: {
    BASE: '/api/friends',
    REQUESTS: '/api/friends/requests',
    SEARCH: (query) => `/api/friends/search?q=${encodeURIComponent(query)}`,
    REQUEST: (userId) => `/api/friends/request/${userId}`,
    ACCEPT: (userId) => `/api/friends/accept/${userId}`,
    REJECT: (userId) => `/api/friends/reject/${userId}`,
  },
  MATCHES: {
    BASE: '/api/matches',
    BY_USER: (userId, limit, type) => {
      const params = new URLSearchParams({ limit: limit.toString() });
      if (type) params.append('type', type);
      return `/api/matches/${userId}?${params.toString()}`;
    },
  },
};

