/**
 * Composant de consentement RGPD/Cookies
 * Conforme RGPD et ePrivacy Directive
 * Supporte Google Analytics, publicités, et autres trackers
 */

import { useState, useEffect } from 'react';

const COOKIE_CONSENT_KEY = 'cookie_consent';
const COOKIE_PREFERENCES_KEY = 'cookie_preferences';

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState({
    necessary: true, // Toujours actif (cookies essentiels)
    analytics: false,
    marketing: false,
    functional: false
  });

  useEffect(() => {
    // Vérifier si le consentement a déjà été donné
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    const savedPreferences = localStorage.getItem(COOKIE_PREFERENCES_KEY);
    
    if (!consent) {
      setShowBanner(true);
    } else if (savedPreferences) {
      try {
        const prefs = JSON.parse(savedPreferences);
        setPreferences(prefs);
        applyConsent(prefs);
      } catch (e) {
        console.error('Error parsing cookie preferences:', e);
      }
    }
  }, []);

  const applyConsent = (prefs) => {
    // Déclencher les scripts selon les préférences
    if (prefs.analytics) {
      // Google Analytics sera chargé ici
      window.gtag?.('consent', 'update', {
        analytics_storage: 'granted'
      });
    }
    
    if (prefs.marketing) {
      // Scripts publicitaires seront chargés ici
      window.gtag?.('consent', 'update', {
        ad_storage: 'granted'
      });
    }

    // Event pour notifier d'autres composants
    window.dispatchEvent(new CustomEvent('cookie-consent-updated', { detail: prefs }));
  };

  const handleAcceptAll = () => {
    const allAccepted = {
      necessary: true,
      analytics: true,
      marketing: true,
      functional: true
    };
    setPreferences(allAccepted);
    localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted');
    localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(allAccepted));
    setShowBanner(false);
    applyConsent(allAccepted);
  };

  const handleRejectAll = () => {
    const onlyNecessary = {
      necessary: true,
      analytics: false,
      marketing: false,
      functional: false
    };
    setPreferences(onlyNecessary);
    localStorage.setItem(COOKIE_CONSENT_KEY, 'rejected');
    localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(onlyNecessary));
    setShowBanner(false);
    applyConsent(onlyNecessary);
  };

  const handleSavePreferences = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'custom');
    localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(preferences));
    setShowBanner(false);
    setShowPreferences(false);
    applyConsent(preferences);
  };

  if (!showBanner && !showPreferences) return null;

  return (
    <>
      {/* Bannière de consentement */}
      {showBanner && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-bg-secondary border-t border-border-secondary shadow-2xl">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
              <div className="flex-1">
                <h3 className="text-text-primary font-semibold mb-2">🍪 Cookies & Confidentialité</h3>
                <p className="text-text-secondary text-sm">
                  Nous utilisons des cookies pour améliorer votre expérience, analyser le trafic et personnaliser le contenu. 
                  En cliquant sur "Accepter tout", vous acceptez notre utilisation des cookies. 
                  <button
                    onClick={() => {
                      setShowBanner(false);
                      setShowPreferences(true);
                    }}
                    className="text-accent-primary hover:text-accent-hover underline ml-1"
                  >
                    Gérer les préférences
                  </button>
                </p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={handleRejectAll}
                  className="px-4 py-2 bg-bg-primary hover:bg-bg-tertiary text-text-primary rounded-lg border border-border-secondary transition-colors text-sm font-medium"
                >
                  Refuser
                </button>
                <button
                  onClick={handleAcceptAll}
                  className="px-4 py-2 bg-accent-primary hover:bg-accent-hover text-white rounded-lg transition-colors text-sm font-medium"
                >
                  Accepter tout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de préférences */}
      {showPreferences && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-bg-secondary rounded-xl border border-border-secondary shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-text-primary mb-4">Gérer les cookies</h2>
              
              <div className="space-y-4 mb-6">
                {/* Cookies nécessaires (toujours actif) */}
                <div className="p-4 bg-bg-primary rounded-lg border border-border-secondary">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-text-primary font-semibold">Cookies nécessaires</h3>
                      <p className="text-text-secondary text-sm mt-1">
                        Ces cookies sont essentiels au fonctionnement du site et ne peuvent pas être désactivés.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.necessary}
                        disabled
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-accent-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                    </label>
                  </div>
                </div>

                {/* Analytics */}
                <div className="p-4 bg-bg-primary rounded-lg border border-border-secondary">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-text-primary font-semibold">Cookies analytiques</h3>
                      <p className="text-text-secondary text-sm mt-1">
                        Ces cookies nous aident à comprendre comment les visiteurs utilisent notre site (Google Analytics).
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.analytics}
                        onChange={(e) => setPreferences({ ...preferences, analytics: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className={`w-11 h-6 rounded-full peer peer-checked:bg-accent-primary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${preferences.analytics ? 'bg-accent-primary' : 'bg-bg-tertiary'}`}></div>
                    </label>
                  </div>
                </div>

                {/* Marketing */}
                <div className="p-4 bg-bg-primary rounded-lg border border-border-secondary">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-text-primary font-semibold">Cookies marketing</h3>
                      <p className="text-text-secondary text-sm mt-1">
                        Ces cookies sont utilisés pour afficher des publicités personnalisées.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.marketing}
                        onChange={(e) => setPreferences({ ...preferences, marketing: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className={`w-11 h-6 rounded-full peer peer-checked:bg-accent-primary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${preferences.marketing ? 'bg-accent-primary' : 'bg-bg-tertiary'}`}></div>
                    </label>
                  </div>
                </div>

                {/* Fonctionnels */}
                <div className="p-4 bg-bg-primary rounded-lg border border-border-secondary">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-text-primary font-semibold">Cookies fonctionnels</h3>
                      <p className="text-text-secondary text-sm mt-1">
                        Ces cookies permettent d'améliorer les fonctionnalités du site.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.functional}
                        onChange={(e) => setPreferences({ ...preferences, functional: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className={`w-11 h-6 rounded-full peer peer-checked:bg-accent-primary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${preferences.functional ? 'bg-accent-primary' : 'bg-bg-tertiary'}`}></div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowPreferences(false);
                    if (!localStorage.getItem(COOKIE_CONSENT_KEY)) {
                      setShowBanner(true);
                    }
                  }}
                  className="px-4 py-2 bg-bg-primary hover:bg-bg-tertiary text-text-primary rounded-lg border border-border-secondary transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSavePreferences}
                  className="px-4 py-2 bg-accent-primary hover:bg-accent-hover text-white rounded-lg transition-colors"
                >
                  Enregistrer les préférences
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

