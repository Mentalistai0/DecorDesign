# Vercel All-in-One Deployment Guide

Deploy both frontend and backend together on Vercel as a single unified application.

## Why Vercel All-in-One?

**Advantages:**
- Single deployment, single domain
- No CORS configuration needed
- Simpler environment variable management
- Built-in HTTPS and CDN
- Auto-scaling serverless backend
- Free SSL certificates
- Easy custom domain setup

**Perfect for:**
- Quick production deployment
- Solo developers
- Small to medium traffic
- Cost-effective hosting

---

## Architecture

Your app will be deployed as:

```
https://your-app.vercel.app/
├── /                    → Frontend (React/Vite static files)
├── /pricing             → Frontend pages
├── /generate            → Frontend pages
└── /api/*               → Backend API (Serverless Functions)
    ├── /api/auth/*      → Authentication endpoints
    ├── /api/credits/*   → Credit management
    ├── /api/generate/*  → Image/video generation
    ├── /api/webhook     → Stripe webhook
    └── /api/payment/*   → Payment processing
```

---

## Prerequisites

Before you begin, ensure you have:

- [x] Supabase project created with migrations run
- [x] Stripe account activated for live mode
- [x] Fal.ai API key
- [x] GitHub repository with your code
- [x] Vercel account (free tier works)

---

## Step-by-Step Deployment

### 1. Prepare Your Repository

Ensure these files exist in your repository root:

- `vercel.json` - Vercel configuration (already created)
- `package.json` - Root package.json with workspaces (already created)
- `frontend/package.json` - Frontend dependencies
- `backend/package.json` - Backend dependencies

**Verify configuration:**

```bash
# Check vercel.json exists
cat vercel.json

# Check root package.json exists
cat package.json
```

### 2. Push to GitHub

```bash
git add .
git commit -m "Configure Vercel monorepo deployment"
git push origin main
```

### 3. Deploy to Vercel

1. Go to https://vercel.com/dashboard
2. Click **New Project**
3. Click **Import Git Repository**
4. Select your DecorDesign repository
5. Configure project:
   - **Framework Preset:** Other (Vercel auto-detects monorepo)
   - **Root Directory:** `.` (leave as project root)
   - **Build Command:** Auto-detected from package.json
   - **Output Directory:** Auto-detected from vercel.json

### 4. Configure Environment Variables

Click **Environment Variables** and add all of these:

#### Supabase Variables

```env
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

#### Stripe Variables (LIVE keys)

```env
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

Note: Leave `STRIPE_WEBHOOK_SECRET` empty for now, we'll add it after Step 6.

#### Fal.ai Variable

```env
FAL_API_KEY=xxx
```

#### Frontend Variables (VITE_ prefix)

```env
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
```

Note: No need to set `VITE_API_URL` - API calls automatically route to `/api/*`

#### Environment Setting

```env
NODE_ENV=production
```

### 5. Deploy

1. Click **Deploy**
2. Wait for build to complete (2-3 minutes)
3. Note your deployment URL: `https://your-app-xxx.vercel.app`

### 6. Configure Stripe Webhook

Now that your app is deployed, set up the Stripe webhook:

1. Go to https://dashboard.stripe.com/webhooks
2. Toggle to **Live mode** (top right switch)
3. Click **Add endpoint**
4. Configure webhook:
   - **Endpoint URL:** `https://your-app-xxx.vercel.app/api/webhook`
   - **Events to send:** Select these 4 events:
     - `checkout.session.completed`
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`
     - `charge.refunded`
5. Click **Add endpoint**
6. Click on your newly created endpoint
7. Click **Reveal** next to **Signing secret**
8. Copy the signing secret (starts with `whsec_`)

### 7. Update Webhook Secret

1. Go back to Vercel dashboard
2. Go to your project → **Settings** → **Environment Variables**
3. Find `STRIPE_WEBHOOK_SECRET`
4. Click **Edit** → Paste the webhook secret
5. Click **Save**
6. Go to **Deployments** tab
7. Click **...** on latest deployment → **Redeploy** → **Redeploy**

---

## Testing Your Deployment

### Quick Test Checklist

1. **Frontend loads:**
   - Visit `https://your-app-xxx.vercel.app`
   - Page should load without errors
   - All assets should load

2. **Sign up works:**
   - Click **Login/Sign Up**
   - Create new account
   - Should redirect to generate page
   - Credit bar should show "0 / 0"

3. **Payment works:**
   - Go to `/pricing`
   - Select any plan
   - Click **Purchase**
   - Use real credit card (or Stripe test card: `4242 4242 4242 4242`)
   - Complete payment
   - Should redirect to success page with 5-second countdown
   - **Credits should appear in navbar**

4. **Generation works:**
   - Go to `/generate`
   - Upload an image
   - Enter a prompt
   - Select room type and style
   - Click **Generate**
   - Credit count should decrease
   - Generated image should appear

### Troubleshooting

#### Credits not showing after payment?

**Check Stripe Webhook:**
1. Go to Stripe Dashboard → Webhooks
2. Click your webhook endpoint
3. Scroll to **Recent events**
4. Latest event should show **200** response
5. If showing 400/500, check Vercel logs

**Check Vercel Logs:**
1. Go to Vercel Dashboard → Your project
2. Click **Deployments** → Latest deployment
3. Click **Functions** → Find `/api/webhook`
4. Check for errors in logs

**Fix:**
- Ensure `STRIPE_WEBHOOK_SECRET` is set correctly
- Ensure `SUPABASE_SERVICE_ROLE_KEY` is set (not anon key)
- Redeploy after changing environment variables

