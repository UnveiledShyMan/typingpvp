/**
 * Composant de résultats de match amélioré
 * Affiche les résultats avec animations, statistiques détaillées et actions
 */

import { useState, useEffect, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import ShareButtons from './ShareButtons';
import { navigateToProfile, isValidUserId } from '../utils/profileNavigation';

// Formate l'accuracy en pourcentage avec une décimale et gère les valeurs manquantes
const formatAccuracy = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return '0.0';
  const fixed = num.toFixed(1);
  // Supprimer le .0 pour rester compact (ex: 98.0 -> 98)
  return fixed.endsWith('.0') ? fixed.slice(0, -2) : fixed;
};

function MatchResults({ 
  players = [], 
  results = {}, 
  eloChanges = {}, 
  playerName = '', 
  userId = null, 
  currentUser = null,
  onPlayAgain,
  onBackToLobby,
  rematchReady = false,
  opponentRematchReady = false
}) {
  const navigate = useNavigate();
  const [showResults, setShowResults] = useState(false);
  const [winner, setWinner] = useState(null);
  
  // Validation des props critiques
  if (!Array.isArray(players)) {
    console.error('❌ MatchResults: players must be an array, received:', typeof players);
    players = [];
  }
  
  if (typeof results !== 'object' || results === null) {
    console.error('❌ MatchResults: results must be an object, received:', typeof results);
    results = {};
  }
  
  // Animation d'entrée
  useEffect(() => {
    const timer = setTimeout(() => setShowResults(true), 300);
    return () => clearTimeout(timer);
  }, []);
  
  // Déterminer le gagnant
  useEffect(() => {
    if (!results || !players || players.length < 2) return;
    
    try {
      const player1 = players[0];
      const player2 = players[1];
      
      // Protection : vérifier que les joueurs ont un id valide
      if (!player1 || !player2) {
        console.warn('⚠️ MatchResults: Invalid players data');
        return;
      }
      
      const player1Id = player1.id || player1.name || 'player1';
      const player2Id = player2.id || player2.name || 'player2';
      
      const result1 = results[player1Id];
      const result2 = results[player2Id];
      
      if (!result1 || !result2) {
        setWinner(null);
        return;
      }
      
      // Gagnant = meilleur WPM, en cas d'égalité meilleure accuracy
      if (result1.wpm > result2.wpm || 
          (result1.wpm === result2.wpm && result1.accuracy > result2.accuracy)) {
        setWinner(player1);
      } else {
        setWinner(player2);
      }
    } catch (error) {
      console.error('❌ Error determining winner in MatchResults:', error);
      setWinner(null);
    }
  }, [results, players]);
  
  if (!results || !players || players.length === 0) return null;
  
  // Protection : s'assurer que players est un tableau valide
  const safePlayers = Array.isArray(players) ? players.filter(p => p && (p.name || p.id)) : [];
  if (safePlayers.length === 0) return null;
  
  const myPlayer = safePlayers.find(p => 
    (p.name && p.name === playerName) || (p.userId && p.userId === (userId || currentUser?.id))
  );
  
  // Protection : utiliser player.id ou player.name comme clé pour results
  const myPlayerKey = myPlayer ? (myPlayer.id || myPlayer.name) : null;
  const myResult = myPlayerKey ? results[myPlayerKey] : null;
  const myIsWinner = winner && myPlayer && (winner.id === myPlayer.id || winner.name === myPlayer.name);
  const opponent = safePlayers.find(p => {
    const pKey = p.id || p.name;
    const myKey = myPlayer?.id || myPlayer?.name;
    return pKey && myKey && pKey !== myKey;
  });
  const opponentKey = opponent ? (opponent.id || opponent.name) : null;
  const opponentResult = opponentKey ? results[opponentKey] : null;
  
  return (
    <div className={`h-full flex items-center justify-center py-2 transition-all duration-700 ${showResults ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
      <div className="w-full max-w-6xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
      {/* En-tête de résultats - encore plus compact pour mobile */}
      <div className="text-center mb-2 sm:mb-4">
        {/* Badge de statut pour garder une lecture rapide */}
        <div className="flex justify-center mb-3">
          <div className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border ${
            myIsWinner
              ? 'bg-accent-primary/15 text-accent-primary border-accent-primary/30'
              : winner
                ? 'bg-text-error/10 text-text-error border-text-error/30'
                : 'bg-bg-secondary/40 text-text-secondary border-border-secondary/40'
          }`}>
            {myIsWinner ? 'Victory' : winner ? 'Defeat' : 'Match Finished'}
          </div>
        </div>
        
        <h2
          className={`text-xl sm:text-3xl font-bold mb-2 ${
            myIsWinner ? 'text-accent-primary' : winner ? 'text-text-error' : 'text-text-primary'
          }`}
          style={{ fontFamily: 'Inter' }}
        >
          {myIsWinner ? 'Victory' : winner ? 'Defeat' : 'Match Finished'}
        </h2>
        
        <p className="text-text-secondary text-xs sm:text-sm px-2">
          {myIsWinner
            ? 'Great job. You won this match.'
            : winner
              ? `${winner.name} won this match.`
              : 'Both players completed the match.'}
        </p>
        
        {/* Barre de séparation simple pour structurer la page */}
        <div className="mt-2 mx-auto h-px w-14 bg-border-secondary/40"></div>
      </div>
      
      {/* Résultats côte à côte - layout simple et lisible */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mb-2 sm:mb-4">
        {/* Résultat du joueur */}
        {myPlayer && myResult && (
          <div
            className={`rounded-lg p-4 sm:p-6 border transition-colors ui-card ui-fade-up ${
              myIsWinner
                ? 'bg-bg-secondary/40 border-accent-primary/40'
                : 'bg-bg-secondary/40 border-border-secondary/40'
            }`}
          >
            <div className="flex items-center justify-between mb-2 sm:mb-4 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className={`text-lg sm:text-xl font-bold ${myIsWinner ? 'text-accent-primary' : 'text-text-primary'}`}>You</div>
              </div>
              {myPlayerKey && eloChanges && eloChanges[myPlayerKey] !== undefined && (
                <div className={`text-xs font-semibold px-2 py-1 rounded-full border ${
                  eloChanges[myPlayerKey] >= 0
                    ? 'bg-green-500/10 text-green-400 border-green-500/30'
                    : 'bg-red-500/10 text-red-400 border-red-500/30'
                }`}>
                  {eloChanges[myPlayerKey] >= 0 ? '+' : ''}{eloChanges[myPlayerKey]} ELO
                </div>
              )}
            </div>
            
            {/* Stats principales - compactes et lisibles */}
            <div className="space-y-2 sm:space-y-3">
              <div className="flex items-baseline gap-2 sm:gap-3">
                <span className={`text-2xl sm:text-4xl md:text-5xl font-bold ${
                  myIsWinner ? 'text-accent-primary' : 'text-text-primary'
                }`} style={{ fontFamily: 'JetBrains Mono' }}>
                  {myResult.wpm}
                </span>
                <span className="text-text-secondary text-sm sm:text-base font-medium">WPM</span>
              </div>
              
            {/* Stats détaillées - compactes (mobile réduit) */}
              <div className="grid grid-cols-2 gap-2 sm:gap-3 pt-2 sm:pt-3 border-t border-border-secondary/30">
                <div className="bg-bg-primary/30 rounded-lg p-2 sm:p-3">
                  <div className="text-text-secondary text-xs mb-1 sm:mb-2 font-medium">Accuracy</div>
                  <div className={`text-lg sm:text-2xl font-bold ${
                    myResult.accuracy >= 95 ? 'text-green-400' : myResult.accuracy >= 85 ? 'text-yellow-400' : 'text-red-400'
                  }`} style={{ fontFamily: 'JetBrains Mono' }}>
                    {formatAccuracy(myResult.accuracy)}%
                  </div>
                </div>
                <div className="bg-bg-primary/30 rounded-lg p-2 sm:p-3">
                  <div className="text-text-secondary text-xs mb-1 sm:mb-2 font-medium">Time</div>
                  <div className="text-lg sm:text-2xl font-bold text-text-primary" style={{ fontFamily: 'JetBrains Mono' }}>
                    {Math.round(myResult.time / 1000)}s
                  </div>
                </div>
                {myResult.errors !== undefined && (
                  <>
                    <div className="bg-bg-primary/30 rounded-lg p-2 sm:p-3 hidden sm:block">
                      <div className="text-text-secondary text-xs mb-1 sm:mb-2 font-medium">Errors</div>
                      <div className="text-lg sm:text-2xl font-bold text-red-400" style={{ fontFamily: 'JetBrains Mono' }}>
                        {myResult.errors}
                      </div>
                    </div>
                    <div className="bg-bg-primary/30 rounded-lg p-2 sm:p-3 hidden sm:block">
                      <div className="text-text-secondary text-xs mb-1 sm:mb-2 font-medium">Characters</div>
                      <div className="text-lg sm:text-2xl font-bold text-text-primary" style={{ fontFamily: 'JetBrains Mono' }}>
                        {myResult.characters || 0}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Résultat de l'adversaire */}
        {opponent && opponentResult && (
          <div
            className={`rounded-lg p-4 sm:p-6 border transition-colors ui-card ui-fade-up ${
              !myIsWinner && winner && opponent && ((winner.id && opponent.id && winner.id === opponent.id) || (winner.name && opponent.name && winner.name === opponent.name))
                ? 'bg-bg-secondary/40 border-accent-primary/40'
                : 'bg-bg-secondary/40 border-border-secondary/40'
            }`}
          >
            <div className="flex items-center justify-between mb-2 sm:mb-4 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div className={`text-lg sm:text-xl font-bold ${
                  !myIsWinner && winner && opponent && ((winner.id && opponent.id && winner.id === opponent.id) || (winner.name && opponent.name && winner.name === opponent.name))
                    ? 'text-accent-primary'
                    : 'text-text-primary'
                  }`}>{opponent.name || 'Opponent'}</div>
                </div>
                <div className="flex items-center gap-2">
                {isValidUserId(opponent.userId) && (
                  <button
                    onClick={() => navigateToProfile(navigate, opponent.userId, opponent.name)}
                    className="text-accent-primary hover:text-accent-hover text-xs sm:text-sm font-medium transition-colors flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-accent-primary/10 ui-press"
                    title="View profile"
                  >
                    <span>👤</span>
                    <span className="hidden sm:inline">Profile</span>
                  </button>
                )}
                {opponentKey && eloChanges && eloChanges[opponentKey] !== undefined && (
                  <div className={`text-xs font-semibold px-2 py-1 rounded-full border ${
                    eloChanges[opponentKey] >= 0
                      ? 'bg-green-500/10 text-green-400 border-green-500/30'
                      : 'bg-red-500/10 text-red-400 border-red-500/30'
                  }`}>
                    {eloChanges[opponentKey] >= 0 ? '+' : ''}{eloChanges[opponentKey]} ELO
                  </div>
                )}
              </div>
              </div>
            {/* Stats principales - compactes */}
            <div className="space-y-2 sm:space-y-3">
              <div className="flex items-baseline gap-2 sm:gap-3">
                <span className={`text-2xl sm:text-4xl md:text-5xl font-bold ${
                  !myIsWinner && winner && winner.id === opponent.id ? 'text-accent-primary' : 'text-text-primary'
                }`} style={{ 
                  fontFamily: 'JetBrains Mono'
                }}>
                  {opponentResult.wpm}
                </span>
                <span className="text-text-secondary text-sm sm:text-base font-medium">WPM</span>
              </div>
              
              {/* Stats détaillées - compactes (mobile réduit) */}
              <div className="grid grid-cols-2 gap-2 sm:gap-3 pt-2 sm:pt-3 border-t border-border-secondary/30">
                <div className="bg-bg-primary/30 rounded-lg p-2 sm:p-3">
                  <div className="text-text-secondary text-xs mb-1 sm:mb-2 font-medium">Accuracy</div>
                  <div className={`text-lg sm:text-2xl font-bold ${
                    opponentResult.accuracy >= 95 ? 'text-green-400' : opponentResult.accuracy >= 85 ? 'text-yellow-400' : 'text-red-400'
                  }`} style={{ fontFamily: 'JetBrains Mono' }}>
                    {formatAccuracy(opponentResult.accuracy)}%
                  </div>
                </div>
                <div className="bg-bg-primary/30 rounded-lg p-2 sm:p-3">
                  <div className="text-text-secondary text-xs mb-1 sm:mb-2 font-medium">Time</div>
                  <div className="text-lg sm:text-2xl font-bold text-text-primary" style={{ fontFamily: 'JetBrains Mono' }}>
                    {Math.round(opponentResult.time / 1000)}s
                  </div>
                </div>
                {opponentResult.errors !== undefined && (
                  <>
                    <div className="bg-bg-primary/30 rounded-lg p-2 sm:p-3 hidden sm:block">
                      <div className="text-text-secondary text-xs mb-1 sm:mb-2 font-medium">Errors</div>
                      <div className="text-lg sm:text-2xl font-bold text-red-400" style={{ fontFamily: 'JetBrains Mono' }}>
                        {opponentResult.errors}
                      </div>
                    </div>
                    <div className="bg-bg-primary/30 rounded-lg p-2 sm:p-3 hidden sm:block">
                      <div className="text-text-secondary text-xs mb-1 sm:mb-2 font-medium">Characters</div>
                      <div className="text-lg sm:text-2xl font-bold text-text-primary" style={{ fontFamily: 'JetBrains Mono' }}>
                        {opponentResult.characters || 0}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Comparaison rapide - masquée sur mobile pour éviter le scroll */}
      {myResult && opponentResult && (
        <div className="hidden sm:block bg-bg-secondary/40 backdrop-blur-sm rounded-lg p-4 sm:p-5 mb-3 sm:mb-4 border border-border-secondary/40 ui-card ui-fade-up">
          <h3 className="text-base sm:text-lg font-bold text-text-primary mb-3 text-center">
            Match Comparison
          </h3>
          <div className="space-y-4">
            {/* WPM Comparison */}
            <div>
              <div className="flex justify-between text-sm text-text-secondary mb-2">
                <span>Words Per Minute</span>
                <span className="font-semibold">{Math.abs(myResult.wpm - opponentResult.wpm)} WPM difference</span>
              </div>
              <div className="relative h-9 bg-bg-primary/30 rounded-lg overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-xs font-bold text-text-secondary">vs</div>
                </div>
                <div className="absolute left-0 top-0 bottom-0 flex items-center justify-center px-2"
                     style={{ 
                       width: `${(myResult.wpm / Math.max(myResult.wpm, opponentResult.wpm, 1)) * 100}%`,
                       backgroundColor: myResult.wpm >= opponentResult.wpm ? 'rgba(33, 136, 255, 0.2)' : 'rgba(100, 100, 100, 0.2)'
                     }}>
                  <span className="text-sm font-bold text-text-primary">{myResult.wpm}</span>
                </div>
                <div className="absolute right-0 top-0 bottom-0 flex items-center justify-end px-2"
                     style={{ 
                       width: `${(opponentResult.wpm / Math.max(myResult.wpm, opponentResult.wpm, 1)) * 100}%`,
                       backgroundColor: opponentResult.wpm >= myResult.wpm ? 'rgba(33, 136, 255, 0.2)' : 'rgba(100, 100, 100, 0.2)'
                     }}>
                  <span className="text-sm font-bold text-text-primary">{opponentResult.wpm}</span>
                </div>
              </div>
            </div>
            
            {/* Accuracy Comparison */}
            <div>
              <div className="flex justify-between text-sm text-text-secondary mb-2">
                <span>Accuracy</span>
                <span className="font-semibold">{formatAccuracy(Math.abs((myResult.accuracy || 0) - (opponentResult.accuracy || 0)))}% difference</span>
              </div>
              <div className="relative h-9 bg-bg-primary/30 rounded-lg overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-xs font-bold text-text-secondary">vs</div>
                </div>
                <div className="absolute left-0 top-0 bottom-0 flex items-center justify-center px-2"
                     style={{ 
                       width: `${Math.min(100, Math.max(0, myResult.accuracy || 0))}%`,
                       backgroundColor: myResult.accuracy >= opponentResult.accuracy ? 'rgba(34, 197, 94, 0.2)' : 'rgba(100, 100, 100, 0.2)'
                     }}>
                  <span className="text-sm font-bold text-green-400">{formatAccuracy(myResult.accuracy)}%</span>
                </div>
                <div className="absolute right-0 top-0 bottom-0 flex items-center justify-end px-2"
                     style={{ 
                       width: `${Math.min(100, Math.max(0, opponentResult.accuracy || 0))}%`,
                       backgroundColor: opponentResult.accuracy >= myResult.accuracy ? 'rgba(34, 197, 94, 0.2)' : 'rgba(100, 100, 100, 0.2)'
                     }}>
                  <span className="text-sm font-bold text-green-400">{formatAccuracy(opponentResult.accuracy)}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Actions */}
      <div className="text-center space-y-2 sm:space-y-3">
        {/* Partage pour le gagnant - discret */}
        {myIsWinner && myResult && (
          <div className="flex justify-center mb-2 sm:mb-3">
            <ShareButtons
              result={{
                wpm: myResult.wpm,
                accuracy: myResult.accuracy,
                isWinner: true,
                eloChange: myPlayerKey ? eloChanges?.[myPlayerKey] : undefined
              }}
              type="battle"
            />
          </div>
        )}
        
        {/* Boutons d'action - style simple et direct */}
          <div className="flex flex-col items-center gap-2 sm:gap-3">
          {onPlayAgain && (
            <div className="flex flex-col items-center gap-3 w-full max-w-md px-2 sm:px-0">
              <button
                onClick={onPlayAgain}
                disabled={rematchReady}
                  className={`font-semibold py-3 px-6 rounded-lg transition-all text-base border w-full min-h-[46px] ui-press ${
                  rematchReady
                    ? 'bg-yellow-500/10 text-yellow-200 border-yellow-500/40 cursor-wait'
                    : 'bg-accent-primary hover:bg-accent-hover text-accent-text border-accent-primary/50'
                }`}
              >
                <span className="flex items-center justify-center gap-2">
                  {rematchReady ? (
                    <>
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Waiting for opponent...</span>
                    </>
                  ) : (
                    <>
                      <span>🎮</span>
                      <span>Play Again</span>
                    </>
                  )}
                </span>
              </button>
              {rematchReady && opponentRematchReady && (
                <div className="flex items-center gap-2 text-green-400 text-sm font-medium">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Both players ready! Starting rematch...</span>
                </div>
              )}
              {rematchReady && !opponentRematchReady && (
                <p className="text-text-secondary text-sm font-medium flex items-center gap-2">
                  <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>
                  <span>Waiting for opponent to accept rematch...</span>
                </p>
              )}
              {!rematchReady && (
                <p className="text-text-secondary text-sm font-medium">Press ENTER to play again</p>
              )}
            </div>
          )}
          
              <div className="flex items-center justify-center gap-3 flex-wrap">
            {onBackToLobby && (
              <button
                onClick={onBackToLobby}
                    className="bg-bg-primary/60 hover:bg-bg-primary/80 border border-border-secondary/40 text-text-primary font-semibold py-2.5 px-5 rounded-lg transition-all ui-press min-h-[46px] w-full sm:w-auto"
              >
                <span className="flex items-center justify-center gap-2 text-sm sm:text-base">
                  <span>←</span>
                  <span>Back to Lobby</span>
                </span>
              </button>
            )}
            
            <button
              onClick={() => navigate('/')}
                  className="bg-bg-primary/60 hover:bg-bg-primary/80 border border-border-secondary/40 text-text-primary font-semibold py-2.5 px-6 rounded-lg transition-all ui-press"
            >
              <span className="flex items-center gap-2">
                <span>🏠</span>
                <span>Home</span>
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}

// Mémoriser le composant pour éviter les re-renders inutiles
export default memo(MatchResults);

