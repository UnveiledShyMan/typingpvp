/**
 * Composant pour gérer les meta tags SEO dynamiques et optimisations SEO avancées
 * Supporte hreflang, JSON-LD structured data, et toutes les optimisations SEO modernes
 */

import { useEffect } from 'react';

// Mapping des codes de langue vers les codes hreflang standards
const LANG_HREFLANG_MAP = {
  en: 'en-US',
  fr: 'fr-FR',
  es: 'es-ES',
  de: 'de-DE',
  it: 'it-IT',
  pt: 'pt-PT',
  ru: 'ru-RU',
  ja: 'ja-JP',
  zh: 'zh-CN',
  ko: 'ko-KR'
};

// Codes de langue supportés pour le SEO international
const SUPPORTED_LANGUAGES = ['en', 'fr', 'es', 'de', 'it', 'pt', 'ru', 'ja', 'zh', 'ko'];

/**
 * Composant pour mettre à jour les meta tags de la page avec optimisations SEO avancées
 * @param {Object} props - Propriétés SEO
 * @param {string} props.title - Titre de la page
 * @param {string} props.description - Description de la page
 * @param {string} props.keywords - Mots-clés (optionnel)
 * @param {string} props.image - Image pour Open Graph (optionnel)
 * @param {string} props.url - URL de la page (optionnel)
 * @param {string} props.type - Type de page pour structured data (optionnel, default: 'WebSite')
 * @param {string} props.language - Code langue de la page (optionnel, default: détection automatique)
 * @param {Object} props.jsonLd - Données JSON-LD supplémentaires (optionnel)
 * @param {boolean} props.noindex - Désactiver l'indexation (optionnel, default: false)
 * @param {Array} props.breadcrumbs - Array de {name, url} pour breadcrumbs (optionnel)
 */
