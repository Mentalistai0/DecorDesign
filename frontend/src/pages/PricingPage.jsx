import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import LoadingSpinner from '../components/LoadingSpinner'
import API_URL from '../config/api.js'
import './PricingPage.css'

export default function PricingPage() {
  const navigate = useNavigate()
  const { isAuthenticated, token } = useAuth()
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [purchasingPlanId, setPurchasingPlanId] = useState(null)
  const [error, setError] = useState(null)

  // Fallback default tiers if backend returns none
  const defaultPlans = [
    { id: 'free', name: 'Free', price: 0, credits_total: 50, credits_image: 50, credits_video: 0 },
    { id: 'pro', name: 'Pro', price: 49, credits_total: 1000, credits_image: 800, credits_video: 200, popular: true },
  ]

  useEffect(() => { fetchPlans() }, [])

  async function fetchPlans() {
    try {
      setLoading(true)
      const res = await fetch(`${API_URL}/api/plans`)
      const data = await res.json()
      if (data.success && Array.isArray(data.plans) && data.plans.length > 0) {
        setPlans(data.plans)
      } else {
        setPlans(defaultPlans)
      }
    } catch (err) {
      console.error('Error fetching plans:', err)
      setPlans(defaultPlans)
      setError('Using default pricing while we fetch plans...')
    } finally {
      setLoading(false)
    }
  }

  async function handlePurchase(plan) {
    if (plan.id === 'free') {
      // Free tier: encourage signup
      navigate('/login?redirect=/generate')
      return
    }

    if (!isAuthenticated) {
      navigate('/login?redirect=/pricing')
      return
    }

    try {
      setPurchasingPlanId(plan.id)
      setError(null)
      const response = await fetch(`${API_URL}/api/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ planId: plan.id }),
      })
      const data = await response.json()
      if (data.success && data.url) {
        window.location.href = data.url
      } else {
        setError(data.message || 'Failed to create checkout session')
        setPurchasingPlanId(null)
      }
    } catch (err) {
      console.error('Error creating checkout session:', err)
      setError('Failed to start checkout. Please try again.')
      setPurchasingPlanId(null)
    }
  }

  if (loading) {
    return (
      <div className="pricing-page loading">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="pricing-page">
      <div className="container">
        <header className="pricing-header">
          <h1>Choose Your Plan</h1>
          <p>Purchase credits to generate premium images and videos</p>
        </header>

        {error && <div className="info-banner">{error}</div>}

        <section className="pricing-grid">
          {plans.map((plan) => {
            const isProfessional = (plan?.id === 'pro') || /pro(fessional)?/i.test(plan?.name || '')
            return (
            <article key={plan.id} className={`price-card glass ${plan.popular ? 'popular' : ''} ${isProfessional ? 'professional' : ''}`}>
              {plan.popular && <div className="badge-gold">Most Popular</div>}
              <h3 className="plan-name">{plan.name}</h3>
              <div className="price-value">
                <span className="currency">$</span>
                <span className="amount">{plan.price}</span>
                <span className="period">/mo</span>
              </div>
              <ul className="features">
                <li><strong>{plan.credits_total}</strong> Total Credits</li>
                <li><strong>{plan.credits_image}</strong> Image Credits</li>
                <li><strong>{plan.credits_video}</strong> Video Credits</li>
                <li className="muted">1 credit = 1 image · 10/20/30 credits = 4s/8s/12s video</li>
                <li>Priority Support</li>
              </ul>
              <button
                className={`btn btn-full purchase-btn ${plan.id !== 'free' ? 'paid' : 'free'} ${plan.popular ? 'is-popular' : ''}`}
                disabled={purchasingPlanId === plan.id}
                onClick={() => handlePurchase(plan)}
              >
                {purchasingPlanId === plan.id ? 'Processing…' : plan.id === 'free' ? 'Start Free' : 'Purchase Plan'}
              </button>
            </article>
          )})}
        </section>

        <section className="credits-info">
          <div className="card glass">
            <h2>How Credits Work</h2>
            <div className="info-grid">
              <div>
                <h4>Image Generation</h4>
                <p>Each image costs 1 credit. Produce photorealistic, on‑brand visuals for your catalog.</p>
              </div>
              <div>
                <h4>Video Generation</h4>
                <p>4s: 10 credits · 8s: 20 credits · 12s: 30 credits. Perfect for ads and PDP videos.</p>
              </div>
              <div>
                <h4>Secure Payment</h4>
                <p>Stripe processes your payments securely. We never store card data on our servers.</p>
              </div>
              <div>
                <h4>No Expiration</h4>
                <p>Your credits never expire — create at your own pace.</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
