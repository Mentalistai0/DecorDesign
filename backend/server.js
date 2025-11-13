import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

// Import routes
import imageRoutes from './routes/imageRoutes.js'
import videoRoutes from './routes/videoRoutes.js'
import galleryRoutes from './routes/galleryRoutes.js'

// Load environment variables
dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3000

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads')
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir)
}

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Serve static files from uploads directory
app.use('/uploads', express.static(uploadsDir))

// Routes
app.use('/api', imageRoutes)
app.use('/api', videoRoutes)
app.use('/api', galleryRoutes)

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Decor Design API is running' })
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err)
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

app.listen(PORT, () => {
  console.log(`🚀 Decor Design API server running on port ${PORT}`)
  console.log(`📝 Health check: http://localhost:${PORT}/health`)
})
