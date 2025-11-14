import { Link } from 'react-router-dom'
import './HowItWorksPage.css'

export default function HowItWorksPage() {
  const steps = [
    { no: 1, title: 'Sign up', text: 'Create your account to access the studio.' },
    { no: 2, title: 'Upload product', text: 'Add a product image or paste a URL.' },
    { no: 3, title: 'Pick a style', text: 'Choose a scene or prompt template.' },
    { no: 4, title: 'Generate & export', text: 'Create images or videos and download in seconds.' }
  ]

  return (
    <div className="how-page">
      <section className="how-hero">
        <div className="container">
          <h1>How It Works</h1>
          <p>From product photo to on‑brand visuals in minutes.</p>
        </div>
      </section>

      <section className="how-steps">
        <div className="container">
          <div className="steps-grid">
            {steps.map((s) => (
              <div key={s.no} className="step-card glass">
                <div className="step-no">{s.no}</div>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="how-cta">
        <div className="container">
          <div className="cta-card glass">
            <div>
              <h2>Start Creating Today</h2>
              <p>Sign up to access the generator and gallery.</p>
            </div>
            <div>
              <Link to="/login" className="btn btn-primary">Get started</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

