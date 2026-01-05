// Génération de nombres pour le mode chiffres

/**
 * Génère un texte avec des nombres aléatoires
 * @param {number} count - Nombre de nombres à générer
 * @returns {string} Texte avec des nombres séparés par des espaces
 */
export function generateNumbers(count = 50) {
  const numbers = [];
  
  for (let i = 0; i < count; i++) {
    // Générer des nombres de différentes longueurs pour varier la difficulté
    const length = Math.random() < 0.3 ? 1 : Math.random() < 0.5 ? 2 : Math.random() < 0.8 ? 3 : 4;
    
    let number = '';
    for (let j = 0; j < length; j++) {
      // Le premier chiffre ne peut pas être 0 (sauf pour les nombres à 1 chiffre)
      if (j === 0 && length > 1) {
        number += Math.floor(Math.random() * 9) + 1; // 1-9
      } else {
        number += Math.floor(Math.random() * 10); // 0-9
      }
    }
    
    // Placer l'espace avant le nombre (sauf pour le premier)
    if (i === 0) {
      numbers.push(number);
    } else {
      numbers.push(' ' + number);
    }
  }
  
  return numbers.join('');
}


