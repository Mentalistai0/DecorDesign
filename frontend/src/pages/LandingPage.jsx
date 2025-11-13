import { Link } from 'react-router-dom'
import './LandingPage.css'

function LandingPage() {
  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title">
              Transform Your Furniture Designs with AI
            </h1>
            <p className="hero-subtitle">
              Create stunning product visuals and videos in seconds using advanced AI technology.
              Perfect for furniture sellers, interior designers, and creative professionals.
            </p>
            <div className="hero-buttons">
              <Link to="/generate" className="btn btn-primary btn-lg">
                Start Creating
              </Link>
              <Link to="/gallery" className="btn btn-secondary btn-lg">
                View Gallery
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="container">
          <h2 className="section-title">Powerful Features</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🖼️</div>
              <h3>AI Image Generation</h3>
              <p>
                Generate high-quality furniture product images using Google's Nano Banana model.
                Upload your own images or start from scratch with custom prompts.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🎬</div>
              <h3>AI Video Creation</h3>
              <p>
                Create stunning product showcase videos with OpenAI's Sora2 model.
                Perfect for marketing, social media, and product demonstrations.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">📚</div>
              <h3>Smart Templates</h3>
              <p>
                Choose from ready-made prompt templates like "modern living room" or "luxury bedroom"
                to get started quickly with professional results.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">💾</div>
              <h3>Gallery Management</h3>
              <p>
                All your generated images and videos are automatically saved to your personal gallery
                for easy access and management.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <h3>Real-time Progress</h3>
              <p>
                Watch your creations come to life with real-time progress tracking and loading indicators
                during generation.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🎯</div>
              <h3>Easy to Use</h3>
              <p>
                Simple, intuitive interface designed for creators of all skill levels.
                No technical knowledge required.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works">
        <div className="container">
          <h2 className="section-title">How It Works</h2>
          <div className="steps">
            <div className="step">
              <div className="step-number">1</div>
              <h3>Upload or Enter URL</h3>
              <p>Start by uploading your furniture image or entering an image URL</p>
            </div>

            <div className="step">
              <div className="step-number">2</div>
              <h3>Choose or Write Prompt</h3>
              <p>Select from templates or write your own custom prompt describing the desired scene</p>
            </div>

            <div className="step">
              <div className="step-number">3</div>
              <h3>Generate</h3>
              <p>Click generate and watch as AI creates your professional product visual or video</p>
            </div>

            <div className="step">
              <div className="step-number">4</div>
              <h3>Save & Share</h3>
              <p>Your creation is automatically saved to your gallery, ready to download or share</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <div className="container">
          <h2>Ready to Transform Your Furniture Visuals?</h2>
          <p>Start creating stunning AI-powered product images and videos today</p>
          <Link to="/generate" className="btn btn-primary btn-lg">
            Get Started Now
          </Link>
        </div>
      </section>
    </div>
  )
}

export default LandingPage
