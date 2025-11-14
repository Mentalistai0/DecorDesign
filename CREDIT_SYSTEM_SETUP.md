# Credit System & Stripe Integration Setup Guide

This document provides a complete guide to setting up and using the credit-based pricing system with Stripe payment integration for DecorDesign.

## Table of Contents

1. [Overview](#overview)
2. [Database Setup](#database-setup)
3. [Stripe Configuration](#stripe-configuration)
4. [Environment Variables](#environment-variables)
5. [Testing the System](#testing-the-system)
6. [Credit Pricing Structure](#credit-pricing-structure)
7. [API Endpoints](#api-endpoints)
8. [Troubleshooting](#troubleshooting)

## Overview

The credit system allows users to purchase credits that can be used for:
- **Image Generation**: 1 credit per image
- **Video Generation**:
  - 4-second video: 10 credits
  - 8-second video: 20 credits
  - 12-second video: 30 credits

### Available Plans

| Plan | Credits | Image | Video | Price |
|------|---------|-------|-------|-------|
| Starter | 200 | 100 | 100 | $99 |
| Professional | 500 | 250 | 250 | $199 |
| Enterprise | 1200 | 600 | 600 | $299 |

## Database Setup

### 1. Run the Migration

Execute the credit system migration on your Supabase database:

```bash
# Navigate to the database migrations directory
cd database/migrations

# Apply the migration in Supabase SQL Editor or via CLI
# Copy and paste the contents of add_credit_system.sql
```

**Migration File**: `/database/migrations/add_credit_system.sql`

This creates:
- `plans` table - Stores available pricing plans
- `user_credits` table - Tracks user credit balances
- `credit_transactions` table - Audit log of all credit operations
- `stripe_payments` table - Records Stripe payment transactions
- Database functions for credit management

### 2. Verify Tables

After running the migration, verify these tables exist:
```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('plans', 'user_credits', 'credit_transactions', 'stripe_payments');
```

### 3. Verify Plans

Check that the 3 plans were inserted:
```sql
SELECT name, credits_total, credits_image, credits_video, price_cents
FROM plans
WHERE is_active = true;
```

## Stripe Configuration

### 1. Create Stripe Account

1. Go to [https://stripe.com](https://stripe.com) and create an account
2. Complete the account verification process
3. Switch to **Test Mode** (toggle in top right)

### 2. Get API Keys

1. Navigate to **Developers** → **API keys**
2. Copy your **Publishable key** (starts with `pk_test_`)
3. Copy your **Secret key** (starts with `sk_test_`)
4. Keep these secure!

### 3. Set Up Webhook

Webhooks are required for Stripe to notify your server of payment events.

#### Development (Using Stripe CLI)

1. Install Stripe CLI: [https://stripe.com/docs/stripe-cli](https://stripe.com/docs/stripe-cli)

2. Login to Stripe:
   ```bash
   stripe login
   ```

3. Forward webhooks to your local server:
   ```bash
   stripe listen --forward-to http://localhost:3000/api/webhook
   ```

4. Copy the webhook signing secret (starts with `whsec_`)

#### Production

1. Go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Enter your endpoint URL: `https://yourdomain.com/api/webhook`
4. Select events to listen for:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
5. Copy the webhook signing secret

## Environment Variables

### Backend (.env)

Update `/backend/.env` with your Stripe credentials:

```env
# Existing variables...
PORT=3000
NODE_ENV=development
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
FAL_API_KEY=your_fal_api_key

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here

# Frontend URL (for redirects)
FRONTEND_URL=http://localhost:5173
```

### Frontend (.env)

Update `/frontend/.env`:

```env
# Existing variables...
VITE_API_URL=http://localhost:3000
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Stripe Configuration
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
```

## Testing the System

### 1. Start the Services

```bash
# Terminal 1 - Start backend
cd backend
npm install
npm run dev

# Terminal 2 - Start frontend
cd frontend
npm install
npm run dev

# Terminal 3 - Start Stripe webhook forwarding (development only)
stripe listen --forward-to http://localhost:3000/api/webhook
```

### 2. Test the Purchase Flow

1. **Create an Account**
   - Navigate to `http://localhost:5173/login`
   - Sign up with a test email

2. **View Plans**
   - Go to `http://localhost:5173/pricing`
   - You should see the 3 available plans

3. **Purchase a Plan**
   - Click "Purchase Plan" on any plan
   - You'll be redirected to Stripe Checkout

4. **Use Test Card**
   - Card Number: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., `12/34`)
   - CVC: Any 3 digits (e.g., `123`)
   - ZIP: Any 5 digits (e.g., `12345`)

5. **Verify Credits**
   - After successful payment, you'll be redirected back
   - Check the navbar - your credits should be displayed
   - Try generating an image or video to test credit deduction

### 3. Check Database

Verify the payment was recorded:

```sql
-- Check user credits
SELECT * FROM user_credits WHERE user_id = 'your_user_id';

-- Check transactions
SELECT * FROM credit_transactions WHERE user_id = 'your_user_id' ORDER BY created_at DESC;

-- Check payments
SELECT * FROM stripe_payments WHERE user_id = 'your_user_id' ORDER BY created_at DESC;
```

## Credit Pricing Structure

### Image Generation
- **Cost**: 1 credit per image
- **API Endpoint**: `POST /api/generate-image`
- **Middleware**: `checkImageCredits`

### Video Generation
- **4-second video**: 10 credits
- **8-second video**: 20 credits
- **12-second video**: 30 credits
- **API Endpoint**: `POST /api/generate-video`
- **Middleware**: `checkVideoCredits`

### Credit Deduction Flow

1. User initiates generation request
2. Middleware checks if user has sufficient credits
3. If insufficient, return 403 error with credit details
4. If sufficient, allow generation to proceed
5. After successful generation, deduct credits atomically
6. Log transaction in `credit_transactions` table

## API Endpoints

### Plans

```bash
# Get all active plans
GET /api/plans

Response:
{
  "success": true,
  "plans": [
    {
      "id": "uuid",
      "name": "Starter Plan",
      "credits_total": 200,
      "credits_image": 100,
      "credits_video": 100,
      "price": 99,
      "price_cents": 9900
    }
  ]
}
```

### Credits

```bash
# Get user's credit balance
GET /api/credits
Authorization: Bearer <token>

Response:
{
  "success": true,
  "credits": {
    "image": {
      "total": 100,
      "used": 5,
      "available": 95
    },
    "video": {
      "total": 100,
      "used": 2,
      "available": 98
    }
  }
}
```

```bash
# Get transaction history
GET /api/credits/transactions?limit=50&offset=0
Authorization: Bearer <token>

Response:
{
  "success": true,
  "transactions": [
    {
      "id": "uuid",
      "type": "purchase",
      "creditType": "image",
      "amount": 100,
      "balanceBefore": 0,
      "balanceAfter": 100,
      "description": "Plan purchase: uuid",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### Payments

```bash
# Create checkout session
POST /api/create-checkout-session
Authorization: Bearer <token>
Content-Type: application/json

{
  "planId": "uuid"
}

Response:
{
  "success": true,
  "sessionId": "cs_test_...",
  "url": "https://checkout.stripe.com/..."
}
```

```bash
# Verify payment
GET /api/verify-payment/:sessionId
Authorization: Bearer <token>

Response:
{
  "success": true,
  "status": "paid",
  "amountTotal": 9900,
  "currency": "usd",
  "customerEmail": "user@example.com"
}
```

### Webhook

```bash
# Stripe webhook endpoint (called by Stripe)
POST /api/webhook
Content-Type: application/json
Stripe-Signature: <signature>

# This endpoint handles:
# - checkout.session.completed
# - payment_intent.succeeded
# - payment_intent.payment_failed
# - charge.refunded
```

## Troubleshooting

### Credits Not Added After Payment

1. **Check webhook logs**:
   ```bash
   # In terminal running stripe listen
   # Look for successful webhook deliveries
   ```

2. **Check database**:
   ```sql
   SELECT * FROM stripe_payments WHERE stripe_checkout_session_id = 'cs_test_...';
   SELECT * FROM user_credits WHERE user_id = 'your_user_id';
   ```

3. **Verify webhook secret**:
   - Ensure `STRIPE_WEBHOOK_SECRET` in `.env` matches Stripe dashboard

### Insufficient Credits Error

If users see "Insufficient credits" but they should have credits:

1. **Check credit balance**:
   ```sql
   SELECT * FROM user_credits WHERE user_id = 'user_id';
   ```

2. **Verify credit type**:
   - Image generation requires `credits_image_available > 0`
   - Video generation requires `credits_video_available > 0`

3. **Check for constraint violations**:
   ```sql
   SELECT * FROM credit_transactions
   WHERE user_id = 'user_id'
   ORDER BY created_at DESC
   LIMIT 10;
   ```

### Webhook Signature Verification Failed

1. **Development**: Ensure `stripe listen` is running
2. **Production**: Verify webhook endpoint URL is correct
3. **Check secret**: Ensure webhook secret matches environment variable
4. **Raw body**: Webhook endpoint must receive raw body (not JSON parsed)

### Payment Succeeded but No Redirect

1. Check `FRONTEND_URL` is set correctly in backend `.env`
2. Verify success URL in checkout session creation
3. Check browser console for errors

## Security Best Practices

1. **Never expose secret keys**:
   - Keep `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` server-side only
   - Only use `STRIPE_PUBLISHABLE_KEY` in frontend

2. **Verify webhook signatures**:
   - Always verify Stripe webhook signatures
   - Reject requests with invalid signatures

3. **Use HTTPS in production**:
   - Stripe requires HTTPS for webhooks
   - Use SSL certificates in production

4. **Atomic credit operations**:
   - All credit deductions use database transactions
   - Prevents race conditions and double-spending

5. **Audit logging**:
   - All credit operations logged in `credit_transactions`
   - Track purchases, generations, and refunds

## Production Deployment

### 1. Update Environment Variables

Replace test keys with production keys:
- Use `pk_live_...` for publishable key
- Use `sk_live_...` for secret key
- Set up production webhook endpoint

### 2. Database

Run the migration on your production Supabase database.

### 3. Webhook Endpoint

1. Set up webhook in Stripe dashboard
2. Point to your production URL: `https://yourdomain.com/api/webhook`
3. Enable live mode
4. Update `STRIPE_WEBHOOK_SECRET` with live webhook secret

### 4. Testing

Test the entire flow with real payment methods before going live.

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review Stripe documentation: [https://stripe.com/docs](https://stripe.com/docs)
3. Check application logs for errors
4. Verify database constraints and RLS policies

---

**Last Updated**: 2024
**Version**: 1.0.0
