import { Link } from 'react-router-dom'
import './Footer.css'

export default function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="site-footer">
      <div className="container footer-wrap">
        <div className="brand">
          <img src="/logo.svg" alt="DecorDesign" className="footer-logo" />
          <span className="brand-name">DecorDesign</span>
        </div>
        <nav className="footer-nav">
          <Link to="/how-it-works">How it works</Link>
          <Link to="/pricing">Pricing</Link>
          <Link to="/privacy">Privacy</Link>
          <Link to="/terms">Terms</Link>
        </nav>
        <div className="copy">© {year} DecorDesign</div>
      </div>
    </footer>
  )
}
