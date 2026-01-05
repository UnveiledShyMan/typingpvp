import { useState, useEffect, Suspense, lazy, useRef } from 'react'
import Footer from '../components/Footer'
import LogoIcon from '../components/icons/LogoIcon'
import LogoIconSmall from '../components/icons/LogoIconSmall'
import KeyboardIcon from '../components/icons/KeyboardIcon'
import SwordIcon from '../components/icons/SwordIcon'
import TrophyIcon from '../components/icons/TrophyIcon'
import CompetitionIcon from '../components/icons/CompetitionIcon'
import MatchmakingIcon from '../components/icons/MatchmakingIcon'
import FriendsIcon from '../components/icons/FriendsIcon'
import SoloDropdown from '../components/SoloDropdown'
import { profileService } from '../services/apiService'
import { useUser } from '../contexts/UserContext'
import { useKeyboardNavigation } from '../hooks/useKeyboardNavigation'
import SEOHead from '../components/SEOHead'

// Lazy loading des composants de pages pour améliorer les performances et réduire le bundle initial
const Solo = lazy(() => import('./Solo'))
const Sandbox = lazy(() => import('./Sandbox'))
const Battle = lazy(() => import('./Battle'))
const Rankings = lazy(() => import('./Rankings'))
const Profile = lazy(() => import('./Profile'))
const Competitions = lazy(() => import('./Competitions'))
const Matchmaking = lazy(() => import('./Matchmaking'))
const Friends = lazy(() => import('./Friends'))
const Login = lazy(() => import('./Login'))
const Register = lazy(() => import('./Register'))

// Composant de chargement pour le lazy loading
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="text-text-secondary">Loading...</div>
  </div>
)

