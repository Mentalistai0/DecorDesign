# DecorDesign - Production Deployment Guide

This guide will walk you through deploying DecorDesign to production.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Database Setup (Supabase)](#database-setup)
3. [Backend Deployment](#backend-deployment)
4. [Frontend Deployment](#frontend-deployment)
5. [Stripe Configuration](#stripe-configuration)
6. [Post-Deployment Checklist](#post-deployment-checklist)

---

## Prerequisites

### Required Accounts
- ✅ **Supabase** account (https://supabase.com)
- ✅ **Stripe** account (https://stripe.com) - Activated for live payments
- ✅ **Fal.ai** account (https://fal.ai)
- ✅ **Hosting provider** for backend (Railway, Render, Fly.io, or DigitalOcean)
- ✅ **Hosting provider** for frontend (Vercel, Netlify, or Cloudflare Pages)

### What You'll Need
- Production domain names (e.g., `api.decordesign.com`, `decordesign.com`)
- SSL certificates (automatically provided by most hosting platforms)

---

## Database Setup (Supabase)

### 1. Run Database Migrations

1. Go to https://supabase.com/dashboard
2. Select your project
3. Navigate to **SQL Editor** → **New query**
4. Copy and paste the contents of `/database/supabase-schema.sql`
5. Click **Run** to execute
6. Create a new query and paste `/database/migrations/add_user_id_and_favorites.sql`
7. Click **Run**
8. Create a new query and paste `/database/migrations/add_credit_system.sql`
9. Click **Run**

### 2. Verify Tables Created

Go to **Table Editor** and verify these tables exist:
- ✅ `gallery`
- ✅ `videos`
- ✅ `plans`
- ✅ `user_credits`
- ✅ `credit_transactions`
- ✅ `stripe_payments`

### 3. Get API Keys

Go to **Settings** → **API**:
- Copy **Project URL** (starts with `https://`)
- Copy **anon public** key (for frontend)
- Copy **service_role** key (for backend - KEEP SECRET!)

---

## Backend Deployment

### Recommended Platforms
1. **Railway.app** (Easiest) - https://railway.app
2. **Render.com** - https://render.com
3. **Fly.io** - https://fly.io
4. **DigitalOcean App Platform** - https://digitalocean.com

### Deployment Steps (Railway Example)

#### 1. Create New Project
- Go to https://railway.app
- Click **"New Project"** → **"Deploy from GitHub repo"**
- Select your repository
- Choose **backend** folder as root directory

#### 2. Configure Environment Variables

Add these in Railway dashboard under **Variables**:

```env
NODE_ENV=production
PORT=3000
SUPABASE_URL=<your_supabase_url>
SUPABASE_ANON_KEY=<your_supabase_anon_key>
SUPABASE_SERVICE_ROLE_KEY=<your_supabase_service_role_key>
FAL_API_KEY=<your_fal_api_key>
STRIPE_SECRET_KEY=sk_live_<your_live_stripe_secret_key>
STRIPE_PUBLISHABLE_KEY=pk_live_<your_live_stripe_publishable_key>
STRIPE_WEBHOOK_SECRET=whsec_<get_after_creating_webhook>
FRONTEND_URL=https://your-frontend-domain.com
```

#### 3. Configure Build Settings

**Start Command:**
```bash
npm start
```

**Build Command:**
```bash
npm install
```

#### 4. Get Your Backend URL

After deployment, Railway will provide a URL like:
```
https://decordesign-backend-production.up.railway.app
```

Save this URL - you'll need it for frontend and Stripe configuration.

---

## Frontend Deployment

### Recommended Platforms
1. **Vercel** (Best for React/Vite) - https://vercel.com
2. **Netlify** - https://netlify.com
3. **Cloudflare Pages** - https://pages.cloudflare.com

### Deployment Steps (Vercel Example)

#### 1. Create New Project
- Go to https://vercel.com
- Click **"Add New"** → **"Project"**
- Import your GitHub repository
- Choose **frontend** folder as root directory

#### 2. Configure Build Settings

**Framework Preset:** Vite

**Build Command:**
```bash
npm run build
```

**Output Directory:**
```bash
dist
```

**Install Command:**
```bash
npm install
```

#### 3. Configure Environment Variables

Add these in Vercel dashboard under **Settings** → **Environment Variables**:

```env
VITE_API_URL=https://your-backend-domain.com
VITE_SUPABASE_URL=<your_supabase_url>
VITE_SUPABASE_ANON_KEY=<your_supabase_anon_key>
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_<your_live_stripe_publishable_key>
```

#### 4. Deploy

Click **"Deploy"** and wait for build to complete.

Your frontend will be available at:
```
https://decordesign.vercel.app
```

#### 5. Add Custom Domain (Optional)

In Vercel:
1. Go to **Settings** → **Domains**
2. Add your custom domain (e.g., `decordesign.com`)
3. Follow DNS configuration instructions

---

## Stripe Configuration

### 1. Switch to Live Mode

1. Go to https://dashboard.stripe.com
2. Toggle **"Test mode"** to **"Live mode"** (top right)

### 2. Get Live API Keys

1. Go to **Developers** → **API keys**
2. Copy **Publishable key** (pk_live_...)
3. Click **"Reveal live key"** for Secret key (sk_live_...)
4. Update your backend and frontend environment variables

### 3. Create Production Webhook

1. Go to **Developers** → **Webhooks**
2. Click **"Add endpoint"**
3. Enter your backend URL + `/api/webhook`:
   ```
   https://your-backend-domain.com/api/webhook
   ```
4. Select events to listen to:
   - ✅ `checkout.session.completed`
   - ✅ `payment_intent.succeeded`
   - ✅ `payment_intent.payment_failed`
   - ✅ `charge.refunded`
5. Click **"Add endpoint"**
6. Copy the **Signing secret** (whsec_...)
7. Add it to your backend environment variables as `STRIPE_WEBHOOK_SECRET`
8. **Redeploy your backend** to apply the new webhook secret

### 4. Test Live Payments

Use a real credit card or Stripe test cards:
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`

⚠️ **IMPORTANT:** Test with small amounts first (e.g., $1) before going fully live!

---

## Post-Deployment Checklist

### Security

- [ ] All production API keys are set correctly
- [ ] HTTPS is enabled on both frontend and backend
- [ ] CORS is configured to only allow your frontend domain
- [ ] Database RLS (Row Level Security) policies are enabled
- [ ] Service role key is ONLY in backend environment variables
- [ ] `.env` files are in `.gitignore` (not committed to git)

### Stripe

- [ ] Live API keys are configured
- [ ] Production webhook is created and working
- [ ] Webhook secret is set in backend environment
- [ ] Test a small live payment to verify credits are allocated
- [ ] Verify webhook events are received (check Stripe dashboard → Developers → Events)

### Functionality Tests

- [ ] User signup works
- [ ] User login works
- [ ] Credit balance displays correctly
- [ ] Can purchase credits (test with small amount)
- [ ] Credits are allocated after payment
- [ ] Image generation works and deducts credits
- [ ] Video generation works and deducts credits
- [ ] Gallery displays user's generated content
- [ ] Payment success page redirects correctly

### Performance

- [ ] Frontend loads quickly (check Lighthouse score)
- [ ] Backend responses are fast (<500ms)
- [ ] Images/videos are optimized
- [ ] CDN is configured (if using Vercel/Netlify, automatic)

### Monitoring (Optional but Recommended)

- [ ] Set up error tracking (Sentry, LogRocket)
- [ ] Set up uptime monitoring (UptimeRobot, Pingdom)
- [ ] Set up analytics (Google Analytics, Plausible)
- [ ] Configure email notifications for failed payments

---

## Common Issues & Solutions

### Issue: Credits not showing after payment

**Solution:**
1. Check Stripe webhook events in dashboard
2. Verify webhook secret is correct in backend `.env`
3. Check backend logs for errors
4. Ensure `SUPABASE_SERVICE_ROLE_KEY` is set

### Issue: CORS errors

**Solution:**
1. Update `FRONTEND_URL` in backend `.env`
2. Ensure it matches your actual frontend domain (no trailing slash)
3. Redeploy backend

### Issue: 401 Unauthorized errors

**Solution:**
1. Check JWT token is being sent in Authorization header
2. Verify Supabase keys are correct
3. Clear localStorage and re-login

### Issue: Webhook not receiving events

**Solution:**
1. Verify webhook URL is accessible publicly
2. Check webhook signing secret matches
3. Ensure backend is deployed and running
4. Check Stripe dashboard → Webhooks → Recent deliveries for errors

---

## Scaling Considerations

### When Your App Grows

1. **Database Optimization**
   - Add indexes on frequently queried columns
   - Enable Supabase connection pooling
   - Consider upgrading Supabase plan

2. **Backend Scaling**
   - Most platforms auto-scale (Railway, Render)
   - Monitor CPU/memory usage
   - Consider Redis for caching

3. **CDN for Media**
   - Move uploaded images to S3/Cloudflare R2
   - Use CloudFlare for image optimization
   - Consider video streaming service

4. **Rate Limiting**
   - Already implemented in code
   - Consider adding Redis for distributed rate limiting

---

## Support & Resources

- **Supabase Docs:** https://supabase.com/docs
- **Stripe Docs:** https://docs.stripe.com
- **Railway Docs:** https://docs.railway.app
- **Vercel Docs:** https://vercel.com/docs

---

## Emergency Rollback

If something goes wrong:

1. **Revert Backend:**
   ```bash
   git revert HEAD
   git push
   ```

2. **Revert Frontend:**
   - Go to Vercel → Deployments
   - Find last working deployment
   - Click "..." → "Promote to Production"

3. **Database:**
   - Supabase has automatic backups
   - Go to Settings → Database → Backups

---

**Congratulations!** 🎉 Your DecorDesign app is now live in production!

For questions or issues, check the GitHub repository issues or contact support.
