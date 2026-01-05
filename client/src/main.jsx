import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Initialiser le thème et la police depuis localStorage
const initTheme = () => {
  const savedTheme = localStorage.getItem('theme') || 'dark';
  const themes = {
    dark: { bg: '#0a0e1a', text: '#e8ecf3', accent: '#8b5cf6' },
    light: { bg: '#ffffff', text: '#1a1a1a', accent: '#8b5cf6' },
    mono: { bg: '#1a1a1a', text: '#ffffff', accent: '#ffffff' },
    blue: { bg: '#0a1628', text: '#e8f4f8', accent: '#3b82f6' },
    green: { bg: '#0a1a0a', text: '#e8f8e8', accent: '#10b981' },
    purple: { bg: '#1a0a1a', text: '#f8e8f8', accent: '#a855f7' },
  };
  const theme = themes[savedTheme] || themes.dark;
  document.documentElement.style.setProperty('--bg-primary', theme.bg);
  document.documentElement.style.setProperty('--text-primary', theme.text);
  document.documentElement.style.setProperty('--accent-primary', theme.accent);
};

const initFont = () => {
  const savedFont = localStorage.getItem('typingFont') || 'jetbrains';
  const fonts = {
    jetbrains: "'JetBrains Mono', monospace",
    fira: "'Fira Code', monospace",
    source: "'Source Code Pro', monospace",
    courier: "'Courier New', monospace",
    monaco: "'Monaco', monospace",
    consolas: "'Consolas', monospace",
  };
  const font = fonts[savedFont] || fonts.jetbrains;
  document.documentElement.style.setProperty('--typing-font', font);
};

// Initialiser avant le rendu
initTheme();
initFont();

// Initialiser le délai du curseur depuis localStorage
const initCursorLag = () => {
  const savedSmoothness = localStorage.getItem('typingSmoothness') || 'medium';
  const smoothnessOptions = [
    { id: 'instant', cursorLag: 0 },
    { id: 'fast', cursorLag: 30 },
    { id: 'medium', cursorLag: 60 },
    { id: 'smooth', cursorLag: 100 },
    { id: 'very-smooth', cursorLag: 150 },
  ];
  const option = smoothnessOptions.find(opt => opt.id === savedSmoothness) || smoothnessOptions[2];
  document.documentElement.style.setProperty('--cursor-lag-duration', `${option.cursorLag}ms`);
};

initCursorLag();

// Fonction pour cacher l'overlay de chargement
const hideLoadingOverlay = () => {
  const overlay = document.getElementById('loading-overlay');
  if (overlay) {
    // Ajouter la classe fade-out pour le fondu
    overlay.classList.add('fade-out');
    // Cacher complètement après la transition
    setTimeout(() => {
      overlay.classList.add('hidden');
    }, 500); // Durée de la transition
  }
  // Changer le fond du body
  document.body.classList.add('content-ready');
};

// Attendre que les polices soient chargées et que React soit monté
const initApp = async () => {
  // Attendre que les polices soient chargées
  if (document.fonts && document.fonts.ready) {
    await document.fonts.ready;
  } else {
    // Fallback si document.fonts n'est pas disponible
    await new Promise((resolve) => {
      if (document.readyState === 'complete') {
        resolve();
      } else {
        window.addEventListener('load', resolve);
      }
    });
  }
  
  // Attendre un peu pour que React soit monté
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Cacher l'overlay
  hideLoadingOverlay();
};

// Initialiser l'application
initApp();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
