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
  players, 
  results, 
  eloChanges, 
  playerName, 
  userId, 
  currentUser,
  onPlayAgain,
  onBackToLobby,
  rematchReady = false,
  opponentRematchReady = false
}) {
  const navigate = useNavigate();
  const [showResults, setShowResults] = useState(false);
  const [winner, setWinner] = useState(null);
  
  // Animation d'entrée
  useEffect(() => {
    const timer = setTimeout(() => setShowResults(true), 300);
    return () => clearTimeout(timer);
  }, []);
  
  // Déterminer le gagnant
  useEffect(() => {
    if (!results || !players || players.length < 2) return;
    
    const player1 = players[0];
    const player2 = players[1];
    const result1 = results[player1.id];
    const result2 = results[player2.id];
    
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
  }, [results, players]);
  
  if (!results || !players) return null;
  
  const myPlayer = players.find(p => 
    p.name === playerName || (p.userId && p.userId === (userId || currentUser?.id))
  );
  const myResult = myPlayer ? results[myPlayer.id] : null;
  const myIsWinner = winner && myPlayer && winner.id === myPlayer.id;
  const opponent = players.find(p => p.id !== myPlayer?.id);
  const opponentResult = opponent ? results[opponent.id] : null;
  
  return (
    <div className={`min-h-screen flex items-center justify-center py-4 sm:py-6 md:py-8 lg:py-12 transition-all duration-700 ${showResults ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
      <div className="w-full max-w-6xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
      {/* En-tête avec animation améliorée */}
      <div className="text-center mb-6 sm:mb-8 md:mb-10 relative">
        {/* Effet de particules pour la victoire */}
        {myIsWinner && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="absolute w-32 h-32 bg-accent-primary/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute w-24 h-24 bg-accent-secondary/20 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '0.5s' }}></div>
          </div>
        )}
        
        <div className="mb-4 sm:mb-6 relative z-10">
          {myIsWinner ? (
            <div className="text-5xl sm:text-6xl md:text-7xl mb-2 sm:mb-3 animate-bounce drop-shadow-2xl filter" style={{ filter: 'drop-shadow(0 0 20px rgba(251, 191, 36, 0.6))' }}>
              🏆
            </div>
          ) : winner ? (
            <div className="text-5xl sm:text-6xl md:text-7xl mb-2 sm:mb-3 animate-pulse opacity-75">😔</div>
          ) : (
            <div className="text-5xl sm:text-6xl md:text-7xl mb-2 sm:mb-3">🎯</div>
          )}
        </div>
        
        <h2 className={`text-3xl sm:text-4xl md:text-5xl font-bold mb-2 sm:mb-3 relative z-10 ${
          myIsWinner 
            ? 'text-accent-primary drop-shadow-lg' 
            : winner 
              ? 'text-red-400' 
              : 'text-text-primary'
        }`} style={{ 
          fontFamily: 'Inter',
          textShadow: myIsWinner ? '0 0 20px rgba(251, 191, 36, 0.5)' : 'none'
        }}>
          {myIsWinner ? 'Victory!' : winner ? 'Defeat' : 'Match Finished!'}
        </h2>
        
        <p className="text-text-secondary text-sm sm:text-base relative z-10 px-2">
          {myIsWinner 
            ? '🎉 Congratulations! You won this match! 🎉' 
            : winner 
              ? `${winner.name} won this match` 
              : 'Both players completed the match'}
        </p>
        
        {/* Barre de séparation décorative */}
        <div className={`mt-4 sm:mt-6 mx-auto h-0.5 sm:h-1 rounded-full ${
          myIsWinner 
            ? 'bg-gradient-to-r from-transparent via-accent-primary to-transparent w-24 sm:w-32' 
            : 'bg-border-secondary/30 w-16 sm:w-24'
        }`}></div>
      </div>
      
      {/* Comparaison des résultats côte à côte - Design amélioré */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8 md:mb-10">
        {/* Mon résultat */}
        {myPlayer && myResult && (
          <div
            className={`relative backdrop-blur-xl rounded-3xl p-6 sm:p-8 border-2 transition-all duration-500 transform ${
              myIsWinner
                ? 'bg-gradient-to-br from-accent-primary/30 via-accent-primary/15 to-accent-primary/5 border-accent-primary/60 shadow-2xl shadow-accent-primary/40 scale-[1.02]'
                : 'bg-gradient-to-br from-bg-secondary/60 via-bg-secondary/40 to-bg-secondary/60 border-border-secondary/40 hover:border-border-secondary/60'
            }`}
          >
            {/* Effet de glow pour le gagnant */}
            {myIsWinner && (
              <div className="absolute inset-0 rounded-3xl bg-accent-primary/10 blur-2xl"></div>
            )}
            <div className="relative">
            <div className="flex items-center justify-between mb-4 sm:mb-6 flex-wrap gap-2">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className={`text-xl sm:text-2xl font-bold ${
                  myIsWinner ? 'text-accent-primary' : 'text-text-primary'
                }`}>You</div>
                {myIsWinner && (
                  <div className="relative">
                    <span className="text-2xl sm:text-3xl animate-bounce">👑</span>
                    <div className="absolute inset-0 text-2xl sm:text-3xl animate-ping opacity-20">👑</div>
                  </div>
                )}
              </div>
              {eloChanges && eloChanges[myPlayer.id] !== undefined && (
                <div className={`text-xs sm:text-sm font-bold px-3 py-1.5 sm:px-4 sm:py-2 rounded-full border-2 ${
                  eloChanges[myPlayer.id] >= 0 
                    ? 'bg-green-500/20 text-green-400 border-green-500/40 shadow-lg shadow-green-500/20' 
                    : 'bg-red-500/20 text-red-400 border-red-500/40 shadow-lg shadow-red-500/20'
                }`}>
                  {eloChanges[myPlayer.id] >= 0 ? '+' : ''}{eloChanges[myPlayer.id]} ELO
                </div>
              )}
            </div>
            
            {/* Stats principales - Design amélioré, responsive */}
            <div className="space-y-4 sm:space-y-6">
              <div className="flex items-baseline gap-3 sm:gap-4">
                <span className={`text-4xl sm:text-5xl md:text-6xl font-bold ${
                  myIsWinner ? 'text-accent-primary' : 'text-text-primary'
                }`} style={{ fontFamily: 'JetBrains Mono', textShadow: myIsWinner ? '0 0 20px rgba(251, 191, 36, 0.4)' : 'none' }}>
                  {myResult.wpm}
                </span>
                <span className="text-text-secondary text-base sm:text-lg font-medium">WPM</span>
              </div>
              
              {/* Stats détaillées - Design amélioré avec icônes */}
              <div className="grid grid-cols-2 gap-4 pt-6 border-t border-border-secondary/30">
                <div className="bg-bg-secondary/30 rounded-lg p-3">
                  <div className="text-text-secondary text-xs mb-2 font-medium flex items-center gap-1">
                    <span>🎯</span>
                    <span>Accuracy</span>
                  </div>
                  <div className={`text-2xl font-bold ${
                    myResult.accuracy >= 95 ? 'text-green-400' : myResult.accuracy >= 85 ? 'text-yellow-400' : 'text-red-400'
                  }`} style={{ fontFamily: 'JetBrains Mono' }}>
                    {formatAccuracy(myResult.accuracy)}%
                  </div>
                </div>
                <div className="bg-bg-secondary/30 rounded-lg p-3">
                  <div className="text-text-secondary text-xs mb-2 font-medium flex items-center gap-1">
                    <span>⏱️</span>
                    <span>Time</span>
                  </div>
                  <div className="text-2xl font-bold text-text-primary" style={{ fontFamily: 'JetBrains Mono' }}>
                    {Math.round(myResult.time / 1000)}s
                  </div>
                </div>
                {myResult.errors !== undefined && (
                  <>
                    <div className="bg-bg-secondary/30 rounded-lg p-3">
                      <div className="text-text-secondary text-xs mb-2 font-medium flex items-center gap-1">
                        <span>❌</span>
                        <span>Errors</span>
                      </div>
                      <div className="text-2xl font-bold text-red-400" style={{ fontFamily: 'JetBrains Mono' }}>
                        {myResult.errors}
                      </div>
                    </div>
                    <div className="bg-bg-secondary/30 rounded-lg p-3">
                      <div className="text-text-secondary text-xs mb-2 font-medium flex items-center gap-1">
                        <span>⌨️</span>
                        <span>Characters</span>
                      </div>
                      <div className="text-2xl font-bold text-text-primary" style={{ fontFamily: 'JetBrains Mono' }}>
                        {myResult.characters || 0}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
            </div>
          </div>
        )}
        
        {/* Résultat de l'adversaire - Design compétitif moderne */}
        {opponent && opponentResult && (
          <div
            className={`relative backdrop-blur-xl rounded-3xl p-6 sm:p-8 border-2 transition-all duration-500 transform ${
              !myIsWinner && winner && winner.id === opponent.id
                ? 'bg-gradient-to-br from-accent-primary/30 via-accent-primary/15 to-accent-primary/5 border-accent-primary/60 shadow-2xl shadow-accent-primary/40 scale-[1.02]'
                : 'bg-gradient-to-br from-bg-secondary/60 via-bg-secondary/40 to-bg-secondary/60 border-border-secondary/40 hover:border-border-secondary/60'
            }`}
          >
            {/* Effet de glow pour le gagnant */}
            {!myIsWinner && winner && winner.id === opponent.id && (
              <div className="absolute inset-0 rounded-3xl bg-accent-primary/10 blur-2xl"></div>
            )}
            <div className="relative">
              <div className="flex items-center justify-between mb-4 sm:mb-6 flex-wrap gap-2">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className={`text-xl sm:text-2xl font-bold ${
                    !myIsWinner && winner && winner.id === opponent.id ? 'text-accent-primary' : 'text-text-primary'
                  }`}>{opponent.name}</div>
                  {!myIsWinner && winner && winner.id === opponent.id && (
                    <div className="relative">
                      <span className="text-2xl sm:text-3xl animate-bounce">👑</span>
                      <div className="absolute inset-0 text-2xl sm:text-3xl animate-ping opacity-20">👑</div>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                {isValidUserId(opponent.userId) && (
                  <button
                    onClick={() => navigateToProfile(navigate, opponent.userId, opponent.name)}
                    className="text-accent-primary hover:text-accent-hover text-sm font-medium transition-all hover:scale-110 flex items-center gap-1 px-3 py-1 rounded-lg hover:bg-accent-primary/10"
                    title="View profile"
                  >
                    <span>👤</span>
                    <span>Profile</span>
                  </button>
                )}
                {eloChanges && eloChanges[opponent.id] !== undefined && (
                  <div className={`text-sm font-bold px-4 py-2 rounded-full border-2 ${
                    eloChanges[opponent.id] >= 0 
                      ? 'bg-green-500/20 text-green-400 border-green-500/40 shadow-lg shadow-green-500/20' 
                      : 'bg-red-500/20 text-red-400 border-red-500/40 shadow-lg shadow-red-500/20'
                  }`}>
                    {eloChanges[opponent.id] >= 0 ? '+' : ''}{eloChanges[opponent.id]} ELO
                  </div>
                )}
              </div>
              </div>
            
            {/* Stats principales - Design amélioré */}
            <div className="space-y-4 sm:space-y-6">
              <div className="flex items-baseline gap-3 sm:gap-4">
                <span className={`text-4xl sm:text-5xl md:text-6xl font-bold ${
                  !myIsWinner && winner && winner.id === opponent.id ? 'text-accent-primary' : 'text-text-primary'
                }`} style={{ 
                  fontFamily: 'JetBrains Mono',
                  textShadow: !myIsWinner && winner && winner.id === opponent.id ? '0 0 20px rgba(251, 191, 36, 0.4)' : 'none'
                }}>
                  {opponentResult.wpm}
                </span>
                <span className="text-text-secondary text-base sm:text-lg font-medium">WPM</span>
              </div>
              
              {/* Stats détaillées - Design amélioré avec icônes */}
              <div className="grid grid-cols-2 gap-4 pt-6 border-t border-border-secondary/30">
                <div className="bg-bg-secondary/30 rounded-lg p-3">
                  <div className="text-text-secondary text-xs mb-2 font-medium flex items-center gap-1">
                    <span>🎯</span>
                    <span>Accuracy</span>
                  </div>
                  <div className={`text-2xl font-bold ${
                    opponentResult.accuracy >= 95 ? 'text-green-400' : opponentResult.accuracy >= 85 ? 'text-yellow-400' : 'text-red-400'
                  }`} style={{ fontFamily: 'JetBrains Mono' }}>
                    {formatAccuracy(opponentResult.accuracy)}%
                  </div>
                </div>
                <div className="bg-bg-secondary/30 rounded-lg p-3">
                  <div className="text-text-secondary text-xs mb-2 font-medium flex items-center gap-1">
                    <span>⏱️</span>
                    <span>Time</span>
                  </div>
                  <div className="text-2xl font-bold text-text-primary" style={{ fontFamily: 'JetBrains Mono' }}>
                    {Math.round(opponentResult.time / 1000)}s
                  </div>
                </div>
                {opponentResult.errors !== undefined && (
                  <>
                    <div className="bg-bg-secondary/30 rounded-lg p-3">
                      <div className="text-text-secondary text-xs mb-2 font-medium flex items-center gap-1">
                        <span>❌</span>
                        <span>Errors</span>
                      </div>
                      <div className="text-2xl font-bold text-red-400" style={{ fontFamily: 'JetBrains Mono' }}>
                        {opponentResult.errors}
                      </div>
                    </div>
                    <div className="bg-bg-secondary/30 rounded-lg p-3">
                      <div className="text-text-secondary text-xs mb-2 font-medium flex items-center gap-1">
                        <span>⌨️</span>
                        <span>Characters</span>
                      </div>
                      <div className="text-2xl font-bold text-text-primary" style={{ fontFamily: 'JetBrains Mono' }}>
                        {opponentResult.characters || 0}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Comparaison visuelle améliorée - Design moderne */}
      {myResult && opponentResult && (
        <div className="bg-gradient-to-br from-bg-secondary/60 via-bg-secondary/40 to-bg-secondary/60 backdrop-blur-sm rounded-2xl p-8 mb-10 border border-border-secondary/30 shadow-xl">
          <h3 className="text-2xl font-bold text-text-primary mb-6 text-center flex items-center justify-center gap-2">
            <span>⚔️</span>
            <span>Match Comparison</span>
            <span>⚔️</span>
          </h3>
          <div className="space-y-4">
            {/* WPM Comparison avec barres proportionnelles */}
            <div>
              <div className="flex justify-between text-sm text-text-secondary mb-2">
                <span>Words Per Minute</span>
                <span className="font-semibold">{Math.abs(myResult.wpm - opponentResult.wpm)} WPM difference</span>
              </div>
              <div className="relative h-12 bg-bg-primary/30 rounded-lg overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-xs font-bold text-text-secondary">vs</div>
                </div>
                <div className="absolute left-0 top-0 bottom-0 flex items-center justify-center px-2"
                     style={{ 
                       width: `${(myResult.wpm / Math.max(myResult.wpm, opponentResult.wpm, 1)) * 100}%`,
                       backgroundColor: myResult.wpm >= opponentResult.wpm ? 'rgba(33, 136, 255, 0.3)' : 'rgba(100, 100, 100, 0.3)'
                     }}>
                  <span className="text-sm font-bold text-text-primary">{myResult.wpm}</span>
                </div>
                <div className="absolute right-0 top-0 bottom-0 flex items-center justify-end px-2"
                     style={{ 
                       width: `${(opponentResult.wpm / Math.max(myResult.wpm, opponentResult.wpm, 1)) * 100}%`,
                       backgroundColor: opponentResult.wpm >= myResult.wpm ? 'rgba(33, 136, 255, 0.3)' : 'rgba(100, 100, 100, 0.3)'
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
              <div className="relative h-12 bg-bg-primary/30 rounded-lg overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-xs font-bold text-text-secondary">vs</div>
                </div>
                <div className="absolute left-0 top-0 bottom-0 flex items-center justify-center px-2"
                     style={{ 
                       width: `${Math.min(100, Math.max(0, myResult.accuracy || 0))}%`,
                       backgroundColor: myResult.accuracy >= opponentResult.accuracy ? 'rgba(34, 197, 94, 0.3)' : 'rgba(100, 100, 100, 0.3)'
                     }}>
                  <span className="text-sm font-bold text-green-400">{formatAccuracy(myResult.accuracy)}%</span>
                </div>
                <div className="absolute right-0 top-0 bottom-0 flex items-center justify-end px-2"
                     style={{ 
                       width: `${Math.min(100, Math.max(0, opponentResult.accuracy || 0))}%`,
                       backgroundColor: opponentResult.accuracy >= myResult.accuracy ? 'rgba(34, 197, 94, 0.3)' : 'rgba(100, 100, 100, 0.3)'
                     }}>
                  <span className="text-sm font-bold text-green-400">{formatAccuracy(opponentResult.accuracy)}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Actions */}
      <div className="text-center space-y-4">
        {/* Partage pour le gagnant */}
        {myIsWinner && myResult && (
          <div className="flex justify-center mb-4">
            <ShareButtons
              result={{
                wpm: myResult.wpm,
                accuracy: myResult.accuracy,
                isWinner: true,
                eloChange: eloChanges?.[myPlayer.id]
              }}
              type="battle"
            />
          </div>
        )}
        
        {/* Boutons d'action - Design amélioré, optimisé mobile */}
        <div className="flex flex-col items-center gap-4 sm:gap-6">
          {onPlayAgain && (
            <div className="flex flex-col items-center gap-3 w-full max-w-md px-2 sm:px-0">
              <button
                onClick={onPlayAgain}
                disabled={rematchReady}
                className={`font-bold py-3.5 sm:py-4 px-6 sm:px-10 rounded-xl sm:rounded-2xl transition-all duration-300 text-base sm:text-lg shadow-2xl transform hover:scale-105 active:scale-95 border-2 w-full relative overflow-hidden group min-h-[48px] sm:min-h-[56px] ${
                  rematchReady
                    ? 'bg-gradient-to-r from-yellow-500/60 to-yellow-400/60 text-yellow-100 border-yellow-500/50 cursor-wait'
                    : 'bg-gradient-to-r from-accent-primary via-accent-primary to-accent-secondary hover:from-accent-hover hover:via-accent-hover hover:to-accent-hover text-accent-text border-accent-primary/50'
                }`}
              >
                {/* Effet de brillance au survol */}
                {!rematchReady && (
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></span>
                )}
                <span className="relative z-10 flex items-center justify-center gap-2">
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
                <div className="flex items-center gap-2 text-green-400 text-sm font-medium animate-pulse">
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
          
          <div className="flex items-center justify-center gap-4 flex-wrap">
            {onBackToLobby && (
              <button
                onClick={onBackToLobby}
                className="bg-bg-primary/60 hover:bg-bg-primary/80 border-2 border-border-secondary/40 text-text-primary font-semibold py-3 px-5 sm:px-6 rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg min-h-[48px] sm:min-h-[52px] w-full sm:w-auto"
              >
                <span className="flex items-center justify-center gap-2 text-sm sm:text-base">
                  <span>←</span>
                  <span>Back to Lobby</span>
                </span>
              </button>
            )}
            
            <button
              onClick={() => navigate('/')}
              className="bg-bg-primary/60 hover:bg-bg-primary/80 border-2 border-border-secondary/40 text-text-primary font-semibold py-3 px-6 rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg"
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

