import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

// Import security middleware
import { configureHelmet, apiLimiter } from './middleware/security.js'

// Import routes
import authRoutes from './routes/authRoutes.js'
import imageRoutes from './routes/imageRoutes.js'
import videoRoutes from './routes/videoRoutes.js'
import galleryRoutes from './routes/galleryRoutes.js'
import paymentRoutes, { handleStripeWebhook } from './routes/paymentRoutes.js'
import creditsRoutes from './routes/creditsRoutes.js'

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

// Security Middleware
app.use(configureHelmet())

// CORS Configuration - restrict to frontend domain
const allowedOrigins = [
  'http://localhost:5173', // Vite dev server
  'http://localhost:3000', // Alternative frontend port
  process.env.FRONTEND_URL, // Production frontend URL
].filter(Boolean); // Remove undefined values

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    // Check if origin is in allowed list
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }

    // Allow Vercel preview and production deployments
    if (origin && (
      origin.endsWith('.vercel.app') ||
      origin === process.env.FRONTEND_URL
    )) {
      return callback(null, true);
    }

    console.warn(`CORS blocked request from origin: ${origin}`);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Stripe webhook route (must be before body parsing middleware)
// This route needs raw body for signature verification
app.post('/api/webhook', express.raw({ type: 'application/json' }), handleStripeWebhook);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Apply rate limiting to all API routes
app.use('/api', apiLimiter)

// Serve static files from uploads directory
app.use('/uploads', express.static(uploadsDir))

// Routes
app.use('/api/auth', authRoutes)
app.use('/api', imageRoutes)
app.use('/api', videoRoutes)
app.use('/api', galleryRoutes)
app.use('/api', paymentRoutes)
app.use('/api', creditsRoutes)

// Health check endpoint (detailed)
app.get('/health', (req, res) => {
  const health = {
    status: 'OK',
    message: 'Decor Design API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    checks: {
      supabase: !!process.env.SUPABASE_URL && !!process.env.SUPABASE_ANON_KEY,
      fal: !!process.env.FAL_API_KEY,
      stripe: !!process.env.STRIPE_SECRET_KEY,
    }
  };

  res.json(health);
});

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
