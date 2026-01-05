import { useState, useRef, useEffect } from 'react'
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
  const dropdownRef = useRef(null);
  const containerRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 150);
  };

  return (
    <div 
      ref={containerRef}
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 mt-1 rounded-lg z-50 min-w-[140px] overflow-hidden animate-fade-in"
          style={{
            background: 'rgba(19, 24, 37, 0.6)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)'
          }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
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
      )}
    </div>
  );
}
