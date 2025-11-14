#!/bin/bash

# Script to set up Vercel environment variables
# Run this script from the project root directory

echo "🔧 Setting up Vercel environment variables..."
echo ""
echo "This script will help you configure environment variables in Vercel."
echo "Make sure you have the Vercel CLI installed: npm i -g vercel"
echo ""

# Read from backend/.env
if [ ! -f "backend/.env" ]; then
    echo "❌ Error: backend/.env file not found"
    exit 1
fi

# Source the backend .env file
set -a
source backend/.env
set +a

echo "📋 Setting backend environment variables..."

# Set environment variables in Vercel (production, preview, and development)
vercel env add SUPABASE_URL production <<< "$SUPABASE_URL"
vercel env add SUPABASE_URL preview <<< "$SUPABASE_URL"

vercel env add SUPABASE_ANON_KEY production <<< "$SUPABASE_ANON_KEY"
vercel env add SUPABASE_ANON_KEY preview <<< "$SUPABASE_ANON_KEY"

vercel env add SUPABASE_SERVICE_ROLE_KEY production <<< "$SUPABASE_SERVICE_ROLE_KEY"
vercel env add SUPABASE_SERVICE_ROLE_KEY preview <<< "$SUPABASE_SERVICE_ROLE_KEY"

vercel env add FAL_API_KEY production <<< "$FAL_API_KEY"
vercel env add FAL_API_KEY preview <<< "$FAL_API_KEY"

vercel env add STRIPE_SECRET_KEY production <<< "$STRIPE_SECRET_KEY"
vercel env add STRIPE_SECRET_KEY preview <<< "$STRIPE_SECRET_KEY"

vercel env add STRIPE_WEBHOOK_SECRET production <<< "$STRIPE_WEBHOOK_SECRET"
vercel env add STRIPE_WEBHOOK_SECRET preview <<< "$STRIPE_WEBHOOK_SECRET"

vercel env add STRIPE_PUBLISHABLE_KEY production <<< "$STRIPE_PUBLISHABLE_KEY"
vercel env add STRIPE_PUBLISHABLE_KEY preview <<< "$STRIPE_PUBLISHABLE_KEY"

vercel env add NODE_ENV production <<< "production"
vercel env add NODE_ENV preview <<< "production"

echo ""
echo "📋 Setting frontend environment variables..."

# Source the frontend .env file
set -a
source frontend/.env
set +a

# Frontend vars
vercel env add VITE_API_URL production <<< ""
vercel env add VITE_API_URL preview <<< ""

vercel env add VITE_SUPABASE_URL production <<< "$VITE_SUPABASE_URL"
vercel env add VITE_SUPABASE_URL preview <<< "$VITE_SUPABASE_URL"

vercel env add VITE_SUPABASE_ANON_KEY production <<< "$VITE_SUPABASE_ANON_KEY"
vercel env add VITE_SUPABASE_ANON_KEY preview <<< "$VITE_SUPABASE_ANON_KEY"

echo ""
echo "✅ Environment variables configured!"
echo ""
echo "⚠️  IMPORTANT: You still need to set FRONTEND_URL manually:"
echo "   vercel env add FRONTEND_URL production"
echo "   Then enter your production Vercel URL (e.g., https://your-app.vercel.app)"
echo ""
echo "🚀 Redeploy your application for changes to take effect:"
echo "   vercel --prod"
