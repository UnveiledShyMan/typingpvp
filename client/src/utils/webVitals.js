/**
 * Instrumentation des Core Web Vitals pour Google Analytics 4
 * Mesure LCP, FID/INP, CLS, FCP, TTFB et envoie les données à GA4
 */

import { onCLS, onFCP, onLCP, onFID, onINP, onTTFB } from 'web-vitals';

const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || 'G-L1NF892NF7';

/**
 * Envoie une métrique Core Web Vital à Google Analytics 4
 * @param {Object} metric - Métrique web-vitals
 */
function sendToGA4(metric) {
  // Vérifier que gtag est disponible et que le consentement est donné
  if (!window.gtag) {
    return;
  }

  // Vérifier le consentement analytics
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
      return;
    }
  }

  if (!prefs.analytics) {
    return;
  }

  // Envoyer la métrique comme événement personnalisé à GA4
  window.gtag('event', metric.name, {
    event_category: 'Web Vitals',
    event_label: metric.id,
    value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
    non_interaction: true,
    // Métadonnées supplémentaires
    metric_id: metric.id,
    metric_value: metric.value,
    metric_delta: metric.delta,
    metric_rating: metric.rating, // 'good', 'needs-improvement', 'poor'
    // Informations sur la page
    page_path: window.location.pathname,
    page_title: document.title
  });

  // Log en développement pour debug
  if (import.meta.env.DEV) {
    console.log(`[Web Vitals] ${metric.name}:`, {
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta
    });
  }
}

/**
 * Initialise le tracking des Core Web Vitals
 * Appelé une seule fois au chargement de l'application
 */
export function initWebVitals() {
  // LCP - Largest Contentful Paint (bon: < 2.5s, améliorable: 2.5-4s, mauvais: > 4s)
  onLCP(sendToGA4);

  // INP - Interaction to Next Paint (remplace FID, bon: < 200ms, améliorable: 200-500ms, mauvais: > 500ms)
  // Utiliser INP si disponible (Chrome 96+), sinon FID
  if ('PerformanceObserver' in window && 'supportedEntryTypes' in PerformanceObserver) {
    if (PerformanceObserver.supportedEntryTypes.includes('event')) {
      onINP(sendToGA4);
    } else {
      // Fallback sur FID pour les navigateurs plus anciens
      onFID(sendToGA4);
    }
  } else {
    onFID(sendToGA4);
  }

  // CLS - Cumulative Layout Shift (bon: < 0.1, améliorable: 0.1-0.25, mauvais: > 0.25)
  onCLS(sendToGA4);

  // FCP - First Contentful Paint (bon: < 1.8s, améliorable: 1.8-3s, mauvais: > 3s)
  onFCP(sendToGA4);

  // TTFB - Time to First Byte (bon: < 800ms, améliorable: 800-1800ms, mauvais: > 1800ms)
  onTTFB(sendToGA4);
}

/**
 * Fonction helper pour obtenir les métriques actuelles (pour debug)
 * @returns {Promise<Object>} Objet avec toutes les métriques
 */
export async function getWebVitalsMetrics() {
  return new Promise((resolve) => {
    const metrics = {};
    let count = 0;
    const totalMetrics = 5;

    const handleMetric = (metric) => {
      metrics[metric.name] = {
        value: metric.value,
        rating: metric.rating,
        delta: metric.delta
      };
      count++;
      if (count === totalMetrics) {
        resolve(metrics);
      }
    };

    onLCP(handleMetric);
    onINP(handleMetric);
    onCLS(handleMetric);
    onFCP(handleMetric);
    onTTFB(handleMetric);

    // Timeout après 10 secondes
    setTimeout(() => {
      resolve(metrics);
    }, 10000);
  });
}

