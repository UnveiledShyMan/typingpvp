import { Link, NavLink } from 'react-router-dom'
import { useState } from 'react'
import { useUser } from '../contexts/UserContext'
import OptimizedImage from './OptimizedImage.jsx'
import LogoIconSmall from './icons/LogoIconSmall.jsx'
import { prefetchOnce } from '../utils/prefetch'

const routePrefetchers = {
  home: () => import('../pages/MainPage'),
  faq: () => import('../pages/FAQ'),
  privacy: () => import('../pages/PrivacyPolicy')
};

const prefetchRoute = (routeKey) => {
  const prefetcher = routePrefetchers[routeKey];
  if (!prefetcher) return;
  prefetchOnce(routeKey, prefetcher);
};

export default function Header() {
  const { user, logout: contextLogout } = useUser();
  const [showMenu, setShowMenu] = useState(false);

  const handleLogout = () => {
    contextLogout();
    setShowMenu(false);
    window.location.href = '/';
  };

  return (
    <header 
      className="fixed top-0 right-0 left-64 h-16 bg-bg-secondary/80 backdrop-blur-md border-b border-border-secondary/50 flex items-center z-40 ui-header"
      style={{
        color: 'var(--text-primary, #e8ecf3)',
        backgroundColor: 'rgba(19, 24, 37, 0.8)'
      }}
    >
      <div className="flex items-center justify-between w-full">
        <Link
          to="/"
          className="flex items-center gap-2 ui-press"
          onMouseEnter={() => prefetchRoute('home')}
        >
          <LogoIconSmall className="w-5 h-5 text-text-primary/80" stroke="currentColor" />
          <span className="text-text-primary font-semibold tracking-tight">TypingPVP</span>
        </Link>
        
        <nav className="hidden md:flex items-center gap-4 text-sm">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `ui-nav-link ${isActive ? 'ui-nav-link-active' : 'text-text-secondary'}`
            }
            onMouseEnter={() => prefetchRoute('home')}
          >
            Home
          </NavLink>
          <NavLink
            to="/faq"
            className={({ isActive }) =>
              `ui-nav-link ${isActive ? 'ui-nav-link-active' : 'text-text-secondary'}`
            }
            onMouseEnter={() => prefetchRoute('faq')}
          >
            FAQ
          </NavLink>
          <NavLink
            to="/privacy"
            className={({ isActive }) =>
              `ui-nav-link ${isActive ? 'ui-nav-link-active' : 'text-text-secondary'}`
            }
            onMouseEnter={() => prefetchRoute('privacy')}
          >
            Privacy
          </NavLink>
        </nav>

        {user ? (
          <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity ui-press"
            aria-label={`Menu utilisateur pour ${user.username}`}
            aria-expanded={showMenu}
            aria-haspopup="true"
          >
            {user.avatar ? (
              <OptimizedImage
                src={user.avatar}
                alt={user.username}
                width={40}
                height={40}
                className="rounded-full border-2 border-border-secondary/30 object-cover object-center"
                loading="lazy"
                priority={false}
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-accent-primary/20 border-2 border-border-secondary/30 flex items-center justify-center text-accent-primary font-bold">
                {user.username[0].toUpperCase()}
              </div>
            )}
            <span className="text-text-primary font-medium">{user.username}</span>
          </button>

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowMenu(false)}
              />
              <div 
                className="absolute right-0 top-full mt-2 w-48 bg-bg-secondary/95 backdrop-blur-md border border-border-secondary/50 rounded-lg shadow-xl z-50 py-2"
                role="menu"
                aria-label="Menu utilisateur"
              >
                <Link
                  to={`/profile/${user.username ? user.username : user.id}`}
                  className="block px-4 py-2 text-text-primary hover:bg-bg-tertiary/50 transition-colors ui-press"
                  onClick={() => setShowMenu(false)}
                  role="menuitem"
                  aria-label="Voir mon profil"
                >
                  Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-text-primary hover:bg-bg-tertiary/50 transition-colors ui-press"
                  role="menuitem"
                  aria-label="Se déconnecter"
                >
                  Logout
                </button>
              </div>
            </>
          )}
        </div>
        ) : (
          <div className="flex items-center gap-4">
            <Link
              to="/login"
              className="text-text-secondary hover:text-text-primary transition-colors font-medium ui-press"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="bg-accent-primary hover:bg-accent-hover text-accent-text font-semibold py-2 px-4 rounded-lg transition-colors shadow-lg shadow-accent-primary/20 ui-press"
            >
              Register
            </Link>
          </div>
        )}
      </div>
    </header>
  )
}

