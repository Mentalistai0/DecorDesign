# DigitalOcean Droplet Deployment Guide

Complete guide to deploy DecorDesign on a DigitalOcean Droplet (VPS).

## Prerequisites

1. A DigitalOcean account
2. A domain name (optional but recommended)
3. SSH access to your server

## Step 1: Create a Droplet

1. Log in to [DigitalOcean](https://cloud.digitalocean.com)
2. Click **Create** → **Droplets**
3. Choose configuration:
   - **Image**: Ubuntu 22.04 LTS
   - **Plan**: Basic
   - **CPU Options**: Regular (2GB RAM / 1 CPU) - $12/month recommended
   - **Datacenter**: Choose closest to your users
   - **Authentication**: SSH key (recommended) or password
   - **Hostname**: decor-design
4. Click **Create Droplet**

## Step 2: Initial Server Setup

SSH into your droplet:
```bash
ssh root@your_droplet_ip
```

### Update system packages
```bash
apt update && apt upgrade -y
```

### Create a non-root user (recommended)
```bash
adduser deployuser
usermod -aG sudo deployuser
```

### Install Node.js (v18)
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt install -y nodejs
node --version  # Should show v18.x
```

### Install PM2 (Process Manager)
```bash
npm install -g pm2
```

### Install Nginx (Web Server)
```bash
apt install -y nginx
systemctl start nginx
systemctl enable nginx
```

### Install Git
```bash
apt install -y git
```

## Step 3: Clone and Setup Application

### Switch to deploy user (if created)
```bash
su - deployuser
```

### Clone repository
```bash
cd /var/www
sudo mkdir -p decor-design
sudo chown -R $USER:$USER decor-design
cd decor-design

git clone https://github.com/Mentalistai0/DecorDesign.git .
```

### Install dependencies
```bash
# Install backend dependencies
cd backend
npm install --production
cd ..

# Install frontend dependencies and build
cd frontend
npm install
npm run build
cd ..
```

### Setup environment variables
```bash
cd backend
cp .env.example .env
nano .env
```

Edit `.env` with your production values:
```env
PORT=3000
NODE_ENV=production

# Supabase
SUPABASE_URL=https://ixtmmrettexwjasdxytr.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# API Keys
FAL_API_KEY=your_fal_key
STRIPE_SECRET_KEY=your_stripe_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret
STRIPE_PUBLISHABLE_KEY=your_publishable_key

# Frontend URL
FRONTEND_URL=https://your-domain.com
```

Save and exit (Ctrl+X, Y, Enter)

## Step 4: Start Application with PM2

```bash
cd /var/www/decor-design

# Start backend with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Run the command it outputs
```

Check if running:
```bash
pm2 status
pm2 logs decor-design-backend
```

## Step 5: Configure Nginx

### Copy and edit Nginx configuration
```bash
sudo cp /var/www/decor-design/nginx.conf /etc/nginx/sites-available/decor-design

sudo nano /etc/nginx/sites-available/decor-design
```

Replace `your-domain.com` with your actual domain (or droplet IP for testing).

### Enable the site
```bash
sudo ln -s /etc/nginx/sites-available/decor-design /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

## Step 6: Setup SSL with Let's Encrypt (Optional but Recommended)

### Install Certbot
```bash
sudo apt install -y certbot python3-certbot-nginx
```

### Get SSL certificate
```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

Follow the prompts. Certbot will automatically:
- Get SSL certificates
- Update your Nginx configuration
- Setup auto-renewal

### Test auto-renewal
```bash
sudo certbot renew --dry-run
```

## Step 7: Configure Firewall (UFW)

```bash
# Allow SSH
sudo ufw allow OpenSSH

# Allow HTTP and HTTPS
sudo ufw allow 'Nginx Full'

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

## Step 8: Point Domain to Droplet

1. Go to your domain registrar
2. Add/Update DNS A records:
   - `@` (root domain) → Your Droplet IP
   - `www` → Your Droplet IP
3. Wait for DNS propagation (can take up to 48 hours, usually much faster)

## Testing Deployment

Visit your domain (or droplet IP):
- `https://your-domain.com` - Should show your app
- `https://your-domain.com/api/health` - Should show backend status (if you have a health endpoint)

## Updating the Application

### Manual update
```bash
cd /var/www/decor-design

# Pull latest changes
git pull

# Update backend
cd backend
npm install --production

# Rebuild frontend
cd ../frontend
npm install
npm run build

# Restart backend
pm2 restart decor-design-backend
```

### Automated deployment (optional)
You can set up a webhook or GitHub Action to auto-deploy on push.

## Monitoring

### View logs
```bash
# PM2 logs
pm2 logs decor-design-backend

# Nginx access logs
sudo tail -f /var/log/nginx/decor-design-access.log

# Nginx error logs
sudo tail -f /var/log/nginx/decor-design-error.log
```

### Check resource usage
```bash
pm2 monit
htop  # Install with: sudo apt install htop
```

## Adding More Projects Later

For each new project:

1. Clone to `/var/www/project-name`
2. Create PM2 ecosystem config
3. Create Nginx config in `/etc/nginx/sites-available/project-name`
4. Enable with symlink to `sites-enabled`
5. Use different ports for each backend (3001, 3002, etc.)
6. Reload Nginx

## Troubleshooting

### Backend not starting
```bash
pm2 logs decor-design-backend
# Check for errors in logs
```

### 502 Bad Gateway
- Backend not running: `pm2 status`
- Wrong port in Nginx config
- Firewall blocking port: `sudo ufw status`

### Permission errors
```bash
sudo chown -R $USER:$USER /var/www/decor-design
```

### High memory usage
Upgrade droplet or optimize application:
```bash
pm2 restart decor-design-backend --max-memory-restart 500M
```

## Backup Strategy

### Database (Supabase)
- Supabase handles backups automatically
- Download manual backups from Supabase dashboard

### Files and uploads
```bash
# Backup uploads folder
rsync -avz /var/www/decor-design/backend/uploads ~/backups/uploads-$(date +%Y%m%d)
```

### Setup automated backups with cron
```bash
crontab -e

# Add daily backup at 2 AM
0 2 * * * rsync -avz /var/www/decor-design/backend/uploads ~/backups/uploads-$(date +\%Y\%m\%d)
```

## Cost Estimate

- **Droplet (2GB)**: $12/month
- **Backups (optional)**: $2.40/month (20% of droplet cost)
- **Bandwidth**: 2TB included (usually enough)
- **Domain**: $10-15/year (if you don't have one)

**Total**: ~$12-15/month + domain

## Security Best Practices

1. ✅ Keep system updated: `sudo apt update && sudo apt upgrade`
2. ✅ Use SSH keys instead of passwords
3. ✅ Enable firewall (UFW)
4. ✅ Use SSL certificates (Let's Encrypt)
5. ✅ Don't run as root user
6. ✅ Regular backups
7. ✅ Monitor logs for suspicious activity
8. ✅ Keep API keys in `.env` files, never commit them

## Support

- [DigitalOcean Documentation](https://docs.digitalocean.com)
- [PM2 Documentation](https://pm2.keymetrics.io/docs)
- [Nginx Documentation](https://nginx.org/en/docs)
