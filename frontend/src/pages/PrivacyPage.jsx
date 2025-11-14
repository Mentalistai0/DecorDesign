import './LegalPages.css'

export default function PrivacyPage() {
  return (
    <div className="legal-page">
      <div className="container legal-wrap">
        <h1>Privacy Policy</h1>
        <p className="muted">Last updated: {new Date().toLocaleDateString()}</p>

        <section className="legal-section">
          <h2>1. Information We Collect</h2>
          <p>We collect account details (name, email) and usage data necessary to operate the service and process payments.</p>
        </section>

        <section className="legal-section">
          <h2>2. How We Use Data</h2>
          <p>To provide features, improve product quality, prevent abuse, and communicate important updates.</p>
        </section>

        <section className="legal-section">
          <h2>3. Sharing</h2>
          <p>We share data with trusted processors (e.g., payments). We do not sell your personal information.</p>
        </section>

        <section className="legal-section">
          <h2>4. Security</h2>
          <p>We use industry standard protections. No method of transmission is 100% secure; use strong passwords.</p>
        </section>

        <section className="legal-section">
          <h2>5. Your Rights</h2>
          <p>You can access, update, or delete your information by contacting support or via your account.</p>
        </section>

        <section className="legal-section">
          <h2>6. Contact</h2>
          <p>For privacy questions, email privacy@decordesign.app</p>
        </section>
      </div>
    </div>
  )
}

