/**
 * Hook React Query pour les profils utilisateur
 * Gère le cache et la synchronisation automatique
 * Supporte maintenant les usernames en plus des IDs
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileService } from '../services/apiService';

/**
 * Hook pour récupérer un profil utilisateur
 * Accepte soit un ID soit un username
 * @param {string|number} identifier - ID ou username de l'utilisateur
 * @returns {Object} - { data, isLoading, error, refetch }
 */
export function useProfile(identifier) {
  // Détecter si c'est un ID numérique ou un username
  const isUsername = identifier && !/^\d+$/.test(String(identifier));
  
  return useQuery({
    queryKey: ['profile', identifier],
    queryFn: async () => {
      // Utiliser getProfileByUsername si c'est un username, sinon getProfile
      if (isUsername) {
        const data = await profileService.getProfileByUsername(identifier);
        return data;
      } else {
        const data = await profileService.getProfile(identifier);
        return data;
      }
    },
    // Cache pendant 5 minutes pour les profils
    staleTime: 5 * 60 * 1000,
    // Garde en cache pendant 10 minutes
    gcTime: 10 * 60 * 1000,
    // Ne fetch que si identifier est défini
    enabled: !!identifier,
    // Retry jusqu'à 3 fois avec délai exponentiel
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

/**
 * Hook pour mettre à jour un profil
 * @returns {Object} - { mutate, isLoading, error }
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, profileData }) => {
      return await profileService.updateProfile(userId, profileData);
    },
    // Invalider le cache du profil après mise à jour
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['profile', variables.userId] });
    },
  });
}

export default useProfile;

