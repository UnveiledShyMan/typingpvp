// Composant Footer avec liens vers les pages légales
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-bg-primary/30 backdrop-blur-sm mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-6">
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
          </nav>
        </div>
      </div>
    </footer>
  );
}

