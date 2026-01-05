/**
 * Provider pour React Query
 * Gère le cache et la synchronisation des données
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Configuration du QueryClient avec cache optimisé
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache les données pendant 5 minutes
      staleTime: 5 * 60 * 1000, // 5 minutes
      // Garde les données en cache pendant 10 minutes même si non utilisées
      gcTime: 10 * 60 * 1000, // 10 minutes (anciennement cacheTime)
      // Retry automatique en cas d'erreur réseau
      retry: 2,
      // Refetch quand la fenêtre reprend le focus
      refetchOnWindowFocus: false,
      // Refetch quand reconnecté au réseau
      refetchOnReconnect: true,
    },
    mutations: {
      // Retry automatique pour les mutations
      retry: 1,
    },
  },
});

/**
 * Provider React Query pour l'application
 */
export function QueryProvider({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

export default QueryProvider;

