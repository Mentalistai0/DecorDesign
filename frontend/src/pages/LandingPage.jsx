import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import './LandingPage.css'

function LandingPage() {
  const [heroInView, setHeroInView] = useState(false)
  const [featuresInView, setFeaturesInView] = useState(false)
  const [stepsInView, setStepsInView] = useState(false)
  const [testimonialsInView, setTestimonialsInView] = useState(false)

  const heroRef = useRef(null)
  const featuresRef = useRef(null)
  const stepsRef = useRef(null)
  const testimonialsRef = useRef(null)

  const particles = useMemo(
    () => Array.from({ length: 22 }, (_, i) => ({
      id: i,
      left: Math.floor(Math.random() * 100),
      size: Math.floor(Math.random() * 4) + 2,
      duration: Math.floor(Math.random() * 12) + 8,
      delay: Math.floor(Math.random() * 10),
      opacity: (Math.random() * 0.4 + 0.3).toFixed(2),
    })),
    []
  )

  useEffect(() => {
    const observerOptions = { threshold: 0.2, rootMargin: '0px 0px -100px 0px' }

    const heroObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setHeroInView(true)
        })
      },
      { threshold: 0.4 }
    )

    const featuresObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setFeaturesInView(true)
        })
      },
      observerOptions
    )

    const stepsObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setStepsInView(true)
        })
      },
      observerOptions
    )

    const testimonialsObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setTestimonialsInView(true)
        })
      },
      observerOptions
    )

    

    if (heroRef.current) heroObserver.observe(heroRef.current)
    if (featuresRef.current) featuresObserver.observe(featuresRef.current)
    if (stepsRef.current) stepsObserver.observe(stepsRef.current)
    if (testimonialsRef.current) testimonialsObserver.observe(testimonialsRef.current)

    return () => {
      heroObserver.disconnect()
      featuresObserver.disconnect()
      stepsObserver.disconnect()
      testimonialsObserver.disconnect()
    }
  }, [])

  const testimonials = [
    { quote: '“Decor Design cut our content turnaround from weeks to hours. Our product pages look premium without the studio bill.”', author: 'Head of Ecommerce, Modernist' },
    { quote: '“Sora videos lifted our ad CTR. Feels bespoke—customers assume we shot everything in‑house.”', author: 'Marketing Lead, CasaNova' },
    { quote: '“Mockups are effortless now. Clients say our proposals finally match the quality we deliver.”', author: 'Design Director, InteriorPro' },
    { quote: '“The gallery keeps us aligned. Approvals are faster and cleaner.”', author: 'Creative Producer, FurniCraft' },
  ]
  const [slide, setSlide] = useState(0)
  const [visible, setVisible] = useState(3)

  useEffect(() => {
    const onResize = () => {
      const w = window.innerWidth
      setVisible(w < 768 ? 1 : 3)
    }
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    const id = setInterval(() => {
      setSlide((s) => (s + 1) % Math.ceil(testimonials.length / visible))
    }, 5000)
    return () => clearInterval(id)
  }, [visible, testimonials.length])

  

  return (
    <div className="landing-page">
      {/* Hero */}
      <section className="hero" ref={heroRef}>
        <div className="particle-bg" aria-hidden>
          {particles.map((p) => (
            <span
              key={p.id}
              className="particle"
              style={{
                left: `${p.left}%`,
                width: p.size,
                height: p.size,
                animationDuration: `${p.duration}s`,
                animationDelay: `${p.delay}s`,
                opacity: p.opacity,
              }}
            />
          ))}
        </div>
        <div className="container">
          <div className="hero-content">
            <h1 className={`hero-title ${heroInView ? 'in-view' : ''}`}>
              Elevate Your Furniture Visuals with AI‑Powered Magic
              <span className="gold-underline" />
            </h1>
            <p className="hero-subtitle">
              Generate photorealistic product images, lifestyle scenes, and social‑ready videos in seconds. Start free today.
            </p>
            <div className="hero-buttons">
              <Link to="/login" className="btn btn-primary btn-lg glow-btn">Get Started Free</Link>
            </div>
            <div className="hero-icons">
              <div className="hero-icon" aria-label="Scale your content">📈</div>
              <div className="hero-icon" aria-label="AI‑guided prompting">🧠</div>
              <div className="hero-icon" aria-label="Team collaboration">🤝</div>
            </div>
          </div>
        </div>
      </section>

      {/* Trusted By */}
      <section className="trusted-by">
        <div className="container">
          <div className="logo-row">
            <span className="logo-pseudo">InteriorPro</span>
            <span className="logo-pseudo">CasaNova</span>
            <span className="logo-pseudo">FurniCraft</span>
            <span className="logo-pseudo">Modernist</span>
            <span className="logo-pseudo">EcomSuite</span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features" ref={featuresRef}>
        <div className="container">
          <h2 className={`section-title ${featuresInView ? 'animate-on-scroll animate' : 'animate-on-scroll'}`}>Design Faster. Launch Better.</h2>
          <div className="features-grid">
            <div className={`feature-card glass ${featuresInView ? 'animate-on-scroll animate' : 'animate-on-scroll animate-left'}`}>
              <div className="feature-icon">🖼️</div>
              <h3>Smart Staging Automation</h3>
              <p>Place furniture into premium lifestyle scenes, remove backgrounds, and apply branded lighting automatically.</p>
            </div>
            <div className={`feature-card glass ${featuresInView ? 'animate-on-scroll animate' : 'animate-on-scroll'}`}>
              <div className="feature-icon">📊</div>
              <h3>Real‑Time Insights</h3>
              <p>See edits and upscale results instantly. Batch generate variations for faster merchandising.</p>
            </div>
            <div className={`feature-card glass ${featuresInView ? 'animate-on-scroll animate' : 'animate-on-scroll animate-right'}`}>
              <div className="feature-icon">🔒</div>
              <h3>Secure Collaboration</h3>
              <p>Invite your team, manage roles, and keep assets organized in a shared gallery with version history.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works" ref={stepsRef}>
        <div className="container">
          <h2 className={`section-title ${stepsInView ? 'animate-on-scroll animate' : 'animate-on-scroll'}`}>Create in Four Steps</h2>
          <div className="steps">
            <div className={`step ${stepsInView ? 'animate-on-scroll animate' : 'animate-on-scroll animate-left'}`}><div className="step-number">1</div><h3>Upload or Paste a URL</h3><p>Start with a product image or use an existing hosted file.</p></div>
            <div className={`step ${stepsInView ? 'animate-on-scroll animate' : 'animate-on-scroll animate-left'}`} style={{animationDelay: '0.2s'}}><div className="step-number">2</div><h3>Select a Template</h3><p>Pick a premium prompt or write your own to match your brand.</p></div>
            <div className={`step ${stepsInView ? 'animate-on-scroll animate' : 'animate-on-scroll animate-right'}`} style={{animationDelay: '0.4s'}}><div className="step-number">3</div><h3>Generate Images or Video</h3><p>Use Nano Banana for images and Sora 2 for smooth video.</p></div>
            <div className={`step ${stepsInView ? 'animate-on-scroll animate' : 'animate-on-scroll animate-right'}`} style={{animationDelay: '0.6s'}}><div className="step-number">4</div><h3>Export & Share</h3><p>Download in seconds, save to your gallery, and publish anywhere.</p></div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="testimonials" ref={testimonialsRef}>
        <div className="container">
          <h2 className={`section-title ${testimonialsInView ? 'animate-on-scroll animate' : 'animate-on-scroll'}`}>What Teams Are Saying</h2>
            <div className="carousel">
            <div className="carousel-track" style={{ ['--offset']: slide, ['--visible']: visible }}>
              {testimonials.map((t, idx) => (
                <div className={`testimonial-card ${testimonialsInView ? 'animate-on-scroll animate' : 'animate-on-scroll'}`} key={idx} style={{animationDelay: `${idx * 0.1}s`}}>
                  <p>{t.quote}</p>
                  <span className="author">{t.author}</span>
                </div>
              ))}
            </div>
            <div className="carousel-progress" />
          </div>
        </div>
      </section>

      

      {/* FAQ */}
      <section className="faq">
        <div className="container">
          <h2 className="section-title">Frequently Asked Questions</h2>
          <div className="features-grid">
            <div className="feature-card faq-item"><h3>Commercial use?</h3><p>Yes—review upstream model terms if needed.</p></div>
            <div className="feature-card faq-item"><h3>Need pro images?</h3><p>No—upload a clear product shot or use a URL.</p></div>
            <div className="feature-card faq-item"><h3>Video duration?</h3><p>Most videos complete within 30–90 seconds.</p></div>
            <div className="feature-card faq-item"><h3>Storage?</h3><p>Saved in your gallery; delete anytime.</p></div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta">
        <div className="container">
          <h2>Ready to Elevate Your Product Visuals?</h2>
          <p>Create premium AI furniture images and videos in minutes.</p>
          <Link to="/login" className="btn btn-primary btn-lg">Start Free</Link>
        </div>
      </section>

      {/* Footer provided by layout */}
    </div>
  )
}

export default LandingPage
