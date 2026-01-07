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
  // Détecter si c'est un ID ou un username
  // Les IDs nanoid sont généralement longs (21+ caractères) et alphanumériques
  // Les usernames sont généralement plus courts et peuvent contenir des caractères spéciaux limités
  // Si c'est un ID numérique pur, utiliser getProfile directement
  // Sinon, essayer d'abord par username, puis par ID si ça échoue
  const isNumericId = identifier && /^\d+$/.test(String(identifier));
  const isLikelyId = identifier && String(identifier).length > 15; // Les IDs nanoid sont généralement longs
  
  return useQuery({
    queryKey: ['profile', identifier],
    queryFn: async () => {
      // Si c'est un ID numérique pur, utiliser directement getProfile
      if (isNumericId) {
        return await profileService.getProfile(identifier);
      }
      
      // Si ça ressemble à un ID (long, alphanumérique), essayer d'abord par ID
      if (isLikelyId) {
        try {
          const data = await profileService.getProfile(identifier);
          return data;
        } catch (error) {
          // Si ça échoue avec 404, essayer par username
          const errorMsg = error.message?.toLowerCase() || '';
          const errorStr = String(error).toLowerCase();
          if (errorMsg.includes('404') || errorMsg.includes('not found') || 
              errorStr.includes('404') || errorStr.includes('not found')) {
            try {
              return await profileService.getProfileByUsername(identifier);
            } catch (usernameError) {
              // Si les deux échouent, throw l'erreur originale (404)
              throw error;
            }
          }
          throw error;
        }
      }
      
      // Sinon, essayer d'abord par username (cas le plus commun)
      try {
        const data = await profileService.getProfileByUsername(identifier);
        return data;
      } catch (error) {
        // Si ça échoue avec 404, essayer par ID
        const errorMsg = error.message?.toLowerCase() || '';
        const errorStr = String(error).toLowerCase();
        if (errorMsg.includes('404') || errorMsg.includes('not found') || 
            errorStr.includes('404') || errorStr.includes('not found')) {
          try {
            return await profileService.getProfile(identifier);
          } catch (idError) {
            // Si les deux échouent, throw l'erreur originale (404)
            throw error;
          }
        }
        throw error;
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

