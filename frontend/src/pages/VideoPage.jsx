import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import axios from 'axios'
import { videoPromptTemplates } from '../utils/promptTemplates'
import LoadingSpinner from '../components/LoadingSpinner'
import './VideoPage.css'

function VideoPage() {
  const location = useLocation()
  const [imageSource, setImageSource] = useState('upload')
  const [imageFile, setImageFile] = useState(null)
  const [imageUrl, setImageUrl] = useState('')
  const [imagePreview, setImagePreview] = useState(null)
  const [prompt, setPrompt] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [generatedVideo, setGeneratedVideo] = useState(null)
  const [error, setError] = useState('')

  // Check if coming from gallery with a source image
  useEffect(() => {
    if (location.state?.sourceImage) {
      setImageUrl(location.state.sourceImage)
      setImagePreview(location.state.sourceImage)
      setImageSource('url')
    }
  }, [location])

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleUrlChange = (e) => {
    const url = e.target.value
    setImageUrl(url)
    if (url) {
      setImagePreview(url)
    }
  }

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template.id)
    setPrompt(template.prompt)
  }

  const handleGenerate = async () => {
    setError('')
    setGeneratedVideo(null)

    if (!imagePreview) {
      setError('Please upload an image or enter an image URL')
      return
    }

    if (!prompt) {
      setError('Please enter a prompt or select a template')
      return
    }

    setIsGenerating(true)
    setProgress(0)

    try {
      // Simulate progress (video generation takes longer)
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 85) {
            clearInterval(progressInterval)
            return 85
          }
          return prev + 5
        })
      }, 1000)

      const formData = new FormData()
      if (imageSource === 'upload' && imageFile) {
        formData.append('image', imageFile)
      } else {
        formData.append('imageUrl', imageUrl)
      }
      formData.append('prompt', prompt)

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/generate-video`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      )

      clearInterval(progressInterval)
      setProgress(100)

      setGeneratedVideo(response.data.videoUrl)
    } catch (err) {
      console.error('Generation error:', err)
      setError(err.response?.data?.error || 'Failed to generate video. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="video-page">
      <div className="container">
        <div className="page-header">
          <h1>Generate Furniture Video</h1>
          <p>Create stunning product showcase videos with AI</p>
        </div>

        <div className="generate-layout">
          {/* Left Column - Input */}
          <div className="generate-input">
            <div className="card">
              <h2>Image Source</h2>
              <div className="source-tabs">
                <button
                  className={`tab ${imageSource === 'upload' ? 'active' : ''}`}
                  onClick={() => setImageSource('upload')}
                >
                  Upload Image
                </button>
                <button
                  className={`tab ${imageSource === 'url' ? 'active' : ''}`}
                  onClick={() => setImageSource('url')}
                >
                  Image URL
                </button>
              </div>

              {imageSource === 'upload' ? (
                <div className="input-group">
                  <label htmlFor="image-upload">Choose Image</label>
                  <input
                    type="file"
                    id="image-upload"
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                </div>
              ) : (
                <div className="input-group">
                  <label htmlFor="image-url">Image URL</label>
                  <input
                    type="url"
                    id="image-url"
                    value={imageUrl}
                    onChange={handleUrlChange}
                    placeholder="https://example.com/furniture.jpg"
                  />
                </div>
              )}

              {imagePreview && (
                <div className="image-preview">
                  <img src={imagePreview} alt="Source" />
                </div>
              )}
            </div>

            <div className="card">
              <h2>Video Prompt</h2>
              <div className="input-group">
                <label htmlFor="prompt">Custom Prompt</label>
                <textarea
                  id="prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe the video you want to create..."
                  rows="4"
                />
              </div>

              <div className="templates">
                <h3>Or choose a template:</h3>
                <div className="template-grid">
                  {videoPromptTemplates.map((template) => (
                    <button
                      key={template.id}
                      className={`template-btn ${selectedTemplate === template.id ? 'active' : ''}`}
                      onClick={() => handleTemplateSelect(template)}
                    >
                      {template.name}
                    </button>
                  ))}
                </div>
              </div>

              {error && <div className="error-message">{error}</div>}

              <div className="generation-notice">
                <p>
                  <strong>Note:</strong> Video generation typically takes 30-90 seconds.
                  Please be patient while we create your video.
                </p>
              </div>

              <button
                className="btn btn-primary btn-full btn-lg"
                onClick={handleGenerate}
                disabled={isGenerating}
              >
                {isGenerating ? 'Generating Video...' : 'Generate Video'}
              </button>
            </div>
          </div>

          {/* Right Column - Output */}
          <div className="generate-output">
            <div className="card output-card">
              <h2>Generated Video</h2>

              {isGenerating && (
                <div className="loading-container">
                  <LoadingSpinner size="large" />
                  <p>Creating your furniture video...</p>
                  <p className="loading-subtext">This may take up to 90 seconds</p>
                  <div className="progress-bar">
                    <div
                      className="progress-bar-fill"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="progress-text">{progress}%</p>
                </div>
              )}

              {generatedVideo && !isGenerating && (
                <div className="result-container">
                  <video
                    src={generatedVideo}
                    controls
                    autoPlay
                    className="generated-video"
                  />
                  <div className="result-actions">
                    <a
                      href={generatedVideo}
                      download="decor-design-video.mp4"
                      className="btn btn-primary"
                    >
                      Download
                    </a>
                    <button
                      className="btn btn-secondary"
                      onClick={() => {
                        setGeneratedVideo(null)
                        setProgress(0)
                      }}
                    >
                      Generate Another
                    </button>
                  </div>
                </div>
              )}

              {!isGenerating && !generatedVideo && (
                <div className="empty-state">
                  <p>Your generated video will appear here</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VideoPage
