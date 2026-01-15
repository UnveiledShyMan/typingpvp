// Dashboard/Home page - Inspiration: osu!, Aimlab, Chess.com
// Combine statistiques visuelles, activités récentes et accès rapide
import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getRankFromMMR } from '../utils/ranks'
import LogoIconSmall from '../components/icons/LogoIconSmall'
import SwordIcon from '../components/icons/SwordIcon'
import TrophyIcon from '../components/icons/TrophyIcon'
import CompetitionIcon from '../components/icons/CompetitionIcon'
import MatchmakingIcon from '../components/icons/MatchmakingIcon'

import { matchesService } from '../services/apiService';

export default function Dashboard({ user, onSectionChange }) {
  const [selectedLang, setSelectedLang] = useState('en');
  const [recentMatches, setRecentMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchRecentMatches();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchRecentMatches = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await matchesService.getMatches(5);
      setRecentMatches(data.matches || []);
    } catch (error) {
      // Erreur gérée par apiService
      setRecentMatches([]);
    } finally {
      setLoading(false);
    }
  };

  // Calculer les statistiques - optimisé avec useMemo
  const stats = useMemo(() => user?.stats || {
    totalMatches: 0,
    wins: 0,
    losses: 0,
    bestWPM: 0,
    averageAccuracy: 0
  }, [user?.stats]);

  const winrate = useMemo(() => {
    return stats.totalMatches > 0 
      ? Math.round((stats.wins / stats.totalMatches) * 100) 
      : 0;
  }, [stats.totalMatches, stats.wins]);

  const elo = useMemo(() => user?.mmr?.[selectedLang] || 1000, [user?.mmr, selectedLang]);
  const rankInfo = useMemo(() => getRankFromMMR(elo), [elo]);

  // Format date pour affichage - optimisé avec useCallback
  const formatDate = useCallback((dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  }, []);

  // Si pas d'utilisateur connecté, afficher une version simplifiée
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 py-8">
        <div className="max-w-4xl w-full text-center space-y-6 sm:space-y-8">
          <div className="space-y-3 sm:space-y-4">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-text-primary mb-3 sm:mb-4" style={{ fontFamily: 'Inter', letterSpacing: '-0.03em' }}>
              Welcome to Typing PvP
            </h1>
            <p className="text-lg sm:text-xl text-text-secondary max-w-2xl mx-auto px-4">
              Test your typing speed, compete with friends, and climb the rankings
            </p>
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mt-8 sm:mt-12 px-4">
            <button
              onClick={() => onSectionChange('solo')}
              className="bg-bg-secondary hover:bg-bg-tertiary border border-border-secondary hover:border-accent-primary/50 rounded-xl p-6 transition-all duration-200 group"
            >
              <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">⌨️</div>
              <div className="text-text-primary font-semibold">Solo Practice</div>
              <div className="text-text-secondary text-sm mt-1">Start typing</div>
            </button>

            <button
              onClick={() => onSectionChange('rankings')}
              className="bg-bg-secondary hover:bg-bg-tertiary border border-border-secondary hover:border-accent-primary/50 rounded-xl p-6 transition-all duration-200 group"
            >
              <TrophyIcon className="w-10 h-10 mx-auto mb-3 text-text-secondary group-hover:text-accent-primary transition-colors" stroke="currentColor" />
              <div className="text-text-primary font-semibold">Rankings</div>
              <div className="text-text-secondary text-sm mt-1">See leaders</div>
            </button>

            <button
              onClick={() => onSectionChange('matchmaking')}
              className="bg-bg-secondary hover:bg-bg-tertiary border border-border-secondary hover:border-accent-primary/50 rounded-xl p-6 transition-all duration-200 group"
            >
              <MatchmakingIcon className="w-10 h-10 mx-auto mb-3 text-text-secondary group-hover:text-accent-primary transition-colors" stroke="currentColor" />
              <div className="text-text-primary font-semibold">Matchmaking</div>
              <div className="text-text-secondary text-sm mt-1">Find opponent</div>
            </button>

            <button
              onClick={() => onSectionChange('competitions')}
              className="bg-bg-secondary hover:bg-bg-tertiary border border-border-secondary hover:border-accent-primary/50 rounded-xl p-6 transition-all duration-200 group"
            >
              <CompetitionIcon className="w-10 h-10 mx-auto mb-3 text-text-secondary group-hover:text-accent-primary transition-colors" stroke="currentColor" />
              <div className="text-text-primary font-semibold">Competitions</div>
              <div className="text-text-secondary text-sm mt-1">Join events</div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container p-6 md:p-8 space-y-6">
      {/* Header avec stats principales - Style osu! */}
      <div className="bg-bg-secondary rounded-2xl border border-border-secondary p-6 md:p-8 shadow-xl ui-card ui-fade-up">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          {/* Infos utilisateur */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <div 
                className="w-20 h-20 md:w-24 md:h-24 rounded-xl bg-bg-primary border-4 overflow-hidden flex items-center justify-center"
                style={{ borderColor: rankInfo.color }}
              >
                {user.avatar ? (
                  <img src={user.avatar} alt={user.username} className="w-full h-full object-cover object-center" loading="lazy" />
                ) : (
                  <LogoIconSmall className="w-12 h-12 text-accent-primary" stroke="currentColor" />
                )}
              </div>
              {/* Badge de rang */}
              <div 
                className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold shadow-lg border-4 border-bg-secondary"
                style={{ backgroundColor: rankInfo.color }}
              >
                {rankInfo.tier[0]}
              </div>
            </div>

            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-2" style={{ fontFamily: 'Inter', letterSpacing: '-0.02em' }}>
                {user.username}
              </h1>
              <div className="flex items-center gap-3 flex-wrap">
                <div 
                  className="px-3 py-1 rounded-full text-xs font-semibold text-white"
                  style={{ backgroundColor: rankInfo.color }}
                >
                  {rankInfo.tier} {rankInfo.rank || ''}
                </div>
                <div className="text-text-secondary text-sm">
                  <span className="font-bold text-text-primary" style={{ fontFamily: 'JetBrains Mono' }}>
                    {elo}
                  </span>
                  <span className="ml-1">ELO</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick actions */}
          <div className="flex gap-2 sm:gap-3 w-full md:w-auto mt-4 md:mt-0">
            <button
              onClick={() => onSectionChange('solo')}
              className="bg-accent-primary hover:bg-accent-hover text-accent-text font-semibold py-2 sm:py-2.5 px-4 sm:px-5 rounded-lg transition-colors text-xs sm:text-sm shadow-lg flex-1 md:flex-initial"
            >
              Start Typing
            </button>
            <button
              onClick={() => onSectionChange('profile')}
              className="bg-bg-primary hover:bg-bg-tertiary border border-border-secondary text-text-primary font-medium py-2 sm:py-2.5 px-4 sm:px-5 rounded-lg transition-colors text-xs sm:text-sm flex-1 md:flex-initial"
            >
              Profile
            </button>
          </div>
        </div>
      </div>

      {/* Stats cards - Style Aimlab */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {/* WPM card */}
        <div className="bg-bg-secondary rounded-lg sm:rounded-xl border border-border-secondary p-4 sm:p-6 hover:border-accent-primary/50 transition-all duration-200 ui-card ui-card-hover">
          <div className="text-text-secondary text-xs sm:text-sm font-medium mb-1 sm:mb-2">Best WPM</div>
          <div className="text-3xl sm:text-4xl font-bold text-text-primary mb-1" style={{ fontFamily: 'JetBrains Mono' }}>
            {stats.bestWPM || 0}
          </div>
          <div className="text-xs text-text-secondary">words/min</div>
        </div>

        {/* Winrate card */}
        <div className="bg-bg-secondary rounded-lg sm:rounded-xl border border-border-secondary p-4 sm:p-6 hover:border-accent-primary/50 transition-all duration-200 ui-card ui-card-hover">
          <div className="text-text-secondary text-xs sm:text-sm font-medium mb-1 sm:mb-2">Winrate</div>
          <div className="text-3xl sm:text-4xl font-bold text-text-primary mb-1" style={{ fontFamily: 'JetBrains Mono' }}>
            {winrate}%
          </div>
          <div className="text-xs text-text-secondary">
            {stats.wins}W / {stats.losses}L
          </div>
        </div>

        {/* Accuracy card */}
        <div className="bg-bg-secondary rounded-lg sm:rounded-xl border border-border-secondary p-4 sm:p-6 hover:border-accent-primary/50 transition-all duration-200 ui-card ui-card-hover">
          <div className="text-text-secondary text-xs sm:text-sm font-medium mb-1 sm:mb-2">Accuracy</div>
          <div className="text-3xl sm:text-4xl font-bold text-text-primary mb-1" style={{ fontFamily: 'JetBrains Mono' }}>
            {Math.round(stats.averageAccuracy) || 100}%
          </div>
          <div className="text-xs text-text-secondary">average</div>
        </div>

        {/* Matches card */}
        <div className="bg-bg-secondary rounded-lg sm:rounded-xl border border-border-secondary p-4 sm:p-6 hover:border-accent-primary/50 transition-all duration-200 ui-card ui-card-hover">
          <div className="text-text-secondary text-xs sm:text-sm font-medium mb-1 sm:mb-2">Total Matches</div>
          <div className="text-3xl sm:text-4xl font-bold text-text-primary mb-1" style={{ fontFamily: 'JetBrains Mono' }}>
            {stats.totalMatches || 0}
          </div>
          <div className="text-xs text-text-secondary">matches</div>
        </div>
      </div>

      {/* Main content grid - Style Chess.com */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Quick actions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick play options */}
          <div className="bg-bg-secondary rounded-xl border border-border-secondary p-6 ui-card ui-fade-up">
            <h2 className="text-xl font-bold text-text-primary mb-4" style={{ fontFamily: 'Inter', letterSpacing: '-0.01em' }}>
              Quick Play
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => onSectionChange('solo')}
                className="bg-bg-primary hover:bg-bg-tertiary border border-border-secondary hover:border-accent-primary/50 rounded-lg p-4 text-left transition-all duration-200 group"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="text-2xl">⌨️</div>
                  <div className="font-semibold text-text-primary">Solo Practice</div>
                </div>
                <div className="text-sm text-text-secondary">Practice alone and improve your skills</div>
              </button>

              <button
                onClick={() => onSectionChange('battle')}
                className="bg-bg-primary hover:bg-bg-tertiary border border-border-secondary hover:border-accent-primary/50 rounded-lg p-4 text-left transition-all duration-200 group"
              >
                <div className="flex items-center gap-3 mb-2">
                  <SwordIcon className="w-5 h-5 text-text-secondary group-hover:text-accent-primary transition-colors" stroke="currentColor" />
                  <div className="font-semibold text-text-primary">1v1 Battle</div>
                </div>
                <div className="text-sm text-text-secondary">Challenge a friend to a typing duel</div>
              </button>

              <button
                onClick={() => onSectionChange('matchmaking')}
                className="bg-bg-primary hover:bg-bg-tertiary border border-border-secondary hover:border-accent-primary/50 rounded-lg p-4 text-left transition-all duration-200 group"
              >
                <div className="flex items-center gap-3 mb-2">
                  <MatchmakingIcon className="w-5 h-5 text-text-secondary group-hover:text-accent-primary transition-colors" stroke="currentColor" />
                  <div className="font-semibold text-text-primary">Matchmaking</div>
                </div>
                <div className="text-sm text-text-secondary">Find a random opponent</div>
              </button>

              <button
                onClick={() => onSectionChange('competitions')}
                className="bg-bg-primary hover:bg-bg-tertiary border border-border-secondary hover:border-accent-primary/50 rounded-lg p-4 text-left transition-all duration-200 group"
              >
                <div className="flex items-center gap-3 mb-2">
                  <CompetitionIcon className="w-5 h-5 text-text-secondary group-hover:text-accent-primary transition-colors" stroke="currentColor" />
                  <div className="font-semibold text-text-primary">Competitions</div>
                </div>
                <div className="text-sm text-text-secondary">Join competitive events</div>
              </button>
            </div>
          </div>

          {/* Recent matches */}
          <div className="bg-bg-secondary rounded-xl border border-border-secondary p-6 ui-card ui-fade-up">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-text-primary" style={{ fontFamily: 'Inter', letterSpacing: '-0.01em' }}>
                Recent Matches
              </h2>
              {recentMatches.length > 0 && (
                <button
                  onClick={() => onSectionChange('profile')}
                  className="text-sm text-text-secondary hover:text-accent-primary transition-colors"
                >
                  View All →
                </button>
              )}
            </div>

            {loading ? (
              <div className="text-center py-8 text-text-secondary">Loading...</div>
            ) : recentMatches.length === 0 ? (
              <div className="text-center py-8 text-text-secondary">
                <div className="text-4xl mb-3">📝</div>
                <div>No matches yet</div>
                <div className="text-sm mt-2">Start playing to see your match history</div>
              </div>
            ) : (
              <div className="space-y-3">
                {recentMatches.map((match, index) => (
                  <div
                    key={index}
                    className="bg-bg-primary rounded-lg border border-border-secondary p-4 hover:border-accent-primary/50 transition-all duration-200"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className={`w-2 h-2 rounded-full ${match.won ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <div className="flex-1">
                          <div className="font-medium text-text-primary">
                            {match.type === 'battle' ? '1v1 Battle' : match.type === 'competition' ? 'Competition' : 'Matchmaking'}
                          </div>
                          <div className="text-sm text-text-secondary">
                            {match.wpm} WPM · {match.accuracy}% accuracy · {formatDate(match.date)}
                          </div>
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-semibold ${match.won ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {match.won ? 'WIN' : 'LOSS'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column - Additional info */}
        <div className="space-y-6">
          {/* Language selector */}
          <div className="bg-bg-secondary rounded-xl border border-border-secondary p-6 ui-card ui-fade-up">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Language</h3>
            <select
              value={selectedLang}
              onChange={(e) => setSelectedLang(e.target.value)}
              className="w-full bg-bg-primary border border-border-secondary text-text-primary px-4 py-2.5 rounded-lg focus:outline-none focus:border-accent-primary transition-colors font-medium"
            >
              <option value="en" className="bg-bg-primary">English</option>
              <option value="fr" className="bg-bg-primary">Français</option>
              <option value="es" className="bg-bg-primary">Español</option>
              <option value="de" className="bg-bg-primary">Deutsch</option>
              <option value="it" className="bg-bg-primary">Italiano</option>
            </select>
          </div>

          {/* Rank info */}
          <div className="bg-bg-secondary rounded-xl border border-border-secondary p-6 ui-card ui-fade-up">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Current Rank</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-text-secondary">Tier</span>
                <span 
                  className="font-bold text-lg"
                  style={{ color: rankInfo.color }}
                >
                  {rankInfo.tier} {rankInfo.rank || ''}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-secondary">ELO</span>
                <span className="font-bold text-lg text-text-primary" style={{ fontFamily: 'JetBrains Mono' }}>
                  {elo}
                </span>
              </div>
            </div>
          </div>

          {/* Next steps */}
          <div className="bg-bg-secondary rounded-xl border border-border-secondary p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Next Steps</h3>
            <div className="space-y-3">
              <button
                onClick={() => onSectionChange('matchmaking')}
                className="w-full bg-bg-primary hover:bg-bg-tertiary border border-border-secondary hover:border-accent-primary/40 rounded-lg px-4 py-3 text-left text-text-primary transition-all"
              >
                Find a ranked opponent
              </button>
              <button
                onClick={() => onSectionChange('battle')}
                className="w-full bg-bg-primary hover:bg-bg-tertiary border border-border-secondary hover:border-accent-primary/40 rounded-lg px-4 py-3 text-left text-text-primary transition-all"
              >
                Start a 1v1 battle
              </button>
              <button
                onClick={() => onSectionChange('rankings')}
                className="w-full bg-bg-primary hover:bg-bg-tertiary border border-border-secondary hover:border-accent-primary/40 rounded-lg px-4 py-3 text-left text-text-primary transition-all"
              >
                Climb the leaderboard
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

