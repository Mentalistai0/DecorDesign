# 🚀 Pre-Deployment Checklist for DecorDesign

Complete this checklist before deploying to production.

## ☑️ Environment & Configuration

### Backend Configuration
- [ ] `.env` file is NOT committed to git
- [ ] All production environment variables are set correctly:
  - [ ] `NODE_ENV=production`
  - [ ] `SUPABASE_URL` (production)
  - [ ] `SUPABASE_ANON_KEY` (production)
  - [ ] `SUPABASE_SERVICE_ROLE_KEY` (production - KEEP SECRET!)
  - [ ] `FAL_API_KEY` (production)
  - [ ] `STRIPE_SECRET_KEY` (**sk_live_**... not sk_test!)
  - [ ] `STRIPE_PUBLISHABLE_KEY` (**pk_live_**... not pk_test!)
  - [ ] `STRIPE_WEBHOOK_SECRET` (production webhook)
  - [ ] `FRONTEND_URL` (your production frontend domain)

### Frontend Configuration
- [ ] `.env` file is NOT committed to git
- [ ] All production environment variables are set:
  - [ ] `VITE_API_URL` (your production backend domain)
  - [ ] `VITE_SUPABASE_URL` (production)
  - [ ] `VITE_SUPABASE_ANON_KEY` (production)
  - [ ] `VITE_STRIPE_PUBLISHABLE_KEY` (**pk_live_**... not pk_test!)

---

## ☑️ Database (Supabase)

- [ ] All 3 SQL migrations have been run:
  1. [ ] `supabase-schema.sql`
  2. [ ] `add_user_id_and_favorites.sql`
  3. [ ] `add_credit_system.sql`

- [ ] Verify tables exist in Table Editor:
  - [ ] `gallery`
  - [ ] `videos`
  - [ ] `plans`
  - [ ] `user_credits`
  - [ ] `credit_transactions`
  - [ ] `stripe_payments`

- [ ] Verify 3 pricing plans exist in `plans` table:
  - [ ] Starter Plan ($99)
  - [ ] Professional Plan ($199)
  - [ ] Enterprise Plan ($299)

- [ ] Row Level Security (RLS) is ENABLED on all tables

- [ ] Test database connection from backend (check health endpoint)

---

## ☑️ Stripe Configuration

### Live Mode
- [ ] Stripe account is **LIVE** (not test mode)
- [ ] Payment method is activated and verified
- [ ] Business information is complete

### API Keys
- [ ] Using **LIVE** keys (sk_live_ and pk_live_)
- [ ] Secret key is in backend environment only
- [ ] Publishable key is in frontend environment

### Webhook Configuration
- [ ] Created webhook endpoint in Stripe dashboard
- [ ] Webhook URL: `https://your-backend-domain.com/api/webhook`
- [ ] Selected these events:
  - [ ] `checkout.session.completed`
  - [ ] `payment_intent.succeeded`
  - [ ] `payment_intent.payment_failed`
  - [ ] `charge.refunded`
- [ ] Copied webhook signing secret to backend `.env`
- [ ] Backend has been redeployed with webhook secret

### Test Payment
- [ ] Made a small test payment ($1) to verify:
  - [ ] Checkout session creates successfully
  - [ ] Payment processes correctly
  - [ ] Webhook is received (200 response)
  - [ ] Credits are allocated to user
  - [ ] User can see credits in navbar
  - [ ] Payment success page displays

---

## ☑️ Security Checks

### Secrets & Keys
- [ ] NO secrets committed to git (check with `git log --all -p | grep -i "sk_live"`)
- [ ] Service role key is ONLY in backend (never in frontend)
- [ ] `.env` files are in `.gitignore`
- [ ] `.env.example` files have placeholder values only

### HTTPS & SSL
- [ ] Frontend is served over HTTPS
- [ ] Backend is served over HTTPS
- [ ] Stripe webhook endpoint is HTTPS

