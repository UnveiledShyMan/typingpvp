/**
 * Composant réutilisable pour partager des résultats
 * Supporte Twitter, copie dans le presse-papier, et autres plateformes
 */

import { useState, memo } from 'react';
import { useToastContext } from '../contexts/ToastContext';

function ShareButtons({ result, type = 'solo' }) {
  const { toast } = useToastContext();
  const [copied, setCopied] = useState(false);

  // Générer le texte de partage selon le type
  // Objectif: style simple et sans emojis pour rester cohérent avec la UI épurée.
  const getShareText = () => {
    if (type === 'solo') {
      return `Just scored ${result.wpm} WPM with ${result.accuracy}% accuracy on TypingPVP.`;
    } else if (type === 'battle') {
      const winner = result.isWinner ? 'Won' : 'Lost';
      return `Just ${winner} a typing battle with ${result.wpm} WPM and ${result.accuracy}% accuracy on TypingPVP.`;
    } else if (type === 'competition') {
      if (result.isWinner) {
        return `Won a typing competition. Finished #${result.position} with ${result.wpm} WPM and ${result.accuracy}% accuracy on TypingPVP.`;
      } else {
        return `Finished #${result.position} in a typing competition with ${result.wpm} WPM and ${result.accuracy}% accuracy on TypingPVP.`;
      }
    }
    return `Check out my typing results on TypingPVP.`;
  };

  // Générer l'URL de partage
  const getShareUrl = () => {
    return window.location.origin;
  };

  // Copier dans le presse-papier
  const copyToClipboard = async () => {
    const text = getShareText();
    const url = getShareUrl();
    const fullText = `${text}\n${url}`;
    
    try {
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      toast.success('Results copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy to clipboard');
    }
  };

  // Partager via Web Share API (mobile)
  const shareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'TypingPVP Results',
          text: getShareText(),
          url: getShareUrl()
        });
      } catch (err) {
        // L'utilisateur a annulé le partage
        if (err.name !== 'AbortError') {
          toast.error('Failed to share');
        }
      }
    } else {
      // Fallback vers copie si Web Share API n'est pas disponible
      copyToClipboard();
    }
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Bouton Copier - style sobre et cohérent */}
      <button
        onClick={copyToClipboard}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium border ui-press ${
          copied
            ? 'bg-green-500/10 text-green-400 border-green-500/30'
            : 'bg-bg-secondary/40 hover:bg-bg-secondary/60 text-text-primary border-border-secondary/40'
        }`}
        title="Copy to clipboard"
      >
        {copied ? (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Copied</span>
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <span>Copy</span>
          </>
        )}
      </button>

      {/* Bouton Partage Natif (mobile) - discret */}
      {navigator.share && (
        <button
          onClick={shareNative}
          className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium border bg-bg-secondary/30 hover:bg-bg-secondary/50 text-text-secondary hover:text-text-primary border-border-secondary/40 ui-press"
          title="Share"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          <span>Share</span>
        </button>
      )}
    </div>
  );
}

// Mémoriser le composant pour éviter les re-renders inutiles
export default memo(ShareButtons);

