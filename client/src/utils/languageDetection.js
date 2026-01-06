// Détection automatique de la langue du navigateur
import { languages } from '../data/languages'

// Mapping des codes de langue du navigateur vers nos codes
const browserToAppLanguage = {
  'en': 'en',
  'en-US': 'en',
  'en-GB': 'en',
  'en-CA': 'en',
  'en-AU': 'en',
  'fr': 'fr',
  'fr-FR': 'fr',
  'fr-CA': 'fr',
  'fr-BE': 'fr',
  'fr-CH': 'fr',
  'es': 'es',
  'es-ES': 'es',
  'es-MX': 'es',
  'es-AR': 'es',
  'es-CO': 'es',
  'de': 'de',
  'de-DE': 'de',
  'de-AT': 'de',
  'de-CH': 'de',
  'it': 'it',
  'it-IT': 'it',
  'pt': 'pt',
  'pt-BR': 'pt',
  'pt-PT': 'pt',
  'ru': 'ru',
  'ru-RU': 'ru',
  'ja': 'ja',
  'ja-JP': 'ja',
  'zh': 'zh',
  'zh-CN': 'zh',
  'zh-TW': 'zh',
  'ko': 'ko',
  'ko-KR': 'ko',
};

/**
 * Détecte la langue du navigateur et retourne le code de langue correspondant
 * @returns {string} Code de langue (en, fr, es, etc.) ou 'en' par défaut
 */
export function detectBrowserLanguage() {
  // Récupérer la langue du navigateur
  const browserLang = navigator.language || navigator.userLanguage;
  
  // Essayer de mapper directement
  if (browserToAppLanguage[browserLang]) {
    return browserToAppLanguage[browserLang];
  }
  
  // Extraire le code de langue principal (avant le tiret)
  const langCode = browserLang.split('-')[0].toLowerCase();
  
  // Vérifier si cette langue est supportée
  if (languages[langCode]) {
    return langCode;
  }
  
  // Essayer de trouver une correspondance dans le mapping
  for (const [browserCode, appCode] of Object.entries(browserToAppLanguage)) {
    if (browserCode.startsWith(langCode)) {
      return appCode;
    }
  }
  
  // Par défaut, retourner 'en'
  return 'en';
}

/**
 * Récupère la langue sauvegardée ou détecte automatiquement
 * @returns {string} Code de langue
 */
export function getDefaultLanguage() {
  // Vérifier s'il y a une préférence sauvegardée
  const savedLang = localStorage.getItem('typingLanguage');
  if (savedLang && languages[savedLang]) {
    return savedLang;
  }
  
  // Sinon, détecter automatiquement
  return detectBrowserLanguage();
}

/**
 * Met à jour l'attribut lang du HTML pour le SEO
 * Cette fonction est appelée automatiquement par le composant SEOHead
 * mais peut aussi être utilisée manuellement si nécessaire
 * @param {string} langCode - Code de langue (en, fr, es, etc.)
 */
export function updateHTMLLang(langCode) {
  if (typeof document !== 'undefined' && document.documentElement) {
    document.documentElement.lang = langCode;
  }
}

/**
 * Initialise la langue dans le HTML au chargement de la page
 * À appeler une fois au démarrage de l'application
 */
export function initializeHTMLLang() {
  const defaultLang = getDefaultLanguage();
  updateHTMLLang(defaultLang);
}

