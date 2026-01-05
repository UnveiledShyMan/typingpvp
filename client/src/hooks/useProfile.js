/**
 * Hook React Query pour les profils utilisateur
 * Gère le cache et la synchronisation automatique
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileService } from '../services/apiService';

/**
 * Hook pour récupérer un profil utilisateur
 * @param {string|number} userId - ID de l'utilisateur
 * @returns {Object} - { data, isLoading, error, refetch }
 */
export function useProfile(userId) {
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: async () => {
      const data = await profileService.getProfile(userId);
      return data;
    },
    // Cache pendant 5 minutes pour les profils
    staleTime: 5 * 60 * 1000,
    // Garde en cache pendant 10 minutes
    gcTime: 10 * 60 * 1000,
    // Ne fetch que si userId est défini
    enabled: !!userId,
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

