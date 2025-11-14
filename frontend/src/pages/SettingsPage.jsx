import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import './SettingsPage.css'
import CreditBar from '../components/CreditBar'

export default function SettingsPage() {
  const { user, credits } = useAuth()

  const [name, setName] = useState(user?.name || '')
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [notifyEmail, setNotifyEmail] = useState(true)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')

  function fakeSave(cb) {
    setStatus('Saving...')
    setError('')
    setTimeout(() => {
      setStatus('Saved')
      cb && cb()
      setTimeout(() => setStatus(''), 1200)
    }, 700)
  }

  const handleSaveName = (e) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Name cannot be empty')
      return
    }
    fakeSave()
  }

  const handleChangePassword = (e) => {
    e.preventDefault()
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    if (password !== password2) {
      setError('Passwords do not match')
      return
    }
    fakeSave(() => {
      setPassword('')
      setPassword2('')
    })
  }

  const handlePrefsSave = (e) => {
    e.preventDefault()
    fakeSave()
  }

  const handleDelete = () => {
    const ok = confirm('This will permanently delete your account and data. Are you sure?')
    if (!ok) return
    fakeSave()
  }

  return (
    <div className="settings-page">
      <div className="container">
        <header className="page-header">
          <h1>Settings</h1>
          <p>Manage your account, security, and preferences</p>
        </header>

        {error && <div className="error-message">{error}</div>}
        {status && !error && <div className="success-message">{status}</div>}

        <section className="settings-grid">
          <article className="card glass">
            <h2>Account</h2>
            <div className="account-info">
              <div className="row">
                <label>Email</label>
                <div className="value" data-testid="email-value">{user?.email}</div>
              </div>
              <form onSubmit={handleSaveName} className="row">
                <label htmlFor="name">Name</label>
                <input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
                <button className="btn btn-primary">Save</button>
              </form>
            </div>
          </article>

          <article className="card glass">
            <h2>Security</h2>
            <form onSubmit={handleChangePassword} className="security-form">
              <div className="input-group">
                <label htmlFor="pass">New Password</label>
                <input id="pass" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" />
              </div>
              <div className="input-group">
                <label htmlFor="pass2">Confirm Password</label>
                <input id="pass2" type="password" value={password2} onChange={(e) => setPassword2(e.target.value)} placeholder="Repeat password" />
              </div>
              <button className="btn btn-secondary">Change Password</button>
            </form>
          </article>

          <article className="card glass">
            <h2>Preferences</h2>
            <form onSubmit={handlePrefsSave} className="prefs-form">
              <label className="switch-row">
                <input type="checkbox" checked={notifyEmail} onChange={() => setNotifyEmail(!notifyEmail)} />
                <span>Email notifications</span>
              </label>
              <button className="btn btn-secondary">Save Preferences</button>
            </form>
          </article>

          <article className="card glass">
            <h2>Billing</h2>
            <div className="billing">
              <div className="credits">
                <div>
                  <strong>Image Credits</strong>
                  <div className="credit-line"><span>Available</span><span>{credits?.image?.available ?? 0}</span></div>
                  <div className="credit-line"><span>Used</span><span>{credits?.image?.used ?? 0}</span></div>
                </div>
                <div>
                  <strong>Video Credits</strong>
                  <div className="credit-line"><span>Available</span><span>{credits?.video?.available ?? 0}</span></div>
                  <div className="credit-line"><span>Used</span><span>{credits?.video?.used ?? 0}</span></div>
                </div>
              </div>
              <CreditBar />
              <Link to="/pricing" className="btn btn-primary">Manage Plan</Link>
            </div>
          </article>

          <article className="card danger">
            <h2>Danger Zone</h2>
            <p>Delete your account and all associated data. This action cannot be undone.</p>
            <button className="btn btn-secondary" onClick={handleDelete}>Delete Account</button>
          </article>
        </section>
      </div>
    </div>
  )
}
