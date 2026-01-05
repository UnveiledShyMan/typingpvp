import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import KeyboardIcon from './icons/KeyboardIcon'

// Icône Sandbox simple et épurée
const SandboxIcon = ({ className = "w-4 h-4", stroke = "currentColor" }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z"
      stroke={stroke}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M14 2V8H20"
      stroke={stroke}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M16 13H8"
      stroke={stroke}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M16 17H8"
      stroke={stroke}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M10 9H9H8"
      stroke={stroke}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default function SoloDropdown({ children, onSandboxClick, onSoloClick, isSandboxMode = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const dropdownRef = useRef(null);
  const containerRef = useRef(null);
  const buttonRef = useRef(null);
  const timeoutRef = useRef(null);
  const isMobileRef = useRef(false);

  // Détecter si on est sur mobile
  useEffect(() => {
    const checkMobile = () => {
      isMobileRef.current = window.innerWidth < 768;
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Calculer la position du dropdown
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const updatePosition = () => {
        if (!buttonRef.current) return;
        const rect = buttonRef.current.getBoundingClientRect();
        // Pour fixed, on utilise directement getBoundingClientRect (position relative à la viewport)
        // Pas besoin d'ajouter scrollY car fixed est relatif à la viewport
        setDropdownPosition({
          top: rect.bottom + 4, // 4px de marge, position relative à la viewport
          left: rect.left,
          width: rect.width
        });
      };
      
      updatePosition();
      
      // Mettre à jour la position lors du scroll et resize
      window.addEventListener('scroll', updatePosition, { passive: true });
      window.addEventListener('resize', updatePosition);
      
      return () => {
        window.removeEventListener('scroll', updatePosition, { passive: true });
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [isOpen]);

  // Gérer les clics en dehors pour fermer le dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current && 
        !containerRef.current.contains(event.target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      // Utiliser un délai pour éviter que le clic d'ouverture ne ferme immédiatement
      setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);
      }, 0);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (!isMobileRef.current) {
      setIsOpen(true);
    }
  };

  const handleMouseLeave = () => {
    if (!isMobileRef.current) {
      timeoutRef.current = setTimeout(() => {
        setIsOpen(false);
      }, 150);
    }
  };

  // Gérer le toggle sur mobile (tactile) - seulement si pas de hover (desktop)
  const handleClick = (e) => {
    // Sur mobile, toggle le dropdown au clic
    // Sur desktop, le hover gère déjà l'ouverture
    if (isMobileRef.current) {
      e.stopPropagation();
      setIsOpen(!isOpen);
    }
  };

  // Contenu du dropdown
  const dropdownContent = isOpen ? (
    <div
      ref={dropdownRef}
      className={`rounded-lg min-w-[140px] overflow-hidden animate-fade-in shadow-xl ${
        isMobileRef.current ? 'fixed' : 'absolute'
      }`}
      style={{
        background: 'rgba(19, 24, 37, 0.95)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(100, 102, 105, 0.2)',
        zIndex: 99999, // Z-index très élevé pour être au-dessus de tout
        ...(isMobileRef.current 
          ? {
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`,
              width: `${Math.max(dropdownPosition.width, 140)}px`
            }
          : {
              top: '100%',
              left: 0,
              marginTop: '4px'
            }
        )
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Afficher l'option alternative : Solo si Sandbox est sélectionné, Sandbox si Solo est sélectionné */}
      {isSandboxMode ? (
        <button
          onClick={() => {
            if (onSoloClick) onSoloClick();
            setIsOpen(false);
          }}
          className="w-full px-3 py-2 text-left text-text-secondary/70 hover:text-text-primary hover:bg-bg-primary/20 transition-all duration-200 flex items-center gap-2 text-xs font-medium"
        >
          <KeyboardIcon 
            className="w-3.5 h-3.5" 
            stroke="currentColor"
            style={{ opacity: 0.6 }}
          />
          <span className="text-xs font-medium">Solo</span>
        </button>
      ) : (
        <button
          onClick={() => {
            if (onSandboxClick) onSandboxClick();
            setIsOpen(false);
          }}
          className="w-full px-3 py-2 text-left text-text-secondary/70 hover:text-text-primary hover:bg-bg-primary/20 transition-all duration-200 flex items-center gap-2 text-xs font-medium"
        >
          <SandboxIcon 
            className="w-3.5 h-3.5" 
            stroke="currentColor"
            style={{ opacity: 0.6 }}
          />
          <span className="text-xs font-medium">Sandbox</span>
        </button>
      )}
    </div>
  ) : null;

  return (
    <div 
      ref={containerRef}
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div ref={buttonRef} onClick={handleClick} className="cursor-pointer select-none">
        {children}
      </div>
      
      {/* Sur mobile, utiliser un portal pour rendre au niveau du body */}
      {/* Sur desktop, garder le positionnement relatif */}
      {isMobileRef.current && typeof document !== 'undefined'
        ? createPortal(dropdownContent, document.body)
        : dropdownContent
      }
    </div>
  );
}
