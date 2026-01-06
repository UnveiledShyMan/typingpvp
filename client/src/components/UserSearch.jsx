/**
 * Composant de recherche d'utilisateurs avec autocomplete
 * Utilise debounce pour optimiser les requêtes
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDebounce } from '../hooks/useDebounce';
import { friendsService } from '../services/apiService';
import { useToastContext } from '../contexts/ToastContext';
import { getRankFromMMR } from '../utils/ranks';

export default function UserSearch({ onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToastContext();
  const searchRef = useRef(null);
  const resultsRef = useRef(null);
  
  // Debounce la recherche pour éviter trop de requêtes
  const debouncedQuery = useDebounce(query, 300);
  
  // Rechercher les utilisateurs
  useEffect(() => {
    const searchUsers = async () => {
      if (debouncedQuery.length < 2) {
        setResults([]);
        setShowResults(false);
        return;
      }
      
      setLoading(true);
      try {
        const data = await friendsService.searchUsers(debouncedQuery);
        setResults(data.users || []);
        setShowResults(true);
      } catch (error) {
        toast.error('Failed to search users');
        setResults([]);
      } finally {
        setLoading(false);
      }
    };
    
    searchUsers();
  }, [debouncedQuery, toast]);
  
  // Fermer les résultats si on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchRef.current && 
        !searchRef.current.contains(event.target) &&
        resultsRef.current &&
        !resultsRef.current.contains(event.target)
      ) {
        setShowResults(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Gérer la sélection d'un utilisateur
  const handleSelectUser = useCallback((user) => {
    navigate(`/profile/${user.id}`);
    setQuery('');
    setShowResults(false);
    if (onClose) onClose();
  }, [navigate, onClose]);
  
  // Gérer les raccourcis clavier
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setShowResults(false);
      if (onClose) onClose();
    } else if (e.key === 'Enter' && results.length > 0) {
      handleSelectUser(results[0]);
    }
  };
  
  const getRankColor = (rankInfo) => {
    return rankInfo?.color || '#646669';
  };
  
  return (
    <div className="relative" ref={searchRef}>
      {/* Input de recherche */}
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowResults(true);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (results.length > 0) setShowResults(true);
          }}
          placeholder="Search users..."
          className="w-full px-4 py-2.5 pl-10 bg-bg-primary/50 backdrop-blur-sm border border-border-secondary/30 rounded-lg text-text-primary placeholder-text-secondary/50 focus:outline-none focus:border-accent-primary/50 transition-colors"
          autoFocus
        />
        {/* Icône de recherche */}
        <svg
          className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-secondary/50"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        {/* Indicateur de chargement */}
        {loading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-accent-primary/30 border-t-accent-primary rounded-full animate-spin"></div>
          </div>
        )}
      </div>
      
      {/* Résultats de recherche */}
      {showResults && results.length > 0 && (
        <div
          ref={resultsRef}
          className="absolute top-full left-0 right-0 mt-2 bg-bg-secondary/95 backdrop-blur-md border border-border-secondary/50 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto"
        >
          <div className="p-2 space-y-1">
            {results.map((user) => {
              const rankInfo = getRankFromMMR(
                Math.max(...Object.values(user.mmr || {}).map(m => parseInt(m) || 1000), 1000)
              );
              
              return (
                <button
                  key={user.id}
                  onClick={() => handleSelectUser(user)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-bg-primary/50 transition-colors text-left"
                >
                  {/* Avatar */}
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.username}
                      className="w-10 h-10 rounded-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-accent-primary/20 flex items-center justify-center text-accent-primary font-bold">
                      {user.username[0].toUpperCase()}
                    </div>
                  )}
                  
                  {/* Infos utilisateur */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-text-primary font-semibold truncate">{user.username}</span>
                      <span
                        className="text-xs font-bold px-2 py-0.5 rounded"
                        style={{ 
                          backgroundColor: getRankColor(rankInfo) + '20',
                          color: getRankColor(rankInfo)
                        }}
                      >
                        {rankInfo.tier}
                      </span>
                    </div>
                    <div className="text-text-secondary text-xs">
                      {user.stats?.totalMatches || 0} matches • {Math.max(...Object.values(user.mmr || {}).map(m => parseInt(m) || 1000), 1000)} ELO
                    </div>
                  </div>
                  
                  {/* Badge ami si déjà ami */}
                  {user.isFriend && (
                    <span className="text-xs text-accent-primary">Friend</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Message si aucun résultat */}
      {showResults && !loading && query.length >= 2 && results.length === 0 && (
        <div
          ref={resultsRef}
          className="absolute top-full left-0 right-0 mt-2 bg-bg-secondary/95 backdrop-blur-md border border-border-secondary/50 rounded-lg shadow-xl z-50 p-4 text-center text-text-secondary text-sm"
        >
          No users found
        </div>
      )}
    </div>
  );
}

