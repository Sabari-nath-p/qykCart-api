#!/bin/bash

# QYKCart API - Docker Startup Script
# This script helps you easily start and manage the Docker containers

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="QYKCart API"
COMPOSE_FILE="docker-compose.dev.yml"
API_PORT="${API_PORT:-3003}"
MYSQL_PORT="${MYSQL_PORT:-3310}"
ADMINER_PORT="${ADMINER_PORT:-8081}"

# Show banner
echo -e "${BLUE}🛒 $PROJECT_NAME - Docker Development Environment${NC}"
echo "======================================================="

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        echo -e "${RED}❌ Docker is not running. Please start Docker Desktop and try again.${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Docker is running${NC}"
}

# Function to check if ports are available
check_ports() {
    local ports=("$API_PORT" "$MYSQL_PORT" "$ADMINER_PORT")
    local port_names=("API" "MySQL" "Adminer")
    
    for i in "${!ports[@]}"; do
        if lsof -i :${ports[$i]} > /dev/null 2>&1; then
            echo -e "${YELLOW}⚠️  Port ${ports[$i]} (${port_names[$i]}) is already in use${NC}"
            read -p "Do you want to stop the process using this port? (y/N): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                sudo lsof -ti:${ports[$i]} | xargs sudo kill -9 2>/dev/null || true
                echo -e "${GREEN}✅ Port ${ports[$i]} freed${NC}"
            fi
        fi
    done
}

# Function to show help
show_help() {
    cat << EOF
${CYAN}Usage: $0 [COMMAND]${NC}

${YELLOW}Commands:${NC}
  ${GREEN}start, up${NC}        Start all services (default)
  ${GREEN}stop, down${NC}       Stop all services  
  ${GREEN}restart${NC}          Restart all services
  ${GREEN}logs${NC}             Show logs from all services
  ${GREEN}logs-api${NC}         Show API logs only
  ${GREEN}logs-db${NC}          Show database logs only
  ${GREEN}status${NC}           Show status of all containers
  ${GREEN}clean${NC}            Remove all containers and volumes (fresh start)
  ${GREEN}build${NC}            Rebuild containers
  ${GREEN}shell${NC}            Access API container shell
  ${GREEN}db-shell${NC}         Access MySQL database shell
  ${GREEN}cache${NC}            Start with Redis cache
  ${GREEN}db-tools${NC}         Start with additional database tools
  ${GREEN}health${NC}           Check API health
  ${GREEN}help${NC}             Show this help message

${YELLOW}Examples:${NC}
  $0 start         # Start the application
  $0 logs-api      # View API logs only
  $0 stop          # Stop the application
  $0 clean         # Clean everything for fresh start
  $0 cache         # Start with Redis cache
  $0 db-tools      # Start with PhpMyAdmin

${YELLOW}Environment Variables:${NC}
  API_PORT=${API_PORT}        # API port (default: 3003)
  MYSQL_PORT=${MYSQL_PORT}      # MySQL port (default: 3310)
  ADMINER_PORT=${ADMINER_PORT}    # Adminer port (default: 8081)

EOF
}

# Function to start services
start_services() {
    echo -e "${GREEN}🚀 Starting $PROJECT_NAME services...${NC}"
    
    # Create directories if they don't exist
    echo -e "${CYAN}📁 Creating required directories...${NC}"
    mkdir -p docker/mysql-init
    mkdir -p src/uploads
    mkdir -p logs
    
    # Check if Docker Compose file exists
    if [[ ! -f "$COMPOSE_FILE" ]]; then
        echo -e "${RED}❌ Docker Compose file not found: $COMPOSE_FILE${NC}"
        exit 1
    fi
    
    # Start services
    echo -e "${CYAN}🐳 Starting Docker containers...${NC}"
    docker-compose -f $COMPOSE_FILE up -d
    
    echo -e "${PURPLE}⏳ Waiting for services to be ready...${NC}"
    sleep 10
    
    # Check if API is responding
    local api_ready=false
    local attempts=0
    local max_attempts=30
    
    while [[ $attempts -lt $max_attempts ]]; do
        if curl -s http://localhost:$API_PORT/api/v1/health > /dev/null 2>&1; then
            api_ready=true
            break
        fi
        echo -e "${YELLOW}⏳ Waiting for API to be ready... (${attempts}/${max_attempts})${NC}"
        sleep 5
        ((attempts++))
    done
    
    echo ""
    echo -e "${GREEN}✅ Services started successfully!${NC}"
    echo ""
    echo -e "${BLUE}📱 Access Points:${NC}"
    echo -e "• ${CYAN}API Base URL:${NC} http://localhost:$API_PORT/api/v1/"
    echo -e "• ${CYAN}Swagger Docs:${NC} http://localhost:$API_PORT/api/docs"
    echo -e "• ${CYAN}Health Check:${NC} http://localhost:$API_PORT/api/v1/health"
    echo -e "• ${CYAN}Database Admin:${NC} http://localhost:$ADMINER_PORT"
    echo ""
    echo -e "${BLUE}🗄️  Database Info:${NC}"
    echo -e "• ${CYAN}Host:${NC} localhost:$MYSQL_PORT"
    echo -e "• ${CYAN}Database:${NC} qykcart_db"
    echo -e "• ${CYAN}Username:${NC} qykcart_user"
    echo -e "• ${CYAN}Password:${NC} qykcart_password"
    echo ""
    
    if [[ $api_ready == true ]]; then
        echo -e "${GREEN}🎉 API is ready and responding!${NC}"
    else
        echo -e "${YELLOW}⚠️  API might still be starting up. Check logs with: $0 logs-api${NC}"
    fi
    
    echo ""
    echo -e "${YELLOW}💡 Useful commands:${NC}"
    echo -e "• View logs: ${CYAN}$0 logs${NC}"
    echo -e "• Check status: ${CYAN}$0 status${NC}"
    echo -e "• Access API shell: ${CYAN}$0 shell${NC}"
    echo -e "• Stop services: ${CYAN}$0 stop${NC}"
}

