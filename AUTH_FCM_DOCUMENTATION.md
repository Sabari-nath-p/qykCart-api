# Authentication & FCM Notification System

## Overview

The Authentication system provides OTP-based login with phone numbers and Firebase Cloud Messaging (FCM) push notifications for a seamless mobile experience. This system is designed for rural and semi-urban users who may not have email access but have mobile phones.

## Authentication Features

### 🔐 **OTP-Based Authentication**
- **Phone Number Login**: Primary authentication using phone numbers
- **Default OTP**: Uses `759409` as default OTP for easy testing and development
- **Auto User Creation**: Creates user accounts automatically on first login
- **Profile Completion**: New users prompted to complete profile
- **JWT Tokens**: Secure access and refresh token system

### 📱 **FCM Push Notifications**
- **Device Management**: Multi-device FCM token support
- **Order Notifications**: Real-time order updates for shop owners and customers
- **Credit Notifications**: Credit and payment notifications
- **Status Updates**: Order status change notifications

## API Endpoints

### Authentication APIs

#### 1. Send OTP
```http
POST /auth/send-otp
Content-Type: application/json

{
  "phone": "+919876543210"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "expiresAt": "2024-01-15T10:35:00Z"
}
```

#### 2. Verify OTP & Login
```http
POST /auth/verify-otp
Content-Type: application/json

{
  "phone": "+919876543210",
  "otp": "759409",
  "fcmToken": "fcm_token_string_here",
  "deviceId": "device_unique_id",
  "deviceType": "android",
  "deviceName": "Samsung Galaxy S21",
  "appVersion": "1.0.0"
}
```

**Response (New User):**
```json
{
  "accessToken": "jwt_access_token_here",
  "refreshToken": "jwt_refresh_token_here",
  "isNewUser": true,
  "user": {
    "id": "user-uuid-123",
    "name": "User +919876543210",
    "phone": "+919876543210",
    "email": null,
    "role": "user",
    "status": "active",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

**Response (Existing User):**
```json
{
  "accessToken": "jwt_access_token_here",
  "refreshToken": "jwt_refresh_token_here",
  "isNewUser": false,
  "user": {
    "id": "user-uuid-123",
    "name": "John Doe",
    "phone": "+919876543210",
    "email": "john@example.com",
    "role": "user",
    "status": "active",
    "createdAt": "2024-01-10T08:20:00Z"
  }
}
```

#### 3. Update Profile (For New Users)
```http
PUT /auth/profile
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "profilePicture": "https://example.com/profile.jpg"
}
```

#### 4. Refresh Tokens
```http
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "jwt_refresh_token_here"
}
```

#### 5. Update FCM Token
```http
PUT /auth/fcm-token
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "fcmToken": "new_fcm_token_here",
  "deviceId": "device_id",
  "deviceType": "android",
  "deviceName": "Device Name",
  "appVersion": "1.0.1"
}
```

#### 6. Logout
```http
POST /auth/logout
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "deviceId": "device_id_to_logout" // Optional - omit to logout all devices
}
```

## FCM Notification System

### Notification Types

#### 1. Order Notifications (Shop Owners)
**Trigger**: New order placed
**Recipient**: Shop owner
**Message**: "🛒 New Order Received! Order ORD-2024-001 from John Doe - ₹1,250 (5 items)"

#### 2. Order Status Notifications (Customers)
**Trigger**: Order status change
**Recipient**: Customer who placed order
**Messages**:
- "🔄 Your order is being processed - Order ORD-2024-001 at Village Store"
- "📦 Your order has been packed - Order ORD-2024-001 at Village Store"
- "✅ Your order has been delivered - Order ORD-2024-001 at Village Store"

#### 3. Credit Notifications (Customers)
**Trigger**: Credit added or payment received
**Recipient**: Customer
**Messages**:
- "💳 Credit Added - ₹500 credit added at Village Store. Balance: ₹1,200"
- "💰 Payment Recorded - ₹300 payment recorded at Village Store. Balance: ₹900"

### FCM Integration Points

#### Order Module Integration
- **New Order**: Notifies shop owner when order is placed
- **Status Update**: Notifies customer when order status changes
- **Credit Order**: Combines order notification with credit notification

#### Credit Module Integration
- **Credit Added**: Notifies customer when credit is added (manual or order-based)
- **Payment Received**: Notifies customer when payment is recorded

## Technical Implementation

### Database Schema

#### OTP Table (`otps`)
```sql
- id (UUID) - Primary key
- phone (VARCHAR) - Phone number
- otp (VARCHAR) - 6-digit OTP code
- type (ENUM) - LOGIN, REGISTRATION, PASSWORD_RESET
- status (ENUM) - PENDING, VERIFIED, EXPIRED, USED
- expiresAt (TIMESTAMP) - OTP expiration time
- attempts (INTEGER) - Failed verification attempts
- verifiedAt (TIMESTAMP) - Verification timestamp
- createdAt (TIMESTAMP) - Creation timestamp
```

#### FCM Tokens Table (`fcm_tokens`)
```sql
- id (UUID) - Primary key
- userId (UUID) - Foreign key to users table
- token (TEXT) - FCM token string
- deviceId (VARCHAR) - Device identifier
- deviceType (ENUM) - ANDROID, IOS, WEB
- deviceName (VARCHAR) - Human-readable device name
- appVersion (VARCHAR) - App version
- status (ENUM) - ACTIVE, INACTIVE, EXPIRED
- lastUsedAt (TIMESTAMP) - Last notification sent
- createdAt, updatedAt (TIMESTAMP)
```

### Authentication Flow

#### 1. OTP Generation
```typescript
// Default OTP for development
const DEFAULT_OTP = '759409';

