import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import './LoginPage.css'

function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, signup } = useAuth()
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(true)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setIsLoading(true)

    try {
      if (!email || !password) {
        setError('Please fill in all fields')
        setIsLoading(false)
        return
      }

      if (!isLogin && password.length < 8) {
        setError('Password must be at least 8 characters long')
        setIsLoading(false)
        return
      }

      let result
      if (isLogin) {
        result = await login(email, password)
      } else {
        result = await signup(email, password, name)
      }

      if (result.success) {
        setSuccess(isLogin ? 'Logged in successfully!' : 'Account created successfully!')
        setTimeout(() => {
          const params = new URLSearchParams(location.search)
          const redirect = params.get('redirect') || '/generate'
          navigate(decodeURIComponent(redirect))
        }, 800)
      } else {
        setError(result.error || 'Authentication failed')
      }
    } catch (err) {
      setError('An unexpected error occurred')
      console.error('Auth error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="particle-bg">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="particle"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 20}s`,
              animationDuration: `${15 + Math.random() * 10}s`,
              width: `${2 + Math.random() * 4}px`,
              height: `${2 + Math.random() * 4}px`,
            }}
          />
        ))}
      </div>
      <div className="container">
        <div className="auth-layout">
          <aside className="auth-side glass">
            <div className="brand-row">
              <img src="/logo.svg" alt="DecorDesign" className="brand-logo" />
              <span className="brand-name">DecorDesign</span>
            </div>
            <h2>Create premium visuals in minutes</h2>
            <ul className="benefits">
              <li>✨ AI‑powered image/video generation</li>
              <li>🧩 Branded templates and styles</li>
              <li>🤝 Team collaboration</li>
              <li>⚡ Fast, secure and reliable</li>
            </ul>
          </aside>

          <div className="login-card card gradient-border">
            <h1>{isLogin ? 'Sign In' : 'Sign Up'}</h1>
            <p className="login-subtitle">
              {isLogin
                ? 'Welcome back! Sign in to your account'
                : 'Create an account to get started'}
            </p>

            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            <form onSubmit={handleSubmit}>
              {!isLogin && (
                <div className="input-group">
                  <label htmlFor="name">Name</label>
                  <div className="input-with-icon">
                    <span className="field-icon">👤</span>
                    <input
                      type="text"
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your name"
                    />
                  </div>
                </div>
              )}

              <div className="input-group">
                <label htmlFor="email">Email</label>
                <div className="input-with-icon">
                  <span className="field-icon">📧</span>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>

              <div className="input-group">
                <label htmlFor="password">Password</label>
                <div className="input-with-icon">
                  <span className="field-icon">🔒</span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={isLogin ? 'Enter your password' : 'At least 8 characters'}
                    required
                  />
                  <button
                    type="button"
                    className="toggle-pass"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPassword((v) => !v)}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <div className="remember-row">
                <label className="remember">
                  <input type="checkbox" checked={remember} onChange={() => setRemember(!remember)} />
                  <span>Remember me</span>
                </label>
                <button type="button" className="forgot" onClick={() => navigate('/login?reset=1')}>Forgot password?</button>
              </div>

              <button type="submit" className="btn btn-primary btn-full" disabled={isLoading}>
                {isLoading ? (isLogin ? 'Signing In...' : 'Creating Account...') : (isLogin ? 'Sign In' : 'Sign Up')}
              </button>
            </form>

            <div className="login-footer">
              <p>
                {isLogin ? "Don't have an account? " : 'Already have an account? '}
                <span
                  onClick={() => setIsLogin(!isLogin)}
                  className="toggle-auth"
                >
                  {isLogin ? 'Sign Up' : 'Sign In'}
                </span>
              </p>
              <p className="legal-note">
                By continuing you agree to our <a href="/terms">Terms</a> and <a href="/privacy">Privacy Policy</a>.
              </p>
            </div>

            {/* Require account to use the app */}
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