# Function to stop services
stop_services() {
    echo -e "${YELLOW}⏹️  Stopping $PROJECT_NAME services...${NC}"
    docker-compose -f $COMPOSE_FILE down
    echo -e "${GREEN}✅ Services stopped successfully!${NC}"
}

# Function to restart services
restart_services() {
    echo -e "${YELLOW}🔄 Restarting $PROJECT_NAME services...${NC}"
    docker-compose -f $COMPOSE_FILE restart
    echo -e "${GREEN}✅ Services restarted successfully!${NC}"
}

# Function to show logs
show_logs() {
    echo -e "${BLUE}📋 Showing logs for $PROJECT_NAME...${NC}"
    docker-compose -f $COMPOSE_FILE logs -f
}

# Function to show API logs only
show_api_logs() {
    echo -e "${BLUE}📋 Showing API logs for $PROJECT_NAME...${NC}"
    docker-compose -f $COMPOSE_FILE logs -f api
}

# Function to show database logs only
show_db_logs() {
    echo -e "${BLUE}📋 Showing database logs for $PROJECT_NAME...${NC}"
    docker-compose -f $COMPOSE_FILE logs -f mysql
}

# Function to show status
show_status() {
    echo -e "${BLUE}📊 $PROJECT_NAME - Container Status${NC}"
    echo "================================================"
    docker-compose -f $COMPOSE_FILE ps
    echo ""
    echo -e "${BLUE}💾 Volume Usage:${NC}"
    docker volume ls | grep qykcart || echo "No volumes found"
    echo ""
    echo -e "${BLUE}🌐 Network Status:${NC}"
    docker network ls | grep qykcart || echo "No networks found"
}

# Function to clean everything
clean_all() {
    echo -e "${RED}🧹 This will remove ALL containers, volumes, and data!${NC}"
    echo -e "${YELLOW}⚠️  You will lose all database data and uploaded files!${NC}"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}🗑️  Cleaning up...${NC}"
        docker-compose -f $COMPOSE_FILE down -v --remove-orphans
        docker system prune -f
        echo -e "${GREEN}✅ Cleanup completed!${NC}"
    else
        echo -e "${BLUE}ℹ️  Cleanup cancelled${NC}"
    fi
}

# Function to build containers
build_containers() {
    echo -e "${YELLOW}🔨 Building containers...${NC}"
    docker-compose -f $COMPOSE_FILE build --no-cache
    echo -e "${GREEN}✅ Build completed!${NC}"
}

# Function to access API container shell
access_shell() {
    echo -e "${CYAN}🐚 Accessing API container shell...${NC}"
    docker-compose -f $COMPOSE_FILE exec api sh
}

# Function to access database shell
access_db_shell() {
    echo -e "${CYAN}🗄️  Accessing MySQL database shell...${NC}"
    docker-compose -f $COMPOSE_FILE exec mysql mysql -u qykcart_user -p qykcart_db
}

# Function to start with cache
start_with_cache() {
    echo -e "${GREEN}🚀 Starting $PROJECT_NAME with Redis cache...${NC}"
    docker-compose -f $COMPOSE_FILE --profile cache up -d
}

# Function to start with database tools
start_with_db_tools() {
    echo -e "${GREEN}🚀 Starting $PROJECT_NAME with database tools...${NC}"
    docker-compose -f $COMPOSE_FILE --profile db-tools up -d
}

# Function to check API health
check_health() {
    echo -e "${BLUE}❤️  Checking API health...${NC}"
    if curl -s http://localhost:$API_PORT/api/v1/health | jq . 2>/dev/null; then
        echo -e "${GREEN}✅ API is healthy!${NC}"
    else
        echo -e "${RED}❌ API health check failed${NC}"
        echo -e "${YELLOW}💡 Try: $0 logs-api${NC}"
    fi
}

# Main script logic
check_docker

case "${1:-start}" in
    "start"|"up")
        check_ports
        start_services
        ;;
    "stop"|"down")
        stop_services
        ;;
    "restart")
        restart_services
        ;;
    "logs")
        show_logs
        ;;
    "logs-api")
        show_api_logs
        ;;
    "logs-db")
        show_db_logs
        ;;
    "status")
        show_status
        ;;
    "clean")
        clean_all
        ;;
    "build")
        build_containers
        ;;
    "shell")
        access_shell
        ;;
    "db-shell")
        access_db_shell
        ;;
    "cache")
        start_with_cache
        ;;
    "db-tools")
        start_with_db_tools
        ;;
    "health")
        check_health
        ;;
    "help"|"-h"|"--help")
        show_help
        ;;
    *)
        echo -e "${RED}❌ Unknown command: $1${NC}"
        echo -e "${YELLOW}💡 Run '$0 help' for available commands${NC}"
        exit 1
        ;;
esac