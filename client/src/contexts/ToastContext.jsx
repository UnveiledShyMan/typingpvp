import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import Toast from '../components/Toast';
import { setErrorHandlers } from '../services/apiService';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info', duration = 4000, options = {}) => {
    // Groupement des notifications similaires
    // Si groupKey est fourni, on groupe les toasts avec la même clé
    if (options.groupKey) {
      setToasts(prev => {
        // Chercher si un toast avec la même groupKey existe déjà
        const existingToastIndex = prev.findIndex(t => t.groupKey === options.groupKey);
        
        if (existingToastIndex !== -1) {
          // Mettre à jour le toast existant avec un compteur
          const existingToast = prev[existingToastIndex];
          const newCount = (existingToast.count || 1) + 1;
          
          // Créer une copie mise à jour
          const updatedToasts = [...prev];
          updatedToasts[existingToastIndex] = {
            ...existingToast,
            message: options.groupMessage 
              ? options.groupMessage.replace('{count}', newCount)
              : `${message} (${newCount}x)`,
            count: newCount,
            // Réinitialiser le timer si on a une durée
            lastUpdated: Date.now()
          };
          
          return updatedToasts;
        } else {
          // Créer un nouveau toast avec groupKey
          const id = Date.now() + Math.random();
          const newToast = { 
            id, 
            message, 
            type, 
            duration: options.persistent ? 0 : duration,
            actions: options.actions || [],
            persistent: options.persistent || false,
            groupKey: options.groupKey,
            count: 1,
            lastUpdated: Date.now()
          };
          
          // Retirer automatiquement après la durée spécifiée (sauf si persistent)
          if (duration > 0 && !options.persistent) {
            setTimeout(() => {
              setToasts(prev => prev.filter(toast => toast.id !== id));
            }, duration + 300);
          }
          
          return [...prev, newToast];
        }
      });
      
      // Retourner l'ID du toast groupé (on ne peut pas le retourner ici car c'est asynchrone)
      return null;
    }
    
    // Comportement normal sans groupement
    const id = Date.now() + Math.random();
    const newToast = { 
      id, 
      message, 
      type, 
      duration: options.persistent ? 0 : duration, // 0 = persistent
      actions: options.actions || [],
      persistent: options.persistent || false
    };
    
    setToasts(prev => [...prev, newToast]);

    // Retirer automatiquement après la durée spécifiée (sauf si persistent)
    if (duration > 0 && !options.persistent) {
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
    success: (message, duration, options) => showToast(message, 'success', duration, options),
    error: (message, duration, options) => showToast(message, 'error', duration, options),
    warning: (message, duration, options) => showToast(message, 'warning', duration, options),
    info: (message, duration, options) => showToast(message, 'info', duration, options),
    // Fonction pour les toasts avec actions
    withActions: (message, type, actions, persistent = false) => 
      showToast(message, type, 0, { actions, persistent }),
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
      {/* z-index 101 pour être au-dessus du header (z-index 100) */}
      <div className="fixed top-4 right-4 pointer-events-none" style={{ maxWidth: '420px', zIndex: 101 }}>
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
              actions={toastItem.actions}
              persistent={toastItem.persistent}
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

