import { useEffect, useState } from 'react';

/**
 * Composant Toast pour afficher des notifications élégantes
 * Style cohérent avec le design Monkeytype du site
 * Supporte maintenant les actions (boutons) dans les notifications
 */
export default function Toast({ message, type = 'info', duration = 4000, actions = [], persistent = false, onClose }) {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      if (onClose) onClose();
    }, 300); // Durée de l'animation de sortie
  };

  if (!isVisible) return null;

  // Couleurs selon le type
  const typeStyles = {
    success: {
      bg: 'bg-green-500/20',
      border: 'border-green-500/30',
      text: 'text-green-400',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      )
    },
    error: {
      bg: 'bg-red-500/20',
      border: 'border-red-500/30',
      text: 'text-red-400',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      )
    },
    warning: {
      bg: 'bg-yellow-500/20',
      border: 'border-yellow-500/30',
      text: 'text-yellow-400',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      )
    },
    info: {
      bg: 'bg-blue-500/20',
      border: 'border-blue-500/30',
      text: 'text-blue-400',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
  };

  const style = typeStyles[type] || typeStyles.info;

  return (
    <div
      className={`
        ${style.bg} ${style.border} border
        backdrop-blur-sm rounded-lg
        px-4 py-3 w-full max-w-md
        shadow-lg shadow-black/20
        flex items-start gap-3
        transform transition-all duration-300 ease-out
        ${isExiting ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'}
      `}
    >
      {/* Icône */}
      <div className={`${style.text} flex-shrink-0 mt-0.5`}>
        {style.icon}
      </div>

      {/* Message et Actions */}
      <div className="flex-1 min-w-0">
        <p className={`${style.text} text-sm font-medium leading-relaxed`}>
          {message}
        </p>
        
        {/* Actions (boutons) */}
        {actions && actions.length > 0 && (
          <div className="flex items-center gap-2 mt-3">
            {actions.map((action, index) => (
              <button
                key={index}
                onClick={() => {
                  if (action.onClick) {
                    action.onClick();
                  }
                  // Fermer le toast après l'action (sauf si persistent)
                  if (!persistent && action.closeOnClick !== false) {
                    handleClose();
                  }
                }}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  action.primary
                    ? `${style.text} bg-bg-primary/50 hover:bg-bg-primary/70 border ${style.border}`
                    : 'text-text-secondary hover:text-text-primary bg-bg-primary/30 hover:bg-bg-primary/50'
                }`}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Bouton de fermeture */}
      <button
        onClick={handleClose}
        className="text-text-secondary/60 hover:text-text-primary transition-colors flex-shrink-0 p-1 rounded hover:bg-bg-primary/30"
        aria-label="Close notification"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

