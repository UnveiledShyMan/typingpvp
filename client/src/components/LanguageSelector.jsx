import { memo, useState, useRef, useEffect } from 'react'
import { languages } from '../data/languages'

// Emoji flags pour chaque langue (ou codes de langue)
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

  const selectedLanguage = languages[selectedLang];
  const selectedFlag = languageFlags[selectedLang] || '🌐';

  const handleSelect = (code) => {
    onLanguageChange(code);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* Bouton du sélecteur */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="bg-bg-secondary hover:bg-bg-tertiary border border-border-secondary hover:border-accent-primary/50 text-text-primary px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 min-w-[140px] justify-between focus:outline-none focus:ring-2 focus:ring-accent-primary/50"
      >
        <span className="flex items-center gap-2">
          <span className="text-lg">{selectedFlag}</span>
          <span>{selectedLanguage?.name || selectedLang}</span>
        </span>
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 mt-2 bg-bg-secondary border border-border-secondary rounded-lg shadow-xl z-50 min-w-[180px] overflow-hidden animate-fade-in"
          style={{
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          <div className="py-1 max-h-[300px] overflow-y-auto custom-scrollbar">
            {Object.entries(languages).map(([code, lang]) => {
              const flag = languageFlags[code] || '🌐';
              const isSelected = code === selectedLang;
              
              return (
                <button
                  key={code}
                  onClick={() => handleSelect(code)}
                  className={`w-full px-4 py-2.5 text-left flex items-center gap-3 transition-all duration-150 ${
                    isSelected
                      ? 'bg-accent-primary/20 text-accent-primary border-l-2 border-accent-primary'
                      : 'text-text-primary hover:bg-bg-tertiary hover:text-accent-primary'
                  }`}
                >
                  <span className="text-lg">{flag}</span>
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