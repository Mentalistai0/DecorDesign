# 🚀 Quick Start Guide - Production Deployment

**TL;DR:** Deploy DecorDesign to production in under 30 minutes.

## Deployment Options

Choose your preferred deployment method:

- **Option A: Vercel All-in-One** (Recommended) - Deploy frontend + backend together on Vercel
- **Option B: Separate Deployment** - Deploy backend on Railway, frontend on Vercel

---

## Prerequisites Checklist

- [x] Supabase account created
- [x] Stripe account (activated for live payments)
- [x] Fal.ai API key
- [ ] Domain names ready (optional but recommended)

---

## Step 1: Database Setup (5 minutes)

1. Go to https://supabase.com/dashboard
2. Open **SQL Editor** → **New Query**
3. Copy/paste and run these 3 files in order:
   - `database/supabase-schema.sql`
   - `database/migrations/add_user_id_and_favorites.sql`
   - `database/migrations/add_credit_system.sql`

4. Get your keys from **Settings** → **API**:
   - Project URL
   - anon public key
   - service_role key ⚠️ (keep secret!)

---

## Step 2: Deploy Your Application

### OPTION A: Vercel All-in-One (Easiest - 10 minutes)

Deploy both frontend and backend together as a single Vercel project.

1. Go to https://vercel.com
2. **New Project** → **Import from GitHub**
3. Select your DecorDesign repository
4. **Framework Preset:** Other (Vercel will auto-detect the monorepo)
5. **Root Directory:** Leave as `.` (project root)
6. Add Environment Variables (these apply to both frontend and backend):

```env
# Supabase (from Step 1)
SUPABASE_URL=<from step 1>
SUPABASE_ANON_KEY=<from step 1>
SUPABASE_SERVICE_ROLE_KEY=<from step 1>

# Stripe (LIVE keys for production)
STRIPE_SECRET_KEY=sk_live_<your live key>
STRIPE_PUBLISHABLE_KEY=pk_live_<your live key>
STRIPE_WEBHOOK_SECRET=<will add after step 3>

# Fal.ai
FAL_API_KEY=<your fal.ai key>

# Frontend variables (prefixed with VITE_)
VITE_SUPABASE_URL=<same as SUPABASE_URL>
VITE_SUPABASE_ANON_KEY=<same as SUPABASE_ANON_KEY>
VITE_STRIPE_PUBLISHABLE_KEY=<same as STRIPE_PUBLISHABLE_KEY>

# Environment
NODE_ENV=production
```

7. **Deploy** → Save the generated URL (e.g., `https://your-app.vercel.app`)

**Important Notes:**
- Your API will be available at: `https://your-app.vercel.app/api/*`
- Frontend will be at: `https://your-app.vercel.app`
- No need to set `VITE_API_URL` - it auto-routes to `/api`
- No need to set `FRONTEND_URL` - same domain handles both

**Skip to Step 3 (Stripe Webhook Setup)**

---

### OPTION B: Separate Deployment (Railway + Vercel)

Deploy backend and frontend on separate platforms.

#### Step 2a: Deploy Backend on Railway (10 minutes)

1. Go to https://railway.app
2. **New Project** → **Deploy from GitHub**
3. Select your repo → Choose `backend` folder
4. Add Environment Variables (copy from `.env.example`):

```env
NODE_ENV=production
SUPABASE_URL=<from step 1>
SUPABASE_ANON_KEY=<from step 1>
SUPABASE_SERVICE_ROLE_KEY=<from step 1>
FAL_API_KEY=<your fal.ai key>
STRIPE_SECRET_KEY=sk_live_<your live key>
STRIPE_PUBLISHABLE_KEY=pk_live_<your live key>
STRIPE_WEBHOOK_SECRET=<will add after step 4>
FRONTEND_URL=<will add after step 3>
```

5. **Deploy** → Save the generated URL (e.g., `https://xxx.railway.app`)

#### Step 2b: Deploy Frontend on Vercel (10 minutes)

1. Go to https://vercel.com
2. **New Project** → Import from GitHub
3. Select `frontend` folder as root
4. Framework: **Vite**
5. Add Environment Variables:

```env
VITE_API_URL=<backend URL from step 2>
VITE_SUPABASE_URL=<from step 1>
VITE_SUPABASE_ANON_KEY=<from step 1>
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_<your live key>
```

6. **Deploy** → Save the generated URL (e.g., `https://xxx.vercel.app`)

7. **Go back to Railway** → Update `FRONTEND_URL` with this Vercel URL → Redeploy

---

## Step 3: Configure Stripe Webhook (5 minutes)

### If you used OPTION A (Vercel All-in-One):

1. Go to https://dashboard.stripe.com/webhooks
2. Toggle to **Live mode** (top right)
3. **Add endpoint**:
   - URL: `https://your-app.vercel.app/api/webhook`
   - Events: Select:
     - `checkout.session.completed`
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`
     - `charge.refunded`
4. **Add endpoint** → Copy **Signing secret** (whsec_...)
5. **Go back to Vercel** → Settings → Environment Variables → Add `STRIPE_WEBHOOK_SECRET=whsec_...` → Redeploy

### If you used OPTION B (Separate Deployment):

1. Go to https://dashboard.stripe.com/webhooks
2. Toggle to **Live mode** (top right)
3. **Add endpoint**:
   - URL: `<your Railway backend URL>/api/webhook`
   - Events: Select:
     - `checkout.session.completed`
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`
     - `charge.refunded`
4. **Add endpoint** → Copy **Signing secret** (whsec_...)
5. **Go back to Railway** → Add `STRIPE_WEBHOOK_SECRET=whsec_...` → Redeploy

---

## Step 4: Test Everything (5 minutes)

### Quick Test Checklist:

1. **Visit your frontend URL**
   - ✅ Page loads without errors

2. **Create account**
   - ✅ Sign up works
   - ✅ Credits show as 0/0

3. **Test payment** (use small amount like $1):
   - ✅ Go to /pricing
   - ✅ Click purchase
   - ✅ Use real card or test card: `4242 4242 4242 4242`
   - ✅ Payment succeeds
   - ✅ Redirects to success page
   - ✅ **Credits appear in navbar** 🎉

4. **Test generation**:
   - ✅ Upload image
   - ✅ Generate image (1 credit deducted)
   - ✅ Credits update correctly

---

## ✅ You're Live!

Your DecorDesign app is now in production!

### Next Steps:

- [ ] Set up custom domain (optional)
- [ ] Configure monitoring (Sentry, UptimeRobot)
- [ ] Review [PRE-DEPLOYMENT-CHECKLIST.md](./PRE-DEPLOYMENT-CHECKLIST.md) for complete checklist
- [ ] Read [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed info

---

## 🆘 Troubleshooting

### Credits not showing after payment?

1. Check Railway logs for errors
2. Go to Stripe → Webhooks → Check recent deliveries
3. Ensure `STRIPE_WEBHOOK_SECRET` is set correctly
4. Verify webhook URL is accessible (try visiting it in browser)

### CORS errors?

1. Verify `FRONTEND_URL` in Railway matches Vercel URL exactly (no trailing slash)
2. Redeploy backend after changing

### 401 Unauthorized?

1. Check Supabase keys are correct
2. Clear browser localStorage
3. Try logging in again

---

## 📊 Platform-Specific Links

### Railway (Backend)
- Dashboard: https://railway.app/dashboard
- Logs: Click your project → View logs
- Environment: Settings → Variables

### Vercel (Frontend)
- Dashboard: https://vercel.com/dashboard
- Deployments: Click project → Deployments
- Environment: Settings → Environment Variables

### Supabase (Database)
- Dashboard: https://supabase.com/dashboard
- Table Editor: View your tables
- SQL Editor: Run queries

### Stripe (Payments)
- Dashboard: https://dashboard.stripe.com
- Webhooks: Developers → Webhooks
- Payments: Payments (to see transactions)

---

**Need help?** Check [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed guide or open an issue on GitHub.

🎉 **Congratulations on launching!**