#### CORS errors?

**Should not happen** with all-in-one deployment since frontend and backend share the same domain.

If you still see CORS errors:
1. Check browser console for exact error
2. Ensure you're not hardcoding API URLs in frontend
3. API calls should use relative paths: `/api/...` not `http://...`

#### 401 Unauthorized errors?

1. Check Supabase environment variables are correct
2. Clear browser localStorage: `localStorage.clear()`
3. Try logging out and back in

#### Image uploads failing?

Vercel serverless functions have a 4.5MB request size limit.

**Solutions:**
1. Compress images on frontend before upload
2. Implement client-side image resizing (already in code)
3. For production, consider using Supabase Storage or S3 for uploads

---

## Custom Domain Setup (Optional)

### Add Custom Domain

1. Go to Vercel Dashboard → Your project
2. Click **Settings** → **Domains**
3. Enter your domain name (e.g., `decordesign.com`)
4. Click **Add**
5. Follow DNS configuration instructions

### Update Stripe Webhook

After adding custom domain:

1. Go to Stripe Dashboard → Webhooks
2. Click your webhook endpoint
3. Click **...** → **Update details**
4. Change URL to: `https://decordesign.com/api/webhook`
5. Click **Update endpoint**

---

## Monitoring and Logs

### View Logs

**Real-time logs:**
1. Vercel Dashboard → Your project
2. Click **Deployments** → Latest deployment
3. Click **View Function Logs**

**Or use Vercel CLI:**
```bash
npm i -g vercel
vercel login
vercel logs your-app-xxx.vercel.app
```

### Performance Monitoring

Vercel automatically provides:
- Response times
- Error rates
- Traffic analytics
- Bandwidth usage

View in: Dashboard → Your project → **Analytics**

---

## Scaling and Limits

### Vercel Free Tier Limits

- **Bandwidth:** 100GB/month
- **Function execution:** 100GB-hours/month
- **Function duration:** 10 seconds max
- **Deployments:** Unlimited
- **Custom domains:** Unlimited

For most applications, this is plenty to start!

### Upgrading

If you exceed limits:
- **Pro Plan:** $20/month
  - 1TB bandwidth
  - 1000GB-hours execution
  - 60-second function duration
  - Priority support

---

## File Uploads in Serverless

**Important:** Vercel serverless functions are stateless. File uploads work differently than traditional servers.

### Current Implementation

The app currently saves uploads to `/backend/uploads/` which works in development but **will not persist** in Vercel serverless environment.

### Recommended Solution for Production

Use Supabase Storage for file uploads:

1. Enable Storage in Supabase dashboard
2. Create a bucket for uploads
3. Update upload routes to use Supabase Storage
4. Reference: https://supabase.com/docs/guides/storage

**This is optional** - image/video generation still works via Fal.ai URLs.

---

## Environment Variables Reference

### Backend Variables (available to serverless functions)

| Variable | Required | Description |
|----------|----------|-------------|
| `SUPABASE_URL` | ✅ | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | ✅ | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase service role key (critical!) |
| `STRIPE_SECRET_KEY` | ✅ | Stripe secret key (sk_live_xxx) |
| `STRIPE_PUBLISHABLE_KEY` | ✅ | Stripe publishable key |
| `STRIPE_WEBHOOK_SECRET` | ✅ | Stripe webhook signing secret |
| `FAL_API_KEY` | ✅ | Fal.ai API key for generation |
| `NODE_ENV` | ✅ | Should be "production" |

### Frontend Variables (must have VITE_ prefix)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | ✅ | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | ✅ | Supabase anonymous key |
| `VITE_STRIPE_PUBLISHABLE_KEY` | ✅ | Stripe publishable key |

Note: `VITE_API_URL` is **NOT needed** - API calls use relative paths.

---

## Security Checklist

Before going live, verify:

- [ ] All environment variables use LIVE/production keys
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is set (NOT anon key)
- [ ] Stripe webhook secret matches production webhook
- [ ] RLS policies enabled in Supabase
- [ ] Rate limiting enabled (already in code)
- [ ] HTTPS is enabled (automatic on Vercel)
- [ ] Sensitive keys are NOT in git repository

---

## Costs Breakdown

### Monthly Operating Costs

**Free Tier (0-1000 users):**
- Vercel: $0 (free tier)
- Supabase: $0 (free tier: 500MB storage, 2GB transfer)
- Stripe: $0 (pay-as-you-go: 2.9% + 30¢ per transaction)
- Fal.ai: ~$10-50 (depending on generation volume)

**Total: $10-50/month** to start

**Paid Tier (1000+ users):**
- Vercel Pro: $20/month
- Supabase Pro: $25/month
- Stripe: Same fees
- Fal.ai: Volume-based

**Total: ~$45/month + generation costs**

---

## Next Steps

After successful deployment:

1. [ ] Test full payment flow with real credit card
2. [ ] Set up custom domain (optional)
3. [ ] Configure monitoring (Sentry, LogRocket)
4. [ ] Set up error alerting
5. [ ] Review Vercel analytics
6. [ ] Plan for scaling

---

## Support Resources

- **Vercel Docs:** https://vercel.com/docs
- **Vercel Support:** https://vercel.com/support
- **Supabase Docs:** https://supabase.com/docs
- **Stripe Docs:** https://stripe.com/docs

---

## You're Live!

Your DecorDesign app is now running on Vercel with:
- Auto-scaling serverless backend
- Global CDN for frontend
- Automatic HTTPS
- Zero-downtime deployments
- Built-in monitoring

**Congratulations on launching!** 🎉
