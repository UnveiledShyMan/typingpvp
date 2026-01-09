import { useState, useEffect, useMemo, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getRankFromMMR } from '../utils/ranks.js'
import { useToastContext } from '../contexts/ToastContext'
import { profileService, authService, matchesService } from '../services/apiService'
import { ProfileSkeleton } from '../components/SkeletonLoader'
import { useProfile, useUpdateProfile } from '../hooks/useProfile'
import { useUser } from '../contexts/UserContext'
import SEOHead from '../components/SEOHead'
import OptimizedImage from '../components/OptimizedImage'
import logger from '../utils/logger'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

export default function Profile({ userId: currentUserId, username: currentUsername }) {
  const { username } = useParams(); // Utiliser username au lieu de id
  const identifier = username || currentUsername || currentUserId; // Priorité: username > currentUsername > currentUserId
  const navigate = useNavigate();
  const { toast } = useToastContext();
  const { user: currentUserFromContext } = useUser();
  
  // Nettoyer l'identifier (enlever ":1" ou autres suffixes bizarres)
  const cleanIdentifier = identifier ? String(identifier).split(':')[0].trim() : null;
  
  // Valider que identifier est présent et valide
  useEffect(() => {
    if (!cleanIdentifier || cleanIdentifier === 'undefined' || cleanIdentifier === 'null' || cleanIdentifier === '') {
      toast.error('Invalid user identifier');
      navigate('/');
      return;
    }
  }, [cleanIdentifier, navigate, toast]);
  
  // Utiliser React Query pour le cache du profil (supporte maintenant username)
  const { data: user, isLoading: loading, refetch: refetchProfile, error } = useProfile(cleanIdentifier);
  
  // Si on a chargé un profil avec un ID mais qu'on est sur une route avec ID, 
  // mettre à jour l'URL pour utiliser le username si disponible
  useEffect(() => {
    if (user && user.username && cleanIdentifier && cleanIdentifier !== user.username) {
      // Si l'identifier actuel est un ID (long ou numérique), rediriger vers username
      const isId = /^\d+$/.test(String(cleanIdentifier)) || String(cleanIdentifier).length > 15;
      if (isId) {
        // Rediriger vers l'URL avec username pour une URL propre
        navigate(`/profile/${user.username}`, { replace: true });
      }
    }
  }, [user, cleanIdentifier, navigate]);
  const updateProfileMutation = useUpdateProfile();
  
  const [selectedLang, setSelectedLang] = useState('en');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    bio: '',
    avatar: '',
    gear: '',
    socialMedia: {
      twitter: '',
      github: '',
      discord: '',
      website: ''
    }
  });
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [recentMatches, setRecentMatches] = useState([]);
  const [soloMatches, setSoloMatches] = useState([]);
  const [multiplayerMatches, setMultiplayerMatches] = useState([]);
  // Filtres pour l'historique des matchs
  const [matchFilter, setMatchFilter] = useState('all'); // 'all', 'solo', 'multiplayer'
  const [matchLanguageFilter, setMatchLanguageFilter] = useState('all'); // 'all' ou code langue spécifique
  const [matchSort, setMatchSort] = useState('date'); // 'date', 'wpm', 'accuracy'
  const [matchSortOrder, setMatchSortOrder] = useState('desc'); // 'asc', 'desc'
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [matchesPerPage] = useState(10);
  const [hasMoreMatches, setHasMoreMatches] = useState(false);
  const [loadingMatches, setLoadingMatches] = useState(false);

  // Initialiser le formulaire d'édition quand les données sont chargées
  useEffect(() => {
    if (user) {
      setEditForm({
        bio: user.bio || '',
        avatar: user.avatar || '',
        gear: user.gear || '',
        socialMedia: user.socialMedia || {
          twitter: '',
          github: '',
          discord: '',
          website: ''
        }
      });
      
      // Récupérer l'historique des matchs réels
      setCurrentPage(1); // Reset à la page 1
      // Utiliser user.id pour récupérer les matchs (toujours utiliser ID pour l'API)
      fetchUserMatches(user.id, 1, false);
    }
  }, [user, cleanIdentifier]);

  useEffect(() => {
    // Écouter les événements de mise à jour ELO après une battle
    const handleEloUpdate = () => {
      // Rafraîchir le profil si c'est le profil de l'utilisateur courant
      if (currentUserFromContext && user && currentUserFromContext.id === user.id) {
        refetchProfile();
      }
    };
    
    window.addEventListener('elo-updated', handleEloUpdate);
    
    return () => {
      window.removeEventListener('elo-updated', handleEloUpdate);
    };
  }, [user, currentUserFromContext, refetchProfile]);

  const fetchUserMatches = async (targetUserId, page = 1, append = false) => {
    try {
      setLoadingMatches(true);
      const limit = matchesPerPage * page; // Charger tous les matchs jusqu'à la page actuelle
      
      // Récupérer les matchs solo et multijoueurs séparément
      // Note: L'API ne supporte pas encore l'offset, donc on charge plus de matchs
      const [soloData, multiplayerData] = await Promise.all([
        matchesService.getUserMatches(targetUserId, limit, 'solo').catch(() => ({ matches: [] })),
        matchesService.getUserMatches(targetUserId, limit, 'multiplayer').catch(() => ({ matches: [] }))
      ]);
      
      // Remplacer les matchs existants (l'API retourne déjà tous les matchs jusqu'à la limite)
      setSoloMatches(soloData.matches || []);
      setMultiplayerMatches(multiplayerData.matches || []);
      
      // Vérifier s'il y a plus de matchs à charger
      // Si on a reçu exactement le nombre de matchs demandés, il y en a probablement plus
      const totalLoaded = (soloData.matches?.length || 0) + (multiplayerData.matches?.length || 0);
      setHasMoreMatches(totalLoaded >= limit);
    } catch (error) {
      // Erreur gérée par apiService
      if (!append) {
        setSoloMatches([]);
        setMultiplayerMatches([]);
        setRecentMatches([]);
      }
    } finally {
      setLoadingMatches(false);
    }
  };
  
  // Charger plus de matchs (pagination)
  const loadMoreMatches = useCallback(() => {
    if (!loadingMatches && hasMoreMatches && user) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      fetchUserMatches(user.id, nextPage, false);
    }
  }, [currentPage, hasMoreMatches, loadingMatches, user]);

  const handleSave = async () => {
    if (!currentUserFromContext) {
      toast.warning('Please login to edit profile');
      return;
    }

    setSaving(true);
    try {
      if (!user || !user.id) {
        toast.error('User not found');
        return;
      }
      await updateProfileMutation.mutateAsync({
        userId: user.id,
        profileData: editForm
      });
      setIsEditing(false);
      toast.success('Profil mis à jour avec succès !');
      // Le cache sera automatiquement invalidé par useUpdateProfile
    } catch (error) {
      // Erreur gérée par apiService
    } finally {
      setSaving(false);
    }
  };

  // Gérer l'upload d'une image de profil
  const handleAvatarUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Vérifier que c'est une image
    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner une image valide');
      return;
    }

    // Vérifier la taille (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('L\'image est trop grande (maximum 5MB)');
      return;
    }

    setUploadingAvatar(true);
    try {
      if (!user || !user.id) {
        toast.error('User not found');
        return;
      }
      const response = await profileService.uploadAvatar(user.id, file);
      // Mettre à jour l'avatar dans le formulaire d'édition
      setEditForm({ ...editForm, avatar: response.avatar });
      toast.success('Photo de profil uploadée avec succès !');
      // Rafraîchir le profil pour afficher la nouvelle image
      refetchProfile();
    } catch (error) {
      // Erreur gérée par apiService
    } finally {
      setUploadingAvatar(false);
      // Réinitialiser l'input file
      event.target.value = '';
    }
  };

  const getRankColor = (rankInfo) => {
    return rankInfo?.color || '#646669';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
  };

  const getMatchTypeLabel = (type) => {
    switch (type) {
      case 'competition': return 'Competition';
      case 'matchmaking': return 'Matchmaking';
      case 'battle': return '1v1 Battle';
      default: return 'Match';
    }
  };

  // CRITIQUE : Tous les hooks (useMemo, useCallback) doivent être appelés AVANT les early returns
  // pour maintenir un ordre constant des hooks entre les renders et éviter l'erreur React #310
  // Calculer les stats par langue - Toujours appelé, même si user est null
  const calculateLanguageStats = useMemo(() => {
    // Vérifier que les arrays existent et sont valides
    if (!soloMatches || !multiplayerMatches) return null;
    if (!Array.isArray(soloMatches) || !Array.isArray(multiplayerMatches)) return null;
    if (soloMatches.length === 0 && multiplayerMatches.length === 0) return null;
    
    const allMatches = [...soloMatches, ...multiplayerMatches];
    const langMatches = allMatches.filter(m => m && m.language === selectedLang);
    
    if (langMatches.length === 0) return null;
    
    const wins = langMatches.filter(m => m.won).length;
    const losses = langMatches.length - wins;
    const totalWPM = langMatches.reduce((sum, m) => sum + (m.wpm || 0), 0);
    const avgWPM = totalWPM / langMatches.length;
    const totalAccuracy = langMatches.reduce((sum, m) => sum + (m.accuracy || 0), 0);
    const avgAccuracy = totalAccuracy / langMatches.length;
    const bestWPM = Math.max(...langMatches.map(m => m.wpm || 0), 0);
    const winRate = langMatches.length > 0 ? ((wins / langMatches.length) * 100).toFixed(1) : 0;
    
    return {
      totalMatches: langMatches.length,
      wins,
      losses,
      avgWPM: Math.round(avgWPM),
      avgAccuracy: avgAccuracy.toFixed(1),
      bestWPM,
      winRate: parseFloat(winRate)
    };
  }, [soloMatches, multiplayerMatches, selectedLang]);
  
  // Calculer la progression ELO - Toujours appelé, même si user est null
  const eloProgressionData = useMemo(() => {
    // Vérifier que les arrays existent et sont valides
    if (!soloMatches || !multiplayerMatches) return [];
    if (!Array.isArray(soloMatches) || !Array.isArray(multiplayerMatches)) return [];
    if (soloMatches.length === 0 && multiplayerMatches.length === 0) return [];
    
    // Vérifier que user et user.mmr existent
    if (!user || !user.mmr || typeof user.mmr !== 'object') return [];
    
    const allMatches = [...soloMatches, ...multiplayerMatches]
      .filter(m => m && m.language === selectedLang && m.eloChange !== undefined && m.eloChange !== null)
      .sort((a, b) => {
        try {
          return new Date(a.date) - new Date(b.date);
        } catch (e) {
          return 0;
        }
      }); // Trier par date croissante
    
    if (allMatches.length === 0) return [];
    
    // Reconstruire la progression ELO en partant du MMR actuel et en remontant
    // Utiliser user.mmr directement avec vérification de sécurité
    const userMmrValue = (user?.mmr && typeof user.mmr === 'object' && user.mmr[selectedLang]) 
      ? user.mmr[selectedLang] 
      : 1000;
    let currentELO = userMmrValue;
    const progression = [];
    
    // Parcourir les matchs en ordre inverse pour reconstruire l'ELO
    for (let i = allMatches.length - 1; i >= 0; i--) {
      const match = allMatches[i];
      if (!match) continue;
      // L'ELO avant ce match = ELO actuel - changement
      currentELO = currentELO - (match.eloChange || 0);
      
      try {
        progression.unshift({
          date: new Date(match.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          elo: currentELO,
          match: i + 1
        });
      } catch (e) {
        // Ignorer les dates invalides
        continue;
      }
    }
    
    // Ajouter le point final (ELO actuel)
    if (progression.length > 0) {
      progression.push({
        date: 'Now',
        elo: userMmrValue,
        match: allMatches.length + 1
      });
    }
    
    return progression;
  }, [soloMatches, multiplayerMatches, selectedLang, user]);

  const isOwnProfile = currentUserFromContext && user && currentUserFromContext.id === user.id;

  if (loading) {
    return (
      <div className="h-full w-full flex flex-col overflow-hidden">
        <div className="w-full h-full max-w-5xl mx-auto flex-1 min-h-0 overflow-y-auto profile-scroll p-6">
          <ProfileSkeleton />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="text-text-primary">User not found</div>
      </div>
    );
  }

  // Maintenant que user est garanti d'exister, on peut calculer les valeurs dérivées
  const userMmr = user.mmr && typeof user.mmr === 'object' ? user.mmr : {};
  const currentUserMmr = userMmr[selectedLang] || 1000;
  
  const rankInfo = getRankFromMMR(currentUserMmr);
  const winRate = user.stats?.totalMatches > 0
    ? ((user.stats.wins / user.stats.totalMatches) * 100).toFixed(1)
    : 0;

  const socialMedia = user.socialMedia || {
    twitter: '',
    github: '',
    discord: '',
    website: ''
  };

  // Préparer les données JSON-LD pour le structured data SEO
  const profileJsonLd = {
    '@type': 'ProfilePage',
    '@id': `https://typingpvp.com/profile/${user.username}`,
    mainEntity: {
      '@type': 'Person',
      '@id': `https://typingpvp.com/profile/${user.username}#person`,
      name: user.username,
      description: user.bio || `${user.username}'s typing profile on TypingPVP`,
      url: `https://typingpvp.com/profile/${user.username}`,
      ...(user.avatar && { image: `/og-image/profile/${user.username}` }),
      ...(socialMedia.twitter && { sameAs: [`https://twitter.com/${socialMedia.twitter.replace('@', '')}`] }),
      ...(socialMedia.github && { sameAs: [...(socialMedia.twitter ? [] : []), `https://github.com/${socialMedia.github}`] }),
      ...(socialMedia.website && { url: socialMedia.website }),
      knowsAbout: ['Typing', 'Competitive Typing', 'WPM', 'Typing Speed', user.gear || 'Keyboard'],
      ...(user.stats && {
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: winRate,
          bestRating: '100',
          worstRating: '0',
          ratingCount: user.stats.totalMatches || 0
        }
      })
    },
    ...(rankInfo && {
      about: {
        '@type': 'Thing',
        name: rankInfo.tier,
        description: `Rank: ${rankInfo.tier} - ${rankInfo.rank}`
      }
    })
  };

  return (
    <>
      <SEOHead 
        title={`${user.username} - Profile - TypingPVP`}
        description={user.bio || `View ${user.username}'s typing stats, ELO, and match history`}
        keywords={`${user.username}, typing profile, typing stats, ${user.gear || ''}`}
        url={`https://typingpvp.com/profile/${user.username}`}
        image={`/og-image/profile/${user.username}`}
        type="ProfilePage"
        jsonLd={profileJsonLd}
      />
      <div className="h-full w-full flex flex-col overflow-hidden">
        <div className="w-full h-full max-w-5xl mx-auto flex-1 min-h-0 overflow-y-auto profile-scroll p-4 sm:p-6">
          {/* Bouton de retour vers la page d'accueil */}
          <div className="mb-4 sm:mb-6">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors group"
              aria-label="Retour à l'accueil"
            >
              <svg 
                className="w-5 h-5 transition-transform group-hover:-translate-x-1" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-sm font-medium">Back to home</span>
            </button>
          </div>
          
          {/* Header avec avatar et infos principales - Style osu! */}
          <div className="relative mb-6 sm:mb-8">
            {/* Bannière de fond avec gradient */}
            <div 
              className="absolute inset-0 rounded-2xl opacity-20"
              style={{
                background: `linear-gradient(135deg, ${getRankColor(rankInfo)}40 0%, ${getRankColor(rankInfo)}10 100%)`
              }}
            ></div>
            
            <div className="relative bg-bg-secondary/40 backdrop-blur-sm rounded-lg p-6 sm:p-8">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                {/* Avatar large */}
                <div className="relative">
              {isEditing ? (
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-2xl bg-bg-primary border-4 flex items-center justify-center overflow-hidden shadow-xl"
                  style={{ borderColor: getRankColor(rankInfo) }}>
                  {editForm.avatar ? (
                    <OptimizedImage 
                      src={editForm.avatar} 
                      alt={`Avatar de ${user.username}`} 
                      width={160}
                      height={160}
                      className="w-full h-full object-cover object-center"
                      loading="lazy"
                      priority={false}
                    />
                  ) : (
                    <span className="text-6xl md:text-7xl text-accent-primary font-bold">
                      {user.username[0].toUpperCase()}
                    </span>
                  )}
                </div>
              ) : (
                user.avatar ? (
                  <OptimizedImage
                    src={user.avatar}
                    alt={`Avatar de ${user.username}`}
                    width={160}
                    height={160}
                    className="w-32 h-32 md:w-40 md:h-40 rounded-2xl object-cover object-center border-4 shadow-2xl"
                    style={{ borderColor: getRankColor(rankInfo) }}
                    loading="lazy"
                    priority={true}
                  />
                ) : (
                  <div
                    className="w-32 h-32 md:w-40 md:h-40 rounded-2xl bg-gradient-to-br from-accent-primary/30 to-accent-secondary/30 flex items-center justify-center text-6xl md:text-7xl text-accent-primary font-bold border-4 shadow-2xl"
                    style={{ borderColor: getRankColor(rankInfo) }}
                  >
                    {user.username[0].toUpperCase()}
                  </div>
                )
              )}
              
              {/* Badge de rang */}
              <div 
                className="absolute -bottom-3 -right-3 w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold shadow-xl border-4 border-bg-secondary"
                style={{ backgroundColor: getRankColor(rankInfo) }}
              >
                {rankInfo.tier[0]}
              </div>
                </div>

                {/* Infos principales */}
                <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-4xl md:text-5xl font-bold text-text-primary mb-2" style={{ fontFamily: 'Inter', letterSpacing: '-0.02em' }}>
                    {user.username}
                  </h1>
                  <div className="flex items-center gap-4 flex-wrap">
                    <div 
                      className="px-4 py-1.5 rounded-full text-sm font-semibold text-white"
                      style={{ backgroundColor: getRankColor(rankInfo) }}
                    >
                      {rankInfo.tier} {rankInfo.rank || ''}
                    </div>
                    <div className="text-text-secondary">
                      <span className="font-bold text-text-primary" style={{ fontFamily: 'JetBrains Mono' }}>
                        {currentUserMmr}
                      </span>
                      <span className="text-xs ml-1">ELO</span>
                    </div>
                  </div>
                </div>
                
                {isOwnProfile && (
                  <button
                    onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                    disabled={saving}
                    className="bg-accent-primary hover:bg-accent-hover text-accent-text font-semibold py-2.5 px-6 rounded-lg transition-colors text-sm disabled:opacity-50 shadow-lg"
                  >
                    {isEditing ? (saving ? 'Saving...' : 'Save') : 'Edit Profile'}
                  </button>
                )}
              </div>

              {/* Bio et réseaux sociaux */}
              {!isEditing && (
                <>
                  {user.bio && (
                    <p className="text-text-secondary mb-4 text-lg leading-relaxed max-w-2xl">{user.bio}</p>
                  )}
                  {user.gear && (
                    <div className="mb-4">
                      <span className="text-text-secondary text-sm">Keyboard/Gear: </span>
                      <span className="text-text-primary font-medium">{user.gear}</span>
                    </div>
                  )}
                  
                  {(socialMedia.twitter || socialMedia.github || socialMedia.discord || socialMedia.website) && (
                    <div className="flex items-center gap-4 flex-wrap">
                      {socialMedia.twitter && (
                        <a
                          href={socialMedia.twitter.startsWith('http') ? socialMedia.twitter : `https://twitter.com/${socialMedia.twitter}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-text-secondary hover:text-accent-primary transition-colors text-sm flex items-center gap-2 bg-bg-primary px-3 py-1.5 rounded-lg hover:bg-bg-tertiary"
                        >
                          <span>🐦</span>
                          <span>Twitter</span>
                        </a>
                      )}
                      {socialMedia.github && (
                        <a
                          href={socialMedia.github.startsWith('http') ? socialMedia.github : `https://github.com/${socialMedia.github}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-text-secondary hover:text-accent-primary transition-colors text-sm flex items-center gap-2 bg-bg-primary px-3 py-1.5 rounded-lg hover:bg-bg-tertiary"
                        >
                          <span>💻</span>
                          <span>GitHub</span>
                        </a>
                      )}
                      {socialMedia.discord && (
                        <span className="text-text-secondary text-sm flex items-center gap-2 bg-bg-primary px-3 py-1.5 rounded-lg">
                          <span>💬</span>
                          <span>{socialMedia.discord}</span>
                        </span>
                      )}
                      {socialMedia.website && (
                        <a
                          href={socialMedia.website.startsWith('http') ? socialMedia.website : `https://${socialMedia.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-text-secondary hover:text-accent-primary transition-colors text-sm flex items-center gap-2 bg-bg-primary px-3 py-1.5 rounded-lg hover:bg-bg-tertiary"
                        >
                          <span>🌐</span>
                          <span>Website</span>
                        </a>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* Formulaire d'édition */}
              {isEditing && (
                <div className="space-y-4 mt-4">
                  <div>
                    <label className="block text-text-primary mb-2 text-sm font-medium">Photo de profil</label>
                    <div className="space-y-2">
                      {/* Input file pour uploader une image */}
                      <div className="flex items-center gap-3">
                        <label className="cursor-pointer bg-accent-primary hover:bg-accent-hover text-accent-text font-semibold py-2 px-4 rounded-lg transition-colors text-sm disabled:opacity-50 shadow-lg inline-block">
                          {uploadingAvatar ? 'Upload en cours...' : 'Choisir une image'}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarUpload}
                            disabled={uploadingAvatar}
                            className="hidden"
                          />
                        </label>
                        {uploadingAvatar && (
                          <span className="text-text-secondary text-sm">Upload en cours...</span>
                        )}
                      </div>
                      {/* Input text pour URL (optionnel) */}
                      <div className="mt-2">
                        <label className="block text-text-secondary mb-1 text-xs">Ou entrez une URL d'image</label>
                        <input
                          type="text"
                          value={editForm.avatar}
                          onChange={(e) => setEditForm({ ...editForm, avatar: e.target.value })}
                          placeholder="https://example.com/avatar.jpg"
                          className="input-modern text-sm"
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-text-primary mb-2 text-sm font-medium">Bio</label>
                    <textarea
                      value={editForm.bio}
                      onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                      placeholder="Tell us about yourself..."
                      rows={4}
                      maxLength={500}
                      className="w-full p-3 bg-bg-primary border border-border-secondary rounded-lg text-text-primary focus:outline-none focus:border-accent-primary resize-none"
                    />
                    <div className="text-text-muted text-xs mt-1 text-right">
                      {editForm.bio.length}/500
                    </div>
                  </div>
                  <div>
                    <label className="block text-text-primary mb-2 text-sm font-medium">Keyboard/Gear</label>
                    <input
                      type="text"
                      value={editForm.gear}
                      onChange={(e) => setEditForm({ ...editForm, gear: e.target.value })}
                      placeholder="e.g. Custom 60%, Cherry MX Red, etc. (optional)"
                      maxLength={100}
                      className="input-modern"
                    />
                    <div className="text-text-muted text-xs mt-1">
                      Your keyboard/gear will be shown in rankings (optional)
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    <div>
                      <label className="block text-text-secondary mb-2 text-sm font-medium">Twitter</label>
                      <input
                        type="text"
                        value={editForm.socialMedia.twitter}
                        onChange={(e) => setEditForm({
                          ...editForm,
                          socialMedia: { ...editForm.socialMedia, twitter: e.target.value }
                        })}
                        placeholder="@username or URL"
                        className="w-full p-2 bg-bg-primary border border-border-secondary rounded-lg text-text-primary focus:outline-none focus:border-accent-primary text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-text-secondary mb-2 text-sm font-medium">GitHub</label>
                      <input
                        type="text"
                        value={editForm.socialMedia.github}
                        onChange={(e) => setEditForm({
                          ...editForm,
                          socialMedia: { ...editForm.socialMedia, github: e.target.value }
                        })}
                        placeholder="username or URL"
                        className="w-full p-2 bg-bg-primary border border-border-secondary rounded-lg text-text-primary focus:outline-none focus:border-accent-primary text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-text-secondary mb-2 text-sm font-medium">Discord</label>
                      <input
                        type="text"
                        value={editForm.socialMedia.discord}
                        onChange={(e) => setEditForm({
                          ...editForm,
                          socialMedia: { ...editForm.socialMedia, discord: e.target.value }
                        })}
                        placeholder="Username#1234"
                        className="w-full p-2 bg-bg-primary border border-border-secondary rounded-lg text-text-primary focus:outline-none focus:border-accent-primary text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-text-secondary mb-2 text-sm font-medium">Website</label>
                      <input
                        type="text"
                        value={editForm.socialMedia.website}
                        onChange={(e) => setEditForm({
                          ...editForm,
                          socialMedia: { ...editForm.socialMedia, website: e.target.value }
                        })}
                        placeholder="example.com or https://..."
                        className="w-full p-2 bg-bg-primary border border-border-secondary rounded-lg text-text-primary focus:outline-none focus:border-accent-primary text-sm"
                      />
                    </div>
                  </div>
                  
                  <button
                    onClick={() => setIsEditing(false)}
                    className="text-text-secondary hover:text-text-primary transition-colors text-sm mt-2"
                  >
                    Cancel
                  </button>
                </div>
              )}
                </div>
              </div>
            </div>
          </div>

          {!isEditing && (
            <>
              {/* Stats Cards - Style osu! */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 sm:mb-8">
                <div className="bg-bg-secondary/40 backdrop-blur-sm rounded-lg p-6 transition-all hover:bg-bg-secondary/60">
                  <div className="text-text-secondary text-xs uppercase tracking-wider mb-2 font-semibold">Total Matches</div>
                  <div className="text-4xl font-bold text-text-primary mb-1" style={{ fontFamily: 'JetBrains Mono' }}>
                    {user.stats.totalMatches}
                  </div>
                  <div className="text-text-muted text-xs">
                    {user.stats.wins}W - {user.stats.losses}L
                  </div>
                </div>
                
                <div className="bg-bg-secondary/40 backdrop-blur-sm rounded-lg p-6 transition-all hover:bg-bg-secondary/60">
                  <div className="text-text-secondary text-xs uppercase tracking-wider mb-2 font-semibold">Win Rate</div>
                  <div className="text-4xl font-bold text-text-primary mb-1" style={{ fontFamily: 'JetBrains Mono', color: winRate >= 50 ? '#10b981' : '#f472b6' }}>
                    {winRate}%
                  </div>
                  <div className="text-text-muted text-xs">
                    {user.stats.wins} wins
                  </div>
                </div>
                
                <div className="bg-bg-secondary/40 backdrop-blur-sm rounded-lg p-6 transition-all hover:bg-bg-secondary/60">
                  <div className="text-text-secondary text-xs uppercase tracking-wider mb-2 font-semibold">Best WPM</div>
                  <div className="text-4xl font-bold text-text-primary mb-1" style={{ fontFamily: 'JetBrains Mono', color: '#fbbf24' }}>
                    {user.stats.bestWPM}
                  </div>
                  <div className="text-text-muted text-xs">
                    Personal best
                  </div>
                </div>
                
                <div className="bg-bg-secondary/40 backdrop-blur-sm rounded-lg p-6 transition-all hover:bg-bg-secondary/60">
                  <div className="text-text-secondary text-xs uppercase tracking-wider mb-2 font-semibold">Accuracy</div>
                  <div className="text-4xl font-bold text-text-primary mb-1" style={{ fontFamily: 'JetBrains Mono', color: '#06b6d4' }}>
                    {user.stats?.averageAccuracy !== undefined && user.stats?.averageAccuracy !== null 
                      ? user.stats.averageAccuracy.toFixed(1) 
                      : '0.0'}%
                  </div>
                  <div className="text-text-muted text-xs">
                    Average
                  </div>
                </div>
              </div>

              {/* Language Selector et Stats par Langue - Design harmonisé */}
              {/* Afficher le sélecteur seulement s'il y a plusieurs langues disponibles */}
              <div className="mb-4 sm:mb-6 space-y-4">
                {Object.keys(user.mmr || {}).length > 1 && (
                  <select
                    value={selectedLang}
                    onChange={(e) => setSelectedLang(e.target.value)}
                    className="w-full p-3 bg-bg-secondary/80 backdrop-blur-sm border border-border-secondary/40 rounded-lg text-text-primary focus:outline-none focus:border-accent-primary/60 focus:ring-2 focus:ring-accent-primary/20 transition-all hover:bg-bg-secondary font-medium appearance-none cursor-pointer"
                    style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                  >
                    {Object.entries(user.mmr || {}).map(([lang]) => (
                      <option key={lang} value={lang} style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                        {lang.toUpperCase()}
                      </option>
                    ))}
                  </select>
                )}
                
                {/* Stats détaillées pour la langue sélectionnée */}
                {calculateLanguageStats && (
                  <div className="bg-bg-secondary/40 backdrop-blur-sm rounded-lg p-4 border border-border-secondary/30">
                    <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
                      <span className="text-accent-primary">📊</span>
                      Statistics for {selectedLang.toUpperCase()}
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <div className="text-text-secondary text-xs mb-1">Matches</div>
                        <div className="text-2xl font-bold text-text-primary" style={{ fontFamily: 'JetBrains Mono' }}>
                          {calculateLanguageStats.totalMatches}
                        </div>
                        <div className="text-text-muted text-xs">
                          {calculateLanguageStats.wins}W - {calculateLanguageStats.losses}L
                        </div>
                      </div>
                      <div>
                        <div className="text-text-secondary text-xs mb-1">Win Rate</div>
                        <div 
                          className="text-2xl font-bold" 
                          style={{ 
                            fontFamily: 'JetBrains Mono',
                            color: calculateLanguageStats.winRate >= 50 ? '#10b981' : '#f472b6'
                          }}
                        >
                          {calculateLanguageStats.winRate}%
                        </div>
                        <div className="text-text-muted text-xs">
                          {calculateLanguageStats.wins} wins
                        </div>
                      </div>
                      <div>
                        <div className="text-text-secondary text-xs mb-1">Avg WPM</div>
                        <div className="text-2xl font-bold text-text-primary" style={{ fontFamily: 'JetBrains Mono' }}>
                          {calculateLanguageStats.avgWPM}
                        </div>
                        <div className="text-text-muted text-xs">
                          Best: {calculateLanguageStats.bestWPM}
                        </div>
                      </div>
                      <div>
                        <div className="text-text-secondary text-xs mb-1">Avg Accuracy</div>
                        <div className="text-2xl font-bold text-text-primary" style={{ fontFamily: 'JetBrains Mono' }}>
                          {calculateLanguageStats.avgAccuracy}%
                        </div>
                        <div className="text-text-muted text-xs">
                          Average
                        </div>
                      </div>
                    </div>
                    
                    {/* Graphique de progression ELO */}
                    {eloProgressionData.length > 0 && (
                      <div className="mt-6 pt-6 border-t border-border-secondary/30">
                        <h4 className="text-md font-semibold text-text-primary mb-4">ELO Progression</h4>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={eloProgressionData} margin={{ top: 5, right: 20, left: 0, bottom: 60 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#646669" opacity={0.3} />
                              <XAxis 
                                dataKey="date" 
                                stroke="#646669"
                                style={{ fontSize: '12px' }}
                                angle={-45}
                                textAnchor="end"
                                height={60}
                              />
                              <YAxis 
                                stroke="#646669"
                                style={{ fontSize: '12px' }}
                                domain={['dataMin - 50', 'dataMax + 50']}
                              />
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: '#1c1c1c',
                                  border: '1px solid #646669',
                                  borderRadius: '8px',
                                  color: '#e6edf3'
                                }}
                                formatter={(value) => [value, 'ELO']}
                                labelStyle={{ color: '#e6edf3' }}
                              />
                              <Legend 
                                wrapperStyle={{ paddingTop: '10px' }}
                                formatter={(value) => <span style={{ color: '#e6edf3', fontSize: '12px' }}>{value}</span>}
                              />
                              <Line 
                                type="monotone" 
                                dataKey="elo" 
                                stroke="#2188ff" 
                                strokeWidth={3}
                                dot={{ fill: '#2188ff', r: 4 }}
                                activeDot={{ r: 6, fill: '#2188ff', strokeWidth: 2, stroke: '#0d1117' }}
                                name="ELO"
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Historique des matchs - Avec filtres et tri améliorés */}
              {(soloMatches.length > 0 || multiplayerMatches.length > 0) && (
                <div className="space-y-6">
                  {/* Contrôles de filtrage et tri */}
                  <div className="bg-bg-secondary/40 backdrop-blur-sm rounded-lg p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                      <h2 className="text-2xl font-bold text-text-primary flex items-center gap-3">
                        <span className="w-1 h-8 bg-gradient-to-b from-accent-primary to-transparent rounded-full"></span>
                        Match History
                      </h2>
                      
                      {/* Filtres et tri - Design harmonisé avec le thème sombre */}
                      <div className="flex items-center gap-3 flex-wrap">
                        {/* Filtre par type */}
                        <select
                          value={matchFilter}
                          onChange={(e) => setMatchFilter(e.target.value)}
                          className="px-3 py-2 bg-bg-secondary/80 backdrop-blur-sm border border-border-secondary/40 rounded-lg text-text-primary text-sm focus:outline-none focus:border-accent-primary/60 focus:ring-2 focus:ring-accent-primary/20 hover:bg-bg-secondary transition-all appearance-none cursor-pointer"
                          style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                        >
                          <option value="all" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>All Matches</option>
                          <option value="solo" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>Solo</option>
                          <option value="multiplayer" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>Multiplayer</option>
                        </select>
                        
                        {/* Filtre par langue */}
                        <select
                          value={matchLanguageFilter}
                          onChange={(e) => setMatchLanguageFilter(e.target.value)}
                          className="px-3 py-2 bg-bg-secondary/80 backdrop-blur-sm border border-border-secondary/40 rounded-lg text-text-primary text-sm focus:outline-none focus:border-accent-primary/60 focus:ring-2 focus:ring-accent-primary/20 hover:bg-bg-secondary transition-all appearance-none cursor-pointer"
                          style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                        >
                          <option value="all" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>All Languages</option>
                          {Object.keys(user.mmr || {}).map(lang => (
                            <option key={lang} value={lang} style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                              {lang.toUpperCase()}
                            </option>
                          ))}
                        </select>
                        
                        {/* Tri */}
                        <select
                          value={matchSort}
                          onChange={(e) => setMatchSort(e.target.value)}
                          className="px-3 py-2 bg-bg-secondary/80 backdrop-blur-sm border border-border-secondary/40 rounded-lg text-text-primary text-sm focus:outline-none focus:border-accent-primary/60 focus:ring-2 focus:ring-accent-primary/20 hover:bg-bg-secondary transition-all appearance-none cursor-pointer"
                          style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                        >
                          <option value="date" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>Sort by Date</option>
                          <option value="wpm" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>Sort by WPM</option>
                          <option value="accuracy" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>Sort by Accuracy</option>
                        </select>
                        
                        {/* Ordre - Bouton amélioré avec design cohérent */}
                        <button
                          onClick={() => setMatchSortOrder(matchSortOrder === 'desc' ? 'asc' : 'desc')}
                          className="px-3 py-2 bg-bg-secondary/80 backdrop-blur-sm border border-border-secondary/40 rounded-lg text-text-primary text-sm hover:bg-bg-tertiary hover:border-accent-primary/40 transition-all focus:outline-none focus:ring-2 focus:ring-accent-primary/20"
                          title={matchSortOrder === 'desc' ? 'Descending' : 'Ascending'}
                        >
                          {matchSortOrder === 'desc' ? '↓' : '↑'}
                        </button>
                      </div>
                    </div>
                    
                    {/* Affichage des matchs filtrés et triés */}
                    {(() => {
                      // Combiner tous les matchs
                      let allMatches = [];
                      if (matchFilter === 'all' || matchFilter === 'solo') {
                        allMatches.push(...soloMatches.map(m => ({ ...m, type: 'solo' })));
                      }
                      if (matchFilter === 'all' || matchFilter === 'multiplayer') {
                        allMatches.push(...multiplayerMatches.map(m => ({ ...m, type: 'multiplayer' })));
                      }
                      
                      // Filtrer par langue si nécessaire
                      if (matchLanguageFilter !== 'all') {
                        allMatches = allMatches.filter(m => m.language === matchLanguageFilter);
                      }
                      
                      // Trier les matchs
                      allMatches.sort((a, b) => {
                        let comparison = 0;
                        if (matchSort === 'date') {
                          comparison = new Date(b.date) - new Date(a.date);
                        } else if (matchSort === 'wpm') {
                          comparison = (b.wpm || 0) - (a.wpm || 0);
                        } else if (matchSort === 'accuracy') {
                          comparison = (b.accuracy || 0) - (a.accuracy || 0);
                        }
                        return matchSortOrder === 'desc' ? comparison : -comparison;
                      });
                      
                      if (allMatches.length === 0) {
                        return (
                          <div className="text-center py-8 text-text-secondary">
                            No matches found with the selected filters.
                          </div>
                        );
                      }
                      
                      return (
                        <>
                          <div className="space-y-3">
                            {allMatches.map((match) => (
                            <div
                              key={match.id}
                              className={`bg-bg-primary rounded-xl p-4 border transition-all hover:scale-[1.02] ${
                                match.won 
                                  ? 'border-correct-char/30 hover:border-correct-char/50' 
                                  : match.type === 'solo'
                                    ? 'border-border-secondary/50 hover:border-accent-primary/50'
                                    : 'border-incorrect-char/30 hover:border-incorrect-char/50'
                              }`}
                            >
                              <div className="flex items-center justify-between flex-wrap gap-4">
                                <div className="flex items-center gap-4">
                                  <div 
                                    className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold text-lg ${
                                      match.type === 'solo'
                                        ? 'bg-accent-primary/20 text-accent-primary'
                                        : match.won 
                                          ? 'bg-correct-char/20 text-correct-char' 
                                          : 'bg-incorrect-char/20 text-incorrect-char'
                                    }`}
                                  >
                                    {match.type === 'solo' ? '⌨️' : (match.won ? '✓' : '✗')}
                                  </div>
                                  
                                  <div>
                                    <div className="flex items-center gap-3 mb-1">
                                      <span className="text-text-primary font-semibold">
                                        {match.type === 'solo' ? 'Solo Practice' : getMatchTypeLabel(match.type)}
                                      </span>
                                      {match.opponent && (
                                        <span className="text-text-secondary text-sm">vs {match.opponent}</span>
                                      )}
                                    </div>
                                    <div className="text-text-muted text-xs">{formatDate(match.date)}</div>
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-6">
                                  <div className="text-center">
                                    <div className="text-2xl font-bold text-text-primary" style={{ fontFamily: 'JetBrains Mono' }}>
                                      {match.wpm}
                                    </div>
                                    <div className="text-text-muted text-xs">WPM</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-2xl font-bold text-text-primary" style={{ fontFamily: 'JetBrains Mono' }}>
                                      {typeof match.accuracy === 'number' ? match.accuracy.toFixed(1) : match.accuracy}%
                                    </div>
                                    <div className="text-text-muted text-xs">ACC</div>
                                  </div>
                                  {match.eloChange !== undefined && match.eloChange !== null && (
                                    <div className="text-center">
                                      <div className={`text-lg font-bold ${match.eloChange >= 0 ? 'text-accent-secondary' : 'text-red-400'}`} style={{ fontFamily: 'JetBrains Mono' }}>
                                        {match.eloChange >= 0 ? '+' : ''}{match.eloChange}
                                      </div>
                                      <div className="text-text-muted text-xs">ELO</div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                          </div>
                          
                          {/* Bouton "Load More" pour la pagination - Design harmonisé */}
                          {hasMoreMatches && (
                            <div className="text-center mt-6">
                              <button
                                onClick={loadMoreMatches}
                                disabled={loadingMatches}
                                className="px-6 py-3 bg-bg-secondary/80 backdrop-blur-sm hover:bg-bg-tertiary border border-border-secondary/40 hover:border-accent-primary/40 rounded-lg text-text-primary text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-accent-primary/20"
                              >
                                {loadingMatches ? (
                                  <span className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-accent-primary/30 border-t-accent-primary rounded-full animate-spin"></div>
                                    Loading...
                                  </span>
                                ) : (
                                  'Load More Matches'
                                )}
                              </button>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
