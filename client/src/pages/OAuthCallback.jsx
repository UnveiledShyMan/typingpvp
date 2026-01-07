import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useToastContext } from '../contexts/ToastContext';
import { useUser } from '../contexts/UserContext';
import { post } from '../services/apiService';

/**
 * Page de callback OAuth qui gère le retour depuis Google/X
 */
export default function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToastContext();
  const { updateUser, refreshUser } = useUser();

  useEffect(() => {
    const handleOAuthCallback = async () => {
      const code = searchParams.get('code');
      const error = searchParams.get('error');

      if (error) {
        toast.error(`OAuth error: ${error}`);
        navigate('/');
        return;
      }

      if (!code) {
        toast.error('No authorization code received');
        navigate('/');
        return;
      }

      try {
        // Échanger le code contre un token et les infos utilisateur
        const data = await post('/api/auth/oauth/exchange', { code, provider: 'google' });
        
        // Sauvegarder le token
        if (data.token) {
          localStorage.setItem('token', data.token);
        }
        
        // Mettre à jour immédiatement l'utilisateur dans le contexte
        if (data.user) {
          updateUser(data.user);
        } else {
          // Si les données utilisateur ne sont pas dans la réponse, récupérer depuis l'API
          await refreshUser();
        }
        
        toast.success('Connexion réussie avec Google !');
        navigate('/');
      } catch (error) {
        // Erreur gérée par apiService
        navigate('/');
      }
    };

    handleOAuthCallback();
  }, [searchParams, navigate, toast]);

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-accent-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-text-secondary">Completing authentication...</p>
      </div>
    </div>
  );
}

