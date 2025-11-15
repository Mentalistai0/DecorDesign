import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Simple admin auth middleware (you should enhance this with proper admin roles)
const isAdmin = async (req, res, next) => {
  // TODO: Implement proper admin role checking
  // For now, just check if user is authenticated
  if (!req.user) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

/**
 * Get all payments/subscriptions
 * GET /api/admin/payments
 */
router.get('/payments', authenticate, isAdmin, async (req, res) => {
  try {
    const { data: payments, error } = await supabaseAdmin
      .from('stripe_payments')
      .select(`
        *,
        user:user_id (
          email
        ),
        plan:plan_id (
          name,
          credits_total
        )
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    res.json({
      success: true,
      count: payments.length,
      payments: payments.map(p => ({
        id: p.id,
        user_email: p.user?.email,
        plan_name: p.plan?.name,
        amount_usd: p.amount_cents / 100,
        status: p.status,
        credits_allocated: p.credits_allocated,
        payment_method: p.payment_method,
        stripe_payment_intent_id: p.stripe_payment_intent_id,
        created_at: p.created_at,
      })),
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({
      error: 'Failed to fetch payments',
      message: error.message,
    });
  }
});

/**
 * Get all user credits
 * GET /api/admin/credits
 */
router.get('/credits', authenticate, isAdmin, async (req, res) => {
  try {
    const { data: credits, error } = await supabaseAdmin
      .from('user_credits')
      .select(`
        *,
        user:user_id (
          email,
          created_at
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      count: credits.length,
      users: credits.map(c => ({
        user_email: c.user?.email,
        image_credits_total: c.credits_image_total,
        image_credits_used: c.credits_image_used,
        image_credits_available: c.credits_image_total - c.credits_image_used,
        video_credits_total: c.credits_video_total,
        video_credits_used: c.credits_video_used,
        video_credits_available: c.credits_video_total - c.credits_video_used,
        stripe_customer_id: c.stripe_customer_id,
        account_created: c.user?.created_at,
      })),
    });
  } catch (error) {
    console.error('Error fetching credits:', error);
    res.status(500).json({
      error: 'Failed to fetch credits',
      message: error.message,
    });
  }
});

/**
 * Get credit transaction history
 * GET /api/admin/transactions
 */
router.get('/transactions', authenticate, isAdmin, async (req, res) => {
  try {
    const { limit = 100, user_id, transaction_type } = req.query;

    let query = supabaseAdmin
      .from('credit_transactions')
      .select(`
        *,
        user:user_id (
          email
        )
      `)
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    if (user_id) {
      query = query.eq('user_id', user_id);
    }

    if (transaction_type) {
      query = query.eq('transaction_type', transaction_type);
    }

    const { data: transactions, error } = await query;

    if (error) throw error;

    res.json({
      success: true,
      count: transactions.length,
      transactions: transactions.map(t => ({
        id: t.id,
        user_email: t.user?.email,
        transaction_type: t.transaction_type,
        credit_type: t.credit_type,
        amount: t.amount,
        balance_before: t.balance_before,
        balance_after: t.balance_after,
        description: t.description,
        created_at: t.created_at,
      })),
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({
      error: 'Failed to fetch transactions',
      message: error.message,
    });
  }
});

/**
 * Get dashboard statistics
 * GET /api/admin/stats
 */
router.get('/stats', authenticate, isAdmin, async (req, res) => {
  try {
    // Get total users
    const { count: totalUsers } = await supabaseAdmin
      .from('user_credits')
      .select('*', { count: 'exact', head: true });

    // Get total payments
    const { data: payments } = await supabaseAdmin
      .from('stripe_payments')
      .select('amount_cents, status');

    const totalRevenue = payments
      ?.filter(p => p.status === 'succeeded')
      ?.reduce((sum, p) => sum + p.amount_cents, 0) || 0;

    const successfulPayments = payments?.filter(p => p.status === 'succeeded').length || 0;
    const pendingPayments = payments?.filter(p => p.status === 'pending').length || 0;
    const failedPayments = payments?.filter(p => p.status === 'failed').length || 0;

    // Get total credits distributed
    const { data: creditsData } = await supabaseAdmin
      .from('user_credits')
      .select('credits_image_total, credits_video_total, credits_image_used, credits_video_used');

    const totalImageCredits = creditsData?.reduce((sum, c) => sum + c.credits_image_total, 0) || 0;
    const totalVideoCredits = creditsData?.reduce((sum, c) => sum + c.credits_video_total, 0) || 0;
    const usedImageCredits = creditsData?.reduce((sum, c) => sum + c.credits_image_used, 0) || 0;
    const usedVideoCredits = creditsData?.reduce((sum, c) => sum + c.credits_video_used, 0) || 0;

    res.json({
      success: true,
      stats: {
        users: {
          total: totalUsers,
        },
        revenue: {
          total_usd: totalRevenue / 100,
          total_cents: totalRevenue,
        },
        payments: {
          total: payments?.length || 0,
          successful: successfulPayments,
          pending: pendingPayments,
          failed: failedPayments,
        },
        credits: {
          image: {
            total_distributed: totalImageCredits,
            used: usedImageCredits,
            available: totalImageCredits - usedImageCredits,
          },
          video: {
            total_distributed: totalVideoCredits,
            used: usedVideoCredits,
            available: totalVideoCredits - usedVideoCredits,
          },
        },
      },
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      error: 'Failed to fetch statistics',
      message: error.message,
    });
  }
});

export default router;
