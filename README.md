# 🏪 QYKCart E-commerce Platform

A comprehensive e-commerce platform built with NestJS, featuring OTP authentication, credit management, order processing, and real-time notifications.

## 🚀 Quick Start

### One-Command Setup
```bash
./start.sh
```

This script will:
- ✅ Check prerequisites (Docker, Node.js)
- ✅ Start MySQL database on port **3310**
- ✅ Start API server on port **3003**
- ✅ Create database and run migrations
- ✅ Install dependencies and build project

### Quick Test Setup
```bash
./quick-start.sh
```

For minimal setup without comprehensive checks.

## 📊 Services

| Service | URL | Port |
|---------|-----|------|
| **API Server** | http://localhost:3003 | 3003 |
| **API Documentation** | http://localhost:3003/api/docs | 3003 |
| **MySQL Database** | localhost:3310 | 3310 |

## 🏗️ Architecture

### Core Modules
- **🔐 Authentication**: OTP-based phone login with FCM integration
- **🛒 Orders**: Complete order lifecycle with payment method updates
- **💳 Credit**: Shop credit management and tracking
- **🛍️ Cart**: Shopping cart operations
- **📱 FCM**: Push notifications for real-time updates

### Key Features
- **OTP Login**: Default OTP `759409` for testing
- **Payment Method Updates**: Shop owners can change payment methods before delivery
- **Credit System**: Customers can use shop credit for orders
- **Real-time Notifications**: FCM push notifications for order and credit updates
- **Multi-shop Support**: Handle multiple shops in single platform

## 📚 Documentation

- **[Quick Start Guide](./QUICK_START.md)** - Complete setup instructions
- **[Authentication & FCM](./AUTH_FCM_DOCUMENTATION.md)** - Authentication and notification system
- **[Credit System](./CREDIT_MODULE_DOCUMENTATION.md)** - Credit management documentation
- **[Order Management](./ORDER_MODULE_DOCUMENTATION.md)** - Order processing system
- **[Cart System](./CART_MODULE_DOCUMENTATION.md)** - Shopping cart documentation
- **[Payment Method Updates](./PAYMENT_METHOD_UPDATE_IMPLEMENTATION.md)** - Payment method change feature

## 🔧 Manual Setup

If you prefer manual setup:

### Prerequisites
- Node.js 18+ 
- Docker & Docker Compose
- MySQL 8.0

### Installation
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
