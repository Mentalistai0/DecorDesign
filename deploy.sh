#!/bin/bash

# Deployment script for DecorDesign
# Run this on your DigitalOcean droplet to deploy/update the application

set -e  # Exit on error

echo "🚀 Starting DecorDesign deployment..."

# Configuration
APP_DIR="/var/www/decor-design"
BACKEND_DIR="$APP_DIR/backend"
FRONTEND_DIR="$APP_DIR/frontend"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Navigate to app directory
cd $APP_DIR

echo -e "${YELLOW}📥 Pulling latest changes from Git...${NC}"
git pull origin main || git pull origin master || git pull

echo -e "${YELLOW}📦 Installing backend dependencies...${NC}"
cd $BACKEND_DIR
npm install --production

echo -e "${YELLOW}🎨 Building frontend...${NC}"
cd $FRONTEND_DIR
npm install
npm run build

echo -e "${YELLOW}🔄 Restarting backend with PM2...${NC}"
cd $APP_DIR
pm2 restart decor-design-backend || pm2 start ecosystem.config.js
pm2 save

echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo "📊 Application status:"
pm2 status

echo ""
echo "📝 View logs with: pm2 logs decor-design-backend"
echo "🔍 Monitor with: pm2 monit"
