import { useState, useEffect } from 'react';

/**
 * Hook pour debounce une valeur
 * Utile pour limiter les appels API lors de la saisie
 * 
 * @param {any} value - La valeur à debounce
 * @param {number} delay - Le délai en millisecondes (défaut: 300ms)
 * @returns {any} La valeur debounced
 * 
 * @example
 * const [searchQuery, setSearchQuery] = useState('');
 * const debouncedQuery = useDebounce(searchQuery, 500);
 * 
 * useEffect(() => {
 *   if (debouncedQuery) {
 *     searchUsers(debouncedQuery);
 *   }
 * }, [debouncedQuery]);
 */
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Créer un timer qui met à jour la valeur debounced après le délai
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Nettoyer le timer si la valeur change avant la fin du délai
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

