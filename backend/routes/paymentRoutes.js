import express from 'express';
import stripe, { stripeConfig } from '../config/stripe.js';
import { authenticate } from '../middleware/auth.js';
import { supabase, supabaseAdmin } from '../config/supabase.js';
import {
  getPlans,
  getPlanById,
  getUserCredits,
  addCredits,
  updateStripeCustomerId,
  recordPayment,
  updatePaymentStatus,
  markCreditsAllocated,
} from '../services/creditService.js';

const router = express.Router();

/**
 * Get all available plans
 * GET /api/plans
 */
router.get('/plans', async (req, res) => {
  try {
    const plans = await getPlans();
    res.json({
      success: true,
      plans: plans.map(plan => ({
        id: plan.id,
        name: plan.name,
        credits_total: plan.credits_total,
        credits_image: plan.credits_image,
        credits_video: plan.credits_video,
        price: plan.price_cents / 100, // Convert cents to dollars
        price_cents: plan.price_cents,
      })),
    });
  } catch (error) {
    console.error('Error fetching plans:', error);
    res.status(500).json({
      error: 'Failed to fetch plans',
      message: error.message,
    });
  }
});

/**
 * Create Stripe checkout session
 * POST /api/create-checkout-session
 */
router.post('/create-checkout-session', authenticate, async (req, res) => {
  try {
    const { planId } = req.body;
    const userId = req.user.id;
    const userEmail = req.user.email;

    if (!planId) {
      return res.status(400).json({
        error: 'Plan ID is required',
      });
    }

    // Get plan details
    const plan = await getPlanById(planId);

    if (!plan) {
      return res.status(404).json({
        error: 'Plan not found',
      });
    }

    // Get or create Stripe customer
    const userCredits = await getUserCredits(userId);
    let customerId = userCredits.stripe_customer_id;

    if (!customerId) {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: {
          user_id: userId,
        },
      });
      customerId = customer.id;

      // Save customer ID to database
      await updateStripeCustomerId(userId, customerId);
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: plan.name,
              description: `${plan.credits_image} image credits + ${plan.credits_video} video credits`,
            },
            unit_amount: plan.price_cents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/pricing?canceled=true`,
      metadata: {
        user_id: userId,
        plan_id: planId,
        credits_image: plan.credits_image.toString(),
        credits_video: plan.credits_video.toString(),
      },
    });

    res.json({
      success: true,
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({
      error: 'Failed to create checkout session',
      message: error.message,
    });
  }
});

/**
 * Stripe webhook handler
 * POST /api/webhook
 * IMPORTANT: This endpoint must use raw body, not JSON parsed body
 * This function is exported and mounted in server.js with raw body middleware
 */
export async function handleStripeWebhook(req, res) {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      stripeConfig.webhookSecret
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log('Received Stripe webhook event:', event.type);

  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        console.log('Checkout session completed:', session.id);

        const userId = session.metadata.user_id;
        const planId = session.metadata.plan_id;
        const creditsImage = parseInt(session.metadata.credits_image);
        const creditsVideo = parseInt(session.metadata.credits_video);

        // CRITICAL FIX: Check idempotency - prevent duplicate credit allocation
        const { data: existingPayment, error: checkError } = await supabaseAdmin
          .from('stripe_payments')
          .select('id, credits_allocated, status')
          .eq('stripe_payment_intent_id', session.payment_intent)
          .single();

        if (checkError && checkError.code !== 'PGRST116') {
          // PGRST116 = no rows found, which is expected for new payments
          console.error('Error checking existing payment:', checkError);
          throw new Error(`Failed to verify payment status: ${checkError.message}`);
        }

        if (existingPayment) {
          if (existingPayment.credits_allocated) {
            console.log(`⚠️ DUPLICATE WEBHOOK: Credits already allocated for payment ${session.payment_intent}`);
            return res.json({ received: true, message: 'Already processed' });
          }

          // Payment record exists but credits not allocated - this could be a retry after failure
          console.log(`Resuming credit allocation for payment ${session.payment_intent}`);
        } else {
          // Record payment (first time processing this webhook)
          await recordPayment({
            user_id: userId,
            plan_id: planId,
            stripe_checkout_session_id: session.id,
            stripe_payment_intent_id: session.payment_intent,
            amount_cents: session.amount_total,
            currency: session.currency,
            status: 'succeeded',
            payment_method: 'card',
            metadata: {
              session_id: session.id,
              customer_email: session.customer_details?.email,
            },
          });
        }

        // Allocate credits to user
        await addCredits(
          userId,
          creditsImage,
          creditsVideo,
          'purchase',
          `Plan purchase: ${session.metadata.plan_id}`,
          {
            checkout_session_id: session.id,
            payment_intent_id: session.payment_intent,
          }
        );

        // Mark credits as allocated
        await markCreditsAllocated(session.payment_intent);

        console.log(`✅ Credits allocated: ${creditsImage} image, ${creditsVideo} video to user ${userId}`);
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        console.log('Payment intent succeeded:', paymentIntent.id);

        // Update payment status
        await updatePaymentStatus(paymentIntent.id, 'succeeded');
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        console.log('Payment intent failed:', paymentIntent.id);

        // Update payment status
        await updatePaymentStatus(
          paymentIntent.id,
          'failed',
          paymentIntent.last_payment_error?.message || 'Payment failed'
        );
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object;
        console.log('Charge refunded:', charge.id);

        // Update payment status to refunded
        await updatePaymentStatus(charge.payment_intent, 'refunded');

        // Note: You may want to deduct credits here or handle refunds differently
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({
      error: 'Webhook processing failed',
      message: error.message,
    });
  }
}

/**
 * Verify payment session
 * GET /api/verify-payment/:sessionId
 */
router.get('/verify-payment/:sessionId', authenticate, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;

    // Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // Verify the session belongs to the user
    if (session.metadata.user_id !== userId) {
      return res.status(403).json({
        error: 'Unauthorized',
        message: 'This payment session does not belong to you',
      });
    }

    res.json({
      success: true,
      status: session.payment_status,
      amountTotal: session.amount_total,
      currency: session.currency,
      customerEmail: session.customer_details?.email,
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({
      error: 'Failed to verify payment',
      message: error.message,
    });
  }
});

export default router;
