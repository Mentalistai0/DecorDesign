import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './LoginPage.css'

function LoginPage() {
  const navigate = useNavigate()
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    // For v1, this is a placeholder - authentication is optional
    if (email && password) {
      setSuccess('Authentication is optional in v1. You can start creating!')
      setTimeout(() => {
        navigate('/generate')
      }, 1500)
    } else {
      setError('Please fill in all fields')
    }
  }

  return (
    <div className="login-page">
      <div className="container">
        <div className="login-container">
          <div className="login-card card">
            <h1>{isLogin ? 'Sign In' : 'Sign Up'}</h1>
            <p className="login-subtitle">
              {isLogin
                ? 'Welcome back! Sign in to your account'
                : 'Create an account to get started'}
            </p>

            <div className="auth-notice">
              <p>
                <strong>Note:</strong> Authentication is optional in v1. You can skip this and go
                directly to{' '}
                <span
                  onClick={() => navigate('/generate')}
                  style={{ color: 'var(--primary-color)', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Generate Page
                </span>
              </p>
            </div>

            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            <form onSubmit={handleSubmit}>
              <div className="input-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                />
              </div>

              <div className="input-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                />
              </div>

              <button type="submit" className="btn btn-primary btn-full">
                {isLogin ? 'Sign In' : 'Sign Up'}
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
            </div>

            <div className="divider">
              <span>OR</span>
            </div>

            <button
              type="button"
              className="btn btn-secondary btn-full"
              onClick={() => navigate('/generate')}
            >
              Continue Without Account
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
