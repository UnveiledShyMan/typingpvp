import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import './App.css'

// Lazy loading des routes pour améliorer les performances
const MainPage = lazy(() => import('./pages/MainPage'))
const BattleRoom = lazy(() => import('./pages/BattleRoom'))
const CompetitionRoom = lazy(() => import('./pages/CompetitionRoom'))
const TermsOfService = lazy(() => import('./pages/TermsOfService'))
const LegalNotice = lazy(() => import('./pages/LegalNotice'))
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'))

// Composant de chargement
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen bg-bg-primary">
    <div className="text-text-secondary">Loading...</div>
  </div>
)

function App() {
  return (
    <Router>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/" element={<MainPage />} />
          <Route path="/battle/:roomId" element={<BattleRoom />} />
          <Route path="/competition/:competitionId" element={<CompetitionRoom />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/legal" element={<LegalNotice />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
        </Routes>
      </Suspense>
    </Router>
  )
}

export default App
