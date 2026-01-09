import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/apiService';

const UserContext = createContext(null);

/**
 * Provider pour gérer l'état utilisateur global
 * Évite les appels multiples à /api/me dans différents composants
 */
export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Charger l'utilisateur au montage
  useEffect(() => {
    loadUser();
    
    // Écouter les événements de déconnexion
    const handleLogout = () => {
      setUser(null);
      setLoading(false);
    };
    
    window.addEventListener('auth-logout', handleLogout);
    
    return () => {
      window.removeEventListener('auth-logout', handleLogout);
    };
  }, []);

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Utiliser silent: true pour ne pas afficher de toast d'erreur lors du chargement initial
      // C'est normal si le token est invalide ou expiré, pas besoin d'alerter l'utilisateur
      const userData = await authService.getCurrentUser({ silent: true });
      setUser(userData);
    } catch (error) {
      // Token invalide ou expiré - ne pas afficher d'erreur lors du chargement initial
      // C'est normal si l'utilisateur n'est pas connecté
      setUser(null);
      // Ne supprimer le token que s'il était présent (évite les suppressions inutiles)
      if (localStorage.getItem('token')) {
        localStorage.removeItem('token');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const updateUser = useCallback((userData) => {
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
    window.dispatchEvent(new CustomEvent('auth-logout'));
  }, []);

  const refreshUser = useCallback(async () => {
    await loadUser();
  }, [loadUser]);

  return (
    <UserContext.Provider 
      value={{ 
        user, 
        loading, 
        error, 
        updateUser, 
        logout, 
        refreshUser,
        isAuthenticated: !!user 
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
}

