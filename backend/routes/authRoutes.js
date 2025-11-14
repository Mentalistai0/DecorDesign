import express from 'express';
import { supabase } from '../middleware/auth.js';
import { apiLimiter } from '../middleware/security.js';

const router = express.Router();

// Signup endpoint
router.post('/signup', apiLimiter, async (req, res) => {
  try {
    if (!supabase) {
      return res.status(503).json({
        error: 'Authentication service not configured',
        code: 'AUTH_NOT_CONFIGURED'
      });
    }

    const { email, password, name } = req.body;

    // Validate inputs
    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required',
        code: 'MISSING_CREDENTIALS'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Invalid email format',
        code: 'INVALID_EMAIL'
      });
    }

    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({
        error: 'Password must be at least 8 characters long',
        code: 'WEAK_PASSWORD'
      });
    }

    // Create user with Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name || email.split('@')[0],
        }
      }
    });

    if (error) {
      console.error('Signup error:', error);

      // Handle specific error cases
      if (error.message.includes('already registered')) {
        return res.status(400).json({
          error: 'This email is already registered',
          code: 'EMAIL_EXISTS'
        });
      }

      return res.status(400).json({
        error: error.message,
        code: 'SIGNUP_FAILED'
      });
    }

    res.status(201).json({
      success: true,
      message: 'Account created successfully. Please check your email for verification.',
      user: {
        id: data.user?.id,
        email: data.user?.email,
        name: data.user?.user_metadata?.name,
      },
      session: {
        access_token: data.session?.access_token,
        refresh_token: data.session?.refresh_token,
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      error: 'Failed to create account',
      code: 'SERVER_ERROR'
    });
  }
});

// Login endpoint
router.post('/login', apiLimiter, async (req, res) => {
  try {
    if (!supabase) {
      return res.status(503).json({
        error: 'Authentication service not configured',
        code: 'AUTH_NOT_CONFIGURED'
      });
    }

    const { email, password } = req.body;

    // Validate inputs
    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required',
        code: 'MISSING_CREDENTIALS'
      });
    }

    // Sign in with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Login error:', error);
      return res.status(401).json({
        error: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS'
      });
    }

    res.json({
      success: true,
      message: 'Logged in successfully',
      user: {
        id: data.user?.id,
        email: data.user?.email,
        name: data.user?.user_metadata?.name,
      },
      session: {
        access_token: data.session?.access_token,
        refresh_token: data.session?.refresh_token,
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Failed to log in',
      code: 'SERVER_ERROR'
    });
  }
});

// Logout endpoint
router.post('/logout', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(503).json({
        error: 'Authentication service not configured',
        code: 'AUTH_NOT_CONFIGURED'
      });
    }

    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(200).json({
        success: true,
        message: 'Logged out successfully'
      });
    }

    const token = authHeader.substring(7);

    // Sign out from Supabase
    const { error } = await supabase.auth.admin.signOut(token);

    if (error) {
      console.error('Logout error:', error);
    }

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      error: 'Failed to log out',
      code: 'SERVER_ERROR'
    });
  }
});

// Get current user endpoint
router.get('/me', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(503).json({
        error: 'Authentication service not configured',
        code: 'AUTH_NOT_CONFIGURED'
      });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'No authentication token provided',
        code: 'NO_TOKEN'
      });
    }

    const token = authHeader.substring(7);

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        error: 'Invalid or expired token',
        code: 'INVALID_TOKEN'
      });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name,
        createdAt: user.created_at,
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      error: 'Failed to get user information',
      code: 'SERVER_ERROR'
    });
  }
});

// Refresh token endpoint
router.post('/refresh', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(503).json({
        error: 'Authentication service not configured',
        code: 'AUTH_NOT_CONFIGURED'
      });
    }

    const { refresh_token } = req.body;

    if (!refresh_token) {
      return res.status(400).json({
        error: 'Refresh token is required',
        code: 'MISSING_REFRESH_TOKEN'
      });
    }

    const { data, error } = await supabase.auth.refreshSession({
      refresh_token
    });

    if (error) {
      console.error('Token refresh error:', error);
      return res.status(401).json({
        error: 'Invalid or expired refresh token',
        code: 'INVALID_REFRESH_TOKEN'
      });
    }

    res.json({
      success: true,
      session: {
        access_token: data.session?.access_token,
        refresh_token: data.session?.refresh_token,
      }
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      error: 'Failed to refresh token',
      code: 'SERVER_ERROR'
    });
  }
});

export default router;
