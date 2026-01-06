import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { languages } from '../data/languages'
import { useRankings } from '../hooks/useRankings'
import { TableSkeleton } from '../components/SkeletonLoader'
import UserTooltip from '../components/UserTooltip'
import SEOHead from '../components/SEOHead'

export default function Rankings() {
  const [selectedLang, setSelectedLang] = useState('en');
  const navigate = useNavigate();
  
  // Utiliser React Query pour le cache automatique
  const { data: rankings = [], isLoading: loading, refetch } = useRankings(selectedLang);

  useEffect(() => {
    // Écouter les événements de mise à jour ELO après une battle
    const handleEloUpdate = () => {
      // Rafraîchir le leaderboard après un court délai
      setTimeout(() => {
        refetch();
      }, 1000);
    };
    
    window.addEventListener('elo-updated', handleEloUpdate);
    
    return () => {
      window.removeEventListener('elo-updated', handleEloUpdate);
    };
  }, [selectedLang, refetch]);

  // Les couleurs sont maintenant dans rankInfo.color
  const getRankColor = (rankInfo) => {
    return rankInfo?.color || '#646669';
  };

  // Préparer les données JSON-LD pour le structured data SEO
  const rankingsJsonLd = {
    '@type': 'ItemList',
    '@id': `https://typingpvp.com/rankings?lang=${selectedLang}`,
    name: `${languages[selectedLang]?.name || 'Global'} Typing Rankings`,
    description: `Global leaderboard for ${languages[selectedLang]?.name || 'typing'} language - Top typists ranked by ELO`,
    numberOfItems: rankings.length,
    ...(rankings.length > 0 && {
      itemListElement: rankings.slice(0, 100).map((player, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'Person',
          name: player.username,
          url: `https://typingpvp.com/profile/${player.username}`,
          ...(player.mmr && {
            knowsAbout: ['Typing', `${languages[selectedLang]?.name || ''} Typing`]
          })
        }
      }))
    })
  };

  return (
    <>
      <SEOHead 
        title={`${languages[selectedLang]?.name || 'Global'} Rankings - TypingPVP`}
        description={`Global leaderboard for ${languages[selectedLang]?.name || 'typing'} - Compete with the best typists`}
        keywords={`typing rankings, leaderboard, ${languages[selectedLang]?.name || ''} typing, competitive typing, ELO leaderboard`}
        url={`https://typingpvp.com/rankings?lang=${selectedLang}`}
        type="ItemList"
        jsonLd={rankingsJsonLd}
      />
      <div className="h-full w-full flex flex-col overflow-hidden">
      <div className="mb-4 sm:mb-6 flex-shrink-0">
        <h1 className="text-3xl sm:text-4xl font-bold text-text-primary mb-1 animate-slide-up" style={{ fontFamily: 'Inter', letterSpacing: '-0.02em' }}>
          Rankings
        </h1>
        <p className="text-text-secondary/70 text-xs sm:text-sm">Compete with the best typists</p>
      </div>

        <div className="mb-4 sm:mb-6 flex-shrink-0">
          <select
            value={selectedLang}
            onChange={(e) => setSelectedLang(e.target.value)}
            className="rounded-lg px-4 py-3 font-medium focus:outline-none focus:ring-2 focus:ring-accent-primary/20 transition-all appearance-none cursor-pointer"
            style={{
              backgroundColor: 'rgba(10, 14, 26, 0.3)',
              color: 'var(--text-primary, #e8ecf3)',
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%239ca3b8' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 1rem center',
              paddingRight: '2.5rem',
              border: 'none'
            }}
          >
            {Object.entries(languages).map(([code, lang]) => (
              <option key={code} value={code} style={{ backgroundColor: 'var(--bg-secondary, #131825)', color: 'var(--text-primary, #e8ecf3)' }}>
                {lang.name}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="p-6">
            <TableSkeleton rows={10} columns={4} />
          </div>
        ) : (
          <div className="bg-bg-secondary/40 backdrop-blur-sm rounded-lg overflow-hidden animate-slide-up flex-1 min-h-0 flex flex-col">
            <div className="overflow-auto flex-1">
              <table className="w-full">
                <thead className="bg-bg-primary/40">
                  <tr>
                    <th className="px-6 py-4 text-left text-text-secondary text-xs font-semibold uppercase tracking-wider">Rank</th>
                    <th className="px-6 py-4 text-left text-text-secondary text-xs font-semibold uppercase tracking-wider">Player</th>
                    <th className="px-6 py-4 text-left text-text-secondary text-xs font-semibold uppercase tracking-wider">Tier</th>
                    <th className="px-6 py-4 text-left text-text-secondary text-xs font-semibold uppercase tracking-wider">ELO</th>
                    <th className="px-6 py-4 text-left text-text-secondary text-xs font-semibold uppercase tracking-wider">W/L</th>
                    <th className="px-6 py-4 text-left text-text-secondary text-xs font-semibold uppercase tracking-wider">Best WPM</th>
                    <th className="px-6 py-4 text-left text-text-secondary text-xs font-semibold uppercase tracking-wider">Gear</th>
                  </tr>
                </thead>
                <tbody>
                  {rankings.map((player, index) => (
                    <tr
                      key={player.id}
                      className="hover:bg-bg-primary/30 transition-all duration-200 cursor-pointer group"
                      onClick={() => {
                        navigate(`/profile/${player.username}`);
                      }}
                    >
                      <td className="px-6 py-5 text-text-primary font-bold group-hover:text-accent-primary transition-colors" style={{ fontFamily: 'JetBrains Mono' }}>
                        #{player.rank}
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          {/* Avatar cliquable pour accéder au profil */}
                          {player.avatar ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation(); // Empêcher le clic sur la ligne
                                navigate(`/profile/${player.username}`);
                              }}
                              className="w-12 h-12 rounded-full object-cover ring-2 ring-text-secondary/20 hover:ring-accent-primary/50 transition-all cursor-pointer overflow-hidden"
                              title="View profile"
                            >
                              <img
                                src={player.avatar}
                                alt={player.username}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            </button>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation(); // Empêcher le clic sur la ligne
                                navigate(`/profile/${player.username}`);
                              }}
                              className="w-12 h-12 rounded-full bg-accent-primary/20 flex items-center justify-center text-accent-primary font-bold text-lg ring-2 ring-text-secondary/20 hover:ring-accent-primary/50 transition-all cursor-pointer"
                              title="View profile"
                            >
                              {player.username[0].toUpperCase()}
                            </button>
                          )}
                          <UserTooltip userId={player.id} username={player.username}>
                            <span 
                              className="text-text-primary font-semibold group-hover:text-accent-primary transition-colors cursor-pointer"
                              onClick={() => navigate(`/profile/${player.username}`)}
                            >
                              {player.username}
                            </span>
                          </UserTooltip>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <span
                            className="text-sm font-bold"
                            style={{ color: getRankColor(player.rankInfo) }}
                          >
                            {player.rankInfo.tier}
                          </span>
                          {player.rankInfo.rank && (
                            <span className="text-text-secondary text-xs font-medium">{player.rankInfo.rank}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5 text-text-primary font-semibold" style={{ fontFamily: 'JetBrains Mono' }}>
                        {player.mmr}
                      </td>
                      <td className="px-6 py-5 text-text-secondary text-sm">
                        <span className="text-text-primary font-medium">{player.stats.wins}</span>W / <span className="text-text-primary font-medium">{player.stats.losses}</span>L
                      </td>
                      <td className="px-6 py-5 text-text-primary font-bold text-lg" style={{ fontFamily: 'JetBrains Mono' }}>
                        {player.stats.bestWPM}
                      </td>
                      <td className="px-6 py-5 text-text-secondary text-sm">
                        {player.gear ? (
                          <span className="text-text-primary">{player.gear}</span>
                        ) : (
                          <span className="text-text-muted">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