### CORS
- [ ] Backend CORS is configured to only allow production frontend domain
- [ ] `FRONTEND_URL` matches actual deployed frontend (no trailing slash)

### Rate Limiting
- [ ] API rate limiting is enabled (already in code)
- [ ] Generation rate limiting is enabled (already in code)

### Authentication
- [ ] JWT tokens are secure
- [ ] Password requirements are enforced (8+ characters)
- [ ] Token refresh works correctly

---

## ☑️ Functionality Tests

### User Authentication
- [ ] Can create new account
- [ ] Can log in with email/password
- [ ] Can log out
- [ ] Session persists on page refresh
- [ ] Invalid credentials show error

### Credit System
- [ ] Credit balance displays correctly
- [ ] Can purchase credits with real payment
- [ ] Credits are allocated immediately after payment
- [ ] Credits are deducted when generating content
- [ ] If generation fails, credits are refunded

### Content Generation
- [ ] Image generation works
- [ ] Image generation deducts 1 credit
- [ ] Video generation works (4s, 8s, 12s)
- [ ] Video generation deducts correct credits (10/20/30)
- [ ] Generated content appears in gallery
- [ ] Can delete items from gallery

### Payment Flow
- [ ] Pricing page loads with correct plans
- [ ] Must be logged in to purchase
- [ ] Stripe checkout opens correctly
- [ ] Can complete payment with credit card
- [ ] Redirects to success page after payment
- [ ] Auto-redirects to /generate after 5 seconds
- [ ] Receipt email is sent (if configured)

---

## ☑️ Performance & Optimization

### Frontend
- [ ] Build completes without errors (`npm run build`)
- [ ] Bundle size is reasonable (<1MB)
- [ ] Images are optimized
- [ ] Lighthouse score > 80 (run in incognito)

### Backend
- [ ] Build completes without errors (`npm install`)
- [ ] No console errors in production logs
- [ ] API responses are fast (<500ms)
- [ ] Database queries are optimized

### Monitoring
- [ ] Set up error tracking (Sentry recommended)
- [ ] Set up uptime monitoring (UptimeRobot recommended)
- [ ] Configure log retention on hosting platform

---

## ☑️ Final Checks Before Launch

- [ ] Domain name is configured and pointing correctly
- [ ] SSL certificates are active
- [ ] All team members have access to:
  - [ ] Hosting dashboards (Railway/Vercel)
  - [ ] Supabase dashboard
  - [ ] Stripe dashboard

- [ ] Backup plan is in place:
  - [ ] Database backups enabled (automatic in Supabase)
  - [ ] Know how to rollback deployment

- [ ] Support email is configured (`support@your-domain.com`)

- [ ] Terms of Service page exists (if applicable)
- [ ] Privacy Policy page exists (if applicable)

- [ ] README.md is up to date
- [ ] DEPLOYMENT.md is accurate

---

## ☑️ Post-Launch Monitoring (First 24 Hours)

- [ ] Monitor Stripe dashboard for successful payments
- [ ] Monitor webhook deliveries (should be 200 responses)
- [ ] Check backend logs for errors
- [ ] Verify users can sign up and purchase
- [ ] Test on different devices/browsers
- [ ] Monitor server resource usage

---

## 🆘 Emergency Contacts

| Service | Dashboard | Support |
|---------|-----------|---------|
| Hosting (Backend) | [Link] | support@platform.com |
| Hosting (Frontend) | [Link] | support@platform.com |
| Supabase | https://supabase.com/dashboard | support@supabase.com |
| Stripe | https://dashboard.stripe.com | https://support.stripe.com |
| Fal.ai | https://fal.ai/dashboard | support@fal.ai |

---

## ✅ Sign-Off

- [ ] Technical Lead reviewed and approved
- [ ] All checklist items completed
- [ ] Ready for production deployment

**Deployed by:** _________________
**Date:** _________________
**Production URLs:**
- Frontend: _________________
- Backend: _________________

---

**Once all items are checked, proceed with deployment following DEPLOYMENT.md**

Good luck! 🚀
