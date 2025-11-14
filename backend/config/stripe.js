import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

// Validate Stripe configuration
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not defined in environment variables');
}

// Initialize Stripe with API version for consistency
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-10-28.acacia',
});

// Export Stripe configuration
export const stripeConfig = {
  secretKey: process.env.STRIPE_SECRET_KEY,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
};

// Credit cost mapping (in credits)
export const CREDIT_COSTS = {
  IMAGE: 1,           // 1 credit per image
  VIDEO_4S: 10,       // 10 credits for 4 second video
  VIDEO_8S: 20,       // 20 credits for 8 second video
  VIDEO_12S: 30,      // 30 credits for 12 second video
};

// Get credit cost for video based on duration
export function getVideoCreditCost(duration) {
  switch (duration) {
    case 4:
      return CREDIT_COSTS.VIDEO_4S;
    case 8:
      return CREDIT_COSTS.VIDEO_8S;
    case 12:
      return CREDIT_COSTS.VIDEO_12S;
    default:
      throw new Error(`Invalid video duration: ${duration}. Must be 4, 8, or 12 seconds.`);
  }
}

export default stripe;
