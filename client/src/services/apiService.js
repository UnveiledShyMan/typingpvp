// Service API centralisé avec gestion d'erreurs améliorée
import { API_URL } from '../config/api.js';

// Callback global pour gérer les erreurs (sera défini par ToastContext)
let errorHandler = null;
let logoutHandler = null;

/**
 * Configure les handlers globaux pour les erreurs
 */
export function setErrorHandlers({ onError, onLogout }) {
  errorHandler = onError;
  logoutHandler = onLogout;
}

/**
 * Effectue une requête fetch avec gestion d'erreurs améliorée
 * - Gestion automatique des tokens expirés (401)
 * - Retry automatique pour les erreurs réseau temporaires
 * - Toast automatique pour les erreurs
 */
async function request(endpoint, options = {}, retryCount = 0) {
  const token = localStorage.getItem('token');
  const maxRetries = 2;
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(`${API_URL}${endpoint}`, config);
    
    // Gérer les erreurs HTTP
    if (!response.ok) {
      // Token expiré ou invalide - déconnexion automatique
      if (response.status === 401) {
        localStorage.removeItem('token');
        if (logoutHandler) {
          logoutHandler();
        }
        if (errorHandler) {
          errorHandler('Session expirée. Veuillez vous reconnecter.', 'error');
        }
        throw new Error('Unauthorized - Session expirée');
      }
      
      const error = await response.json().catch(() => ({ 
        error: `Erreur HTTP ${response.status}` 
      }));
      
      const errorMessage = error.error || `Erreur HTTP ${response.status}`;
      
      // Afficher l'erreur via toast si handler disponible
      if (errorHandler) {
        errorHandler(errorMessage, 'error');
      }
      
      throw new Error(errorMessage);
    }
    
    return await response.json();
  } catch (error) {
    // Erreur réseau - retry automatique
    if (
      (error.message.includes('Failed to fetch') || 
       error.message.includes('NetworkError') ||
       error.name === 'TypeError') &&
      retryCount < maxRetries
    ) {
      // Attendre un peu avant de réessayer (backoff exponentiel)
      await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
      return request(endpoint, options, retryCount + 1);
    }
    
    // Si ce n'est pas une erreur réseau ou qu'on a épuisé les retries
    if (errorHandler && !error.message.includes('Unauthorized')) {
      errorHandler(
        error.message || 'Une erreur est survenue. Veuillez réessayer.',
        'error'
      );
    }
    
    throw error;
  }
}

/**
 * GET request
 * @param {string} endpoint - Endpoint API
 * @param {Object} options - Options supplémentaires
 * @returns {Promise<Object>} - Données JSON
 */
export async function get(endpoint, options = {}) {
  return request(endpoint, { ...options, method: 'GET' });
}

/**
 * POST request
 * @param {string} endpoint - Endpoint API
 * @param {Object} data - Données à envoyer
 * @param {Object} options - Options supplémentaires
 * @returns {Promise<Object>} - Données JSON
 */
export async function post(endpoint, data, options = {}) {
  return request(endpoint, {
    ...options,
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * PUT request
 * @param {string} endpoint - Endpoint API
 * @param {Object} data - Données à envoyer
 * @param {Object} options - Options supplémentaires
 * @returns {Promise<Object>} - Données JSON
 */
export async function put(endpoint, data, options = {}) {
  return request(endpoint, {
    ...options,
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * DELETE request
 * @param {string} endpoint - Endpoint API
 * @param {Object} options - Options supplémentaires
 * @returns {Promise<Object>} - Données JSON
 */
export async function del(endpoint, options = {}) {
  return request(endpoint, { ...options, method: 'DELETE' });
}

/**
 * Service d'authentification
 */
export const authService = {
  async login(username, password) {
    const data = await post('/api/auth/login', { username, password });
    if (data.token) {
      localStorage.setItem('token', data.token);
    }
    return data;
  },
  
  async register(username, email, password) {
    const data = await post('/api/auth/register', { username, email, password });
    if (data.token) {
      localStorage.setItem('token', data.token);
    }
    return data;
  },
  
  async getCurrentUser() {
    return get('/api/me');
  },
  
  logout() {
    localStorage.removeItem('token');
  },
};

/**
 * Service utilisateurs
 */
export const userService = {
  async getUserById(userId) {
    return get(`/api/users/${userId}`);
  },
};

/**
 * Service de classements
 */
export const rankingsService = {
  async getRankingsByLanguage(language, limit = 100) {
    return get(`/api/rankings/${language}?limit=${limit}`);
  },
};

/**
 * Service d'amis
 */
export const friendsService = {
  async getFriends() {
    return get('/api/friends');
  },
  
  async getFriendRequests() {
    return get('/api/friends/requests');
  },
  
  async searchUsers(query) {
    if (query.length < 2) return { users: [] };
    return get(`/api/friends/search?q=${encodeURIComponent(query)}`);
  },
  
  async sendFriendRequest(userId) {
    return post(`/api/friends/request/${userId}`);
  },
  
  async acceptFriendRequest(userId) {
    return post(`/api/friends/accept/${userId}`);
  },
  
  async rejectFriendRequest(userId) {
    return post(`/api/friends/reject/${userId}`);
  },
};

/**
 * Service de profil
 */
export const profileService = {
  async getProfile(userId) {
    return get(`/api/users/${userId}`);
  },
  
  async updateProfile(userId, data) {
    return put(`/api/users/${userId}`, data);
  },
  
  async updatePreferences(preferences) {
    return put('/api/me/preferences', { preferences });
  },
  
  /**
   * Upload une image de profil
   * @param {string} userId - ID de l'utilisateur
   * @param {File} file - Fichier image à uploader
   * @returns {Promise<Object>} - Réponse avec l'URL de l'image
   */
  async uploadAvatar(userId, file) {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('avatar', file);
    
    const response = await fetch(`${API_URL}/api/users/${userId}/avatar`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ 
        error: `Erreur HTTP ${response.status}` 
      }));
      
      const errorMessage = error.error || `Erreur HTTP ${response.status}`;
      
      if (errorHandler) {
        errorHandler(errorMessage, 'error');
      }
      
      throw new Error(errorMessage);
    }
    
    return await response.json();
  },
};

/**
 * Service de matchs
 */
export const matchesService = {
  async getMatches(limit = 10) {
    return get(`/api/matches?limit=${limit}`);
  },
  
  async getUserMatches(userId, limit = 10, type = null) {
    const typeParam = type ? `&type=${type}` : '';
    return get(`/api/matches/user/${userId}?limit=${limit}${typeParam}`);
  },
};

/**
 * Service Discord
 */
export const discordService = {
  async generateCode(discordId, discordUsername) {
    return post('/api/discord/generate-code', { discordId, discordUsername });
  },
  
  async unlink() {
    return del('/api/discord/unlink');
  },
  
  async getLinkedUser(discordId) {
    return get(`/api/discord/user/${discordId}`);
  },
};

export default {
  get,
  post,
  put,
  del,
  authService,
  userService,
  rankingsService,
  friendsService,
  profileService,
  matchesService,
  discordService,
  setErrorHandlers,
};

