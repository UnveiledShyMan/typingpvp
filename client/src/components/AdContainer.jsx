/**
 * Composant conteneur pour les publicités
 * Supporte Google AdSense et autres réseaux publicitaires
 * Affiche les publicités uniquement si le consentement marketing est donné
 */

import { useEffect, useRef, useState } from 'react';

const AD_CLIENT_ID = import.meta.env.VITE_ADSENSE_CLIENT_ID || '';

export default function AdContainer({ 
  slot, 
  format = 'auto',
  style = 'display:block',
  className = '',
  responsive = true,
  placeholder = null
}) {
  const adRef = useRef(null);
  const [canShowAds, setCanShowAds] = useState(false);
  const [adLoaded, setAdLoaded] = useState(false);

  useEffect(() => {
    // Vérifier le consentement
    const checkConsent = () => {
      const consent = localStorage.getItem('cookie_consent');
      const preferences = localStorage.getItem('cookie_preferences');
      
      if (consent === 'rejected') {
        setCanShowAds(false);
        return;
      }

      if (!consent || consent === 'custom') {
        if (preferences) {
          try {
            const prefs = JSON.parse(preferences);
            setCanShowAds(prefs.marketing === true);
          } catch (e) {
            setCanShowAds(false);
          }
        } else {
          setCanShowAds(false);
        }
      } else if (consent === 'accepted') {
        setCanShowAds(true);
      }
    };

    checkConsent();

    // Écouter les changements de consentement
    const handleConsentUpdate = () => checkConsent();
    window.addEventListener('cookie-consent-updated', handleConsentUpdate);

    return () => {
      window.removeEventListener('cookie-consent-updated', handleConsentUpdate);
    };
  }, []);

  useEffect(() => {
    if (!canShowAds || !AD_CLIENT_ID || adLoaded) return;

    // Charger Google AdSense si disponible
    if (window.adsbygoogle && adRef.current) {
      try {
        window.adsbygoogle.push({});
        setAdLoaded(true);
      } catch (e) {
        console.error('Error loading ad:', e);
      }
    } else {
      // Charger le script AdSense
      const script = document.createElement('script');
      script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + AD_CLIENT_ID;
      script.async = true;
      script.crossOrigin = 'anonymous';
      script.onload = () => {
        if (adRef.current) {
          try {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
            setAdLoaded(true);
          } catch (e) {
            console.error('Error initializing ad:', e);
          }
        }
      };
      document.head.appendChild(script);
    }
  }, [canShowAds, adLoaded]);

  if (!canShowAds) {
    return placeholder ? (
      <div className={className}>
        {placeholder}
      </div>
    ) : null;
  }

  // Hauteurs minimales par format pour éviter CLS (Cumulative Layout Shift)
  const minHeights = {
    'horizontal': '90px',   // Banner horizontal
    'vertical': '250px',    // Sidebar vertical
    'fluid': '100px',       // In-article
    'auto': '90px'          // Auto (par défaut)
  };
  const minHeight = minHeights[format] || minHeights.auto;

  return (
    <div 
      className={`ad-container ${className}`}
      style={{ 
        minHeight: canShowAds ? minHeight : '0',
        // Réserver l'espace même si l'annonce n'est pas chargée pour éviter CLS
        position: 'relative'
      }}
    >
      {canShowAds && (
        <ins
          ref={adRef}
          className="adsbygoogle"
          style={{ 
            display: 'block',
            minHeight: minHeight,
            ...(responsive && { width: '100%', height: 'auto' })
          }}
          data-ad-client={AD_CLIENT_ID}
          data-ad-slot={slot}
          data-ad-format={format}
          data-full-width-responsive={responsive ? 'true' : 'false'}
        />
      )}
    </div>
  );
}

// Composants prédéfinis pour différents formats
export function BannerAd({ className = '', slot }) {
  return (
    <AdContainer
      slot={slot}
      format="horizontal"
      className={`w-full ${className}`}
      placeholder={
        <div className="w-full h-90 bg-bg-primary/20 border border-border-secondary rounded-lg flex items-center justify-center text-text-secondary text-sm">
          Publicité
        </div>
      }
    />
  );
}

export function SidebarAd({ className = '', slot }) {
  return (
    <AdContainer
      slot={slot}
      format="vertical"
      className={`w-full ${className}`}
      placeholder={
        <div className="w-full h-250 bg-bg-primary/20 border border-border-secondary rounded-lg flex items-center justify-center text-text-secondary text-sm">
          Publicité
        </div>
      }
    />
  );
}

export function InArticleAd({ className = '', slot }) {
  return (
    <AdContainer
      slot={slot}
      format="fluid"
      className={`w-full my-8 ${className}`}
      placeholder={
        <div className="w-full h-100 bg-bg-primary/20 border border-border-secondary rounded-lg flex items-center justify-center text-text-secondary text-sm">
          Publicité
        </div>
      }
    />
  );
}

