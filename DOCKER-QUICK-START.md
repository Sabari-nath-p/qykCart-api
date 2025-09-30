# QYKCart Docker Quick Start Guide

## 🚀 Quick Start

The fastest way to get QYKCart API running with Docker:

```bash
# Start the development environment
./docker-start.sh

# Or with specific command
./docker-start.sh start
```

That's it! Your API will be available at `http://localhost:3003/api/v1/`

## 📋 Available Commands

| Command | Description |
|---------|-------------|
| `./docker-start.sh start` | Start all services (default) |
| `./docker-start.sh stop` | Stop all services |
| `./docker-start.sh restart` | Restart all services |
| `./docker-start.sh logs` | Show logs from all services |
| `./docker-start.sh logs-api` | Show API logs only |
| `./docker-start.sh logs-db` | Show database logs only |
| `./docker-start.sh status` | Show container status |
| `./docker-start.sh clean` | Remove all containers and volumes |
| `./docker-start.sh build` | Rebuild containers |
| `./docker-start.sh shell` | Access API container shell |
| `./docker-start.sh db-shell` | Access MySQL shell |
| `./docker-start.sh cache` | Start with Redis cache |
| `./docker-start.sh db-tools` | Start with PhpMyAdmin |
| `./docker-start.sh health` | Check API health |
| `./docker-start.sh help` | Show help message |

## 🌐 Access Points

After starting the services:

- **API Base URL**: `http://localhost:3003/api/v1/`
- **Swagger Documentation**: `http://localhost:3003/api/docs`
- **Health Check**: `http://localhost:3003/api/v1/health`
- **Database Admin (Adminer)**: `http://localhost:8085`
- **PhpMyAdmin** (with db-tools): `http://localhost:8082`

## 🗄️ Database Access

- **Host**: `localhost:3310`
- **Database**: `qykcart_db`
- **Username**: `qykcart_user`
- **Password**: `qykcart_password`
- **Root Password**: `rootpassword`

## 🔧 Development Workflow

### 1. Start Development Environment
```bash
./docker-start.sh start
```

### 2. View Real-time Logs
```bash
# All services
./docker-start.sh logs

# API only
./docker-start.sh logs-api

# Database only
./docker-start.sh logs-db
```

### 3. Access API Container for Debugging
```bash
./docker-start.sh shell
```

### 4. Access Database Shell
```bash
./docker-start.sh db-shell
```

### 5. Check Service Status
```bash
./docker-start.sh status
```

### 6. Stop Services
```bash
./docker-start.sh stop
```

### 7. Clean Everything (Fresh Start)
```bash
./docker-start.sh clean
```

## 📦 Optional Services

### Start with Redis Cache
```bash
./docker-start.sh cache
```

### Start with Database Tools (PhpMyAdmin)
```bash
./docker-start.sh db-tools
```

## 🔧 Configuration

### Environment Variables
Edit `.env.docker` to customize:

```bash
# Port Configuration
API_PORT=3003
MYSQL_PORT=3310
ADMINER_PORT=8085

# Database Configuration
MYSQL_DATABASE=qykcart_db
MYSQL_USER=qykcart_user
MYSQL_PASSWORD=qykcart_password

# Firebase Configuration
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY=your-firebase-private-key
FIREBASE_CLIENT_EMAIL=your-firebase-client-email
```

### Docker Compose Profiles

The setup supports different profiles:

- **Default**: API + MySQL + Adminer
- **cache**: Includes Redis
- **db-tools**: Includes PhpMyAdmin

## 🐛 Troubleshooting

### Port Already in Use
The script will detect and offer to stop processes using required ports.

### API Not Responding
```bash
# Check if containers are running
./docker-start.sh status

# View API logs
./docker-start.sh logs-api

# Restart services
./docker-start.sh restart
```

### Database Connection Issues
```bash
# Check database logs
./docker-start.sh logs-db

# Access database shell
./docker-start.sh db-shell

# Clean and restart
./docker-start.sh clean
./docker-start.sh start
```

### Container Build Issues
```bash
# Rebuild containers
./docker-start.sh build

# Or force rebuild and start
./docker-start.sh clean
./docker-start.sh build
./docker-start.sh start
```

## 📱 Testing API Endpoints

### Health Check
```bash
curl http://localhost:3003/api/v1/health
```

### Send OTP (Example)
```bash
curl -X POST http://localhost:3003/api/v1/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+1234567890"}'
```

### View Swagger Documentation
Open `http://localhost:3003/api/docs` in your browser.

## 🚨 Important Notes

1. **Firebase Configuration**: Update Firebase credentials in `.env.docker` before starting
2. **Data Persistence**: Database data is stored in Docker volumes and persists between restarts
3. **Hot Reload**: The API container supports hot reload during development
4. **Port Conflicts**: The script automatically detects and resolves port conflicts

## 🔄 Updating the Application

When you make code changes:

1. **API Changes**: Hot reload is enabled, changes are automatically reflected
2. **Package Changes**: Restart the API container
   ```bash
   ./docker-start.sh restart
   ```
3. **Database Schema Changes**: The application will automatically sync TypeORM entities

## 🛡️ Security Notes

- The configuration is optimized for development
- Use different passwords and secrets for production
- Firebase credentials should be properly configured
- CORS is set to `*` for development convenience

Happy coding! 🎉