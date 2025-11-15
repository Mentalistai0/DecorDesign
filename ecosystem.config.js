// PM2 Ecosystem Configuration
// Used for managing Node.js processes on DigitalOcean Droplet

module.exports = {
  apps: [
    {
      name: 'decor-design-backend',
      script: './backend/server.js',
      instances: 1,
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_file: './logs/backend-combined.log',
      time: true
    }
  ]
};