export default function SEOHead({ 
  title = 'TypingPVP - Competitive Typing Battles',
  description = 'Compete in real-time typing battles, improve your speed and accuracy, and climb the global leaderboard.',
  keywords = 'typing, typing test, typing speed, wpm, typing battle, competitive typing',
  image = '/logo.png',
  url = typeof window !== 'undefined' ? window.location.href : 'https://typingpvp.com/',
  type = 'WebSite',
  language = null,
  jsonLd = null,
  noindex = false,
  breadcrumbs = null
}) {
  useEffect(() => {
    // Construire l'URL absolue de l'image et de la page
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://typingpvp.com';
    const absoluteImageUrl = image.startsWith('http') ? image : `${baseUrl}${image}`;
    const absoluteUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;

    // Détecter la langue si non fournie
    const detectedLang = language || 
      (typeof window !== 'undefined' ? 
        (navigator.language?.split('-')[0] || 'en') : 'en');

    // Mettre à jour le titre
    document.title = title;

    // Fonction helper pour mettre à jour ou créer une meta tag
    const setMetaTag = (name, content, attribute = 'name') => {
      if (!content) return; // Ne pas créer de meta tag vide
      
      let element = document.querySelector(`meta[${attribute}="${name}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, name);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // Fonction helper pour supprimer des meta tags
    const removeMetaTag = (name, attribute = 'name') => {
      const element = document.querySelector(`meta[${attribute}="${name}"]`);
      if (element) {
        element.remove();
      }
    };

    // Meta tags robots (index/noindex)
    if (noindex) {
      setMetaTag('robots', 'noindex, nofollow');
      setMetaTag('googlebot', 'noindex, nofollow');
    } else {
      setMetaTag('robots', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
      setMetaTag('googlebot', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
    }

    // Meta tags de base
    setMetaTag('description', description);
    setMetaTag('keywords', keywords);
    setMetaTag('author', 'TypingPVP');
    setMetaTag('language', detectedLang);
    setMetaTag('revisit-after', '7 days');

    // Open Graph tags (Facebook, WhatsApp, LinkedIn, etc.)
    setMetaTag('og:title', title, 'property');
    setMetaTag('og:description', description, 'property');
    setMetaTag('og:image', absoluteImageUrl, 'property');
    setMetaTag('og:image:secure_url', absoluteImageUrl, 'property');
    setMetaTag('og:image:type', 'image/png', 'property');
    setMetaTag('og:image:width', '1200', 'property');
    setMetaTag('og:image:height', '630', 'property');
    setMetaTag('og:image:alt', title, 'property');
    setMetaTag('og:url', absoluteUrl, 'property');
    setMetaTag('og:type', type === 'WebSite' ? 'website' : 'article', 'property');
    setMetaTag('og:site_name', 'TypingPVP', 'property');
    
    // Open Graph locale pour support multilingue
    const hreflangCode = LANG_HREFLANG_MAP[detectedLang] || 'en-US';
    setMetaTag('og:locale', hreflangCode, 'property');
    
    // Ajouter les alternate locales pour toutes les langues supportées
    SUPPORTED_LANGUAGES.forEach(lang => {
      if (lang !== detectedLang) {
        const altHreflang = LANG_HREFLANG_MAP[lang] || `${lang}-${lang.toUpperCase()}`;
        const altElement = document.createElement('meta');
        altElement.setAttribute('property', 'og:locale:alternate');
        altElement.setAttribute('content', altHreflang);
        document.head.appendChild(altElement);
      }
    });

    // Twitter Card tags
    setMetaTag('twitter:card', 'summary_large_image');
    setMetaTag('twitter:title', title);
    setMetaTag('twitter:description', description);
    setMetaTag('twitter:image', absoluteImageUrl);
    setMetaTag('twitter:image:alt', title);
    setMetaTag('twitter:site', '@typingpvp');
    setMetaTag('twitter:creator', '@typingpvp');

    // Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', absoluteUrl);

    // Hreflang tags pour le SEO international
    // Supprimer les anciens hreflang
    document.querySelectorAll('link[rel="alternate"][hreflang]').forEach(el => el.remove());
    
    // Ajouter hreflang pour toutes les langues supportées
    SUPPORTED_LANGUAGES.forEach(lang => {
      const hreflangLink = document.createElement('link');
      hreflangLink.setAttribute('rel', 'alternate');
      hreflangLink.setAttribute('hreflang', lang);
      // Pour l'instant, toutes les langues pointent vers la même URL
      // À améliorer avec un système de routing par langue si nécessaire
      hreflangLink.setAttribute('href', absoluteUrl);
      document.head.appendChild(hreflangLink);
    });
    
    // Hreflang x-default pour la langue par défaut
    const xDefaultLink = document.createElement('link');
    xDefaultLink.setAttribute('rel', 'alternate');
    xDefaultLink.setAttribute('hreflang', 'x-default');
    xDefaultLink.setAttribute('href', absoluteUrl);
    document.head.appendChild(xDefaultLink);

    // JSON-LD Structured Data pour le SEO
    // Supprimer les anciens scripts JSON-LD
    document.querySelectorAll('script[type="application/ld+json"]').forEach(el => {
      // Ne pas supprimer les JSON-LD statiques dans index.html
      if (el.id !== 'static-jsonld') {
        el.remove();
      }
    });

    // Créer le JSON-LD de base
    const baseJsonLd = {
      '@context': 'https://schema.org',
      '@type': type,
      name: title,
      description: description,
      url: absoluteUrl,
      image: absoluteImageUrl,
      inLanguage: hreflangCode,
      publisher: {
        '@type': 'Organization',
        name: 'TypingPVP',
        url: 'https://typingpvp.com',
        logo: {
          '@type': 'ImageObject',
          url: `${baseUrl}/logo.png`
        }
      },
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: 'https://typingpvp.com/?search={search_term_string}'
        },
        'query-input': 'required name=search_term_string'
      }
    };

    // Fusionner avec les données JSON-LD personnalisées si fournies
    const finalJsonLd = jsonLd ? { ...baseJsonLd, ...jsonLd } : baseJsonLd;

    // Ajouter le script JSON-LD
    const jsonLdScript = document.createElement('script');
    jsonLdScript.type = 'application/ld+json';
    jsonLdScript.id = 'dynamic-jsonld';
    jsonLdScript.textContent = JSON.stringify(finalJsonLd);
    document.head.appendChild(jsonLdScript);

    // Ajouter BreadcrumbList si fourni
    if (breadcrumbs && Array.isArray(breadcrumbs) && breadcrumbs.length > 0) {
      // Supprimer les anciens breadcrumbs
      document.querySelectorAll('script[data-breadcrumb]').forEach(el => el.remove());

      const breadcrumbJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: breadcrumbs.map((item, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: item.name,
          item: item.url.startsWith('http') ? item.url : `${baseUrl}${item.url}`
        }))
      };

      const breadcrumbScript = document.createElement('script');
      breadcrumbScript.type = 'application/ld+json';
      breadcrumbScript.setAttribute('data-breadcrumb', 'true');
      breadcrumbScript.textContent = JSON.stringify(breadcrumbJsonLd);
      document.head.appendChild(breadcrumbScript);
    }

    // Mettre à jour l'attribut lang du HTML si nécessaire
    if (typeof document !== 'undefined' && document.documentElement) {
      document.documentElement.lang = detectedLang;
    }

    // Cleanup function
    return () => {
      // Optionnel : nettoyer les meta tags dynamiques si nécessaire
      // Pour l'instant, on les garde car elles peuvent être réutilisées
    };
  }, [title, description, keywords, image, url, type, language, jsonLd, noindex, breadcrumbs]);

  return null; // Ce composant ne rend rien
}

