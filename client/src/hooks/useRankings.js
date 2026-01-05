/**
 * Hook React Query pour les rankings
 * Gère le cache et la synchronisation automatique
 */

import { useQuery } from '@tanstack/react-query';
import { rankingsService } from '../services/apiService';

/**
 * Hook pour récupérer les rankings par langue
 * @param {string} language - Code langue (ex: 'en', 'fr')
 * @returns {Object} - { data, isLoading, error, refetch }
 */
export function useRankings(language = 'en') {
  return useQuery({
    queryKey: ['rankings', language],
    queryFn: async () => {
      const data = await rankingsService.getRankingsByLanguage(language);
      return data.rankings || [];
    },
    // Cache pendant 2 minutes pour les rankings (changent souvent)
    staleTime: 2 * 60 * 1000,
    // Garde en cache pendant 5 minutes
    gcTime: 5 * 60 * 1000,
  });
}

export default useRankings;

