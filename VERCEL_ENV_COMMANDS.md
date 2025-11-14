# Quick Vercel Environment Setup

## Option 1: Using Vercel CLI (Recommended)

Install Vercel CLI if you haven't:
```bash
npm i -g vercel
```

Link your project:
```bash
vercel link
```

Then run these commands to set environment variables:

### Backend Variables

```bash
# Supabase
vercel env add SUPABASE_URL
# Enter: [Get from backend/.env file]
# Select: Production, Preview

vercel env add SUPABASE_ANON_KEY
# Enter: [Get from backend/.env file]
# Select: Production, Preview

vercel env add SUPABASE_SERVICE_ROLE_KEY
# Enter: [Get from backend/.env file]
# Select: Production, Preview

vercel env add FAL_API_KEY
# Enter: [Get from backend/.env file]
# Select: Production, Preview

vercel env add STRIPE_SECRET_KEY
# Enter: [Get from backend/.env file]
# Select: Production, Preview

vercel env add STRIPE_WEBHOOK_SECRET
# Enter: [Get from backend/.env file]
# Select: Production, Preview

vercel env add STRIPE_PUBLISHABLE_KEY
# Enter: [Get from backend/.env file]
# Select: Production, Preview

vercel env add NODE_ENV
# Enter: production
# Select: Production, Preview

vercel env add FRONTEND_URL
# Enter: https://your-actual-vercel-deployment-url.vercel.app
# Select: Production, Preview
```

### Frontend Variables

```bash
vercel env add VITE_API_URL
# Leave EMPTY (just press Enter) - this makes it use relative URLs
# Select: Production, Preview

vercel env add VITE_SUPABASE_URL
# Enter: [Get from frontend/.env file]
# Select: Production, Preview

vercel env add VITE_SUPABASE_ANON_KEY
# Enter: [Get from frontend/.env file]
# Select: Production, Preview
```

### Redeploy

After setting all variables:
```bash
vercel --prod
```

## Option 2: Using Vercel Dashboard

1. Go to https://vercel.com/dashboard
2. Select your DecorDesign project
3. Go to **Settings** → **Environment Variables**
4. Add each variable listed above with the values from your local `.env` files
5. Make sure to select **Production** and **Preview** environments
6. Click **Save** for each
7. Go to **Deployments** and redeploy the latest deployment

## Important Notes

1. **FRONTEND_URL**: After your first deployment, get the actual URL from Vercel (e.g., `https://decor-design-abc123.vercel.app`) and set it as the `FRONTEND_URL` variable
2. **VITE_API_URL**: Must be empty or unset for production - this makes the app use relative URLs
3. **Security**: These are production API keys - never commit them to git

## Verification

After deployment, check:
1. Open browser console
2. Try to login
3. If you see 500 errors, check Vercel function logs:
   - Go to your deployment → **Functions** tab
   - Click on `/api` → **Logs**
   - Look for error messages
