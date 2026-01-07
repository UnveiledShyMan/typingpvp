/**
 * Utilitaire pour générer des breadcrumbs SEO-friendly
 * Génère du JSON-LD BreadcrumbList pour Schema.org
 */

/**
 * Génère le JSON-LD pour les breadcrumbs
 * @param {Array} items - Tableau d'objets {name, url}
 * @returns {Object} JSON-LD BreadcrumbList
 */
export function generateBreadcrumbJSONLD(items) {
  if (!items || items.length === 0) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  };
}

/**
 * Ajoute le breadcrumb JSON-LD au document
 * @param {Array} items - Tableau d'objets {name, url}
 */
export function addBreadcrumbToPage(items) {
  const jsonLd = generateBreadcrumbJSONLD(items);
  if (!jsonLd) return;

  // Supprimer les anciens breadcrumbs
  const existing = document.querySelector('script[data-breadcrumb]');
  if (existing) {
    existing.remove();
  }

  // Ajouter le nouveau breadcrumb
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.setAttribute('data-breadcrumb', 'true');
  script.textContent = JSON.stringify(jsonLd);
  document.head.appendChild(script);
}

