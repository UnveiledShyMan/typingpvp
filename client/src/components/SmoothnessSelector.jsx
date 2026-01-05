import { useState, useRef, useEffect } from 'react'
import SettingsIcon from './icons/SettingsIcon'
import { useKeyboardNavigation } from '../hooks/useKeyboardNavigation'

const smoothnessOptions = [
  { id: 'instant', name: 'Instant', value: 0, cursorLag: 0 },
  { id: 'fast', name: 'Fast', value: 100, cursorLag: 30 },
  { id: 'medium', name: 'Medium', value: 200, cursorLag: 60 },
  { id: 'smooth', name: 'Smooth', value: 300, cursorLag: 100 },
  { id: 'very-smooth', name: 'Very Smooth', value: 500, cursorLag: 150 },
]

export default function SmoothnessSelector() {
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

  // Charger la préférence depuis localStorage
  const currentSmoothness = smoothnessOptions.find(
    opt => opt.id === (localStorage.getItem('typingSmoothness') || 'medium')
  ) || smoothnessOptions[2]; // Default: medium

  const handleSmoothnessChange = (optionId) => {
    localStorage.setItem('typingSmoothness', optionId);
    const option = smoothnessOptions.find(opt => opt.id === optionId);
    if (option) {
      // Appliquer la smoothness via CSS variable
      document.documentElement.style.setProperty('--typing-transition-duration', `${option.value}ms`);
      // Appliquer le délai du curseur (retard) pour créer l'effet de suivi fluide
      document.documentElement.style.setProperty('--cursor-lag-duration', `${option.cursorLag}ms`);
      
      // Appliquer aussi aux éléments de texte existants
      const typingTextElements = document.querySelectorAll('.typing-text, .char-correct, .char-incorrect, .char-current, .char-pending');
      typingTextElements.forEach(el => {
        el.style.transitionDuration = `${option.value}ms`;
      });
    }
    setIsOpen(false);
  };

  // Initialiser la smoothness au chargement
  useEffect(() => {
    const savedSmoothness = localStorage.getItem('typingSmoothness') || 'medium';
    const option = smoothnessOptions.find(opt => opt.id === savedSmoothness) || smoothnessOptions[2];
    document.documentElement.style.setProperty('--typing-transition-duration', `${option.value}ms`);
    document.documentElement.style.setProperty('--cursor-lag-duration', `${option.cursorLag}ms`);
  }, []);

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
        aria-label="Adjust smoothness"
        aria-expanded={isOpen}
        aria-haspopup="true"
        className="p-2 text-text-secondary/60 hover:text-text-primary transition-all duration-200 opacity-60 hover:opacity-100"
      >
        <SettingsIcon className="w-4 h-4" stroke="currentColor" />
      </button>
      
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute top-full right-0 mt-2 bg-bg-secondary/90 backdrop-blur-md rounded-lg shadow-xl z-50 min-w-[180px] overflow-hidden animate-fade-in"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          style={{
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          <div className="py-1">
            <div className="px-4 py-2 text-xs font-medium text-text-secondary/70 border-b border-text-secondary/10">
              Smoothness
            </div>
            {smoothnessOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => handleSmoothnessChange(option.id)}
                className={`w-full px-4 py-2.5 text-left text-sm transition-colors flex items-center justify-between ${
                  currentSmoothness.id === option.id
                    ? 'bg-accent-primary/20 text-accent-primary'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-primary/20'
                }`}
              >
                <span>{option.name}</span>
                {currentSmoothness.id === option.id && (
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

