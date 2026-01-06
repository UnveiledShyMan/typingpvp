/**
 * Composant de résultats de match amélioré
 * Affiche les résultats avec animations, statistiques détaillées et actions
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ShareButtons from './ShareButtons';
import { navigateToProfile, isValidUserId } from '../utils/profileNavigation';

export default function MatchResults({ 
  players, 
  results, 
  eloChanges, 
  playerName, 
  userId, 
  currentUser,
  onPlayAgain,
  onBackToLobby 
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
    <div className={`py-8 transition-all duration-500 ${showResults ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      {/* En-tête avec animation */}
      <div className="text-center mb-8">
        <div className="mb-4">
          {myIsWinner ? (
            <div className="text-6xl mb-2 animate-bounce">🏆</div>
          ) : winner ? (
            <div className="text-6xl mb-2">😔</div>
          ) : (
            <div className="text-6xl mb-2">🎯</div>
          )}
        </div>
        <h2 className="text-4xl font-bold text-text-primary mb-2">
          {myIsWinner ? 'Victory!' : winner ? 'Defeat' : 'Match Finished!'}
        </h2>
        <p className="text-text-secondary text-sm">
          {myIsWinner 
            ? 'Congratulations! You won this match!' 
            : winner 
              ? `${winner.name} won this match` 
              : 'Both players completed the match'}
        </p>
      </div>
      
      {/* Comparaison des résultats côte à côte */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Mon résultat */}
        {myPlayer && myResult && (
          <div
            className={`bg-bg-primary/30 backdrop-blur-sm rounded-xl p-6 border-2 transition-all ${
              myIsWinner
                ? 'border-accent-primary/50 shadow-lg shadow-accent-primary/20 scale-105'
                : 'border-border-secondary/30'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="text-xl font-semibold text-text-primary">You</div>
                {myIsWinner && <span className="text-2xl">👑</span>}
              </div>
              {eloChanges && eloChanges[myPlayer.id] !== undefined && (
                <div className={`text-sm font-semibold px-3 py-1 rounded ${
                  eloChanges[myPlayer.id] >= 0 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-red-500/20 text-red-400'
                }`}>
                  {eloChanges[myPlayer.id] >= 0 ? '+' : ''}{eloChanges[myPlayer.id]} ELO
                </div>
              )}
            </div>
            
            {/* Stats principales */}
            <div className="space-y-4">
              <div className="flex items-baseline gap-3">
                <span className="text-5xl font-bold text-text-primary" style={{ fontFamily: 'JetBrains Mono' }}>
                  {myResult.wpm}
                </span>
                <span className="text-text-secondary text-sm">WPM</span>
              </div>
              
              {/* Stats détaillées */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border-secondary/30">
                <div>
                  <div className="text-text-secondary text-xs mb-1">Accuracy</div>
                  <div className="text-xl font-bold text-text-primary" style={{ fontFamily: 'JetBrains Mono' }}>
                    {myResult.accuracy}%
                  </div>
                </div>
                <div>
                  <div className="text-text-secondary text-xs mb-1">Time</div>
                  <div className="text-xl font-bold text-text-primary" style={{ fontFamily: 'JetBrains Mono' }}>
                    {Math.round(myResult.time / 1000)}s
                  </div>
                </div>
                {myResult.errors !== undefined && (
                  <>
                    <div>
                      <div className="text-text-secondary text-xs mb-1">Errors</div>
                      <div className="text-xl font-bold text-red-400" style={{ fontFamily: 'JetBrains Mono' }}>
                        {myResult.errors}
                      </div>
                    </div>
                    <div>
                      <div className="text-text-secondary text-xs mb-1">Characters</div>
                      <div className="text-xl font-bold text-text-primary" style={{ fontFamily: 'JetBrains Mono' }}>
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
            className={`bg-bg-primary/30 backdrop-blur-sm rounded-xl p-6 border-2 transition-all ${
              !myIsWinner && winner && winner.id === opponent.id
                ? 'border-accent-primary/50 shadow-lg shadow-accent-primary/20 scale-105'
                : 'border-border-secondary/30'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="text-xl font-semibold text-text-primary">{opponent.name}</div>
                {!myIsWinner && winner && winner.id === opponent.id && <span className="text-2xl">👑</span>}
              </div>
              {isValidUserId(opponent.userId) && (
                <button
                  onClick={() => navigateToProfile(navigate, opponent.userId)}
                  className="text-accent-primary hover:text-accent-hover text-sm font-medium transition-colors flex items-center gap-1"
                  title="View profile"
                >
                  <span>👤</span>
                  <span>Profile</span>
                </button>
              )}
              {eloChanges && eloChanges[opponent.id] !== undefined && (
                <div className={`text-sm font-semibold px-3 py-1 rounded ${
                  eloChanges[opponent.id] >= 0 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-red-500/20 text-red-400'
                }`}>
                  {eloChanges[opponent.id] >= 0 ? '+' : ''}{eloChanges[opponent.id]} ELO
                </div>
              )}
            </div>
            
            {/* Stats principales */}
            <div className="space-y-4">
              <div className="flex items-baseline gap-3">
                <span className="text-5xl font-bold text-text-primary" style={{ fontFamily: 'JetBrains Mono' }}>
                  {opponentResult.wpm}
                </span>
                <span className="text-text-secondary text-sm">WPM</span>
              </div>
              
              {/* Stats détaillées */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border-secondary/30">
                <div>
                  <div className="text-text-secondary text-xs mb-1">Accuracy</div>
                  <div className="text-xl font-bold text-text-primary" style={{ fontFamily: 'JetBrains Mono' }}>
                    {opponentResult.accuracy}%
                  </div>
                </div>
                <div>
                  <div className="text-text-secondary text-xs mb-1">Time</div>
                  <div className="text-xl font-bold text-text-primary" style={{ fontFamily: 'JetBrains Mono' }}>
                    {Math.round(opponentResult.time / 1000)}s
                  </div>
                </div>
                {opponentResult.errors !== undefined && (
                  <>
                    <div>
                      <div className="text-text-secondary text-xs mb-1">Errors</div>
                      <div className="text-xl font-bold text-red-400" style={{ fontFamily: 'JetBrains Mono' }}>
                        {opponentResult.errors}
                      </div>
                    </div>
                    <div>
                      <div className="text-text-secondary text-xs mb-1">Characters</div>
                      <div className="text-xl font-bold text-text-primary" style={{ fontFamily: 'JetBrains Mono' }}>
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
      
      {/* Comparaison visuelle améliorée */}
      {myResult && opponentResult && (
        <div className="bg-bg-secondary/40 backdrop-blur-sm rounded-lg p-6 mb-8">
          <h3 className="text-lg font-bold text-text-primary mb-4 text-center">Match Comparison</h3>
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
                <span className="font-semibold">{Math.abs(myResult.accuracy - opponentResult.accuracy).toFixed(1)}% difference</span>
              </div>
              <div className="relative h-12 bg-bg-primary/30 rounded-lg overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-xs font-bold text-text-secondary">vs</div>
                </div>
                <div className="absolute left-0 top-0 bottom-0 flex items-center justify-center px-2"
                     style={{ 
                       width: `${myResult.accuracy}%`,
                       backgroundColor: myResult.accuracy >= opponentResult.accuracy ? 'rgba(34, 197, 94, 0.3)' : 'rgba(100, 100, 100, 0.3)'
                     }}>
                  <span className="text-sm font-bold text-green-400">{myResult.accuracy}%</span>
                </div>
                <div className="absolute right-0 top-0 bottom-0 flex items-center justify-end px-2"
                     style={{ 
                       width: `${opponentResult.accuracy}%`,
                       backgroundColor: opponentResult.accuracy >= myResult.accuracy ? 'rgba(34, 197, 94, 0.3)' : 'rgba(100, 100, 100, 0.3)'
                     }}>
                  <span className="text-sm font-bold text-green-400">{opponentResult.accuracy}%</span>
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
        
        {/* Boutons d'action */}
        <div className="flex items-center justify-center gap-4 flex-wrap">
          {onPlayAgain && (
            <button
              onClick={onPlayAgain}
              className="bg-accent-primary hover:bg-accent-hover text-accent-text font-semibold py-3 px-8 rounded-lg transition-colors text-lg"
            >
              🎮 Play Again
            </button>
          )}
          
          {onBackToLobby && (
            <button
              onClick={onBackToLobby}
              className="bg-bg-primary/50 hover:bg-bg-primary/70 border border-border-secondary/30 text-text-primary font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              ← Back to Lobby
            </button>
          )}
          
          <button
            onClick={() => navigate('/')}
            className="bg-bg-primary/50 hover:bg-bg-primary/70 border border-border-secondary/30 text-text-primary font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            🏠 Home
          </button>
        </div>
      </div>
    </div>
  );
}

