#!/bin/bash

# Quick Start Script - Minimal version
# Use this for quick testing without full setup

set -e

echo "🚀 Quick starting QYKCart with Docker..."

# Update docker-compose to use custom ports
export DB_PORT=3310
export API_PORT=3003

# Create basic .env if not exists
if [ ! -f .env ]; then
    cat > .env << EOF
NODE_ENV=development
PORT=3003
DB_HOST=localhost
DB_PORT=3310
DB_USERNAME=qykcart_user
DB_PASSWORD=qykcart_password
DB_DATABASE=qykcart_db
JWT_SECRET=development-secret-$(date +%s)
JWT_REFRESH_SECRET=development-refresh-secret-$(date +%s)
EOF
fi

# Stop any existing containers
docker-compose down >/dev/null 2>&1 || true

# Start only database (no Redis)
echo "📊 Starting database on port $DB_PORT..."
docker-compose up -d mysql

# Wait for database
echo "⏳ Waiting for database..."
sleep 20

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Build project
echo "🔨 Building project..."
npm run build

# Start API
echo "🌐 Starting API on port $API_PORT..."
echo "Visit: http://localhost:$API_PORT/api/docs"
npm run start:dev