// Hook personnalisé pour l'authentification
import { useState, useEffect } from 'react';
import { authService } from '../services/apiService';
import { STORAGE_KEYS } from '../constants/gameConfig';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const userData = await authService.getCurrentUser();
      setUser(userData);
      setError(null);
    } catch (err) {
      console.error('Error fetching current user:', err);
      setError(err);
      // Si le token est invalide, le supprimer
      if (err.message.includes('401') || err.message.includes('Unauthorized')) {
        localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      }
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username, password) => {
    try {
      setIsLoading(true);
      const data = await authService.login(username, password);
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, data.token);
      setUser(data.user);
      setError(null);
      return data;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (username, email, password) => {
    try {
      setIsLoading(true);
      const data = await authService.register(username, email, password);
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, data.token);
      setUser(data.user);
      setError(null);
      return data;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    setUser(null);
    setError(null);
  };

  const isAuthenticated = !!user;

  return {
    user,
    isLoading,
    error,
    isAuthenticated,
    login,
    register,
    logout,
    fetchCurrentUser,
  };
}

