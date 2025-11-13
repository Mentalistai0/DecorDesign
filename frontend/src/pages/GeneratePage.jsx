import { useState } from 'react'
import axios from 'axios'
import { imagePromptTemplates } from '../utils/promptTemplates'
import LoadingSpinner from '../components/LoadingSpinner'
import './GeneratePage.css'

function GeneratePage() {
  const [imageSource, setImageSource] = useState('upload')
  const [imageFile, setImageFile] = useState(null)
  const [imageUrl, setImageUrl] = useState('')
  const [imagePreview, setImagePreview] = useState(null)
  const [prompt, setPrompt] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [generatedImage, setGeneratedImage] = useState(null)
  const [error, setError] = useState('')

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
    setGeneratedImage(null)

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
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 500)

      const formData = new FormData()
      if (imageSource === 'upload' && imageFile) {
        formData.append('image', imageFile)
      } else {
        formData.append('imageUrl', imageUrl)
      }
      formData.append('prompt', prompt)

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/generate-image`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      )

      clearInterval(progressInterval)
      setProgress(100)

      setGeneratedImage(response.data.imageUrl)
    } catch (err) {
      console.error('Generation error:', err)
      setError(err.response?.data?.error || 'Failed to generate image. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="generate-page">
      <div className="container">
        <div className="page-header">
          <h1>Generate Furniture Image</h1>
          <p>Create stunning product visuals with AI</p>
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
              <h2>Prompt</h2>
              <div className="input-group">
                <label htmlFor="prompt">Custom Prompt</label>
                <textarea
                  id="prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe the scene you want to create..."
                  rows="4"
                />
              </div>

              <div className="templates">
                <h3>Or choose a template:</h3>
                <div className="template-grid">
                  {imagePromptTemplates.map((template) => (
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

              <button
                className="btn btn-primary btn-full btn-lg"
                onClick={handleGenerate}
                disabled={isGenerating}
              >
                {isGenerating ? 'Generating...' : 'Generate Image'}
              </button>
            </div>
          </div>

          {/* Right Column - Output */}
          <div className="generate-output">
            <div className="card output-card">
              <h2>Generated Image</h2>

              {isGenerating && (
                <div className="loading-container">
                  <LoadingSpinner />
                  <p>Creating your furniture visualization...</p>
                  <div className="progress-bar">
                    <div
                      className="progress-bar-fill"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="progress-text">{progress}%</p>
                </div>
              )}

              {generatedImage && !isGenerating && (
                <div className="result-container">
                  <img src={generatedImage} alt="Generated" className="generated-image" />
                  <div className="result-actions">
                    <a
                      href={generatedImage}
                      download="decor-design-image.jpg"
                      className="btn btn-primary"
                    >
                      Download
                    </a>
                    <button
                      className="btn btn-secondary"
                      onClick={() => {
                        setGeneratedImage(null)
                        setProgress(0)
                      }}
                    >
                      Generate Another
                    </button>
                  </div>
                </div>
              )}

              {!isGenerating && !generatedImage && (
                <div className="empty-state">
                  <p>Your generated image will appear here</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default GeneratePage
