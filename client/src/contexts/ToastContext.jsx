import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import Toast from '../components/Toast';
import { setErrorHandlers } from '../services/apiService';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random();
    const newToast = { id, message, type, duration };
    
    setToasts(prev => [...prev, newToast]);

    // Retirer automatiquement après la durée spécifiée
    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
      }, duration + 300); // +300 pour l'animation de sortie
    }

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  // Exposer les fonctions de convenance
  const toast = {
    success: (message, duration) => showToast(message, 'success', duration),
    error: (message, duration) => showToast(message, 'error', duration),
    warning: (message, duration) => showToast(message, 'warning', duration),
    info: (message, duration) => showToast(message, 'info', duration),
  };

  // Configurer les handlers d'erreur pour apiService après que showToast soit défini
  useEffect(() => {
    setErrorHandlers({
      onError: showToast,
      onLogout: () => {
        // Déclencher un événement pour que les composants réagissent
        window.dispatchEvent(new CustomEvent('auth-logout'));
      }
    });
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, removeToast, toast }}>
      {children}
      {/* Container pour les toasts */}
      <div className="fixed top-4 right-4 z-50 pointer-events-none" style={{ maxWidth: '420px' }}>
        {toasts.map((toastItem, index) => (
          <div 
            key={toastItem.id} 
            className="pointer-events-auto mb-2" 
            style={{ 
              animation: 'slideInRight 0.3s ease-out'
            }}
          >
            <Toast
              message={toastItem.message}
              type={toastItem.type}
              duration={toastItem.duration}
              onClose={() => removeToast(toastItem.id)}
            />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToastContext() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToastContext must be used within ToastProvider');
  }
  return context;
}

