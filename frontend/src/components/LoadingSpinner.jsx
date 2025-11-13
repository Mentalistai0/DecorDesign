import './LoadingSpinner.css'

function LoadingSpinner({ size = 'medium' }) {
  return (
    <div className={`spinner-container ${size}`}>
      <div className="loading-spinner"></div>
    </div>
  )
}

export default LoadingSpinner
