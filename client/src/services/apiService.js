// Service API centralisé

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Effectue une requête fetch avec gestion d'erreurs
 */
async function request(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  
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
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
}

/**
 * GET request
 */
export async function get(endpoint, options = {}) {
  return request(endpoint, { ...options, method: 'GET' });
}

/**
 * POST request
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
 */
export async function del(endpoint, options = {}) {
  return request(endpoint, { ...options, method: 'DELETE' });
}

/**
 * Service d'authentification
 */
export const authService = {
  async login(username, password) {
    return post('/api/auth/login', { username, password });
  },
  
  async register(username, email, password) {
    return post('/api/auth/register', { username, email, password });
  },
  
  async getCurrentUser() {
    return get('/api/me');
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

export default {
  get,
  post,
  put,
  del,
  authService,
  userService,
  rankingsService,
};

