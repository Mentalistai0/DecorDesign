import './LegalPages.css'

export default function TermsPage() {
  return (
    <div className="legal-page">
      <div className="container legal-wrap">
        <h1>Terms of Service</h1>
        <p className="muted">Last updated: {new Date().toLocaleDateString()}</p>

        <section className="legal-section">
          <h2>1. Overview</h2>
          <p>These Terms govern your access and use of DecorDesign. By creating an account you agree to these Terms.</p>
        </section>

        <section className="legal-section">
          <h2>2. Accounts</h2>
          <p>You are responsible for maintaining the confidentiality of your account and for all activities under it.</p>
        </section>

        <section className="legal-section">
          <h2>3. Usage</h2>
          <p>Generated content must comply with applicable laws and third‑party model licenses. Do not upload unlawful content.</p>
        </section>

        <section className="legal-section">
          <h2>4. Credits & Billing</h2>
          <p>Purchases are processed by our payment provider. Credits are non‑transferable and may be consumed by generations.</p>
        </section>

        <section className="legal-section">
          <h2>5. Termination</h2>
          <p>We may suspend access for violations of these Terms. You may cancel at any time from your account.</p>
        </section>

        <section className="legal-section">
          <h2>6. Contact</h2>
          <p>Questions? Contact support at support@decordesign.app</p>
        </section>
      </div>
    </div>
  )
}

