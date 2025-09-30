# QYKCart Backend API

A professional, scalable NestJS backend for QYKCart e-commerce platform with multi-role user management system.

## 🚀 Features

- **Multi-Role User System**: Super Admin, Shop Owner, User, Delivery Partner
- **MySQL Database**: Professional database setup with TypeORM
- **JWT Authentication**: Secure token-based authentication
- **Swagger Documentation**: Complete API documentation
- **Docker Support**: Production-ready containerization
- **Role-Based Access Control**: Granular permissions system
- **Comprehensive Validation**: Input validation and sanitization
- **Health Monitoring**: Application health checks
- **Scalable Architecture**: Modular, component-based design

## � Shop Management System

### Shop Fields
- **Shop Name**: Name of the shop
- **Address**: Complete street address
- **Location Details**: Zip code, city, state, district
- **Coordinates**: Latitude and longitude for map integration
- **Delivery**: Has own delivery partner flag
- **Operating Hours**: Opening time, closing time, working days
- **Contact**: Phone number and email
- **Features**: Description, shop image, amenities
- **Business**: Rating, reviews, delivery options, fees
- **Status**: Active, Inactive, Suspended, Pending Approval, Under Maintenance

### Shop Features
- **Location-based search**: Find shops by coordinates and radius
- **Advanced filtering**: By city, state, district, status, delivery options
- **Time-based queries**: Find currently open shops
- **Rating system**: Track and update shop ratings
- **Delivery management**: Manage delivery partners and fees
- **Owner relationship**: Link shops to shop owner users
- **Comprehensive statistics**: Shop analytics and reporting

## �🏗️ Architecture

```
src/
├── config/                 # Configuration management
├── database/              # Database configuration and migrations
├── modules/               # Feature modules
│   ├── users/            # User management (4 roles)
│   ├── shops/            # Shop management with full features
│   └── health/           # Health checks
├── app.module.ts         # Main application module
└── main.ts              # Application bootstrap
```

## 👥 User Structure

Each user has the following simple fields:
- **Name**: Full name of the user
- **Email**: Unique email address (required)
- **Phone**: Phone number (optional, unique if provided)
- **Profile Picture**: Optional profile image URL
- **Password**: Securely hashed password
- **Role**: One of 4 user types (Super Admin, Shop Owner, User, Delivery Partner)
- **Status**: Current status (Active, Inactive, Suspended, Pending Verification)

## 👥 User Roles

1. **Super Admin**: Complete system access and management
2. **Shop Owner**: Store management and inventory control
3. **User**: Customer with shopping capabilities
4. **Delivery Partner**: Order delivery and logistics

## 🛠️ Technology Stack

- **Framework**: NestJS
- **Database**: MySQL 8.0
- **ORM**: TypeORM
- **Authentication**: JWT + Passport
- **Documentation**: Swagger/OpenAPI
- **Validation**: class-validator
- **Container**: Docker & Docker Compose
- **Security**: Helmet, CORS

