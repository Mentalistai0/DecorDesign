import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import validator from 'validator';

/**
 * Rate limiter for API endpoints
 * Prevents abuse by limiting requests per IP address
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

/**
 * Stricter rate limiter for generation endpoints
 * These are expensive operations that consume API credits
 */
const generationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 generations per 15 minutes
  message: {
    error: 'Generation rate limit exceeded. Please wait before creating more content.',
    retryAfter: '15 minutes',
    limit: 20
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for authenticated premium users (implement later)
  skip: (req) => {
    return req.user?.isPremium === true;
  }
});

/**
 * Input sanitization middleware
 * Sanitizes text inputs to prevent XSS attacks
 */
const sanitizeInput = (req, res, next) => {
  try {
    // Sanitize text fields in body
    if (req.body) {
      Object.keys(req.body).forEach(key => {
        if (typeof req.body[key] === 'string') {
          // Remove any potential script tags and dangerous characters
          req.body[key] = validator.escape(req.body[key]);
          // Normalize whitespace
          req.body[key] = req.body[key].trim();
        }
      });
    }

    // Sanitize query parameters
    if (req.query) {
      Object.keys(req.query).forEach(key => {
        if (typeof req.query[key] === 'string') {
          req.query[key] = validator.escape(req.query[key]);
          req.query[key] = req.query[key].trim();
        }
      });
    }

    next();
  } catch (error) {
    console.error('Input sanitization error:', error);
    next(error);
  }
};

/**
 * Validate URL inputs
 */
const validateUrl = (url) => {
  if (!url) return false;

  // Check if it's a valid URL
  if (!validator.isURL(url, {
    protocols: ['http', 'https'],
    require_protocol: true,
    require_valid_protocol: true
  })) {
    return false;
  }

  // Additional security: block localhost and internal IPs
  const urlObj = new URL(url);
  const hostname = urlObj.hostname;

  // Block localhost and internal networks
  const blockedPatterns = [
    /^localhost$/i,
    /^127\./,
    /^192\.168\./,
    /^10\./,
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
    /^::1$/,
    /^fe80:/i,
  ];

  if (blockedPatterns.some(pattern => pattern.test(hostname))) {
    return false;
  }

  return true;
};

/**
 * Validate prompt input
 */
const validatePrompt = (prompt) => {
  if (!prompt || typeof prompt !== 'string') {
    return { valid: false, error: 'Prompt is required and must be a string' };
  }

  const trimmedPrompt = prompt.trim();

  // Check length
  if (trimmedPrompt.length < 3) {
    return { valid: false, error: 'Prompt must be at least 3 characters long' };
  }

  if (trimmedPrompt.length > 1000) {
    return { valid: false, error: 'Prompt must be less than 1000 characters' };
  }

  // Check for potentially harmful content (basic check)
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /onerror=/i,
    /onclick=/i,
    /<iframe/i,
  ];

  if (suspiciousPatterns.some(pattern => pattern.test(trimmedPrompt))) {
    return { valid: false, error: 'Prompt contains invalid characters or patterns' };
  }

  return { valid: true, prompt: trimmedPrompt };
};

/**
 * Request validation middleware for image generation
 */
const validateImageGeneration = (req, res, next) => {
  const { imageUrl, prompt } = req.body;
  const imageFile = req.file;

  // Validate prompt
  const promptValidation = validatePrompt(prompt);
  if (!promptValidation.valid) {
    return res.status(400).json({ error: promptValidation.error });
  }

  // Update with sanitized prompt
  req.body.prompt = promptValidation.prompt;

  // Validate image source (either file or URL required)
  if (!imageFile && !imageUrl) {
    return res.status(400).json({
      error: 'Either an image file or image URL is required'
    });
  }

  // If URL is provided, validate it
  if (imageUrl && !validateUrl(imageUrl)) {
    return res.status(400).json({
      error: 'Invalid image URL. Must be a valid HTTP/HTTPS URL and not point to internal networks.'
    });
  }

  next();
};

/**
 * Request validation middleware for video generation
 */
const validateVideoGeneration = (req, res, next) => {
  const { imageUrl, prompt } = req.body;
  const imageFile = req.file;

  // Validate prompt
  const promptValidation = validatePrompt(prompt);
  if (!promptValidation.valid) {
    return res.status(400).json({ error: promptValidation.error });
  }

  req.body.prompt = promptValidation.prompt;

  // Validate image source
  if (!imageFile && !imageUrl) {
    return res.status(400).json({
      error: 'Either an image file or image URL is required'
    });
  }

  if (imageUrl && !validateUrl(imageUrl)) {
    return res.status(400).json({
      error: 'Invalid image URL. Must be a valid HTTP/HTTPS URL and not point to internal networks.'
    });
  }

  next();
};

/**
 * Configure helmet with security headers
 */
const configureHelmet = () => {
  return helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
        connectSrc: ["'self'", 'https://api.fal.ai', 'https://*.supabase.co'],
        fontSrc: ["'self'", 'data:'],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'", 'https:', 'blob:'],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false, // Allow loading external images
    crossOriginResourcePolicy: { policy: "cross-origin" },
  });
};

export {
  apiLimiter,
  generationLimiter,
  sanitizeInput,
  validateUrl,
  validatePrompt,
  validateImageGeneration,
  validateVideoGeneration,
  configureHelmet,
};
