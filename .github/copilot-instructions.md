# QYKCart Backend - NestJS Project

## Project Overview
Professional NestJS backend for QYKCart e-commerce platform with:
- MySQL database with TypeORM
- Swagger API documentation
- Docker containerization
- JWT authentication
- Multi-role user system (Super Admin, Shop Owner, User, Delivery Partner)
- Modular, scalable architecture

## User Management System
The application includes a simplified user module with 4 distinct user types and basic fields:

### User Fields
- **Name**: Full name of the user
- **Email**: Unique email address (required)
- **Phone**: Phone number (optional, unique if provided)  
- **Profile Picture**: Optional profile image URL
- **Password**: Securely hashed password
- **Role**: User type (Super Admin, Shop Owner, User, Delivery Partner)
- **Status**: Current status (Active, Inactive, Suspended, Pending Verification)

### User Roles
1. **Super Admin** - Complete system access and management
2. **Shop Owner** - Store management and inventory control  
3. **User** - Customer with shopping capabilities
4. **Delivery Partner** - Order delivery and logistics

### User Features
- Role-based access control
- Status management (Active, Inactive, Suspended, Pending Verification)
- Email and phone verification
- Permission system
- Comprehensive user statistics
- Advanced filtering and pagination

## Shop Management System
The application includes a comprehensive shop module with full operational features:

### Shop Fields
- **Basic Info**: Shop name, address, zip code, city, state, district
- **Location**: Latitude, longitude for map integration
- **Operations**: Opening/closing times, working days, status
- **Delivery**: Own delivery partner flag, delivery radius, fees
- **Contact**: Phone, email, description, shop image
- **Business**: Rating, reviews, amenities, minimum order amount
- **Ownership**: Linked to shop owner users

### Shop Features
- Location-based search with radius filtering
- Time-based queries (currently open shops)
- Advanced filtering by city, state, district, status
- Delivery management and fee calculation
- Rating and review system
- Comprehensive shop statistics
- Owner relationship management

## Architecture
- Component-based modular structure
- Clean separation of concerns
- Professional error handling
- Comprehensive validation
- Database migrations support
- Docker containerization

## Setup Status
- [x] Project requirements clarified
- [x] Project structure scaffolded
- [x] Dependencies installed
- [x] Database configuration complete
- [x] Docker setup complete
- [x] Swagger configuration complete
- [x] User module with 4 roles implemented
- [x] Shop module with comprehensive features implemented
- [x] Initial compilation successful
- [x] Documentation complete

## Development Guidelines
- New modules should be created based on specific requirements
- Follow the established patterns for scalability
- Maintain role-based access control principles
- Use component-based architecture
- Implement proper validation and error handling