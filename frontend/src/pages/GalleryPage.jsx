import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import './GalleryPage.css'

function GalleryPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('images')
  const [images, setImages] = useState([])
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedItem, setSelectedItem] = useState(null)

  useEffect(() => {
    fetchGalleryItems()
  }, [])

  const fetchGalleryItems = async () => {
    setLoading(true)
    setError('')

    try {
      const [imagesRes, videosRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/gallery`),
        axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/videos`),
      ])

      const toArray = (payload) => {
        const d = payload?.data
        if (Array.isArray(d)) return d
        if (Array.isArray(d?.items)) return d.items
        if (Array.isArray(d?.data)) return d.data
        // Some APIs return object maps; convert values if they look like items
        if (d && typeof d === 'object') {
          const vals = Object.values(d)
          return Array.isArray(vals) && vals.every((v) => typeof v === 'object') ? vals : []
        }
        return []
      }

      setImages(toArray(imagesRes))
      setVideos(toArray(videosRes))
    } catch (err) {
      console.error('Fetch error:', err)
      setError('Failed to load gallery items')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id, type) => {
    if (!confirm('Are you sure you want to delete this item?')) {
      return
    }

    try {
      const endpoint = type === 'image' ? 'gallery' : 'videos'
      await axios.delete(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/${endpoint}/${id}`
      )

      if (type === 'image') {
        setImages(images.filter((img) => img.id !== id))
      } else {
        setVideos(videos.filter((vid) => vid.id !== id))
      }

      if (selectedItem?.id === id) {
        setSelectedItem(null)
      }
    } catch (err) {
      console.error('Delete error:', err)
      alert('Failed to delete item')
    }
  }

  const handleUseForVideo = (image) => {
    navigate('/video', { state: { sourceImage: image.url } })
  }

  const currentItems = activeTab === 'images' ? images : videos
  const safeCurrentItems = Array.isArray(currentItems) ? currentItems : []
  const imagesCount = Array.isArray(images) ? images.length : 0
  const videosCount = Array.isArray(videos) ? videos.length : 0

  return (
    <div className="gallery-page">
      <div className="container">
        <div className="page-header">
          <h1>Gallery</h1>
          <p>View and manage your AI-generated content</p>
        </div>

        <div className="gallery-tabs">
          <button
            className={`tab ${activeTab === 'images' ? 'active' : ''}`}
            onClick={() => setActiveTab('images')}
          >
            Images ({imagesCount})
          </button>
          <button
            className={`tab ${activeTab === 'videos' ? 'active' : ''}`}
            onClick={() => setActiveTab('videos')}
          >
            Videos ({videosCount})
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading gallery...</p>
          </div>
        ) : safeCurrentItems.length === 0 ? (
          <div className="empty-gallery">
            <div className="empty-icon">
              {activeTab === 'images' ? '🖼️' : '🎬'}
            </div>
            <h2>No {activeTab} yet</h2>
            <p>
              {activeTab === 'images'
                ? 'Generate your first image to see it here'
                : 'Create your first video to see it here'}
            </p>
            <button
              className="btn btn-primary"
              onClick={() => navigate(activeTab === 'images' ? '/generate' : '/video')}
            >
              {activeTab === 'images' ? 'Generate Image' : 'Generate Video'}
            </button>
          </div>
        ) : (
          <div className="gallery-grid">
            {safeCurrentItems.map((item) => (
              <div key={item.id} className="gallery-item">
                <div
                  className="item-preview"
                  onClick={() => setSelectedItem(item)}
                >
                  {activeTab === 'images' ? (
                    <img src={item.url} alt={item.prompt || 'Generated image'} />
                  ) : (
                    <video src={item.url} controls />
                  )}
                </div>

                <div className="item-info">
                  <p className="item-prompt">
                    {item.prompt || 'No prompt available'}
                  </p>
                  <p className="item-date">
                    {new Date(item.created_at).toLocaleDateString()}
                  </p>
                </div>

                <div className="item-actions">
                  {activeTab === 'images' && (
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleUseForVideo(item)}
                    >
                      Use for Video
                    </button>
                  )}
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDelete(item.id, activeTab === 'images' ? 'image' : 'video')}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal for full view */}
        {selectedItem && (
          <div className="modal-overlay" onClick={() => setSelectedItem(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <button
                className="modal-close"
                onClick={() => setSelectedItem(null)}
              >
                ✕
              </button>

              {activeTab === 'images' ? (
                <img src={selectedItem.url} alt="Full view" />
              ) : (
                <video src={selectedItem.url} controls autoPlay />
              )}

              <div className="modal-info">
                <p className="modal-prompt">{selectedItem.prompt}</p>
                <div className="modal-actions">
                  <a
                    href={selectedItem.url}
                    download
                    className="btn btn-primary"
                  >
                    Download
                  </a>
                  {activeTab === 'images' && (
                    <button
                      className="btn btn-secondary"
                      onClick={() => {
                        setSelectedItem(null)
                        handleUseForVideo(selectedItem)
                      }}
                    >
                      Use for Video
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default GalleryPage
