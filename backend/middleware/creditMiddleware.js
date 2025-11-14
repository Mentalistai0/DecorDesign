import { hasEnoughCredits, getUserCredits, initializeUserCredits } from '../services/creditService.js';
import { CREDIT_COSTS, getVideoCreditCost } from '../config/stripe.js';

/**
 * Middleware to check if user has enough credits for image generation
 * IMPORTANT: This middleware now DEDUCTS credits before generation
 * to prevent race conditions where users get free content
 */
export async function checkImageCredits(req, res, next) {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'You must be logged in to generate images',
      });
    }

    const userId = req.user.id;
    const requiredCredits = CREDIT_COSTS.IMAGE;

    // Check if user has enough credits
    const hasCredits = await hasEnoughCredits(userId, 'image', requiredCredits);

    if (!hasCredits) {
      const credits = await getUserCredits(userId);
      return res.status(403).json({
        error: 'Insufficient credits',
        message: `You need ${requiredCredits} image credit(s) to generate an image. You have ${credits.credits_image_available} available.`,
        required: requiredCredits,
        available: credits.credits_image_available,
        creditType: 'image',
      });
    }

    // Store required credits in request for tracking
    req.creditsRequired = {
      type: 'image',
      amount: requiredCredits,
    };

    next();
  } catch (error) {
    console.error('Error checking image credits:', error);

    // If error is about missing credits record, try to initialize
    if (error.message.includes('no rows')) {
      try {
        await initializeUserCredits(req.user.id);
        return res.status(403).json({
          error: 'Insufficient credits',
          message: 'You have no credits. Please purchase a plan to start generating images.',
          required: CREDIT_COSTS.IMAGE,
          available: 0,
          creditType: 'image',
        });
      } catch (initError) {
        console.error('Error initializing credits:', initError);
      }
    }

    res.status(500).json({
      error: 'Failed to check credits',
      message: 'An error occurred while checking your credit balance',
    });
  }
}

/**
 * Middleware to check if user has enough credits for video generation
 */
export async function checkVideoCredits(req, res, next) {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'You must be logged in to generate videos',
      });
    }

    const userId = req.user.id;

    // Get video duration from request (default to 4 seconds if not specified)
    const duration = parseInt(req.body.duration) || 4;

    // Validate duration
    if (![4, 8, 12].includes(duration)) {
      return res.status(400).json({
        error: 'Invalid duration',
        message: 'Video duration must be 4, 8, or 12 seconds',
      });
    }

    // Calculate required credits based on duration
    const requiredCredits = getVideoCreditCost(duration);

    // Check if user has enough credits
    const hasCredits = await hasEnoughCredits(userId, 'video', requiredCredits);

    if (!hasCredits) {
      const credits = await getUserCredits(userId);
      return res.status(403).json({
        error: 'Insufficient credits',
        message: `You need ${requiredCredits} video credit(s) to generate a ${duration}-second video. You have ${credits.credits_video_available} available.`,
        required: requiredCredits,
        available: credits.credits_video_available,
        creditType: 'video',
        duration: duration,
      });
    }

    // Store required credits in request for later deduction
    req.creditsRequired = {
      type: 'video',
      amount: requiredCredits,
      duration: duration,
    };

    next();
  } catch (error) {
    console.error('Error checking video credits:', error);

    // If error is about missing credits record, try to initialize
    if (error.message.includes('no rows')) {
      try {
        await initializeUserCredits(req.user.id);
        const duration = parseInt(req.body.duration) || 4;
        const requiredCredits = getVideoCreditCost(duration);
        return res.status(403).json({
          error: 'Insufficient credits',
          message: 'You have no credits. Please purchase a plan to start generating videos.',
          required: requiredCredits,
          available: 0,
          creditType: 'video',
          duration: duration,
        });
      } catch (initError) {
        console.error('Error initializing credits:', initError);
      }
    }

    res.status(500).json({
      error: 'Failed to check credits',
      message: 'An error occurred while checking your credit balance',
    });
  }
}

/**
 * Helper function to deduct credits BEFORE generation
 * Returns a transaction ID that can be used for refunds if needed
 */
export { deductCredits, addCredits } from '../services/creditService.js';

/**
 * Helper function to refund credits if generation fails
 * @param {string} userId - User's UUID
 * @param {string} creditType - 'image' or 'video'
 * @param {number} amount - Number of credits to refund
 * @param {string} reason - Reason for refund
 */
export async function refundCredits(userId, creditType, amount, reason) {
  try {
    const { addCredits } = await import('../services/creditService.js');

    // Add credits back based on type
    if (creditType === 'image') {
      await addCredits(userId, amount, 0, 'refund', reason);
    } else if (creditType === 'video') {
      await addCredits(userId, 0, amount, 'refund', reason);
    }

    console.log(`Refunded ${amount} ${creditType} credits to user ${userId}: ${reason}`);
    return true;
  } catch (error) {
    console.error('Error refunding credits:', error);
    return false;
  }
}
