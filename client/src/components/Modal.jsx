import { useEffect } from 'react';

/**
 * Composant Modal moderne et sobre
 * Compatible avec la direction artistique du site
 */
export default function Modal({ isOpen, onClose, title, children, showCloseButton = true }) {
  useEffect(() => {
    if (isOpen) {
      // Empêcher le scroll du body quand le modal est ouvert
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Gérer la fermeture avec la touche Escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.75)' }}
      onClick={(e) => {
        // Fermer si on clique sur le backdrop
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="bg-bg-secondary rounded-lg border border-text-secondary/20 shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête */}
        {title && (
          <div className="px-6 py-4 border-b border-text-secondary/10 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-text-primary" style={{ fontFamily: 'Inter' }}>
              {title}
            </h2>
            {showCloseButton && (
              <button
                onClick={onClose}
                className="text-text-secondary hover:text-text-primary transition-colors p-1 rounded-lg hover:bg-bg-primary/50"
                aria-label="Close modal"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Contenu */}
        <div className="px-6 py-4">
          {children}
        </div>
      </div>
    </div>
  );
}

