import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  getUserCredits,
  getCreditTransactions,
  initializeUserCredits,
} from '../services/creditService.js';

const router = express.Router();

/**
 * Get user's credit balance
 * GET /api/credits
 */
router.get('/credits', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const credits = await getUserCredits(userId);

    res.json({
      success: true,
      credits: {
        image: {
          total: credits.credits_image_total,
          used: credits.credits_image_used,
          available: credits.credits_image_available,
        },
        video: {
          total: credits.credits_video_total,
          used: credits.credits_video_used,
          available: credits.credits_video_available,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching user credits:', error);

    // If user doesn't have credits record, initialize it
    if (error.message.includes('no rows')) {
      try {
        await initializeUserCredits(req.user.id);
        return res.json({
          success: true,
          credits: {
            image: { total: 0, used: 0, available: 0 },
            video: { total: 0, used: 0, available: 0 },
          },
        });
      } catch (initError) {
        console.error('Error initializing credits:', initError);
      }
    }

    res.status(500).json({
      error: 'Failed to fetch credits',
      message: error.message,
    });
  }
});

/**
 * Get user's credit transaction history
 * GET /api/credits/transactions?limit=50&offset=0
 */
router.get('/credits/transactions', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    const transactions = await getCreditTransactions(userId, limit, offset);

    res.json({
      success: true,
      transactions: transactions.map(tx => ({
        id: tx.id,
        type: tx.transaction_type,
        creditType: tx.credit_type,
        amount: tx.amount,
        balanceBefore: tx.balance_before,
        balanceAfter: tx.balance_after,
        description: tx.description,
        createdAt: tx.created_at,
        metadata: tx.metadata,
      })),
      pagination: {
        limit,
        offset,
        hasMore: transactions.length === limit,
      },
    });
  } catch (error) {
    console.error('Error fetching credit transactions:', error);
    res.status(500).json({
      error: 'Failed to fetch transactions',
      message: error.message,
    });
  }
});

/**
 * Initialize credits for a new user (admin only or automatic on signup)
 * POST /api/credits/initialize
 */
router.post('/credits/initialize', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    await initializeUserCredits(userId);

    res.json({
      success: true,
      message: 'Credits initialized successfully',
    });
  } catch (error) {
    console.error('Error initializing credits:', error);

    // If credits already exist, return success
    if (error.message.includes('unique constraint')) {
      return res.json({
        success: true,
        message: 'Credits already initialized',
      });
    }

    res.status(500).json({
      error: 'Failed to initialize credits',
      message: error.message,
    });
  }
});

export default router;
