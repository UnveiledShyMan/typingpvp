import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import { ToastProvider } from './contexts/ToastContext'
import { UserProvider } from './contexts/UserContext'
import { QueryProvider } from './providers/QueryProvider'
import './App.css'

// Lazy loading des routes pour améliorer les performances
const MainPage = lazy(() => import('./pages/MainPage'))
const BattleRoom = lazy(() => import('./pages/BattleRoom'))
const CompetitionRoom = lazy(() => import('./pages/CompetitionRoom'))
const OAuthCallback = lazy(() => import('./pages/OAuthCallback'))
const TermsOfService = lazy(() => import('./pages/TermsOfService'))
const LegalNotice = lazy(() => import('./pages/LegalNotice'))
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'))
const Profile = lazy(() => import('./pages/Profile'))
const UserProfile = lazy(() => import('./pages/UserProfile'))

// Composant de chargement
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen bg-bg-primary">
    <div className="text-text-secondary">Loading...</div>
  </div>
)

function App() {
  return (
    <QueryProvider>
      <ToastProvider>
        <UserProvider>
          <Router>
            <Suspense fallback={<LoadingSpinner />}>
              <Routes>
                <Route path="/" element={<MainPage />} />
                <Route path="/battle/:roomId" element={<BattleRoom />} />
                <Route path="/competition/:competitionId" element={<CompetitionRoom />} />
                <Route path="/oauth/callback" element={<OAuthCallback />} />
                <Route path="/terms" element={<TermsOfService />} />
                <Route path="/legal" element={<LegalNotice />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/profile/:id" element={<Profile />} />
                <Route path="/user/:username" element={<UserProfile />} />
              </Routes>
            </Suspense>
          </Router>
        </UserProvider>
      </ToastProvider>
    </QueryProvider>
  )
}

export default App
