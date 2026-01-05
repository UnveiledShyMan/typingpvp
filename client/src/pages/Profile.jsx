import { useState, useEffect, useMemo, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getRankFromMMR } from '../utils/ranks.js'
import { useToastContext } from '../contexts/ToastContext'
import { profileService, authService, matchesService } from '../services/apiService'
import { ProfileSkeleton } from '../components/SkeletonLoader'
import { useProfile, useUpdateProfile } from '../hooks/useProfile'
import { useUser } from '../contexts/UserContext'
import SEOHead from '../components/SEOHead'
import logger from '../utils/logger'

export default function Profile({ userId: currentUserId }) {
  const { id } = useParams();
  const userId = id || currentUserId;
  const navigate = useNavigate();
  const { toast } = useToastContext();
  const { user: currentUserFromContext } = useUser();
  
  // Utiliser React Query pour le cache du profil
  const { data: user, isLoading: loading, refetch: refetchProfile } = useProfile(userId);
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
  const [recentMatches, setRecentMatches] = useState([]);
  const [soloMatches, setSoloMatches] = useState([]);
  const [multiplayerMatches, setMultiplayerMatches] = useState([]);

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
      fetchUserMatches(userId);
    }
  }, [user, userId]);

  useEffect(() => {
    // Écouter les événements de mise à jour ELO après une battle
    const handleEloUpdate = () => {
      // Rafraîchir le profil si c'est le profil de l'utilisateur courant
      if (currentUserFromContext && currentUserFromContext.id === userId) {
        refetchProfile();
      }
    };
    
    window.addEventListener('elo-updated', handleEloUpdate);
    
    return () => {
      window.removeEventListener('elo-updated', handleEloUpdate);
    };
  }, [userId, currentUserFromContext, refetchProfile]);

  const fetchUserMatches = async (targetUserId) => {
    try {
      // Récupérer les matchs solo et multijoueurs séparément
      const [soloData, multiplayerData, allData] = await Promise.all([
        matchesService.getUserMatches(targetUserId, 10, 'solo').catch(() => ({ matches: [] })),
        matchesService.getUserMatches(targetUserId, 10, 'multiplayer').catch(() => ({ matches: [] })),
        matchesService.getUserMatches(targetUserId, 10).catch(() => ({ matches: [] }))
      ]);
      
      setSoloMatches(soloData.matches || []);
      setMultiplayerMatches(multiplayerData.matches || []);
      setRecentMatches(allData.matches || []);
    } catch (error) {
      // Erreur gérée par apiService
      setSoloMatches([]);
      setMultiplayerMatches([]);
      setRecentMatches([]);
    }
  };

  const handleSave = async () => {
    if (!currentUserFromContext) {
      toast.warning('Please login to edit profile');
      return;
    }

    setSaving(true);
    try {
      await updateProfileMutation.mutateAsync({
        userId,
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

  const isOwnProfile = currentUserFromContext && currentUserFromContext.id === userId;

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

  const rankInfo = getRankFromMMR(user.mmr[selectedLang] || 1000);
  const winRate = user.stats.totalMatches > 0
    ? ((user.stats.wins / user.stats.totalMatches) * 100).toFixed(1)
    : 0;

  const socialMedia = user.socialMedia || {
    twitter: '',
    github: '',
    discord: '',
    website: ''
  };

  return (
    <>
      <SEOHead 
        title={`${user.username} - Profile - TypingPVP`}
        description={user.bio || `View ${user.username}'s typing stats, ELO, and match history`}
        keywords={`${user.username}, typing profile, typing stats, ${user.gear || ''}`}
      />
      <div className="h-full w-full flex flex-col overflow-hidden">
        <div className="w-full h-full max-w-5xl mx-auto flex-1 min-h-0 overflow-y-auto profile-scroll p-4 sm:p-6">
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
                    <img src={editForm.avatar} alt={user.username} className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <span className="text-6xl md:text-7xl text-accent-primary font-bold">
                      {user.username[0].toUpperCase()}
                    </span>
                  )}
                </div>
              ) : (
                user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.username}
                    className="w-32 h-32 md:w-40 md:h-40 rounded-2xl object-cover border-4 shadow-2xl"
                    style={{ borderColor: getRankColor(rankInfo) }}
                    loading="lazy"
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
                        {user.mmr[selectedLang] || 1000}
                      </span>
                      <span className="text-xs ml-1">ELO</span>
                    </div>
                  </div>
                </div>
                
                {isOwnProfile && (
                  <button
                    onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                    disabled={saving}
                    className="bg-accent-primary hover:bg-accent-hover text-bg-primary font-semibold py-2.5 px-6 rounded-lg transition-colors text-sm disabled:opacity-50 shadow-lg"
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
                    <label className="block text-text-primary mb-2 text-sm font-medium">Avatar URL</label>
                    <input
                      type="text"
                      value={editForm.avatar}
                      onChange={(e) => setEditForm({ ...editForm, avatar: e.target.value })}
                      placeholder="https://example.com/avatar.jpg"
                      className="input-modern"
                    />
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
                {user.stats.averageAccuracy.toFixed(1)}%
              </div>
              <div className="text-text-muted text-xs">
                Average
              </div>
            </div>
          </div>

          {/* Language Selector */}
          <div className="mb-4 sm:mb-6">
            <select
              value={selectedLang}
              onChange={(e) => setSelectedLang(e.target.value)}
              className="bg-bg-secondary/40 backdrop-blur-sm text-text-primary px-4 py-2.5 rounded-lg focus:outline-none focus:bg-bg-secondary/60 transition-colors font-medium"
            >
              {Object.entries(user.mmr || {}).map(([lang]) => (
                <option key={lang} value={lang} className="bg-bg-primary">
                  {lang.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          {/* Historique des matchs - Deux sections : Solo et Multijoueurs */}
          {(soloMatches.length > 0 || multiplayerMatches.length > 0) && (
            <div className="space-y-6">
              {/* Matchs Solo */}
              {soloMatches.length > 0 && (
                <div className="bg-bg-secondary/40 backdrop-blur-sm rounded-lg p-4 sm:p-6">
                  <h2 className="text-2xl font-bold text-text-primary mb-6 flex items-center gap-3">
                    <span className="w-1 h-8 bg-gradient-to-b from-accent-primary to-transparent rounded-full"></span>
                    Solo Matches
                  </h2>
                  
                  <div className="space-y-3">
                    {soloMatches.map((match) => (
                      <div
                        key={match.id}
                        className="bg-bg-primary rounded-xl p-4 border border-border-secondary/50 transition-all hover:scale-[1.02] hover:border-accent-primary/50"
                      >
                        <div className="flex items-center justify-between flex-wrap gap-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg flex items-center justify-center font-bold text-lg bg-accent-primary/20 text-accent-primary">
                              ⌨️
                            </div>
                            
                            <div>
                              <div className="flex items-center gap-3 mb-1">
                                <span className="text-text-primary font-semibold">Solo Practice</span>
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
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Matchs Multijoueurs */}
              {multiplayerMatches.length > 0 && (
                <div className="bg-bg-secondary/40 backdrop-blur-sm rounded-lg p-4 sm:p-6">
                  <h2 className="text-2xl font-bold text-text-primary mb-6 flex items-center gap-3">
                    <span className="w-1 h-8 bg-gradient-to-b from-accent-primary to-transparent rounded-full"></span>
                    Multiplayer Matches
                  </h2>
                  
                  <div className="space-y-3">
                    {multiplayerMatches.map((match) => (
                      <div
                        key={match.id}
                        className={`bg-bg-primary rounded-xl p-4 border transition-all hover:scale-[1.02] ${
                          match.won 
                            ? 'border-correct-char/30 hover:border-correct-char/50' 
                            : 'border-incorrect-char/30 hover:border-incorrect-char/50'
                        }`}
                      >
                        <div className="flex items-center justify-between flex-wrap gap-4">
                          <div className="flex items-center gap-4">
                            <div 
                              className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold text-lg ${
                                match.won 
                                  ? 'bg-correct-char/20 text-correct-char' 
                                  : 'bg-incorrect-char/20 text-incorrect-char'
                              }`}
                            >
                              {match.won ? '✓' : '✗'}
                            </div>
                            
                            <div>
                              <div className="flex items-center gap-3 mb-1">
                                <span className="text-text-primary font-semibold">{getMatchTypeLabel(match.type)}</span>
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
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
