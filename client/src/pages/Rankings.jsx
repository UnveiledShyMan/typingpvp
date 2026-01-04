import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { languages } from '../data/languages'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function Rankings() {
  const [selectedLang, setSelectedLang] = useState('en');
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRankings();
  }, [selectedLang]);

  const fetchRankings = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/rankings/${selectedLang}`);
      const data = await response.json();
      setRankings(data.rankings || []);
    } catch (error) {
      console.error('Error fetching rankings:', error);
    } finally {
      setLoading(false);
    }
  };

  // Les couleurs sont maintenant dans rankInfo.color
  const getRankColor = (rankInfo) => {
    return rankInfo?.color || '#646669';
  };

  return (
    <div className="page-container p-8">
      <h1 className="text-4xl font-bold text-text-primary mb-8 animate-slide-up" style={{ fontFamily: 'Inter', letterSpacing: '-0.02em' }}>
        Rankings
      </h1>

        <div className="mb-8">
          <select
            value={selectedLang}
            onChange={(e) => setSelectedLang(e.target.value)}
            className="bg-bg-secondary border border-text-secondary/20 text-text-primary px-4 py-3 rounded-lg focus:outline-none focus:border-accent-primary transition-colors font-medium"
          >
            {Object.entries(languages).map(([code, lang]) => (
              <option key={code} value={code} className="bg-bg-secondary">
                {lang.name}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="text-center py-12 text-text-secondary">Loading...</div>
        ) : (
          <div className="bg-bg-secondary rounded-lg border border-text-secondary/10 overflow-hidden shadow-lg animate-slide-up">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-bg-primary border-b border-text-secondary/20">
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
                      className="border-b border-text-secondary/10 hover:bg-bg-primary/50 transition-all duration-200 cursor-pointer group"
                      onClick={() => {
                        if (onProfileClick) {
                          onProfileClick(player.id);
                        } else {
                          window.location.href = `/profile/${player.id}`;
                        }
                      }}
                    >
                      <td className="px-6 py-5 text-text-primary font-bold group-hover:text-accent-primary transition-colors" style={{ fontFamily: 'JetBrains Mono' }}>
                        #{player.rank}
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          {player.avatar ? (
                            <img
                              src={player.avatar}
                              alt={player.username}
                              className="w-12 h-12 rounded-full object-cover ring-2 ring-text-secondary/20 group-hover:ring-accent-primary/50 transition-all"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-accent-primary/20 flex items-center justify-center text-accent-primary font-bold text-lg ring-2 ring-text-secondary/20 group-hover:ring-accent-primary/50 transition-all">
                              {player.username[0].toUpperCase()}
                            </div>
                          )}
                          <span className="text-text-primary font-semibold group-hover:text-accent-primary transition-colors">{player.username}</span>
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
  )
}

