import { useState, useEffect, Suspense, lazy } from 'react'
import Footer from '../components/Footer'
import AppSidebar from '../components/AppSidebar'
import LogoIconSmall from '../components/icons/LogoIconSmall'
import MenuIcon from '../components/icons/MenuIcon'

// Lazy loading des composants de pages pour améliorer les performances et réduire le bundle initial
const Solo = lazy(() => import('./Solo'))
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
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false); // État du menu mobile

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    try {
      const response = await fetch(`${API_URL}/api/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };

  const handleAuthSuccess = () => {
    setShowAuth(null);
    fetchCurrentUser();
  };

  // Fonction pour changer de section et fermer le menu mobile
  const handleSectionChange = (section) => {
    setActiveSection(section);
    setSidebarOpen(false);
  };

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
    <div className="min-h-screen bg-bg-primary flex">
      {/* Overlay pour mobile (ferme le menu quand on clique dessus) */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <AppSidebar 
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
        user={user}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main content area */}
      <div className="flex-1 flex flex-col lg:ml-64">
        {/* Header compact avec menu hamburger pour mobile */}
        <header className="h-16 bg-bg-primary/40 backdrop-blur-md z-30 flex items-center justify-between px-4 lg:px-6">
          {/* Menu hamburger pour mobile */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 text-text-secondary hover:text-text-primary transition-colors"
            aria-label="Toggle menu"
          >
            <MenuIcon className="w-6 h-6" stroke="currentColor" />
          </button>

          <div className="flex items-center gap-3 ml-auto">
            {user ? (
              <button
                onClick={() => setActiveSection('profile')}
                className="flex items-center gap-3 hover:opacity-80 transition-opacity group"
              >
                <span className="text-text-secondary text-sm group-hover:text-text-primary transition-colors hidden sm:inline">Welcome,</span>
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
        </header>

        {/* Main content avec lazy loading et animation */}
        <main className="flex-1 overflow-y-auto">
          <Suspense fallback={<LoadingSpinner />}>
            <div key={activeSection}>
              {activeSection === 'solo' && <Solo />}
              {activeSection === 'battle' && <Battle />}
              {activeSection === 'rankings' && <Rankings />}
              {activeSection === 'competitions' && <Competitions />}
              {activeSection === 'matchmaking' && <Matchmaking />}
              {activeSection === 'friends' && user && <Friends />}
              {activeSection === 'profile' && user && <Profile userId={user.id} />}
            </div>
          </Suspense>
        </main>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  )
}

