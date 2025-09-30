# Cart Module - Complete User Shopping Cart System

## 🛒 Overview

The Cart Module provides a comprehensive shopping cart system that allows users to:
- Add products to cart from multiple shops
- Manage separate carts per shop
- Handle stock availability validation based on shop policies
- Update quantities and manage cart items
- Track cart expiry and activity
- Support both authenticated and guest users

## 🏗️ Architecture

### Entities

#### Cart Entity
- **Purpose**: Represents a user's shopping cart for a specific shop
- **Key Features**:
  - One cart per user per shop (unique constraint)
  - Automatic total calculations
  - Stock validation based on shop policy
  - Cart expiry management (24 hours by default)
  - Activity tracking
  - Support for guest sessions

#### CartItem Entity
- **Purpose**: Individual items within a cart
- **Key Features**:
  - Product snapshot at time of adding
  - Quantity and pricing management
  - Stock validation per shop policy
  - Discount calculations
  - Availability tracking

### Stock Validation Logic

```typescript
// Shop has hasStockAvailability = true
if (shop.hasStockAvailability) {
  // User CANNOT add out-of-stock items
  if (!product.hasStock) {
    throw BadRequestException('Out of stock');
  }
}

// Shop has hasStockAvailability = false  
if (!shop.hasStockAvailability) {
  // User CAN add out-of-stock items
  // Item will be marked as unavailable but still addable
}
```

## 🎯 Key Features

### 1. Multi-Shop Cart Support
- Users can have multiple active carts (one per shop)
- Each cart is independent with its own totals
- Shop-specific policies applied per cart

### 2. Stock Availability Management
- **Strict Mode** (`hasStockAvailability = true`): Only in-stock items can be added
- **Flexible Mode** (`hasStockAvailability = false`): Out-of-stock items can be added but marked as unavailable

### 3. Real-time Product Updates
- Cart items maintain product snapshots
- Refresh functionality updates with latest product info
- Automatic availability checking

### 4. Cart Lifecycle Management
- **ACTIVE**: Normal shopping state
- **ABANDONED**: User left without checkout
- **CHECKED_OUT**: Converted to order
- **EXPIRED**: Automatically expired after 24 hours

### 5. Comprehensive Calculations
- Subtotals with discount applications
- Tax and delivery fee support
- Total savings tracking
- Item-level and cart-level totals

## 🔌 API Endpoints

### Core Cart Operations
```http
POST   /cart/add                    # Add product to cart
GET    /cart/my-carts              # Get all user carts
GET    /cart/shop/:shopId          # Get cart for specific shop
GET    /cart/:cartId               # Get cart by ID
PATCH  /cart/:cartId               # Update cart details
DELETE /cart/:cartId/clear         # Clear all items from cart
```

### Cart Item Management
```http
PATCH  /cart/item/:itemId          # Update item quantity/notes
DELETE /cart/item/:itemId          # Remove item from cart
```

### Cart Status Management
```http
PATCH  /cart/:cartId/refresh       # Refresh with latest product info
PATCH  /cart/:cartId/abandon       # Mark as abandoned
PATCH  /cart/:cartId/checkout      # Mark as checked out
```

### Analytics
```http
GET    /cart/stats                 # Get cart statistics
```

## 📝 Usage Examples

### Adding Product to Cart

```typescript
// Request
POST /cart/add
{
  "productId": "product-uuid",
  "shopId": "shop-uuid", 
  "quantity": 2,
  "notes": "Extra spicy please"
}

// Response
{
  "id": "cart-uuid",
  "userId": "user-uuid",
  "shopId": "shop-uuid",
  "items": [
    {
      "id": "item-uuid",
      "productId": "product-uuid",
      "quantity": 2,
      "unitPrice": 10.00,
      "unitDiscountPrice": 8.00,
      "subtotal": 16.00,
      "isAvailable": true,
      "notes": "Extra spicy please"
    }
  ],
  "subtotal": 16.00,
  "totalDiscount": 4.00,
  "total": 16.00,
  "status": "active"
}
```

