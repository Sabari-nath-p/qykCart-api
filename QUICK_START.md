# QYKCart Platform Quick Start Guide

## 🚀 One-Command Setup

Run the entire QYKCart platform with a single command:

```bash
./start.sh
```

## What the Script Does

### 🔧 **Prerequisites Check**
- ✅ Verifies Docker and Docker Compose installation
- ✅ Checks Node.js and npm availability
- ✅ Ensures required ports are available

### 🐳 **Docker Services Setup**
- **Database**: MySQL 8.0 on port **3310**
- **Cache**: Redis on port 6379
- **Automatic**: Database and user creation
- **Health Checks**: Ensures services are ready

### 📦 **Project Configuration**
- **Environment**: Auto-configures .env file
- **Dependencies**: Installs npm packages
- **Build**: Compiles TypeScript
- **Migrations**: Sets up database schema

### 🌐 **API Server**
- **Port**: 3003 (configurable)
- **Documentation**: Auto-generated Swagger docs
- **Hot Reload**: Development mode with auto-restart

## 📋 Service URLs

Once started, access these services:

| Service | URL | Description |
|---------|-----|-------------|
| **API Server** | http://localhost:3003 | Main API endpoints |
| **API Docs** | http://localhost:3003/api/docs | Interactive Swagger documentation |
| **Database** | localhost:3310 | MySQL database (use any MySQL client) |

## 🗄️ Database Connection

```bash
# Connect using MySQL client
mysql -h localhost -P 3310 -u qykcart_user -p qykcart_db
# Password: qykcart_password
```

## 🔧 Manual Commands

If you need to run individual components:

```bash
# Install dependencies
npm install

# Build project
npm run build

# Start only database
docker-compose up -d mysql

# Start API in development mode
npm run start:dev

# Run database migrations
npm run typeorm:migration:run

# Sync database schema (alternative to migrations)
npm run typeorm:schema:sync
```

## 🛑 Stopping Services

```bash
# Stop all Docker services
docker-compose down

# Or simply press Ctrl+C in the terminal where start.sh is running
```

## 🏪 E-commerce Features Ready

Once started, these features are immediately available:

### 🔐 **Authentication System**
- **OTP Login**: Phone-based authentication
- **Default OTP**: `759409` (for testing)
- **JWT Tokens**: Secure access control
- **FCM Support**: Push notification setup

### 🛒 **Order Management**
- **Order Creation**: From cart to delivery
- **Status Tracking**: Real-time order updates
- **Payment Methods**: Cash, Credit, Online options
- **Payment Method Updates**: Change before delivery

### 💳 **Credit System**
- **Credit Accounts**: Per-shop customer credit
- **Credit Tracking**: Balance and transaction history
- **Credit Orders**: Pay via shop credit
- **Credit Notifications**: Real-time FCM alerts

### 🛍️ **Cart Management**
- **Add/Remove Items**: Shopping cart operations
- **Shop Separation**: Multi-shop cart support
- **Persistence**: Cart data saved across sessions

### 📱 **Push Notifications**
- **Order Alerts**: Shop owners get new order notifications
- **Status Updates**: Customers get order status updates
- **Credit Notifications**: Credit and payment alerts
- **Multi-device**: Support for multiple devices per user

## 📚 API Documentation

The API includes comprehensive documentation:

- **Interactive Docs**: http://localhost:3003/api/docs
- **OpenAPI Spec**: Downloadable specification
- **Try It Out**: Test endpoints directly from documentation
- **Authentication**: Built-in auth testing

## 🔧 Troubleshooting

### Port Conflicts
If ports 3310 or 3003 are in use:
1. Edit `start.sh` and change `DB_PORT` or `API_PORT` variables
2. Run the script again

### Database Issues
```bash
# Reset database
docker-compose down -v
./start.sh

# Check database logs
docker-compose logs mysql
```

### API Issues
```bash
# Check API logs
npm run start:dev

# Rebuild project
npm run build
```

## 🚀 Production Deployment

For production deployment:

1. **Update Environment**: Change JWT secrets and database passwords
2. **Use Production Build**: `npm run start:prod`
3. **Configure Reverse Proxy**: Nginx or similar
4. **Set up SSL**: HTTPS certificates
5. **Environment Variables**: Production-specific config

## 📱 Mobile App Integration

The API is ready for mobile app integration:

- **Authentication**: OTP-based login with FCM tokens
- **Real-time Notifications**: FCM push notifications
- **RESTful APIs**: Standard HTTP JSON APIs
- **Swagger Documentation**: Complete API reference

Ready to connect your React Native, Flutter, or native mobile apps!

---

**🎉 Enjoy building with QYKCart Platform!**