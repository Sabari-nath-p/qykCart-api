#!/bin/bash

# QYKCart VPS Quick Setup Script
# For Hostinger VPS or any Ubuntu/Debian VPS
# This script automates the entire deployment process

set -e

echo "🚀 Starting QYKCart VPS Deployment..."
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step() {
    echo -e "\n${BLUE}[STEP]${NC} $1"
    echo "----------------------------------------"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root for security reasons"
   print_warning "Please run as a regular user with sudo privileges"
   exit 1
fi

# Get current user info
CURRENT_USER=$(whoami)
USER_HOME="/home/$CURRENT_USER"

print_step "1. System Information"
print_status "Current user: $CURRENT_USER"
print_status "Home directory: $USER_HOME"
print_status "Working directory: $(pwd)"

# Check if we're in the correct directory
if [[ ! -f "package.json" ]]; then
    print_error "package.json not found in current directory"
    print_error "Please run this script from the QYKCart project root directory"
    exit 1
fi

print_step "2. Updating System Packages"
sudo apt update && sudo apt upgrade -y
print_status "System packages updated successfully"

print_step "3. Installing Node.js 18.x"
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
    print_status "Node.js installed successfully"
else
    print_status "Node.js already installed: $(node --version)"
fi

print_step "4. Installing PM2 Process Manager"
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
    print_status "PM2 installed successfully"
else
    print_status "PM2 already installed: $(pm2 --version)"
fi

print_step "5. Installing MySQL Server"
if ! command -v mysql &> /dev/null; then
    sudo apt install -y mysql-server
    sudo systemctl start mysql
    sudo systemctl enable mysql
    print_status "MySQL installed and started"
    
    print_warning "MySQL root password not set. Setting up..."
    # Set MySQL root password
    MYSQL_ROOT_PASSWORD=$(openssl rand -hex 16)
    sudo mysql -e "ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '$MYSQL_ROOT_PASSWORD';"
    echo "MySQL Root Password: $MYSQL_ROOT_PASSWORD" >> ~/qykcart-credentials.txt
    print_status "MySQL root password saved to ~/qykcart-credentials.txt"
else
    print_status "MySQL already installed"
fi

print_step "6. Installing Nginx"
if ! command -v nginx &> /dev/null; then
    sudo apt install -y nginx
    sudo systemctl start nginx
    sudo systemctl enable nginx
    print_status "Nginx installed and started"
else
    print_status "Nginx already installed"
fi

print_step "7. Setting up Database"
# Generate database credentials
DB_PASSWORD=$(openssl rand -hex 16)
MYSQL_ROOT_PASSWORD=$(grep "MySQL Root Password:" ~/qykcart-credentials.txt 2>/dev/null | cut -d' ' -f4 || echo "")

if [[ -z "$MYSQL_ROOT_PASSWORD" ]]; then
    print_warning "MySQL root password not found. Please enter it manually:"
    read -s -p "MySQL root password: " MYSQL_ROOT_PASSWORD
    echo
fi

# Create database and user
mysql -u root -p"$MYSQL_ROOT_PASSWORD" <<EOF
CREATE DATABASE IF NOT EXISTS qykcart_db;
CREATE USER IF NOT EXISTS 'qykcart_user'@'localhost' IDENTIFIED BY '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON qykcart_db.* TO 'qykcart_user'@'localhost';
FLUSH PRIVILEGES;
EOF

print_status "Database qykcart_db created successfully"
echo "Database Password: $DB_PASSWORD" >> ~/qykcart-credentials.txt

print_step "8. Configuring Environment Variables"
# Backup existing .env
if [[ -f ".env" ]]; then
    cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
    print_status "Existing .env backed up"
fi

# Generate JWT secrets
JWT_SECRET=$(openssl rand -hex 32)
JWT_REFRESH_SECRET=$(openssl rand -hex 32)

# Create production .env file
cat > .env <<EOF
# Production Environment Configuration
NODE_ENV=production
PORT=3003
CORS_ORIGIN=*

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=qykcart_user
DB_PASSWORD=$DB_PASSWORD
DB_DATABASE=qykcart_db

# JWT Configuration
JWT_SECRET=$JWT_SECRET
JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET
JWT_EXPIRES_IN=1d
JWT_REFRESH_EXPIRES_IN=7d

# API Configuration
API_PREFIX=api/v1
SWAGGER_PATH=api/docs
ENABLE_SWAGGER=true
LOG_LEVEL=info

# Firebase Configuration (Update these with your Firebase credentials)
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY=your-firebase-private-key
FIREBASE_CLIENT_EMAIL=your-firebase-client-email
EOF

print_status "Environment configuration created"
echo "JWT Secret: $JWT_SECRET" >> ~/qykcart-credentials.txt
echo "JWT Refresh Secret: $JWT_REFRESH_SECRET" >> ~/qykcart-credentials.txt

print_step "9. Installing Dependencies and Building"
npm install --production
npm run build
print_status "Application built successfully"

print_step "10. Setting up PM2 Process Management"
# Create logs directory
mkdir -p logs

# Create PM2 ecosystem file
cat > ecosystem.config.js <<EOF
module.exports = {
  apps: [{
    name: 'qykcart-api',
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

# Stop any existing processes
pm2 delete qykcart-api 2>/dev/null || true

# Start the application
pm2 start ecosystem.config.js
pm2 save

# Setup PM2 startup
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $CURRENT_USER --hp $USER_HOME

print_status "PM2 process management configured"

print_step "11. Configuring Nginx Reverse Proxy"
# Get server IP
SERVER_IP=$(curl -s http://checkip.amazonaws.com/ 2>/dev/null || echo "YOUR_SERVER_IP")

# Create Nginx configuration
sudo tee /etc/nginx/sites-available/qykcart <<EOF
server {
    listen 80;
    server_name $SERVER_IP _;
    
    client_max_body_size 50M;
    
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
        
        # Increase timeout for long requests
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Health check endpoint
    location /health {
        proxy_pass http://localhost:3003/api/v1/health;
        access_log off;
    }
}
EOF

# Enable the site
sudo ln -sf /etc/nginx/sites-available/qykcart /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
if sudo nginx -t; then
    sudo systemctl reload nginx
    print_status "Nginx configured successfully"
else
    print_error "Nginx configuration failed"
    exit 1
fi

print_step "12. Configuring Firewall"
# Enable UFW and configure rules
sudo ufw --force reset
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw deny 3003/tcp  # Block direct access to Node.js port
sudo ufw --force enable

print_status "Firewall configured successfully"

print_step "13. Final System Health Check"
sleep 5  # Wait for services to stabilize

# Check if application is running
if pm2 list | grep -q "qykcart-api.*online"; then
    print_status "✅ QYKCart API is running"
else
    print_error "❌ QYKCart API failed to start"
    print_warning "Check logs with: pm2 logs qykcart-api"
fi

# Check if Nginx is serving the application
if curl -s http://localhost/api/v1/health > /dev/null; then
    print_status "✅ Nginx proxy is working"
else
    print_warning "❌ Nginx proxy might have issues"
fi

# Check database connection
if mysql -u qykcart_user -p"$DB_PASSWORD" -e "SELECT 1;" qykcart_db > /dev/null 2>&1; then
    print_status "✅ Database connection is working"
else
    print_warning "❌ Database connection issues"
fi

print_step "🎉 Deployment Completed!"
echo
print_status "Your QYKCart API is now deployed and accessible at:"
echo
echo "🌐 API Base URL: http://$SERVER_IP/api/v1/"
echo "📚 Swagger Docs: http://$SERVER_IP/api/docs"
echo "❤️  Health Check: http://$SERVER_IP/api/v1/health"
echo
print_status "Credentials saved to: ~/qykcart-credentials.txt"
echo
print_warning "IMPORTANT: Update Firebase credentials in .env file:"
echo "  - FIREBASE_PROJECT_ID"
echo "  - FIREBASE_PRIVATE_KEY"
echo "  - FIREBASE_CLIENT_EMAIL"
echo
print_status "Useful commands:"
echo "  📊 Check status: pm2 status"
echo "  📋 View logs: pm2 logs qykcart-api"
echo "  🔄 Restart app: pm2 restart qykcart-api"
echo "  🔧 Nginx reload: sudo systemctl reload nginx"
echo
print_status "Deployment completed successfully! 🚀"

# Create a quick status check script
cat > check-status.sh <<'EOF'
#!/bin/bash
echo "🔍 QYKCart API Status Check"
echo "=========================="
echo
echo "PM2 Status:"
pm2 list
echo
echo "System Services:"
systemctl is-active nginx mysql
echo
echo "Port Usage:"
sudo netstat -tulpn | grep -E ":80|:3003|:3306"
echo
echo "API Health Check:"
curl -s http://localhost/api/v1/health || echo "Health check failed"
echo
EOF

chmod +x check-status.sh
print_status "Status check script created: ./check-status.sh"