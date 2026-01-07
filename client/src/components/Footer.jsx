// Composant Footer avec liens vers les pages légales
import { Link } from 'react-router-dom';
import DiscordIcon from './icons/DiscordIcon';

export default function Footer() {
  return (
    <footer className="bg-bg-primary/40 backdrop-blur-sm mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex flex-col items-center justify-center gap-3">
          {/* Liens légaux - Centrés, police plus douce, opacité réduite */}
          <nav className="flex flex-wrap items-center justify-center gap-4 text-sm">
            <Link
              to="/terms"
              className="text-text-secondary/50 hover:text-text-secondary/80 transition-colors font-light"
              style={{ fontFamily: 'Inter', fontWeight: 300 }}
            >
              CGU
            </Link>
            <span className="text-text-muted/40">•</span>
            <Link
              to="/legal"
              className="text-text-secondary/50 hover:text-text-secondary/80 transition-colors font-light"
              style={{ fontFamily: 'Inter', fontWeight: 300 }}
            >
              Mentions Légales
            </Link>
            <span className="text-text-muted/40">•</span>
            <Link
              to="/privacy"
              className="text-text-secondary/50 hover:text-text-secondary/80 transition-colors font-light"
              style={{ fontFamily: 'Inter', fontWeight: 300 }}
            >
              Confidentialité
            </Link>
            <span className="text-text-muted/40">•</span>
            <Link
              to="/faq"
              className="text-text-secondary/50 hover:text-text-secondary/80 transition-colors font-light"
              style={{ fontFamily: 'Inter', fontWeight: 300 }}
            >
              FAQ
            </Link>
            <span className="text-text-muted/40">•</span>
            <a
              href="https://discord.gg/ztc3gnVmAd"
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-secondary/50 hover:text-text-secondary/80 transition-colors font-light flex items-center gap-1.5"
              style={{ fontFamily: 'Inter', fontWeight: 300 }}
            >
              <DiscordIcon className="w-4 h-4" fill="currentColor" />
              <span>Discord</span>
            </a>
            <span className="text-text-muted/40">•</span>
            <a
              href="https://buymeacoffee.com/typingpvp.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-secondary/50 hover:text-accent-primary transition-colors font-light flex items-center gap-1.5"
              style={{ fontFamily: 'Inter', fontWeight: 300 }}
              title="Soutenir TypingPVP"
            >
              <span>☕</span>
              <span>Buy Me a Coffee</span>
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
}

