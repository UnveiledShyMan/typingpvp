/**
 * Composant Tooltip pour afficher des infos rapides sur un utilisateur au hover
 * Charge les données du profil en lazy loading
 */

import { useState, useEffect, useRef, memo } from 'react';
import { profileService } from '../services/apiService';
import { getRankFromMMR } from '../utils/ranks';

function UserTooltip({ userId, username, children }) {
  const [show, setShow] = useState(false);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(false);
  const timeoutRef = useRef(null);
  const tooltipRef = useRef(null);
  
  // Charger les données du profil au hover (lazy loading)
  useEffect(() => {
    if (show && !userData && !loading && userId) {
      setLoading(true);
      profileService.getProfile(userId)
        .then(data => {
          setUserData(data);
        })
        .catch(() => {
          // Erreur silencieuse - le tooltip ne s'affichera simplement pas
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [show, userId, userData, loading]);

  // Gérer le hover avec un délai pour éviter les affichages trop rapides
  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setShow(true);
    }, 300); // Délai de 300ms avant d'afficher
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setShow(false);
  };

  // Nettoyer le timeout au démontage
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Calculer le rank info
  const rankInfo = userData ? getRankFromMMR(Math.max(...Object.values(userData.mmr || {}).map(m => parseInt(m) || 1000), 1000)) : null;

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      
      {/* Tooltip */}
      {show && (userData || loading) && (
        <div
          ref={tooltipRef}
          className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-bg-secondary/95 backdrop-blur-md border border-border-secondary/50 rounded-lg p-4 shadow-xl"
          style={{ animation: 'fadeIn 0.2s ease-out' }}
        >
          {loading ? (
            <div className="text-center py-4">
              <div className="w-6 h-6 border-2 border-accent-primary/30 border-t-accent-primary rounded-full animate-spin mx-auto"></div>
            </div>
          ) : userData ? (
            <div className="space-y-3">
              {/* Header avec avatar et nom */}
              <div className="flex items-center gap-3">
                {userData.avatar ? (
                  <img
                    src={userData.avatar}
                    alt={userData.username}
                    className="w-12 h-12 rounded-full object-cover object-center"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-accent-primary/20 flex items-center justify-center text-accent-primary font-bold text-lg">
                    {userData.username[0].toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-text-primary font-semibold truncate">{userData.username}</div>
                  {rankInfo && (
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className="text-xs font-bold px-2 py-0.5 rounded"
                        style={{ 
                          backgroundColor: getRankColor(rankInfo) + '20',
                          color: getRankColor(rankInfo)
                        }}
                      >
                        {rankInfo.tier} {rankInfo.rank || ''}
                      </span>
                      <span className="text-text-secondary text-xs">
                        {Math.max(...Object.values(userData.mmr || {}).map(m => parseInt(m) || 1000), 1000)} ELO
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Stats rapides */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border-secondary/30">
                <div className="text-center">
                  <div className="text-text-primary font-bold text-sm">
                    {userData.stats?.totalMatches || 0}
                  </div>
                  <div className="text-text-secondary text-xs">Matches</div>
                </div>
                <div className="text-center">
                  <div className="text-text-primary font-bold text-sm">
                    {userData.stats?.wins || 0}
                  </div>
                  <div className="text-text-secondary text-xs">Wins</div>
                </div>
                <div className="text-center">
                  <div className="text-text-primary font-bold text-sm">
                    {userData.stats?.totalMatches > 0 
                      ? Math.round((userData.stats.wins || 0) / userData.stats.totalMatches * 100)
                      : 0}%
                  </div>
                  <div className="text-text-secondary text-xs">Win Rate</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-text-secondary text-sm text-center py-2">
              {username || 'User'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Fonction helper pour obtenir la couleur du rank
function getRankColor(rankInfo) {
  return rankInfo?.color || '#646669';
}

// Mémoriser le composant pour éviter les re-renders inutiles
export default memo(UserTooltip);
