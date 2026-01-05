import { useState, useRef, useEffect } from 'react'
import FontIcon from './icons/FontIcon'
import { useKeyboardNavigation } from '../hooks/useKeyboardNavigation'

const fonts = [
  { id: 'jetbrains', name: 'JetBrains Mono', family: "'JetBrains Mono', monospace" },
  { id: 'fira', name: 'Fira Code', family: "'Fira Code', monospace" },
  { id: 'source', name: 'Source Code Pro', family: "'Source Code Pro', monospace" },
  { id: 'courier', name: 'Courier New', family: "'Courier New', monospace" },
  { id: 'monaco', name: 'Monaco', family: "'Monaco', monospace" },
  { id: 'consolas', name: 'Consolas', family: "'Consolas', monospace" },
]

export default function FontSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Navigation clavier : fermer avec Escape
  useKeyboardNavigation({
    onEscape: () => {
      if (isOpen) {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    },
    enabled: isOpen
  });

  const currentFont = fonts.find(f => f.id === (localStorage.getItem('typingFont') || 'jetbrains')) || fonts[0];

  const handleFontChange = (fontId) => {
    localStorage.setItem('typingFont', fontId);
    const font = fonts.find(f => f.id === fontId);
    if (font) {
      // Mettre à jour la variable CSS globale - cela mettra à jour automatiquement tous les éléments qui l'utilisent
      document.documentElement.style.setProperty('--typing-font', font.family);
      
      // Forcer la mise à jour des éléments avec la classe .typing-text pour une application immédiate
      const typingTextElements = document.querySelectorAll('.typing-text');
      typingTextElements.forEach(el => {
        el.style.fontFamily = font.family;
      });
      
      // Mettre à jour les éléments avec des styles inline qui utilisent var(--typing-font)
      // En remplaçant directement la valeur dans le style
      const allElements = document.querySelectorAll('*');
      allElements.forEach(el => {
        const style = el.getAttribute('style');
        if (style && style.includes('--typing-font')) {
          // Remplacer var(--typing-font) par la valeur réelle de la police
          const newStyle = style.replace(
            /var\(--typing-font[^)]*\)/g,
            font.family
          );
          el.setAttribute('style', newStyle);
        }
      });
    }
    setIsOpen(false);
  };

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 150);
  };

  return (
    <div 
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Select font"
        aria-expanded={isOpen}
        aria-haspopup="true"
        className="p-2 text-text-secondary/60 hover:text-text-primary transition-colors opacity-60 hover:opacity-100"
      >
        <FontIcon className="w-4 h-4" stroke="currentColor" />
      </button>
      
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute top-full right-0 mt-2 bg-bg-secondary/90 backdrop-blur-md rounded-lg shadow-xl z-50 min-w-[200px] overflow-hidden animate-fade-in"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div className="py-1">
            {fonts.map((font) => (
              <button
                key={font.id}
                onClick={() => handleFontChange(font.id)}
                className={`w-full px-4 py-2.5 text-left text-sm transition-colors flex items-center justify-between ${
                  currentFont.id === font.id
                    ? 'bg-accent-primary/20 text-accent-primary'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-primary/20'
                }`}
                style={{ fontFamily: font.family }}
              >
                <span>{font.name}</span>
                {currentFont.id === font.id && (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

