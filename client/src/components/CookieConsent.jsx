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
      {/* Bannière de consentement - Design amélioré */}
      {showBanner && (
        <div 
          className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6 animate-slide-up"
          style={{
            animation: 'slideUp 0.4s ease-out'
          }}
        >
          <div className="max-w-6xl mx-auto">
            <div 
              className="relative overflow-hidden rounded-2xl p-6 md:p-8 shadow-2xl border"
              style={{
                background: 'linear-gradient(135deg, rgba(19, 24, 37, 0.95) 0%, rgba(26, 31, 46, 0.95) 100%)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                borderColor: 'rgba(139, 92, 246, 0.2)',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(139, 92, 246, 0.1), inset 0 0 60px rgba(139, 92, 246, 0.05)'
              }}
            >
              {/* Effet de brillance animé */}
              <div 
                className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-accent-primary to-transparent opacity-50"
                style={{
                  background: 'linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.5), transparent)',
                  animation: 'shimmer 3s infinite'
                }}
              />
              
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6 relative z-10">
                {/* Icône et contenu */}
                <div className="flex items-start gap-4 flex-1">
                  <div 
                    className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                    style={{
                      background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(139, 92, 246, 0.1))',
                      border: '1px solid rgba(139, 92, 246, 0.3)'
                    }}
                  >
                    🍪
                  </div>
                  <div className="flex-1">
                    <h3 className="text-text-primary font-bold text-lg mb-2 flex items-center gap-2">
                      Cookies & Confidentialité
                    </h3>
                    <p className="text-text-secondary text-sm leading-relaxed">
                      Nous utilisons des cookies pour améliorer votre expérience, analyser le trafic et personnaliser le contenu. 
                      En cliquant sur "Accepter tout", vous acceptez notre utilisation des cookies.{' '}
                      <button
                        onClick={() => {
                          setShowBanner(false);
                          setShowPreferences(true);
                        }}
                        className="text-accent-primary hover:text-accent-hover underline font-medium transition-colors"
                      >
                        Gérer les préférences
                      </button>
                    </p>
                  </div>
                </div>
                
                {/* Boutons */}
                <div className="flex gap-3 flex-shrink-0 w-full md:w-auto">
                  <button
                    onClick={handleRejectAll}
                    className="px-6 py-3 bg-bg-primary/60 hover:bg-bg-primary border border-border-secondary/60 hover:border-border-secondary text-text-primary rounded-xl transition-all duration-200 text-sm font-semibold backdrop-blur-sm hover:scale-105 active:scale-95"
                  >
                    Refuser
                  </button>
                  <button
                    onClick={handleAcceptAll}
                    className="px-6 py-3 bg-gradient-to-r from-accent-primary to-accent-hover hover:from-accent-hover hover:to-accent-primary text-white rounded-xl transition-all duration-200 text-sm font-semibold shadow-lg shadow-accent-primary/30 hover:shadow-xl hover:shadow-accent-primary/40 hover:scale-105 active:scale-95"
                  >
                    Accepter tout
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <style>{`
            @keyframes slideUp {
              from {
                transform: translateY(100%);
                opacity: 0;
              }
              to {
                transform: translateY(0);
                opacity: 1;
              }
            }
            @keyframes shimmer {
              0%, 100% {
                opacity: 0.3;
              }
              50% {
                opacity: 0.7;
              }
            }
          `}</style>
        </div>
      )}

      {/* Modal de préférences - Design amélioré */}
      {showPreferences && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in"
          onClick={() => {
            setShowPreferences(false);
            if (!localStorage.getItem(COOKIE_CONSENT_KEY)) {
              setShowBanner(true);
            }
          }}
          style={{
            animation: 'fadeIn 0.3s ease-out'
          }}
        >
          <div 
            className="relative overflow-hidden rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'linear-gradient(135deg, rgba(19, 24, 37, 0.98) 0%, rgba(26, 31, 46, 0.98) 100%)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              borderColor: 'rgba(139, 92, 246, 0.3)',
              boxShadow: '0 25px 80px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(139, 92, 246, 0.2), inset 0 0 80px rgba(139, 92, 246, 0.05)'
            }}
          >
            {/* Effet de brillance en haut */}
            <div 
              className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-accent-primary to-transparent opacity-50"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.6), transparent)'
              }}
            />
            
            <div className="p-6 md:p-8 relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                  style={{
                    background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(139, 92, 246, 0.1))',
                    border: '1px solid rgba(139, 92, 246, 0.3)'
                  }}
                >
                  ⚙️
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-text-primary">Gérer les cookies</h2>
              </div>
              
              <div className="space-y-3 mb-6">
                {/* Cookies nécessaires */}
                <CookieOption
                  icon="🔒"
                  title="Cookies nécessaires"
                  description="Ces cookies sont essentiels au fonctionnement du site et ne peuvent pas être désactivés."
                  checked={preferences.necessary}
                  disabled={true}
                  onChange={() => {}}
                />

                {/* Analytics */}
                <CookieOption
                  icon="📊"
                  title="Cookies analytiques"
                  description="Ces cookies nous aident à comprendre comment les visiteurs utilisent notre site (Google Analytics)."
                  checked={preferences.analytics}
                  onChange={(e) => setPreferences({ ...preferences, analytics: e.target.checked })}
                />

                {/* Marketing */}
                <CookieOption
                  icon="📢"
                  title="Cookies marketing"
                  description="Ces cookies sont utilisés pour afficher des publicités personnalisées."
                  checked={preferences.marketing}
                  onChange={(e) => setPreferences({ ...preferences, marketing: e.target.checked })}
                />

                {/* Fonctionnels */}
                <CookieOption
                  icon="⚡"
                  title="Cookies fonctionnels"
                  description="Ces cookies permettent d'améliorer les fonctionnalités du site."
                  checked={preferences.functional}
                  onChange={(e) => setPreferences({ ...preferences, functional: e.target.checked })}
                />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-border-secondary/50">
                <button
                  onClick={() => {
                    setShowPreferences(false);
                    if (!localStorage.getItem(COOKIE_CONSENT_KEY)) {
                      setShowBanner(true);
                    }
                  }}
                  className="px-6 py-3 bg-bg-primary/60 hover:bg-bg-primary border border-border-secondary/60 hover:border-border-secondary text-text-primary rounded-xl transition-all duration-200 font-semibold backdrop-blur-sm hover:scale-105 active:scale-95"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSavePreferences}
                  className="px-6 py-3 bg-gradient-to-r from-accent-primary to-accent-hover hover:from-accent-hover hover:to-accent-primary text-white rounded-xl transition-all duration-200 font-semibold shadow-lg shadow-accent-primary/30 hover:shadow-xl hover:shadow-accent-primary/40 hover:scale-105 active:scale-95"
                >
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
          
          <style>{`
            @keyframes fadeIn {
              from {
                opacity: 0;
              }
              to {
                opacity: 1;
              }
            }
          `}</style>
        </div>
      )}
    </>
  );
}

