#!/bin/bash

# Simple QYKCart VPS Deployment Script
# For quick deployment on Hostinger VPS or any Ubuntu/Debian VPS
# Author: QYKCart Development Team

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Configuration
APP_NAME="qykcart"
PORT=${PORT:-3003}
NODE_ENV="production"

echo -e "${BLUE}🚀 Starting QYKCart VPS Deployment...${NC}"

# Update system
echo -e "${BLUE}📦 Updating system packages...${NC}"
sudo apt update && sudo apt upgrade -y

# Install Node.js 18.x
echo -e "${BLUE}📦 Installing Node.js 18.x...${NC}"
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
echo -e "${BLUE}📦 Installing PM2...${NC}"
sudo npm install -g pm2

# Install MySQL
echo -e "${BLUE}🗄️ Installing MySQL...${NC}"
sudo apt install -y mysql-server
sudo systemctl start mysql
sudo systemctl enable mysql

# Install Nginx
echo -e "${BLUE}🌐 Installing Nginx...${NC}"
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Setup MySQL database
echo -e "${BLUE}🗄️ Setting up database...${NC}"
echo "Please enter MySQL root password (press Enter if no password set):"
mysql -u root -p <<EOF
CREATE DATABASE IF NOT EXISTS qykcart_db;
CREATE USER IF NOT EXISTS 'qykcart_user'@'localhost' IDENTIFIED BY 'qykcart_secure_2024';
GRANT ALL PRIVILEGES ON qykcart_db.* TO 'qykcart_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
EOF

# Create production environment file
echo -e "${BLUE}⚙️ Creating production environment...${NC}"
cat > .env.production <<EOF
NODE_ENV=production
PORT=$PORT
CORS_ORIGIN=*

DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=qykcart_user
DB_PASSWORD=qykcart_secure_2024
DB_DATABASE=qykcart_db

JWT_SECRET=$(openssl rand -hex 32)
JWT_REFRESH_SECRET=$(openssl rand -hex 32)
JWT_EXPIRES_IN=1d
JWT_REFRESH_EXPIRES_IN=7d

API_PREFIX=api/v1
SWAGGER_PATH=api/docs

ENABLE_SWAGGER=true
LOG_LEVEL=info

# Update these with your Firebase credentials
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY=your-firebase-private-key
FIREBASE_CLIENT_EMAIL=your-firebase-client-email
EOF

cp .env.production .env

# Install dependencies and build
echo -e "${BLUE}📦 Installing dependencies and building...${NC}"
npm install --production
npm run build

# Create PM2 ecosystem file
echo -e "${BLUE}⚙️ Creating PM2 configuration...${NC}"
cat > ecosystem.config.js <<EOF
module.exports = {
  apps: [{
    name: '$APP_NAME',
    script: 'dist/main.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: $PORT
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

# Setup Nginx reverse proxy
echo -e "${BLUE}🌐 Setting up Nginx reverse proxy...${NC}"
sudo tee /etc/nginx/sites-available/$APP_NAME <<EOF
server {
    listen 80;
    server_name _;
    
    location / {
        proxy_pass http://localhost:$PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Increase timeout for long-running requests
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
EOF

# Enable the site
sudo ln -sf /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

# Configure firewall
echo -e "${BLUE}🔥 Configuring firewall...${NC}"
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

# Start the application
echo -e "${BLUE}🚀 Starting application...${NC}"
pm2 start ecosystem.config.js
pm2 save
pm2 startup

echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo ""
echo -e "${GREEN}🌐 Your QYKCart API is now accessible at:${NC}"
echo -e "  📍 Public URL: http://$(curl -s ifconfig.me || hostname -I | awk '{print $1}')"
echo -e "  📚 API Docs: http://$(curl -s ifconfig.me || hostname -I | awk '{print $1}')/api/docs"
echo -e "  🏥 Health Check: http://$(curl -s ifconfig.me || hostname -I | awk '{print $1}')/api/v1/health"
echo ""
echo -e "${BLUE}🔧 Management commands:${NC}"
echo -e "  pm2 status          - Check app status"
echo -e "  pm2 logs $APP_NAME  - View logs"
echo -e "  pm2 restart $APP_NAME - Restart app"
echo -e "  pm2 stop $APP_NAME  - Stop app"
echo ""
echo -e "${GREEN}🎉 Happy coding!${NC}"