### Multi-Shop Cart Scenario

```typescript
// User adds items from Shop A
POST /cart/add { "productId": "prod1", "shopId": "shopA", "quantity": 1 }
// Creates Cart A

// User adds items from Shop B  
POST /cart/add { "productId": "prod2", "shopId": "shopB", "quantity": 2 }
// Creates Cart B

// User now has 2 separate carts
GET /cart/my-carts
// Returns: [Cart A, Cart B]
```

### Stock Validation Examples

```typescript
// Shop with strict stock control (hasStockAvailability = true)
POST /cart/add { 
  "productId": "out-of-stock-product",
  "shopId": "strict-shop" 
}
// Response: 400 Bad Request - "Out of stock"

// Shop with flexible stock control (hasStockAvailability = false)
POST /cart/add { 
  "productId": "out-of-stock-product", 
  "shopId": "flexible-shop" 
}
// Response: 200 OK - Item added but marked as unavailable
```

## 🔄 Business Logic

### Cart Creation Flow
1. Check if user has active cart for the shop
2. If exists, add to existing cart
3. If not, create new cart
4. Validate product belongs to specified shop
5. Apply shop's stock availability policy
6. Calculate totals and save

### Stock Validation Flow
1. Get shop's `hasStockAvailability` setting
2. If `true`: Reject out-of-stock items
3. If `false`: Allow but mark as unavailable
4. Update cart item availability status
5. Recalculate cart totals

### Cart Refresh Flow
1. Fetch latest product information
2. Update cart item snapshots
3. Revalidate stock availability
4. Mark unavailable items appropriately
5. Recalculate all totals

## 🎛️ Configuration Options

### Cart Expiry
- Default: 24 hours from last activity
- Configurable per cart
- Automatic cleanup job available

### Stock Validation
- Per-shop configuration via `hasStockAvailability`
- Real-time validation on add/update
- Availability status tracking

### Pricing Calculations
- Support for unit discounts
- Tax and delivery fee inclusion
- Automatic total recalculation

## 🔐 Security Considerations

- Users can only access their own carts
- Cart ownership validation on all operations
- Session support for guest users
- Product-shop association validation

## 📊 Analytics & Reporting

### Available Statistics
- Total carts per user/system
- Active vs abandoned cart ratios
- Total items and values
- Cart lifecycle tracking
- Stock availability impact

## 🧪 Testing Scenarios

### Stock Availability Testing
1. **Strict Shop**: Verify out-of-stock rejection
2. **Flexible Shop**: Verify out-of-stock acceptance with unavailable marking
3. **Stock Changes**: Test cart refresh after stock updates

### Multi-Cart Testing
1. **Multiple Shops**: Verify separate cart creation
2. **Cart Isolation**: Verify operations don't affect other carts
3. **User Switching**: Verify cart ownership isolation

### Edge Cases
1. **Product Deletion**: Verify cart item handling
2. **Shop Deactivation**: Verify cart behavior
3. **Price Changes**: Verify snapshot vs current pricing

## ✅ Implementation Status

- ✅ **Cart Entity**: Complete with all business logic
- ✅ **CartItem Entity**: Complete with stock validation
- ✅ **Cart Service**: Full CRUD and business operations
- ✅ **Cart Controller**: Complete REST API
- ✅ **Cart Module**: Proper dependency injection
- ✅ **DTOs**: Comprehensive request/response objects
- ✅ **Stock Validation**: Shop-based policy enforcement
- ✅ **Multi-Shop Support**: Separate carts per shop
- ✅ **Real-time Updates**: Product refresh functionality
- ✅ **Analytics**: Cart statistics and reporting

**Status: ✅ COMPLETE - Ready for Testing**

The Cart Module is fully implemented and ready for integration testing with the existing user, shop, and product systems.