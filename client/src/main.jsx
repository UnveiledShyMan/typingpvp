import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { initializeHTMLLang } from './utils/languageDetection.js'

// Initialiser la langue du HTML pour le SEO (avant le rendu)
initializeHTMLLang();

// Initialiser les couleurs par défaut (thème dark fixe)
const initTheme = () => {
  // Appliquer les variables CSS du thème dark par défaut
  document.documentElement.style.setProperty('--bg-primary', '#0a0e1a');
  document.documentElement.style.setProperty('--bg-secondary', '#131825');
  document.documentElement.style.setProperty('--bg-tertiary', '#1a1f2e');
  document.documentElement.style.setProperty('--bg-card', '#151a27');
  document.documentElement.style.setProperty('--text-primary', '#e8ecf3');
  document.documentElement.style.setProperty('--text-secondary', '#9ca3b8');
  document.documentElement.style.setProperty('--text-muted', '#6b7280');
  document.documentElement.style.setProperty('--accent-primary', '#8b5cf6');
  document.documentElement.style.setProperty('--accent-hover', '#a78bfa');
  document.documentElement.style.setProperty('--accent-text', '#ffffff');
  document.documentElement.style.setProperty('--accent-secondary', '#06b6d4');
  document.documentElement.style.setProperty('--accent-glow', '#8b5cf6');
  document.documentElement.style.setProperty('--border-primary', 'rgba(139, 92, 246, 0.2)');
  document.documentElement.style.setProperty('--border-secondary', 'rgba(156, 163, 184, 0.1)');
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

// Fonction pour cacher l'overlay de chargement avec fondu noir doux
const hideLoadingOverlay = () => {
  const overlay = document.getElementById('loading-overlay');
  if (overlay) {
    // Ajouter la classe fade-out pour le fondu doux
    overlay.classList.add('fade-out');
    // Changer le fond du body en même temps pour une transition fluide
    document.body.classList.add('content-ready');
    // Cacher complètement après la transition
    setTimeout(() => {
      overlay.classList.add('hidden');
    }, 800); // Durée de la transition (synchronisée avec l'animation CSS)
  } else {
    // Si l'overlay n'existe pas, changer quand même le fond du body
    document.body.classList.add('content-ready');
  }
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
  
  // Cacher l'overlay avec un fondu noir doux
  hideLoadingOverlay();
};

// Enregistrer le Service Worker pour PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('[SW] Service Worker registered:', registration.scope);
        
        // Vérifier les mises à jour périodiquement
        setInterval(() => {
          registration.update();
        }, 60000); // Vérifier toutes les minutes
      })
      .catch((error) => {
        console.warn('[SW] Service Worker registration failed:', error);
      });
  });
}

// Initialiser l'application
initApp();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