export default function MainPage() {
  const [activeSection, setActiveSection] = useState('solo');
  const [showAuth, setShowAuth] = useState(null); // 'login' | 'register' | null
  const { user, updateUser } = useUser();
  const [showSandbox, setShowSandbox] = useState(false);

  useEffect(() => {
    // Charger la préférence depuis localStorage si pas d'utilisateur connecté
    const savedMode = localStorage.getItem('defaultMode');
    if (!user && savedMode === 'sandbox') {
      setShowSandbox(true);
      setActiveSection('sandbox');
    }
  }, [user]);

  // Charger la préférence de mode par défaut quand l'utilisateur est chargé
  useEffect(() => {
    if (user && user.preferences && user.preferences.defaultMode === 'sandbox') {
      setShowSandbox(true);
      setActiveSection('sandbox');
    } else if (user && (!user.preferences || user.preferences.defaultMode === 'solo')) {
      // S'assurer que showSandbox est false si la préférence est 'solo'
      setShowSandbox(false);
      if (activeSection === 'sandbox') {
        setActiveSection('solo');
      }
    }
  }, [user]);

  // L'utilisateur est maintenant géré par UserContext
  // Plus besoin de fetchCurrentUser

  // Sauvegarder la préférence de mode
  const saveModePreference = async (mode) => {
    if (!user) {
      // Si pas d'utilisateur, sauvegarder dans localStorage
      localStorage.setItem('defaultMode', mode);
      return;
    }

    try {
      const data = await profileService.updatePreferences({ defaultMode: mode });
      if (user) {
        updateUser({
          ...user,
          preferences: data.preferences
        });
      }
    } catch (error) {
      // Erreur gérée par apiService
    }
  };

  const handleAuthSuccess = () => {
    setShowAuth(null);
    // L'utilisateur sera automatiquement chargé par UserContext après la connexion
  };

  // Sections de navigation
  const baseSections = [
    { id: 'solo', label: 'Solo', Icon: KeyboardIcon },
    { id: 'battle', label: '1v1', Icon: SwordIcon },
    { id: 'rankings', label: 'Rankings', Icon: TrophyIcon },
    { id: 'competitions', label: 'Competitions', Icon: CompetitionIcon },
    { id: 'matchmaking', label: 'Matchmaking', Icon: MatchmakingIcon },
  ];
  
  const sections = user 
    ? [...baseSections, { id: 'friends', label: 'Friends', Icon: FriendsIcon }]
    : baseSections;

  if (showAuth === 'login') {
    return (
      <Suspense fallback={<LoadingSpinner />}>
        <Login onSuccess={handleAuthSuccess} onSwitch={() => setShowAuth('register')} />
      </Suspense>
    );
  }

  if (showAuth === 'register') {
    return (
      <Suspense fallback={<LoadingSpinner />}>
        <Register onSuccess={handleAuthSuccess} onSwitch={() => setShowAuth('login')} />
      </Suspense>
    );
  }

  return (
    <>
      <SEOHead 
        title="TypingPVP - Competitive Typing Battles"
        description="Compete in real-time typing battles, improve your speed and accuracy, and climb the global leaderboard."
        keywords="typing, typing test, typing speed, wpm, typing battle, competitive typing"
      />
      <div className="h-screen bg-bg-primary flex flex-col overflow-hidden">
      {/* Header avec navigation horizontale */}
      <header 
        className="w-full bg-bg-primary/60 backdrop-blur-md relative"
        style={{
          background: 'rgba(10, 14, 26, 0.6)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          zIndex: 100
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo et titre */}
            <button
              onClick={() => {
                setShowSandbox(false);
                setActiveSection('solo');
                saveModePreference('solo');
              }}
              className="flex items-center gap-2 sm:gap-3 cursor-pointer group flex-shrink-0"
            >
              <LogoIcon 
                className="w-7 h-7 sm:w-8 sm:h-8 text-text-primary/80 group-hover:text-accent-primary transition-all duration-200" 
                stroke="currentColor"
              />
              <h1 
                className="text-base sm:text-xl font-bold text-text-primary/90 group-hover:text-accent-primary transition-all duration-200 whitespace-nowrap"
                style={{ fontFamily: 'Inter', letterSpacing: '-0.02em' }}
              >
                typingpvp.com
              </h1>
            </button>

            {/* Navigation horizontale */}
            <nav className="hidden md:flex items-center gap-1 flex-1 justify-center min-w-0 overflow-hidden">
              {sections.map((section) => {
                const Icon = section.Icon;
                const isActive = activeSection === section.id;
                
                // Menu déroulant spécial pour Solo
                if (section.id === 'solo') {
                  const displayLabel = showSandbox ? 'Sandbox' : 'Solo';
                  return (
                    <SoloDropdown
                      key={section.id}
                      isSandboxMode={showSandbox}
                      onSandboxClick={() => {
                        setShowSandbox(true);
                        setActiveSection('sandbox');
                        saveModePreference('sandbox');
                      }}
                      onSoloClick={() => {
                        setShowSandbox(false);
                        setActiveSection('solo');
                        saveModePreference('solo');
                      }}
                    >
                      <button
                        onClick={() => {
                          // Sur desktop, le hover gère l'ouverture du dropdown
                          // Sur mobile, le clic toggle le dropdown (géré par SoloDropdown)
                          // On ne change pas la section ici pour éviter les conflits
                        }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                          (isActive && !showSandbox) || showSandbox
                            ? 'text-accent-primary'
                            : 'text-text-secondary/70 hover:text-text-primary/90'
                        }`}
                      >
                        <Icon 
                          className="w-4 h-4 transition-all duration-200 flex-shrink-0" 
                          stroke={(isActive && !showSandbox) || showSandbox ? '#8b5cf6' : 'currentColor'}
                          style={{ opacity: (isActive && !showSandbox) || showSandbox ? 1 : 0.7 }}
                        />
                        <span className={`${(isActive && !showSandbox) || showSandbox ? 'font-semibold' : 'font-medium'} whitespace-nowrap`}>{displayLabel}</span>
                        <svg
                          className="w-3 h-3 transition-transform opacity-50 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </SoloDropdown>
                  );
                }
                
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'text-accent-primary'
                        : 'text-text-secondary/70 hover:text-text-primary/90'
                    }`}
                  >
                    <Icon 
                      className="w-4 h-4 transition-all duration-200 flex-shrink-0" 
                      stroke={isActive ? '#8b5cf6' : 'currentColor'}
                      style={{ opacity: isActive ? 1 : 0.7 }}
                    />
                    <span className={`${isActive ? 'font-semibold' : 'font-medium'} whitespace-nowrap`}>{section.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* User section / Auth buttons */}
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              {user ? (
                <>
                  {/* Profile button dans la nav pour mobile */}
                  <button
                    onClick={() => setActiveSection('profile')}
                    className="md:hidden flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-text-secondary/70 hover:text-text-primary/90 transition-all"
                  >
                    <div className="w-6 h-6 rounded bg-bg-primary/30 overflow-hidden flex items-center justify-center">
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.username}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <LogoIconSmall 
                          className="w-4 h-4 text-accent-primary/80" 
                          stroke="currentColor"
                        />
                      )}
                    </div>
                  </button>
                  
                  {/* Desktop user display */}
                  <button
                    onClick={() => setActiveSection('profile')}
                    className="hidden md:flex items-center gap-3 hover:opacity-80 transition-opacity group"
                  >
                    <span className="text-text-secondary text-sm group-hover:text-text-primary transition-colors">Welcome,</span>
                    <span className="text-text-primary font-medium">{user.username}</span>
                    <div className="w-10 h-10 rounded-lg bg-bg-primary/30 overflow-hidden flex items-center justify-center backdrop-blur-sm transition-opacity group-hover:opacity-80">
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.username}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <LogoIconSmall 
                          className="w-6 h-6 text-accent-primary" 
                          stroke="currentColor"
                        />
                      )}
                    </div>
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowAuth('login')}
                    className="text-text-secondary hover:text-text-primary transition-colors text-sm font-medium px-3 py-1.5"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => setShowAuth('register')}
                    className="bg-accent-primary hover:bg-accent-hover text-bg-primary font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
                  >
                    Register
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Navigation mobile (menu déroulant) */}
          <div className="md:hidden pt-2 pb-4 overflow-x-auto scrollbar-hide -mx-4 sm:-mx-6 px-4 sm:px-6">
            <nav className="flex items-center gap-1 min-w-max">
              {sections.map((section) => {
                const Icon = section.Icon;
                const isActive = activeSection === section.id;
                
                // Menu déroulant spécial pour Solo sur mobile aussi
                if (section.id === 'solo') {
                  const displayLabel = showSandbox ? 'Sandbox' : 'Solo';
                  return (
                    <SoloDropdown
                      key={section.id}
                      isSandboxMode={showSandbox}
                      onSandboxClick={() => {
                        setShowSandbox(true);
                        setActiveSection('sandbox');
                        saveModePreference('sandbox');
                      }}
                      onSoloClick={() => {
                        setShowSandbox(false);
                        setActiveSection('solo');
                        saveModePreference('solo');
                      }}
                    >
                      <button
                        onClick={() => {
                          // Sur desktop, le hover gère l'ouverture du dropdown
                          // Sur mobile, le clic toggle le dropdown (géré par SoloDropdown)
                          // On ne change pas la section ici pour éviter les conflits
                        }}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap ${
                          (isActive && !showSandbox) || showSandbox
                            ? 'text-accent-primary'
                            : 'text-text-secondary/70 hover:text-text-primary/90'
                        }`}
                      >
                        <Icon 
                          className="w-4 h-4 transition-all duration-200 flex-shrink-0" 
                          stroke={(isActive && !showSandbox) || showSandbox ? '#8b5cf6' : 'currentColor'}
                          style={{ opacity: (isActive && !showSandbox) || showSandbox ? 1 : 0.7 }}
                        />
                        <span className={`${(isActive && !showSandbox) || showSandbox ? 'font-semibold' : 'font-medium'} whitespace-nowrap`}>{displayLabel}</span>
                        <svg
                          className="w-2.5 h-2.5 transition-transform opacity-60 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </SoloDropdown>
                  );
                }
                
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap ${
                      isActive
                        ? 'text-accent-primary'
                        : 'text-text-secondary/70 hover:text-text-primary/90'
                    }`}
                  >
                    <Icon 
                      className="w-4 h-4 transition-all duration-200 flex-shrink-0" 
                      stroke={isActive ? '#8b5cf6' : 'currentColor'}
                      style={{ opacity: isActive ? 1 : 0.7 }}
                    />
                    <span className={`${isActive ? 'font-semibold' : 'font-medium'} whitespace-nowrap`}>{section.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      {/* Main content avec lazy loading et animation - Parfaitement centré, non scrollable */}
      <main className="flex-1 overflow-hidden relative" style={{ zIndex: 1 }}>
        <div className="w-full h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Suspense fallback={<LoadingSpinner />}>
            <div key={`${activeSection}-${showSandbox}`} className="h-full overflow-hidden animate-fade-in">
              {activeSection === 'solo' && !showSandbox && <Solo />}
              {activeSection === 'sandbox' && showSandbox && <Sandbox />}
              {activeSection === 'battle' && <Battle />}
              {activeSection === 'rankings' && <Rankings />}
              {activeSection === 'competitions' && <Competitions />}
              {activeSection === 'matchmaking' && <Matchmaking />}
              {activeSection === 'friends' && user && <Friends />}
              {activeSection === 'profile' && user && <Profile userId={user.id} />}
            </div>
          </Suspense>
        </div>
      </main>

      {/* Footer */}
      <Footer />
      </div>
    </>
  )
}

