#!/bin/bash

# QYKCart Project Startup Script
# This script sets up and runs the entire QYKCart e-commerce platform
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

# Configuration
DB_PORT=3310
API_PORT=3003
PROJECT_NAME="qykcart"
DB_NAME="qykcart_db"
DB_USER="qykcart_user"
DB_PASSWORD="qykcart_password"
DB_ROOT_PASSWORD="rootpassword"

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
is_port_available() {
    ! lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1
}

# Function to wait for service to be ready
wait_for_service() {
    local host=$1
    local port=$2
    local service_name=$3
    local max_attempts=60
    local attempt=1

    print_info "Waiting for $service_name to be ready on $host:$port..."
    
    while [ $attempt -le $max_attempts ]; do
        # Try multiple methods to check port availability
        if nc -z $host $port >/dev/null 2>&1 || \
           timeout 1 bash -c "cat < /dev/null > /dev/tcp/$host/$port" >/dev/null 2>&1 || \
           telnet $host $port >/dev/null 2>&1 < /dev/null; then
            print_success "$service_name is ready!"
            return 0
        fi
        
        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    print_error "$service_name failed to start within $((max_attempts * 2)) seconds"
    return 1
}

# Function to create database if not exists
create_database() {
    print_info "Creating database if not exists..."
    
    # Wait a bit more for MySQL to fully initialize
    sleep 5
    
    docker exec -i ${PROJECT_NAME}-mysql mysql -uroot -p${DB_ROOT_PASSWORD} -e "
        CREATE DATABASE IF NOT EXISTS ${DB_NAME};
        CREATE USER IF NOT EXISTS '${DB_USER}'@'%' IDENTIFIED BY '${DB_PASSWORD}';
        GRANT ALL PRIVILEGES ON ${DB_NAME}.* TO '${DB_USER}'@'%';
        FLUSH PRIVILEGES;
    " || {
        print_warning "Direct database creation failed, trying alternative method..."
        
        # Alternative method using mysql client
        docker exec -i ${PROJECT_NAME}-mysql sh -c "
            until mysql -uroot -p${DB_ROOT_PASSWORD} -e 'SELECT 1' >/dev/null 2>&1; do
                echo 'Waiting for MySQL to be ready...'
                sleep 2
            done
            
            mysql -uroot -p${DB_ROOT_PASSWORD} -e \"
                CREATE DATABASE IF NOT EXISTS ${DB_NAME};
                CREATE USER IF NOT EXISTS '${DB_USER}'@'%' IDENTIFIED BY '${DB_PASSWORD}';
                GRANT ALL PRIVILEGES ON ${DB_NAME}.* TO '${DB_USER}'@'%';
                FLUSH PRIVILEGES;
                SELECT 'Database setup completed' as status;
            \"
        "
    }
    
    print_success "Database setup completed!"
}

# Function to update environment configuration
update_env_config() {
    print_info "Updating environment configuration..."
    
    # Backup original .env file
    if [ -f .env ]; then
        cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
        print_info "Backed up existing .env file"
    fi
    
    # Create or update .env file
    cat > .env << EOF
# Application Configuration
NODE_ENV=development
PORT=${API_PORT}
CORS_ORIGIN=http://localhost:${API_PORT}

# Database Configuration
DB_HOST=localhost
DB_PORT=${DB_PORT}
DB_USERNAME=${DB_USER}
DB_PASSWORD=${DB_PASSWORD}
DB_DATABASE=${DB_NAME}

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production-$(date +%s)
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production-$(date +%s)
JWT_EXPIRES_IN=1d
JWT_REFRESH_EXPIRES_IN=7d

# API Configuration
API_PREFIX=api/v1
SWAGGER_PATH=api/docs

# Firebase Configuration (for FCM - add your credentials)
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY=your-firebase-private-key
FIREBASE_CLIENT_EMAIL=your-firebase-client-email

# Development Settings
ENABLE_SWAGGER=true
LOG_LEVEL=debug
EOF
    
    print_success "Environment configuration updated!"
}

# Function to update docker-compose configuration
update_docker_config() {
    print_info "Updating Docker Compose configuration..."
    
    # Backup original docker-compose.yml
    if [ -f docker-compose.yml ]; then
        cp docker-compose.yml docker-compose.yml.backup.$(date +%Y%m%d_%H%M%S)
        print_info "Backed up existing docker-compose.yml"
    fi
    
    cat > docker-compose.yml << EOF
version: '3.8'

services:
  # MySQL Database
  mysql:
    image: mysql:8.0
    container_name: ${PROJECT_NAME}-mysql
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_ROOT_PASSWORD}
      MYSQL_DATABASE: ${DB_NAME}
      MYSQL_USER: ${DB_USER}
      MYSQL_PASSWORD: ${DB_PASSWORD}
    ports:
      - "${DB_PORT}:3306"
    volumes:
      - mysql_data:/var/lib/mysql
      - ./database/init:/docker-entrypoint-initdb.d
    networks:
      - ${PROJECT_NAME}-network
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-uroot", "-p${DB_ROOT_PASSWORD}"]
      timeout: 20s
      retries: 10
      interval: 10s
    command: --default-authentication-plugin=mysql_native_password

volumes:
  mysql_data:
    driver: local

networks:
  ${PROJECT_NAME}-network:
    driver: bridge
EOF
    
    print_success "Docker Compose configuration updated!"
}

