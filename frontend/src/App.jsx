import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { AuthProvider } from './contexts/AuthContext'
import Navbar from './components/Navbar'
import PrivateRoute from './components/PrivateRoute'
import Footer from './components/Footer'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import GeneratePage from './pages/GeneratePage'
import GalleryPage from './pages/GalleryPage'
import VideoPage from './pages/VideoPage'
import PricingPage from './pages/PricingPage'
import PaymentSuccessPage from './pages/PaymentSuccessPage'
import HowItWorksPage from './pages/HowItWorksPage'
import TermsPage from './pages/TermsPage'
import PrivacyPage from './pages/PrivacyPage'
import SettingsPage from './pages/SettingsPage'
import './App.css'

function PageTransition({ children }) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => setIsVisible(true), 50)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className={`page-transition ${isVisible ? 'visible' : ''}`}>
      {children}
    </div>
  )
}

function AppContent() {
  const location = useLocation()
  const [displayLocation, setDisplayLocation] = useState(location)
  const [transitionStage, setTransitionStage] = useState('fadeIn')

  useEffect(() => {
    if (location !== displayLocation) {
      setTransitionStage('fadeOut')
    }
  }, [location, displayLocation])

  const handleAnimationEnd = () => {
    if (transitionStage === 'fadeOut') {
      setDisplayLocation(location)
      setTransitionStage('fadeIn')
    }
  }

  return (
    <div className="app">
      <Navbar />
      <main className="main-content">
        <div
          className={`page-wrapper ${transitionStage}`}
          onAnimationEnd={handleAnimationEnd}
        >
          <Routes location={displayLocation}>
            <Route path="/" element={<PageTransition><LandingPage /></PageTransition>} />
            <Route path="/login" element={<PageTransition><LoginPage /></PageTransition>} />
            <Route
              path="/generate"
              element={
                <PageTransition>
                  <PrivateRoute>
                    <GeneratePage />
                  </PrivateRoute>
                </PageTransition>
              }
            />
            <Route
              path="/gallery"
              element={
                <PageTransition>
                  <PrivateRoute>
                    <GalleryPage />
                  </PrivateRoute>
                </PageTransition>
              }
            />
            <Route
              path="/video"
              element={
                <PageTransition>
                  <PrivateRoute>
                    <VideoPage />
                  </PrivateRoute>
                </PageTransition>
              }
            />
            <Route path="/pricing" element={<PageTransition><PricingPage /></PageTransition>} />
            <Route path="/how-it-works" element={<PageTransition><HowItWorksPage /></PageTransition>} />
            <Route path="/terms" element={<PageTransition><TermsPage /></PageTransition>} />
            <Route path="/privacy" element={<PageTransition><PrivacyPage /></PageTransition>} />
            <Route
              path="/settings"
              element={
                <PageTransition>
                  <PrivateRoute>
                    <SettingsPage />
                  </PrivateRoute>
                </PageTransition>
              }
            />
            <Route path="/payment/success" element={<PageTransition><PaymentSuccessPage /></PageTransition>} />
          </Routes>
        </div>
      </main>
      <Footer />
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  )
}

export default App
