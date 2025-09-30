# QYKCart VPS Deployment Guide

## Quick Deployment for Hostinger VPS

This guide will help you deploy QYKCart API on your Hostinger VPS or any Ubuntu/Debian VPS.

## Prerequisites

- Ubuntu/Debian VPS with root or sudo access
- Domain name pointed to your VPS IP (optional)
- Basic knowledge of Linux commands

## 🚀 Quick Deployment (Recommended)

### Step 1: Upload Your Project
```bash
# Upload your project files to VPS (via FTP, SCP, or Git)
# Example using Git:
cd /home/$(whoami)
git clone https://github.com/Sabari-nath-p/qykCart-api.git qykcart
cd qykcart
```

### Step 2: Run the Deployment Script
```bash
# Make the script executable
chmod +x deploy-vps.sh

# Run the deployment script
./deploy-vps.sh
```

That's it! Your API will be accessible at your VPS IP address.

## 📋 Manual Deployment Steps

If you prefer to deploy manually or the script doesn't work:

### 1. Update System
```bash
sudo apt update && sudo apt upgrade -y
```

### 2. Install Node.js 18.x
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 3. Install PM2
```bash
sudo npm install -g pm2
```

### 4. Install MySQL
```bash
sudo apt install -y mysql-server
sudo systemctl start mysql
sudo systemctl enable mysql

# Secure MySQL installation
sudo mysql_secure_installation
```

### 5. Install Nginx
```bash
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 6. Setup Database
```bash
# Connect to MySQL
mysql -u root -p

# Run these commands in MySQL:
CREATE DATABASE qykcart_db;
CREATE USER 'qykcart_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON qykcart_db.* TO 'qykcart_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 7. Configure Environment
```bash
# Create production environment file
cp .env .env.backup
cat > .env <<EOF
NODE_ENV=production
PORT=3003
CORS_ORIGIN=*

DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=qykcart_user
DB_PASSWORD=your_secure_password
DB_DATABASE=qykcart_db

JWT_SECRET=$(openssl rand -hex 32)
JWT_REFRESH_SECRET=$(openssl rand -hex 32)
JWT_EXPIRES_IN=1d
JWT_REFRESH_EXPIRES_IN=7d

API_PREFIX=api/v1
SWAGGER_PATH=api/docs
ENABLE_SWAGGER=true
LOG_LEVEL=info

# Update with your Firebase credentials
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY=your-firebase-private-key
FIREBASE_CLIENT_EMAIL=your-firebase-client-email
EOF
```

### 8. Install Dependencies and Build
```bash
npm install --production
npm run build
```

### 9. Setup PM2 Process Management
```bash
# Create PM2 ecosystem file
cat > ecosystem.config.js <<EOF
module.exports = {
  apps: [{
    name: 'qykcart',
    script: 'dist/main.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3003
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
EOF

# Create logs directory
mkdir -p logs

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 10. Configure Nginx Reverse Proxy
```bash
# Create Nginx configuration
sudo tee /etc/nginx/sites-available/qykcart <<EOF
server {
    listen 80;
    server_name YOUR_DOMAIN_OR_IP;
    
    location / {
        proxy_pass http://localhost:3003;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Increase timeout
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
EOF

# Enable the site
sudo ln -sf /etc/nginx/sites-available/qykcart /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

### 11. Configure Firewall
```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable
```

## 🔧 Post-Deployment Management

### Check Application Status
```bash
pm2 status
pm2 logs qykcart
```

### Restart Application
```bash
pm2 restart qykcart
```

### Update Application
```bash
# Pull latest changes
git pull origin main

# Rebuild
npm run build

# Restart
pm2 restart qykcart
```

### Monitor Logs
```bash
# Real-time logs
pm2 logs qykcart --lines 50

# Error logs only
pm2 logs qykcart --err

# Application logs
tail -f logs/combined.log
```

## 🌐 Accessing Your API

After successful deployment:

- **API Base URL**: `http://YOUR_VPS_IP/api/v1/`
- **Swagger Documentation**: `http://YOUR_VPS_IP/api/docs`
- **Health Check**: `http://YOUR_VPS_IP/api/v1/health`

## 🔒 Security Recommendations

### 1. Enable SSL/HTTPS
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate (replace your-domain.com)
sudo certbot --nginx -d your-domain.com
```

### 2. Update Firewall Rules
```bash
# Allow only necessary ports
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw deny 3003/tcp  # Block direct access to Node.js port
```

### 3. Secure MySQL
```bash
# Run MySQL security script
sudo mysql_secure_installation

# Update MySQL user password
mysql -u root -p
ALTER USER 'qykcart_user'@'localhost' IDENTIFIED BY 'new_strong_password';
FLUSH PRIVILEGES;
```

### 4. Update Environment Variables
```bash
# Generate strong JWT secrets
openssl rand -hex 32

# Update .env file with strong passwords and secrets
```

## 🐛 Troubleshooting

### Application Not Starting
```bash
# Check PM2 logs
pm2 logs qykcart

# Check if port is in use
sudo netstat -tulpn | grep :3003

# Restart services
pm2 restart qykcart
sudo systemctl restart nginx
```

### Database Connection Issues
```bash
# Test MySQL connection
mysql -u qykcart_user -p qykcart_db

# Check MySQL service
sudo systemctl status mysql

# Restart MySQL
sudo systemctl restart mysql
```

### Nginx Issues
```bash
# Test Nginx configuration
sudo nginx -t

# Check Nginx status
sudo systemctl status nginx

# View Nginx error logs
sudo tail -f /var/log/nginx/error.log
```

### 502 Bad Gateway
```bash
# Usually means the Node.js app is not running
pm2 status
pm2 restart qykcart

# Check if app is listening on correct port
sudo netstat -tulpn | grep :3003
```

## 📱 Mobile App Integration

Your API is now ready for mobile app integration:

### Base URL Configuration
```javascript
// In your mobile app
const API_BASE_URL = 'http://YOUR_VPS_IP/api/v1';
// or with domain
const API_BASE_URL = 'https://your-domain.com/api/v1';
```

### Test Endpoints
```bash
# Health check
curl http://YOUR_VPS_IP/api/v1/health

# Send OTP (example)
curl -X POST http://YOUR_VPS_IP/api/v1/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+1234567890"}'
```

## 🆘 Need Help?

If you encounter issues:

1. Check the logs: `pm2 logs qykcart`
2. Verify all services are running: `pm2 status`, `sudo systemctl status nginx mysql`
3. Test database connection manually
4. Check firewall settings: `sudo ufw status`
5. Verify environment variables in `.env` file

Good luck with your deployment! 🚀