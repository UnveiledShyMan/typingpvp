import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { profileService } from '../services/apiService'
import { ProfileSkeleton } from '../components/SkeletonLoader'
import Profile from './Profile'

/**
 * Composant pour afficher un profil utilisateur par username
 * Récupère l'ID de l'utilisateur depuis le username et redirige vers Profile
 */
export default function UserProfile() {
  const { username } = useParams();
  const navigate = useNavigate();
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Nettoyer le username (enlever ":1" ou autres suffixes bizarres)
  // React Router décode automatiquement les paramètres d'URL, donc on doit nettoyer ici
  const cleanUsername = username ? String(username).split(':')[0].trim() : null;

  useEffect(() => {
    const fetchUserId = async () => {
      if (!cleanUsername) {
        setError('Username is required');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Récupérer l'utilisateur par username (déjà nettoyé)
        const user = await profileService.getProfileByUsername(cleanUsername);
        if (user && user.id) {
          setUserId(user.id);
          // Rediriger vers /profile/:id pour une URL propre
          navigate(`/profile/${user.id}`, { replace: true });
        } else {
          setError('User not found');
          setLoading(false);
        }
      } catch (err) {
        console.error('Error fetching user by username:', err);
        setError('User not found');
        setLoading(false);
      }
    };

    fetchUserId();
  }, [cleanUsername, navigate]);

  if (loading) {
    return (
      <div className="h-full w-full flex flex-col overflow-hidden">
        <div className="w-full h-full max-w-5xl mx-auto flex-1 min-h-0 overflow-y-auto profile-scroll p-6">
          <ProfileSkeleton />
        </div>
      </div>
    );
  }

  if (error || !userId) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-text-primary text-xl font-semibold mb-2">User not found</div>
          <div className="text-text-secondary text-sm mb-4">The user "{cleanUsername}" does not exist.</div>
          <button
            onClick={() => navigate('/')}
            className="bg-accent-primary hover:bg-accent-hover text-accent-text font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  // Utiliser le composant Profile avec l'ID récupéré
  return <Profile userId={userId} />;
}

