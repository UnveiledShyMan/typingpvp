/**
 * Hook pour gérer la navigation clavier
 * Supporte Tab, Enter, Escape, et les flèches
 */

import { useEffect, useRef, useState } from 'react';

/**
 * Hook pour gérer la navigation clavier dans un composant
 * @param {Object} options - Options de configuration
 * @param {Function} options.onEscape - Callback pour la touche Escape
 * @param {Function} options.onEnter - Callback pour la touche Enter
 * @param {boolean} options.enabled - Activer/désactiver le hook
 */
export function useKeyboardNavigation({ onEscape, onEnter, enabled = true } = {}) {
  const elementRef = useRef(null);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e) => {
      // Escape - fermer/annuler
      if (e.key === 'Escape' && onEscape) {
        e.preventDefault();
        onEscape(e);
      }
      
      // Enter - soumettre/valider
      if (e.key === 'Enter' && !e.shiftKey && onEnter) {
        // Ne pas déclencher si on est dans un textarea
        if (e.target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          onEnter(e);
        }
      }
    };

    const element = elementRef.current || document;
    element.addEventListener('keydown', handleKeyDown);

    return () => {
      element.removeEventListener('keydown', handleKeyDown);
    };
  }, [onEscape, onEnter, enabled]);

  return elementRef;
}

/**
 * Hook pour gérer la navigation avec Tab dans une liste d'éléments
 * @param {Array} items - Liste d'éléments
 * @param {Function} onSelect - Callback quand un élément est sélectionné
 */
export function useListNavigation(items = [], onSelect) {
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const itemsRef = useRef([]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < items.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : items.length - 1
        );
      } else if (e.key === 'Enter' && selectedIndex >= 0) {
        e.preventDefault();
        if (onSelect && items[selectedIndex]) {
          onSelect(items[selectedIndex], selectedIndex);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [items, selectedIndex, onSelect]);

  // Focus sur l'élément sélectionné
  useEffect(() => {
    if (selectedIndex >= 0 && itemsRef.current[selectedIndex]) {
      itemsRef.current[selectedIndex].focus();
    }
  }, [selectedIndex]);

  return { selectedIndex, itemsRef };
}