// In production, you would generate random OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();
```

#### 2. User Creation (First-time Login)
```typescript
// Auto-create user on successful OTP verification
const newUser = new User();
newUser.phone = phone;
newUser.name = `User ${phone}`; // Temporary name
newUser.role = UserRole.USER;
newUser.status = UserStatus.ACTIVE;
```

#### 3. JWT Token Generation
```typescript
const payload = {
  sub: user.id,
  phone: user.phone,
  role: user.role,
};

const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });
const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '7d' });
```

### FCM Service Architecture

#### Notification Delivery
```typescript
// Send to specific user (all their devices)
await fcmService.sendToUser(userId, {
  title: "Order Update",
  body: "Your order has been packed",
  data: { type: "order_status", orderId: "123" }
});

// Send to multiple users
await fcmService.sendToUsers(userIds, notificationPayload);
```

#### Error Handling
- FCM failures don't break business operations
- Invalid tokens are automatically cleaned up
- Retry logic for failed notifications

### Security Features

#### OTP Security
- **Expiration**: OTPs expire after 5 minutes
- **Attempt Limiting**: Maximum 3 verification attempts
- **Rate Limiting**: Prevents OTP spam
- **Phone Validation**: International format validation

#### JWT Security
- **Short-lived Access Tokens**: 1 day expiration
- **Refresh Tokens**: 7 days expiration
- **Secure Storage**: Environment-based secrets
- **Role-based Access**: User role included in token

#### FCM Security
- **Token Validation**: Validates FCM token format
- **Device Tracking**: Links tokens to specific devices
- **Auto Cleanup**: Removes expired/inactive tokens

## Mobile App Integration

### Authentication Flow
```javascript
// 1. Send OTP
const sendOTPResponse = await fetch('/auth/send-otp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ phone: '+919876543210' })
});

// 2. Get FCM token (Firebase SDK)
import messaging from '@react-native-firebase/messaging';
const fcmToken = await messaging().getToken();

// 3. Verify OTP with FCM token
const verifyResponse = await fetch('/auth/verify-otp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    phone: '+919876543210',
    otp: '759409',
    fcmToken: fcmToken,
    deviceId: 'unique-device-id',
    deviceType: 'android'
  })
});

const { accessToken, isNewUser } = await verifyResponse.json();

// 4. Store tokens securely
await AsyncStorage.setItem('accessToken', accessToken);

// 5. If new user, prompt for profile completion
if (isNewUser) {
  // Navigate to profile completion screen
}
```

### FCM Token Management
```javascript
// Update FCM token when it refreshes
messaging().onTokenRefresh(token => {
  updateFCMToken(token);
});

// Handle foreground notifications
messaging().onMessage(async remoteMessage => {
  // Show in-app notification
  showNotification(remoteMessage);
});

// Handle background/quit state notifications
messaging().setBackgroundMessageHandler(async remoteMessage => {
  // Process notification
});
```

## Business Benefits

### For Shop Owners
- **Instant Order Alerts**: Know immediately when orders are placed
- **Customer Management**: Track customer activity and preferences
- **Reduced No-shows**: Status notifications keep customers informed

### For Customers
- **Order Transparency**: Real-time updates on order status
- **Credit Tracking**: Immediate notifications about credit transactions
- **Convenience**: Phone-based login, no passwords to remember

### For Platform
- **User Engagement**: Push notifications increase app usage
- **Rural Market Fit**: Phone-based auth suits rural demographics
- **Real-time Communication**: Instant updates improve satisfaction

## Development Features

### Testing Support
- **Default OTP**: `759409` works for any phone number
- **Simulation Mode**: FCM service simulates notifications in development
- **Debug Logging**: Comprehensive logging for troubleshooting

### Environment Configuration
```env
# JWT Configuration
JWT_SECRET=your-jwt-secret-here
JWT_REFRESH_SECRET=your-refresh-secret-here
JWT_EXPIRES_IN=1d

# Firebase Configuration (for production FCM)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email
```

## Future Enhancements

### Authentication
- **Biometric Login**: Fingerprint/Face ID for returning users
- **Social Login**: WhatsApp/Google integration
- **Backup Methods**: Email OTP as fallback

### Notifications
- **Rich Notifications**: Images and action buttons
- **Scheduling**: Delivery time reminders
- **Localization**: Multi-language support
- **SMS Fallback**: SMS notifications when push fails

### Analytics
- **Login Analytics**: Track authentication patterns
- **Notification Metrics**: Delivery rates and engagement
- **User Journey**: Authentication to order completion

This authentication and notification system provides a modern, mobile-first experience while remaining accessible to users in rural and semi-urban areas who may not have traditional email access.