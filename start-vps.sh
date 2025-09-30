#!/bin/bash

# QYKCart VPS Production Deployment Script
# Optimized for Hostinger VPS and production environments
# Author: QYKCart Development Team
# Date: October 2025

set -e  # Exit immediately if a command exits with a non-zero status

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# VPS Configuration
PROJECT_NAME="qykcart"
APP_DIR="/home/$(whoami)/$PROJECT_NAME"
API_PORT=${PORT:-3003}  # Use PORT env var if available, default to 3003
DB_HOST=${DB_HOST:-"localhost"}
DB_PORT=${DB_PORT:-3306}  # Standard MySQL port for VPS
DB_NAME="qykcart_db"
DB_USER="qykcart_user"
DB_PASSWORD=${DB_PASSWORD:-"qykcart_secure_password_2024"}
NODE_ENV="production"

# Function to print colored output
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_header() {
    echo -e "${MAGENTA}🚀 $1${NC}"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if port is available
check_port() {
    local port=$1
    if ss -tuln | grep -q ":$port "; then
        return 1  # Port is in use
    else
        return 0  # Port is available
    fi
}

# Function to stop existing processes
stop_existing_processes() {
    print_info "Stopping existing QYKCart processes..."
    
    # Stop PM2 processes
    if command_exists pm2; then
        pm2 delete $PROJECT_NAME 2>/dev/null || true
        pm2 kill 2>/dev/null || true
    fi
    
    # Kill any remaining Node processes on our port
    pkill -f "node.*$API_PORT" 2>/dev/null || true
    pkill -f "npm.*start" 2>/dev/null || true
    
    print_success "Stopped existing processes"
}

# Function to install system dependencies
install_system_dependencies() {
    print_info "Installing system dependencies..."
    
    # Update package list
    sudo apt update -y
    
    # Install essential packages
    sudo apt install -y curl wget git nginx mysql-server
    
    # Install Node.js and npm if not present
    if ! command_exists node; then
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt-get install -y nodejs
    fi
    
    # Install PM2 globally for process management
    if ! command_exists pm2; then
        sudo npm install -g pm2
    fi
    
    print_success "System dependencies installed"
}

# Function to setup MySQL database
setup_database() {
    print_info "Setting up MySQL database..."
    
    # Start MySQL service
    sudo systemctl start mysql
    sudo systemctl enable mysql
    
    # Create database and user
    mysql -u root -p <<EOF
CREATE DATABASE IF NOT EXISTS $DB_NAME;
CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASSWORD';
CREATE USER IF NOT EXISTS '$DB_USER'@'%' IDENTIFIED BY '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'localhost';
GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'%';
FLUSH PRIVILEGES;
EOF
    
    print_success "Database setup completed"
}

# Function to create/update environment file
create_env_file() {
    print_info "Creating production environment file..."
    
    cat > .env.production <<EOF
# Application Configuration
NODE_ENV=production
PORT=$API_PORT
CORS_ORIGIN=*

# Database Configuration
DB_HOST=$DB_HOST
DB_PORT=$DB_PORT
DB_USERNAME=$DB_USER
DB_PASSWORD=$DB_PASSWORD
DB_DATABASE=$DB_NAME

# JWT Configuration
JWT_SECRET=$(openssl rand -hex 32)
JWT_REFRESH_SECRET=$(openssl rand -hex 32)
JWT_EXPIRES_IN=1d
JWT_REFRESH_EXPIRES_IN=7d

# API Configuration
API_PREFIX=api/v1
SWAGGER_PATH=api/docs

# Production Settings
ENABLE_SWAGGER=true
LOG_LEVEL=info

# Firebase Configuration (update with your credentials)
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY=your-firebase-private-key
FIREBASE_CLIENT_EMAIL=your-firebase-client-email
EOF

    # Copy to .env for consistency
    cp .env.production .env
    
    print_success "Environment file created"
}

# Function to install project dependencies
install_project_dependencies() {
    print_info "Installing project dependencies..."
    
    # Clean install of dependencies
    rm -rf node_modules package-lock.json
    npm install --production
    
    # Build the project
    npm run build
    
    print_success "Project dependencies installed and built"
}

# Function to setup Nginx reverse proxy
setup_nginx() {
    print_info "Setting up Nginx reverse proxy..."
    
    # Create Nginx configuration
    sudo tee /etc/nginx/sites-available/$PROJECT_NAME <<EOF
server {
    listen 80;
    server_name _;
    
    location / {
        proxy_pass http://localhost:$API_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Swagger documentation
    location /api/docs {
        proxy_pass http://localhost:$API_PORT/api/docs;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

    # Enable the site
    sudo ln -sf /etc/nginx/sites-available/$PROJECT_NAME /etc/nginx/sites-enabled/
    sudo rm -f /etc/nginx/sites-enabled/default
    
    # Test and reload Nginx
    sudo nginx -t && sudo systemctl reload nginx
    sudo systemctl enable nginx
    
    print_success "Nginx reverse proxy configured"
}

# Function to setup firewall
setup_firewall() {
    print_info "Configuring firewall..."
    
    # Enable UFW and configure basic rules
    sudo ufw --force enable
    sudo ufw default deny incoming
    sudo ufw default allow outgoing
    
    # Allow SSH, HTTP, HTTPS
    sudo ufw allow ssh
    sudo ufw allow 80/tcp
    sudo ufw allow 443/tcp
    
    # Allow MySQL if needed
    sudo ufw allow 3306/tcp
    
    print_success "Firewall configured"
}

# Function to start application with PM2
start_application() {
    print_info "Starting application with PM2..."
    
    # Create PM2 ecosystem file
    cat > ecosystem.config.js <<EOF
module.exports = {
  apps: [{
    name: '$PROJECT_NAME',
    script: 'dist/main.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: $API_PORT
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: $API_PORT
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024'
  }]
};
EOF

    # Create logs directory
    mkdir -p logs
    
    # Start with PM2
    pm2 start ecosystem.config.js --env production
    pm2 save
    pm2 startup
    
    print_success "Application started with PM2"
}

# Function to show final information
show_final_info() {
    clear
    print_header "🎉 QYKCart VPS Deployment Complete!"
    echo ""
    echo -e "${GREEN}📊 Service Information:${NC}"
    echo -e "  ${CYAN}• API Server:${NC} http://$(hostname -I | awk '{print $1}'):80"
    echo -e "  ${CYAN}• API Documentation:${NC} http://$(hostname -I | awk '{print $1}'):80/api/docs"
    echo -e "  ${CYAN}• Internal Port:${NC} $API_PORT"
    echo -e "  ${CYAN}• Database:${NC} MySQL on $DB_HOST:$DB_PORT"
    echo -e "  ${CYAN}• Database Name:${NC} $DB_NAME"
    echo ""
    echo -e "${GREEN}🔧 Management Commands:${NC}"
    echo -e "  ${CYAN}• View Logs:${NC} pm2 logs $PROJECT_NAME"
    echo -e "  ${CYAN}• Restart App:${NC} pm2 restart $PROJECT_NAME"
    echo -e "  ${CYAN}• Stop App:${NC} pm2 stop $PROJECT_NAME"
    echo -e "  ${CYAN}• App Status:${NC} pm2 status"
    echo -e "  ${CYAN}• Nginx Status:${NC} sudo systemctl status nginx"
    echo ""
    echo -e "${GREEN}🌐 Access Your API:${NC}"
    echo -e "  ${CYAN}• Public URL:${NC} http://YOUR_VPS_IP/"
    echo -e "  ${CYAN}• Swagger Docs:${NC} http://YOUR_VPS_IP/api/docs"
    echo ""
    echo -e "${YELLOW}🔐 Security Notes:${NC}"
    echo -e "  ${CYAN}• Update your domain/IP in CORS settings${NC}"
    echo -e "  ${CYAN}• Configure SSL certificate for HTTPS${NC}"
    echo -e "  ${CYAN}• Update Firebase credentials in .env${NC}"
    echo ""
}

# Main execution function
main() {
    clear
    print_header "🏪 QYKCart VPS Production Deployment"
    echo -e "${BLUE}Setting up QYKCart for production on VPS...${NC}"
    echo ""
    
    # Change to project directory
    cd "$APP_DIR" || {
        print_error "Project directory not found: $APP_DIR"
        print_info "Please ensure your project is in: $APP_DIR"
        exit 1
    }
    
    # Stop existing processes
    stop_existing_processes
    
    # Install system dependencies
    install_system_dependencies
    
    # Setup database
    setup_database
    
    # Create environment file
    create_env_file
    
    # Install project dependencies
    install_project_dependencies
    
    # Setup Nginx
    setup_nginx
    
    # Setup firewall
    setup_firewall
    
    # Start application
    start_application
    
    # Show final information
    show_final_info
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --port PORT     Set API port (default: 3003)"
    echo "  --db-host HOST  Set database host (default: localhost)"
    echo "  --db-port PORT  Set database port (default: 3306)"
    echo "  --help          Show this help message"
    echo ""
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --port)
            API_PORT="$2"
            shift 2
            ;;
        --db-host)
            DB_HOST="$2"
            shift 2
            ;;
        --db-port)
            DB_PORT="$2"
            shift 2
            ;;
        --help)
            show_usage
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Run main function
main "$@"