## 📋 Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- MySQL 8.0
- Docker & Docker Compose (optional)

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd qykcart
npm install
```

### 2. Environment Setup

```bash
cp .env.example .env
# Edit .env with your database credentials
```

### 3. Database Setup

#### Option A: Using Docker (Recommended)
```bash
npm run docker:dev
```

#### Option B: Local MySQL
```bash
# Ensure MySQL is running
# Create database: qykcart_db
npm run migration:run
```

### 4. Start Development Server

```bash
npm run start:dev
```

## 🐳 Docker Deployment

### Development Environment
```bash
npm run docker:dev
npm run start:dev
```

### Production Environment
```bash
npm run docker:prod
```

## 📚 API Documentation

Once the application is running, visit:
- **Swagger UI**: http://localhost:3000/api/docs
- **Health Check**: http://localhost:3000/api/v1/health

## 🔐 Authentication

The API uses JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## 👤 User Management Endpoints

### Core User Operations
- `POST /api/v1/users` - Create user
- `GET /api/v1/users` - List users (with filtering)
- `GET /api/v1/users/:id` - Get user by ID
- `PATCH /api/v1/users/:id` - Update user
- `DELETE /api/v1/users/:id` - Delete user

### Role-Specific Queries
- `GET /api/v1/users/super-admins` - Get all super admins
- `GET /api/v1/users/shop-owners` - Get all shop owners
- `GET /api/v1/users/regular-users` - Get all regular users
- `GET /api/v1/users/delivery-partners` - Get all delivery partners

### Status Management
- `GET /api/v1/users/active` - Get active users
- `GET /api/v1/users/inactive` - Get inactive users
- `GET /api/v1/users/suspended` - Get suspended users
- `GET /api/v1/users/pending` - Get pending verification users

### User Administration
- `PATCH /api/v1/users/:id/status` - Update user status
- `PATCH /api/v1/users/:id/role` - Update user role
- `PATCH /api/v1/users/:id/verify-email` - Verify email
- `PATCH /api/v1/users/:id/verify-phone` - Verify phone
- `POST /api/v1/users/:id/permissions` - Add permission
- `DELETE /api/v1/users/:id/permissions/:permission` - Remove permission

## 🏪 Shop Management Endpoints

### Core Shop Operations
- `POST /api/v1/shops` - Create shop (shop owners only)
- `GET /api/v1/shops` - List shops (with advanced filtering)
- `GET /api/v1/shops/:id` - Get shop by ID
- `PATCH /api/v1/shops/:id` - Update shop
- `DELETE /api/v1/shops/:id` - Delete shop

### Shop Status & Management
- `GET /api/v1/shops/active` - Get active shops
- `GET /api/v1/shops/pending` - Get pending approval shops
- `GET /api/v1/shops/suspended` - Get suspended shops
- `PATCH /api/v1/shops/:id/status` - Update shop status
- `PATCH /api/v1/shops/:id/rating` - Update shop rating

### Location & Search Features
- `GET /api/v1/shops/nearby` - Find nearby shops by coordinates
- `GET /api/v1/shops/by-city/:city` - Get shops by city
- `GET /api/v1/shops/currently-open` - Get currently open shops
- `GET /api/v1/shops/with-delivery` - Get shops with delivery

### Owner & Analytics
- `GET /api/v1/shops/by-owner/:ownerId` - Get shops by owner
- `GET /api/v1/shops/stats` - Get shop statistics

## 🔧 Configuration

### Environment Variables

```env
# Application
NODE_ENV=development
PORT=3000
CORS_ORIGIN=*

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=password
DB_DATABASE=qykcart_db

# JWT
JWT_SECRET=your-super-secret-key
JWT_EXPIRES_IN=24h

# API
API_PREFIX=api/v1
SWAGGER_PATH=api/docs
```

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov

# Test watch mode
npm run test:watch
```

## 📊 Database Migrations

```bash
# Generate migration
npm run migration:generate

# Run migrations
npm run migration:run

# Revert migration
npm run migration:revert

# Sync schema (development only)
npm run schema:sync
```

## 🚀 Production Deployment

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Set production environment variables**

3. **Deploy using Docker**:
   ```bash
   npm run docker:prod
   ```

## 🔒 Security Features

- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing
- **JWT**: Secure authentication
- **Input Validation**: Request validation and sanitization
- **Password Hashing**: bcrypt password encryption
- **Role-Based Access**: Granular permission system

## 📈 Monitoring & Health

- **Health Endpoint**: `/api/v1/health`
- **User Statistics**: `/api/v1/users/stats`
- **Docker Health Checks**: Built-in container monitoring

## 🤝 Contributing

This is a component-based, scalable architecture. New modules should be created based on specific requirements following the established patterns.

## 📝 License

This project is licensed under the UNLICENSED License.

---

**QYKCart Backend** - Professional, scalable e-commerce API solution