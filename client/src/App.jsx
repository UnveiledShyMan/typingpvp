import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Suspense, lazy, useEffect } from 'react'
import { ToastProvider } from './contexts/ToastContext'
import { UserProvider } from './contexts/UserContext'
import { QueryProvider } from './providers/QueryProvider'
import ErrorBoundary from './components/ErrorBoundary'
import CookieConsent from './components/CookieConsent'
import { initGoogleAnalytics } from './utils/analytics'
import { initWebVitals } from './utils/webVitals'
import './App.css'

// Lazy loading des routes pour améliorer les performances
// Prefetch des routes probables pour améliorer la navigation
const MainPage = lazy(() => import('./pages/MainPage'))
const BattleRoom = lazy(() => import('./pages/BattleRoom'))
const CompetitionRoom = lazy(() => import('./pages/CompetitionRoom'))
const OAuthCallback = lazy(() => import('./pages/OAuthCallback'))
const TermsOfService = lazy(() => import('./pages/TermsOfService'))
const LegalNotice = lazy(() => import('./pages/LegalNotice'))
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'))
const Profile = lazy(() => import('./pages/Profile'))
const UserProfile = lazy(() => import('./pages/UserProfile'))
const FAQ = lazy(() => import('./pages/FAQ'))

// Prefetch des routes probables après chargement initial
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    // Prefetch des routes les plus utilisées après un délai
    setTimeout(() => {
      const prefetchRoutes = [
        () => import('./pages/Rankings'),
        () => import('./pages/Matchmaking'),
      ];
      
      prefetchRoutes.forEach(prefetch => {
        prefetch().catch(() => {
          // Ignorer les erreurs de prefetch
        });
      });
    }, 3000); // Attendre 3 secondes après le chargement
  });
}

// Composant de chargement
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen bg-bg-primary">
    <div className="text-text-secondary">Loading...</div>
  </div>
)

function App() {
  // Initialiser Google Analytics si le consentement a été donné
  useEffect(() => {
    // Petit délai pour s'assurer que le DOM est prêt
    const timer = setTimeout(() => {
      initGoogleAnalytics();
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Initialiser le tracking des Core Web Vitals
  useEffect(() => {
    initWebVitals();
  }, []);

  // Prefetch des routes probables après chargement initial pour améliorer la navigation
  useEffect(() => {
    // Attendre que l'application soit chargée
    const timer = setTimeout(() => {
      // Prefetch des routes les plus utilisées
      const prefetchRoutes = [
        () => import('./pages/Rankings'),
        () => import('./pages/Matchmaking'),
      ];
      
      prefetchRoutes.forEach(prefetch => {
        prefetch().catch(() => {
          // Ignorer les erreurs de prefetch silencieusement
        });
      });
    }, 3000); // Attendre 3 secondes après le chargement
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <ErrorBoundary>
      <QueryProvider>
        <ToastProvider>
          <UserProvider>
            {/* Skip link pour accessibilité */}
            <a href="#main-content" className="skip-link">
              Aller au contenu principal
            </a>
            <Router>
              <Suspense fallback={<LoadingSpinner />}>
                <Routes>
                  <Route path="/" element={<MainPage />} />
                  <Route 
                    path="/battle/:roomId" 
                    element={
                      <ErrorBoundary key="battle-room-error-boundary">
                        <BattleRoom />
                      </ErrorBoundary>
                    } 
                  />
                  <Route path="/competition/:competitionId" element={<CompetitionRoom />} />
                  <Route path="/oauth/callback" element={<OAuthCallback />} />
                  <Route path="/terms" element={<TermsOfService />} />
                  <Route path="/legal" element={<LegalNotice />} />
                  <Route path="/privacy" element={<PrivacyPolicy />} />
                  <Route path="/faq" element={<FAQ />} />
                  <Route path="/profile/:username" element={<Profile />} />
                  {/* Route de compatibilité pour les anciens liens avec ID */}
                  <Route path="/user/:username" element={<UserProfile />} />
                </Routes>
              </Suspense>
            </Router>
            <CookieConsent />
          </UserProvider>
        </ToastProvider>
      </QueryProvider>
    </ErrorBoundary>
  )
}

export default App
