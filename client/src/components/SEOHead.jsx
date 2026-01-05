/**
 * Composant pour gérer les meta tags SEO dynamiques
 * Utilise React Helmet pour les meta tags
 */

import { useEffect } from 'react';

/**
 * Composant pour mettre à jour les meta tags de la page
 * @param {Object} props - Propriétés SEO
 * @param {string} props.title - Titre de la page
 * @param {string} props.description - Description de la page
 * @param {string} props.keywords - Mots-clés (optionnel)
 * @param {string} props.image - Image pour Open Graph (optionnel)
 * @param {string} props.url - URL de la page (optionnel)
 */
export default function SEOHead({ 
  title = 'TypingPVP - Competitive Typing Battles',
  description = 'Compete in real-time typing battles, improve your speed and accuracy, and climb the global leaderboard.',
  keywords = 'typing, typing test, typing speed, wpm, typing battle, competitive typing',
  image = '/logo.png',
  url = typeof window !== 'undefined' ? window.location.href : 'https://typingpvp.com/'
}) {
  useEffect(() => {
    // Construire l'URL absolue de l'image
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://typingpvp.com';
    const absoluteImageUrl = image.startsWith('http') ? image : `${baseUrl}${image}`;
    const absoluteUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;

    // Mettre à jour le titre
    document.title = title;

    // Fonction helper pour mettre à jour ou créer une meta tag
    const setMetaTag = (name, content, attribute = 'name') => {
      let element = document.querySelector(`meta[${attribute}="${name}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, name);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // Meta tags de base
    setMetaTag('description', description);
    setMetaTag('keywords', keywords);

    // Open Graph tags (Facebook, WhatsApp, etc.)
    setMetaTag('og:title', title, 'property');
    setMetaTag('og:description', description, 'property');
    setMetaTag('og:image', absoluteImageUrl, 'property');
    setMetaTag('og:image:secure_url', absoluteImageUrl, 'property');
    setMetaTag('og:image:type', 'image/png', 'property');
    setMetaTag('og:image:width', '1200', 'property');
    setMetaTag('og:image:height', '630', 'property');
    setMetaTag('og:image:alt', title, 'property');
    setMetaTag('og:url', absoluteUrl, 'property');
    setMetaTag('og:type', 'website', 'property');
    setMetaTag('og:site_name', 'typingpvp.com', 'property');

    // Twitter Card tags
    setMetaTag('twitter:card', 'summary_large_image');
    setMetaTag('twitter:title', title);
    setMetaTag('twitter:description', description);
    setMetaTag('twitter:image', absoluteImageUrl);
    setMetaTag('twitter:image:alt', title);

    // Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', absoluteUrl);

    // Cleanup function (optionnel, mais bon pour la propreté)
    return () => {
      // On ne supprime pas les meta tags car elles peuvent être réutilisées
    };
  }, [title, description, keywords, image, url]);

  return null; // Ce composant ne rend rien
}

