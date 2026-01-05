import { useState, useRef, useEffect } from 'react'
import BrushIcon from './icons/BrushIcon'
import { useKeyboardNavigation } from '../hooks/useKeyboardNavigation'

const themes = [
  { 
    id: 'dark', 
    name: 'Dark', 
    bg: '#0a0e1a', 
    bgSecondary: '#131825', 
    bgTertiary: '#1a1f2e', 
    bgCard: '#151a27',
    text: '#e8ecf3', 
    textSecondary: '#9ca3b8',
    textMuted: '#6b7280',
    accent: '#8b5cf6',
    accentHover: '#a78bfa',
    accentText: '#ffffff', // Texte sur les boutons accent (toujours blanc pour contraste)
    accentSecondary: '#06b6d4',
    accentGlow: '#8b5cf6',
    borderPrimary: 'rgba(139, 92, 246, 0.2)',
    borderSecondary: 'rgba(156, 163, 184, 0.1)'
  },
  { 
    id: 'light', 
    name: 'Light', 
    bg: '#ffffff', 
    bgSecondary: '#f8f9fa', 
    bgTertiary: '#e9ecef', 
    bgCard: '#fafbfc',
    text: '#1a1a1a', 
    textSecondary: '#4a5568',
    textMuted: '#718096',
    accent: '#6366f1',
    accentHover: '#818cf8',
    accentText: '#ffffff', // Texte blanc sur bouton accent pour contraste
    accentSecondary: '#06b6d4',
    accentGlow: '#6366f1',
    borderPrimary: 'rgba(99, 102, 241, 0.3)',
    borderSecondary: 'rgba(0, 0, 0, 0.1)'
  },
  { 
    id: 'mono', 
    name: 'Monochrome', 
    bg: '#1a1a1a', 
    bgSecondary: '#2a2a2a', 
    bgTertiary: '#3a3a3a', 
    bgCard: '#252525',
    text: '#ffffff', 
    textSecondary: '#cccccc',
    textMuted: '#999999',
    accent: '#ffffff',
    accentHover: '#e0e0e0',
    accentText: '#1a1a1a', // Texte sombre sur fond blanc
    accentSecondary: '#cccccc',
    accentGlow: '#ffffff',
    borderPrimary: 'rgba(255, 255, 255, 0.3)',
    borderSecondary: 'rgba(255, 255, 255, 0.1)'
  },
  { 
    id: 'blue', 
    name: 'Blue', 
    bg: '#0a1628', 
    bgSecondary: '#131f35', 
    bgTertiary: '#1a2842', 
    bgCard: '#152238',
    text: '#e8f4f8', 
    textSecondary: '#9cb8c8',
    textMuted: '#6b8a9a',
    accent: '#3b82f6',
    accentHover: '#60a5fa',
    accentText: '#ffffff', // Texte blanc sur bouton bleu
    accentSecondary: '#06b6d4',
    accentGlow: '#3b82f6',
    borderPrimary: 'rgba(59, 130, 246, 0.3)',
    borderSecondary: 'rgba(156, 184, 200, 0.1)'
  },
  { 
    id: 'green', 
    name: 'Green', 
    bg: '#0a1a0a', 
    bgSecondary: '#132815', 
    bgTertiary: '#1a3620', 
    bgCard: '#152a18',
    text: '#e8f8e8', 
    textSecondary: '#9cc89c',
    textMuted: '#6b8a6b',
    accent: '#10b981',
    accentHover: '#34d399',
    accentText: '#ffffff', // Texte blanc sur bouton vert
    accentSecondary: '#06b6d4',
    accentGlow: '#10b981',
    borderPrimary: 'rgba(16, 185, 129, 0.3)',
    borderSecondary: 'rgba(156, 200, 156, 0.1)'
  },
  { 
    id: 'purple', 
    name: 'Purple', 
    bg: '#1a0a1a', 
    bgSecondary: '#251325', 
    bgTertiary: '#301c30', 
    bgCard: '#221522',
    text: '#f8e8f8', 
    textSecondary: '#c89cc8',
    textMuted: '#9a6b9a',
    accent: '#a855f7',
    accentHover: '#c084fc',
    accentText: '#ffffff', // Texte blanc sur bouton violet
    accentSecondary: '#06b6d4',
    accentGlow: '#a855f7',
    borderPrimary: 'rgba(168, 85, 247, 0.3)',
    borderSecondary: 'rgba(200, 156, 200, 0.1)'
  },
]

export default function ThemeSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentThemeId, setCurrentThemeId] = useState(() => localStorage.getItem('theme') || 'dark');
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
        buttonRef.current?.focus(); // Retourner le focus au bouton
      }
    },
    enabled: isOpen
  });

  const currentTheme = themes.find(t => t.id === currentThemeId) || themes[0];

  const handleThemeChange = (themeId) => {
    localStorage.setItem('theme', themeId);
    setCurrentThemeId(themeId);
    const theme = themes.find(t => t.id === themeId);
    if (theme) {
      // Appliquer toutes les variables CSS du thème
      document.documentElement.style.setProperty('--bg-primary', theme.bg);
      document.documentElement.style.setProperty('--bg-secondary', theme.bgSecondary);
      document.documentElement.style.setProperty('--bg-tertiary', theme.bgTertiary);
      document.documentElement.style.setProperty('--bg-card', theme.bgCard);
      document.documentElement.style.setProperty('--text-primary', theme.text);
      document.documentElement.style.setProperty('--text-secondary', theme.textSecondary);
      document.documentElement.style.setProperty('--text-muted', theme.textMuted);
      document.documentElement.style.setProperty('--accent-primary', theme.accent);
      document.documentElement.style.setProperty('--accent-hover', theme.accentHover);
      document.documentElement.style.setProperty('--accent-text', theme.accentText);
      document.documentElement.style.setProperty('--accent-secondary', theme.accentSecondary);
      document.documentElement.style.setProperty('--accent-glow', theme.accentGlow);
      document.documentElement.style.setProperty('--border-primary', theme.borderPrimary);
      document.documentElement.style.setProperty('--border-secondary', theme.borderSecondary);
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
        aria-label="Select theme"
        aria-expanded={isOpen}
        aria-haspopup="true"
        className="p-2 text-text-secondary/60 hover:text-text-primary transition-colors opacity-60 hover:opacity-100"
      >
        <BrushIcon className="w-4 h-4" stroke="currentColor" />
      </button>
      
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute top-full right-0 mt-2 bg-bg-secondary/90 backdrop-blur-md rounded-lg shadow-xl z-50 min-w-[180px] overflow-hidden animate-fade-in"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div className="py-1">
            {themes.map((theme) => (
              <button
                key={theme.id}
                onClick={() => handleThemeChange(theme.id)}
                className={`w-full px-4 py-2.5 text-left text-sm transition-colors flex items-center justify-between ${
                  currentTheme.id === theme.id
                    ? 'bg-accent-primary/20 text-accent-primary'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-primary/20'
                }`}
              >
                <span>{theme.name}</span>
                {currentTheme.id === theme.id && (
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

