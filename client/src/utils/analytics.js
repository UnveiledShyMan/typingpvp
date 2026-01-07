/**
 * Utilitaire pour Google Analytics 4
 * Ne charge GA que si le consentement a été donné
 */

const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || 'G-L1NF892NF7';

// Initialiser Google Analytics
export function initGoogleAnalytics() {
  if (!GA_MEASUREMENT_ID) {
    console.warn('Google Analytics Measurement ID not configured');
    return;
  }

  // Vérifier le consentement
  const consent = localStorage.getItem('cookie_consent');
  const preferences = localStorage.getItem('cookie_preferences');
  
  if (!consent || consent === 'rejected') {
    return;
  }

  let prefs = { analytics: false };
  if (preferences) {
    try {
      prefs = JSON.parse(preferences);
    } catch (e) {
      console.error('Error parsing cookie preferences:', e);
    }
  }

  if (!prefs.analytics) {
    return;
  }

  // Charger Google Analytics avec consentement
  loadGoogleAnalytics();
}

function loadGoogleAnalytics() {
  // Le script gtag.js est déjà chargé dans index.html
  // Il suffit de mettre à jour le consentement pour activer le tracking
  if (window.gtag) {
    // Mettre à jour le consentement pour activer le tracking
    gtag('consent', 'update', {
      analytics_storage: 'granted',
      ad_storage: 'granted'
    });
    
    // Reconfigurer avec le consentement activé
    gtag('config', GA_MEASUREMENT_ID, {
      anonymize_ip: true,
      cookie_flags: 'SameSite=None;Secure',
      analytics_storage: 'granted',
      ad_storage: 'granted'
    });
  }

  // Écouter les mises à jour de consentement
  window.addEventListener('cookie-consent-updated', (event) => {
    const prefs = event.detail;
    if (window.gtag) {
      gtag('consent', 'update', {
        analytics_storage: prefs.analytics ? 'granted' : 'denied',
        ad_storage: prefs.marketing ? 'granted' : 'denied'
      });
    }
  });
}

// Fonctions helper pour tracking
export function trackEvent(category, action, label, value) {
  if (window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value
    });
  }
}

export function trackPageView(path) {
  if (window.gtag) {
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_path: path
    });
  }
}

export function trackConversion(conversionId, value, currency = 'EUR') {
  if (window.gtag) {
    window.gtag('event', 'conversion', {
      send_to: conversionId,
      value: value,
      currency: currency
    });
  }
}

