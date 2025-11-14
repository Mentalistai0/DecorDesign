import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import './LoginPage.css'

function LoginPage() {
  const navigate = useNavigate()
  const { login, signup } = useAuth()
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)

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
          navigate('/generate')
        }, 1000)
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
      <div className="container">
        <div className="login-container">
          <div className="login-card card">
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
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                  />
                </div>
              )}

              <div className="input-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div className="input-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isLogin ? "Enter your password" : "At least 8 characters"}
                  required
                />
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