// Composant réutilisable pour chaque option de cookie
function CookieOption({ icon, title, description, checked, disabled = false, onChange }) {
  return (
    <div 
      className="p-5 rounded-xl border transition-all duration-200 hover:border-accent-primary/40"
      style={{
        background: checked 
          ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(139, 92, 246, 0.03))'
          : 'linear-gradient(135deg, rgba(10, 14, 26, 0.6), rgba(10, 14, 26, 0.4))',
        borderColor: checked ? 'rgba(139, 92, 246, 0.3)' : 'rgba(156, 163, 184, 0.1)'
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <div 
            className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-lg"
            style={{
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(139, 92, 246, 0.05))',
              border: '1px solid rgba(139, 92, 246, 0.2)'
            }}
          >
            {icon}
          </div>
          <div className="flex-1">
            <h3 className="text-text-primary font-semibold mb-1.5">{title}</h3>
            <p className="text-text-secondary/80 text-sm leading-relaxed">
              {description}
            </p>
          </div>
        </div>
        <label className={`relative inline-flex items-center cursor-pointer flex-shrink-0 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
          <input
            type="checkbox"
            checked={checked}
            disabled={disabled}
            onChange={onChange}
            className="sr-only peer"
          />
          <div 
            className={`w-12 h-6 rounded-full transition-all duration-300 relative ${
              checked 
                ? 'bg-gradient-to-r from-accent-primary to-accent-hover shadow-lg shadow-accent-primary/30' 
                : 'bg-bg-tertiary'
            }`}
          >
            <div 
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-all duration-300 shadow-md ${
                checked ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </div>
        </label>
      </div>
    </div>
  );
}