# Function to check prerequisites
check_prerequisites() {
    print_header "Checking Prerequisites"
    
    # Check if Docker is installed
    if ! command_exists docker; then
        print_error "Docker is not installed. Please install Docker first."
        echo "Visit: https://docs.docker.com/get-docker/"
        exit 1
    fi
    print_success "Docker is installed"
    
    # Check if Docker Compose is available
    if ! command_exists docker-compose && ! docker compose version >/dev/null 2>&1; then
        print_error "Docker Compose is not available. Please install Docker Compose."
        exit 1
    fi
    print_success "Docker Compose is available"
    
    # Check if Node.js is installed
    if ! command_exists node; then
        print_error "Node.js is not installed. Please install Node.js first."
        echo "Visit: https://nodejs.org/"
        exit 1
    fi
    print_success "Node.js is installed ($(node --version))"
    
    # Check if npm is installed
    if ! command_exists npm; then
        print_error "npm is not installed. Please install npm first."
        exit 1
    fi
    print_success "npm is installed ($(npm --version))"
}

# Function to check port availability
check_ports() {
    print_header "Checking Port Availability"
    
    if ! is_port_available $DB_PORT; then
        print_error "Port $DB_PORT is already in use. Please stop the service using this port or change DB_PORT in this script."
        lsof -Pi :$DB_PORT -sTCP:LISTEN
        exit 1
    fi
    print_success "Database port $DB_PORT is available"
    
    if ! is_port_available $API_PORT; then
        print_error "Port $API_PORT is already in use. Please stop the service using this port or change API_PORT in this script."
        lsof -Pi :$API_PORT -sTCP:LISTEN
        exit 1
    fi
    print_success "API port $API_PORT is available"
}

# Function to setup project dependencies
setup_dependencies() {
    print_header "Setting Up Project Dependencies"
    
    # Install npm dependencies
    if [ ! -d "node_modules" ] || [ ! -f "package-lock.json" ]; then
        print_info "Installing npm dependencies..."
        npm install
        print_success "npm dependencies installed"
    else
        print_info "Dependencies already installed, checking for updates..."
        npm ci
        print_success "Dependencies verified"
    fi
    
    # Build the project
    print_info "Building the project..."
    npm run build
    print_success "Project built successfully"
}

# Function to start Docker services
start_docker_services() {
    print_header "Starting Docker Services"
    
    # Stop any existing containers
    print_info "Stopping any existing containers..."
    docker-compose down >/dev/null 2>&1 || true
    
    # Start database service first
    print_info "Starting MySQL database..."
    docker-compose up -d mysql
    
    # Wait for MySQL to be ready
    wait_for_service localhost $DB_PORT "MySQL Database"
    
    # Create database and user
    create_database
    
    print_success "Docker services are running!"
}

# Function to run database migrations
run_migrations() {
    print_header "Setting Up Database Schema"
    
    # Wait a bit more to ensure database is fully ready
    sleep 10
    
    print_info "Setting up database schema..."
    
    # For development, we'll use synchronize mode which is already enabled
    # This avoids migration complexity for initial setup
    print_info "Database schema will be synchronized automatically on first API start"
    print_success "Database setup completed!"
}

# Function to start the API
start_api() {
    print_header "Starting QYKCart API"
    
    print_info "Starting the API server on port $API_PORT..."
    print_info "API will be available at: http://localhost:$API_PORT"
    print_info "Swagger documentation will be available at: http://localhost:$API_PORT/api/docs"
    print_info "Press Ctrl+C to stop the server"
    
    # Start the development server
    npm run start:dev
}

# Function to cleanup on exit
cleanup() {
    print_warning "Shutting down services..."
    docker-compose down >/dev/null 2>&1 || true
    print_success "Cleanup completed"
}

# Function to show final information
show_info() {
    print_header "🎉 QYKCart Platform is Ready!"
    echo ""
    echo -e "${GREEN}📊 Service Information:${NC}"
    echo -e "  ${CYAN}• API Server:${NC} http://localhost:$API_PORT"
    echo -e "  ${CYAN}• API Documentation:${NC} http://localhost:$API_PORT/api/docs"
    echo -e "  ${CYAN}• Database:${NC} MySQL on localhost:$DB_PORT"
    echo -e "  ${CYAN}• Database Name:${NC} $DB_NAME"
    echo -e "  ${CYAN}• Database User:${NC} $DB_USER"
    echo ""
    echo -e "${GREEN}🔧 Development Tools:${NC}"
    echo -e "  ${CYAN}• Build Project:${NC} npm run build"
    echo -e "  ${CYAN}• Run Tests:${NC} npm run test"
    echo -e "  ${CYAN}• View Logs:${NC} docker-compose logs -f"
    echo ""
    echo -e "${GREEN}🏪 E-commerce Features Available:${NC}"
    echo -e "  ${CYAN}• Authentication:${NC} OTP-based phone login (default OTP: 759409)"
    echo -e "  ${CYAN}• Order Management:${NC} Complete order lifecycle with payment method updates"
    echo -e "  ${CYAN}• Credit System:${NC} Shop credit management and tracking"
    echo -e "  ${CYAN}• Cart Management:${NC} Add, update, remove cart items"
    echo -e "  ${CYAN}• FCM Notifications:${NC} Push notifications for orders and credits"
    echo ""
    echo -e "${YELLOW}📱 Ready for Mobile App Integration!${NC}"
    echo ""
}

# Main execution flow
main() {
    clear
    print_header "🏪 QYKCart E-commerce Platform Startup Script"
    echo -e "${BLUE}Starting comprehensive setup for QYKCart platform...${NC}"
    echo ""
    
    # Set trap for cleanup on exit
    trap cleanup EXIT
    
    # Check prerequisites
    check_prerequisites
    
    # Check port availability
    check_ports
    
    # Update configurations
    update_env_config
    update_docker_config
    
    # Setup project dependencies
    setup_dependencies
    
    # Start Docker services
    start_docker_services
    
    # Run database migrations
    run_migrations
    
    # Show information
    show_info
    
    # Start the API (this will block)
    start_api
}

# Run main function
main "$@"