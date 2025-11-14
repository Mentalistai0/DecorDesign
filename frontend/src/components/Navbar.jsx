import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import CreditBar from './CreditBar'
import './Navbar.css'

function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, isAuthenticated, logout, credits } = useAuth()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const isActive = (path) => location.pathname === path

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [location])

  const isHome = location.pathname === '/'

  return (
    <nav className={`navbar ${isScrolled ? 'scrolled' : ''} ${isHome ? 'home' : ''}`}>
      <div className="container navbar-container">
        <Link to="/" className="navbar-logo" aria-label="DecorDesign Home">
          <img src="/logo.svg" alt="DecorDesign" className="logo-img" />
        </Link>

        <button
          className={`mobile-menu-toggle ${isMobileMenuOpen ? 'open' : ''}`}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <ul className={`navbar-menu ${isMobileMenuOpen ? 'open' : ''}`}>
          {!isAuthenticated && (
            <>
              <li>
                <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>
                  Home
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className={`nav-link ${isActive('/how-it-works') ? 'active' : ''}`}>
                  How it works
                </Link>
              </li>
            </>
          )}
          <li>
            <Link to="/pricing" className={`nav-link ${isActive('/pricing') ? 'active' : ''}`}>
              Pricing
            </Link>
          </li>

          {isAuthenticated && (
            <>
              <li>
                <Link to="/generate" className={`nav-link ${isActive('/generate') ? 'active' : ''}`}>
                  Generate
                </Link>
              </li>
              <li>
                <Link to="/video" className={`nav-link ${isActive('/video') ? 'active' : ''}`}>
                  Video
                </Link>
              </li>
              <li>
                <Link to="/gallery" className={`nav-link ${isActive('/gallery') ? 'active' : ''}`}>
                  Gallery
                </Link>
              </li>
              <li>
                <Link to="/settings" className={`nav-link ${isActive('/settings') ? 'active' : ''}`}>
                  Settings
                </Link>
              </li>
            </>
          )}

          {isAuthenticated ? (
            <>
              <li className="nav-credits">
                <CreditBar variant="compact" />
              </li>
              <li className="nav-user-info">
                <span className="user-name">{user?.name || user?.email}</span>
              </li>
              <li>
                <button onClick={handleLogout} className="btn btn-secondary btn-sm">Logout</button>
              </li>
            </>
          ) : (
            <>
              <li>
                <Link to="/login" className="btn btn-primary btn-sm">Get started</Link>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  )
}

export default Navbar
