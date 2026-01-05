import { useState, useRef, useEffect } from 'react'
import BrushIcon from './icons/BrushIcon'

const themes = [
  { id: 'dark', name: 'Dark', bg: '#0a0e1a', text: '#e8ecf3', accent: '#8b5cf6' },
  { id: 'light', name: 'Light', bg: '#ffffff', text: '#1a1a1a', accent: '#8b5cf6' },
  { id: 'mono', name: 'Monochrome', bg: '#1a1a1a', text: '#ffffff', accent: '#ffffff' },
  { id: 'blue', name: 'Blue', bg: '#0a1628', text: '#e8f4f8', accent: '#3b82f6' },
  { id: 'green', name: 'Green', bg: '#0a1a0a', text: '#e8f8e8', accent: '#10b981' },
  { id: 'purple', name: 'Purple', bg: '#1a0a1a', text: '#f8e8f8', accent: '#a855f7' },
]

export default function ThemeSelector() {
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

  const currentTheme = themes.find(t => t.id === (localStorage.getItem('theme') || 'dark')) || themes[0];

  const handleThemeChange = (themeId) => {
    localStorage.setItem('theme', themeId);
    const theme = themes.find(t => t.id === themeId);
    if (theme) {
      document.documentElement.style.setProperty('--bg-primary', theme.bg);
      document.documentElement.style.setProperty('--text-primary', theme.text);
      document.documentElement.style.setProperty('--accent-primary', theme.accent);
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
        className="p-2 text-text-secondary/60 hover:text-text-primary transition-colors opacity-60 hover:opacity-100"
        aria-label="Select theme"
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

