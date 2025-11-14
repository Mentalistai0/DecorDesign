# Vercel Deployment Setup Guide

This guide explains how to configure environment variables for your DecorDesign application on Vercel.

## Frontend Environment Variables

Configure these in Vercel Dashboard → Your Project → Settings → Environment Variables:

### Required Variables

```bash
# Leave empty to use relative URLs (API served via /api rewrites)
VITE_API_URL=

# Supabase Configuration
VITE_SUPABASE_URL=https://ixtmmrettexwjasdxytr.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4dG1tcmV0dGV4d2phc2R4eXRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwNTgxNzksImV4cCI6MjA3ODYzNDE3OX0.M-5CeZDs5GvR9D6OyiULuKbq3-vItjS86iGxzXJi7K4

# Stripe Publishable Key (if using payments)
# VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your_key_here
```

## Backend Environment Variables

The backend runs as a serverless function at `/api`. Configure these variables:

### Required Variables

```bash
# Database
SUPABASE_URL=https://ixtmmrettexwjasdxytr.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=24h

# Frontend URL (for CORS) - Set to your Vercel deployment URL
FRONTEND_URL=https://your-app.vercel.app

# Stripe Configuration
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# AI API Keys
OPENAI_API_KEY=sk-your_openai_key_here
REPLICATE_API_TOKEN=r8_your_replicate_token_here
FAL_KEY=your_fal_key_here

# Server Configuration
NODE_ENV=production
PORT=3000
```

## How to Set Environment Variables in Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add each variable with:
   - **Name**: Variable name (e.g., `SUPABASE_URL`)
   - **Value**: The actual value
   - **Environment**: Select which environments (Production, Preview, Development)
5. Click **Save**

## Important Notes

### API URL Configuration

- **Production**: Leave `VITE_API_URL` empty or unset. The app uses relative URLs that are routed to the backend via Vercel rewrites (`/api/*` → serverless function)
- **Local Development**: In your local `.env` file, set `VITE_API_URL=http://localhost:3000`

### CORS Configuration

The backend automatically allows:
- All Vercel deployment URLs (`*.vercel.app`)
- The configured `FRONTEND_URL`
- Local development URLs (`localhost:5173`, `localhost:3000`)

### Security Best Practices

1. **Never commit `.env` files** - They're already in `.gitignore`
2. **Use different keys for development and production**
3. **Rotate secrets regularly**
4. **Only use ANON keys in frontend** - Never expose service role keys
5. **Keep Stripe webhook secrets secure**

## After Configuration

1. Trigger a new deployment or redeploy the current one
2. Check the deployment logs for any errors
3. Test the application functionality

## Troubleshooting

### CORS Errors
- Ensure `FRONTEND_URL` is set correctly in backend environment variables
- Check that your Vercel domain matches the URL you're accessing

### API Not Found (404)
- Verify the `vercel.json` rewrites configuration
- Check that backend dependencies are installed
- Review build logs for errors

### Environment Variables Not Working
- Ensure you've redeployed after adding/changing variables
- Check variable names match exactly (case-sensitive)
- Verify the environment (Production/Preview/Development) is correct
