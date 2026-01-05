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
  image = '/logo.svg',
  url = window.location.href
}) {
  useEffect(() => {
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

    // Open Graph tags
    setMetaTag('og:title', title, 'property');
    setMetaTag('og:description', description, 'property');
    setMetaTag('og:image', image, 'property');
    setMetaTag('og:url', url, 'property');
    setMetaTag('og:type', 'website', 'property');

    // Twitter Card tags
    setMetaTag('twitter:card', 'summary_large_image');
    setMetaTag('twitter:title', title);
    setMetaTag('twitter:description', description);
    setMetaTag('twitter:image', image);

    // Cleanup function (optionnel, mais bon pour la propreté)
    return () => {
      // On ne supprime pas les meta tags car elles peuvent être réutilisées
    };
  }, [title, description, keywords, image, url]);

  return null; // Ce composant ne rend rien
}

