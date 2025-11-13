import { Link, useLocation } from 'react-router-dom'
import './Navbar.css'

function Navbar() {
  const location = useLocation()

  const isActive = (path) => location.pathname === path

  return (
    <nav className="navbar">
      <div className="container navbar-container">
        <Link to="/" className="navbar-logo">
          <span className="logo-icon">🎨</span>
          <span className="logo-text">Decor Design</span>
        </Link>

        <ul className="navbar-menu">
          <li>
            <Link
              to="/"
              className={`nav-link ${isActive('/') ? 'active' : ''}`}
            >
              Home
            </Link>
          </li>
          <li>
            <Link
              to="/generate"
              className={`nav-link ${isActive('/generate') ? 'active' : ''}`}
            >
              Generate Image
            </Link>
          </li>
          <li>
            <Link
              to="/video"
              className={`nav-link ${isActive('/video') ? 'active' : ''}`}
            >
              Generate Video
            </Link>
          </li>
          <li>
            <Link
              to="/gallery"
              className={`nav-link ${isActive('/gallery') ? 'active' : ''}`}
            >
              Gallery
            </Link>
          </li>
          <li>
            <Link
              to="/login"
              className="btn btn-primary btn-sm"
            >
              Sign In
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  )
}

export default Navbar
