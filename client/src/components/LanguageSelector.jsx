import { memo, useState, useRef, useEffect } from 'react'
import { languages } from '../data/languages'
import { useKeyboardNavigation } from '../hooks/useKeyboardNavigation'

// Codes de langue à afficher
const languageCodes = {
  en: 'ENG',
  fr: 'FR',
  es: 'ES',
  de: 'DE',
  it: 'IT',
  pt: 'PT',
  ru: 'RU',
  ja: 'JA',
  zh: 'ZH',
  ko: 'KO'
};

// Emoji flags pour chaque langue (pour le dropdown)
const languageFlags = {
  en: '🇺🇸',
  fr: '🇫🇷',
  es: '🇪🇸',
  de: '🇩🇪',
  it: '🇮🇹',
  pt: '🇵🇹',
  ru: '🇷🇺',
  ja: '🇯🇵',
  zh: '🇨🇳',
  ko: '🇰🇷'
};

// Composant optimisé avec memo pour éviter les re-renders inutiles
const LanguageSelector = memo(function LanguageSelector({ selectedLang, onLanguageChange }) {
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

  // Fermer le dropdown si on clique en dehors
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

  const selectedLanguage = languages[selectedLang];
  const selectedCode = languageCodes[selectedLang] || selectedLang.toUpperCase();

  const handleSelect = (code) => {
    onLanguageChange(code);
    setIsOpen(false);
  };

  return (
    <div 
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Bouton du sélecteur - Affiche le code langue (FR, ENG, etc.) */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Select language"
        aria-expanded={isOpen}
        aria-haspopup="true"
        className="px-3 py-1.5 bg-bg-secondary/20 hover:bg-bg-secondary/40 text-text-secondary/70 hover:text-text-primary rounded text-xs font-medium transition-all duration-200 opacity-60 hover:opacity-100"
      >
        <span className="font-mono">{selectedCode}</span>
      </button>

      {/* Dropdown menu - Style cohérent avec les autres sélecteurs */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute top-full right-0 mt-2 bg-bg-secondary/90 backdrop-blur-md rounded-lg shadow-xl z-50 min-w-[180px] overflow-hidden animate-fade-in"
          style={{
            animation: 'fadeIn 0.2s ease-out'
          }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div className="py-1 max-h-[300px] overflow-y-auto custom-scrollbar">
            {Object.entries(languages).map(([code, lang]) => {
              const flag = languageFlags[code] || '🌐';
              const isSelected = code === selectedLang;
              
              return (
                <button
                  key={code}
                  onClick={() => handleSelect(code)}
                  className={`w-full px-4 py-2.5 text-left flex items-center gap-3 transition-all duration-150 text-sm ${
                    isSelected
                      ? 'bg-accent-primary/20 text-accent-primary'
                      : 'text-text-secondary hover:text-text-primary hover:bg-bg-primary/20'
                  }`}
                >
                  <span className="text-base">{flag}</span>
                  <span className="font-medium flex-1">{lang.name}</span>
                  {isSelected && (
                    <svg
                      className="w-4 h-4 text-accent-primary"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
});

export default LanguageSelector