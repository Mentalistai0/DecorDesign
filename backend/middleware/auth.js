import { supabase } from '../config/supabase.js';

/**
 * Authentication middleware
 * Verifies JWT token from Supabase Auth
 * Attaches user info to req.user
 */
const authenticate = async (req, res, next) => {
  try {
    // Check if Supabase is configured
    if (!supabase) {
      console.warn('Supabase not configured. Skipping authentication.');
      return next();
    }

    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Authentication required. Please provide a valid token.',
        code: 'NO_TOKEN'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      console.error('Authentication error:', error?.message);
      return res.status(401).json({
        error: 'Invalid or expired token. Please login again.',
        code: 'INVALID_TOKEN'
      });
    }

    // Attach user to request object
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role || 'user',
      metadata: user.user_metadata,
    };

    // Attach authenticated Supabase client
    req.supabaseAuth = supabase;

    next();
  } catch (error) {
    console.error('Authentication middleware error:', error);
    return res.status(500).json({
      error: 'Authentication service error',
      code: 'AUTH_ERROR'
    });
  }
};

/**
 * Optional authentication middleware
 * Attaches user if token is valid, but allows request to continue if not
 * Useful for endpoints that work with or without authentication
 */
const optionalAuth = async (req, res, next) => {
  try {
    if (!supabase) {
      return next();
    }

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, continue without user
      return next();
    }

    const token = authHeader.substring(7);

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (!error && user) {
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role || 'user',
        metadata: user.user_metadata,
      };
      req.supabaseAuth = supabase;
    }

    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    // Continue even if there's an error
    next();
  }
};

/**
 * Role-based authorization middleware
 * Requires authenticate middleware to run first
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'NO_USER'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'You do not have permission to access this resource',
        code: 'FORBIDDEN',
        requiredRoles: allowedRoles
      });
    }

    next();
  };
};

/**
 * Middleware to ensure user owns the resource
 * Checks if req.user.id matches the user_id of the resource
 */
const checkOwnership = (userIdField = 'user_id') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'NO_USER'
      });
    }

    // The resource should be attached to req by previous middleware
    if (req.resource && req.resource[userIdField] !== req.user.id) {
      return res.status(403).json({
        error: 'You do not have permission to access this resource',
        code: 'NOT_OWNER'
      });
    }

    next();
  };
};

export {
  authenticate,
  optionalAuth,
  authorize,
  checkOwnership,
  supabase,
};
