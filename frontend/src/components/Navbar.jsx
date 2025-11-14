import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
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

  return (
    <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
      <div className="container navbar-container">
        <Link to="/" className="navbar-logo">
          <span className="logo-icon">🎨</span>
          <span className="logo-text">Decor Design</span>
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
          <li>
            <Link
              to="/"
              className={`nav-link ${isActive('/') ? 'active' : ''}`}
            >
              <span className="nav-icon">🏠</span>
              Home
            </Link>
          </li>
          <li>
            <Link
              to="/generate"
              className={`nav-link ${isActive('/generate') ? 'active' : ''}`}
            >
              <span className="nav-icon">✨</span>
              Generate Image
            </Link>
          </li>
          <li>
            <Link
              to="/video"
              className={`nav-link ${isActive('/video') ? 'active' : ''}`}
            >
              <span className="nav-icon">🎬</span>
              Generate Video
            </Link>
          </li>
          <li>
            <Link
              to="/gallery"
              className={`nav-link ${isActive('/gallery') ? 'active' : ''}`}
            >
              <span className="nav-icon">🖼️</span>
              Gallery
            </Link>
          </li>
          <li>
            <Link
              to="/pricing"
              className={`nav-link ${isActive('/pricing') ? 'active' : ''}`}
            >
              <span className="nav-icon">💳</span>
              Pricing
            </Link>
          </li>
          {isAuthenticated ? (
            <>
              <li className="nav-credits">
                <div className="credits-display">
                  <div className="credit-item">
                    <span className="credit-icon">🖼️</span>
                    <span className="credit-value">{credits.image.available}</span>
                  </div>
                  <div className="credit-item">
                    <span className="credit-icon">🎬</span>
                    <span className="credit-value">{credits.video.available}</span>
                  </div>
                </div>
              </li>
              <li className="nav-user-info">
                <span className="user-name">{user?.name || user?.email}</span>
              </li>
              <li>
                <button
                  onClick={handleLogout}
                  className="btn btn-secondary btn-sm"
                >
                  Logout
                </button>
              </li>
            </>
          ) : (
            <li>
              <Link
                to="/login"
                className="btn btn-primary btn-sm"
              >
                Sign In
              </Link>
            </li>
          )}
        </ul>
      </div>
    </nav>
  )
}

export default Navbar
