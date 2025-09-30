# Credit Management API Examples

## Table of Contents
1. [Shop Owner Workflows](#shop-owner-workflows)
2. [Customer Workflows](#customer-workflows)
3. [Order Integration Examples](#order-integration-examples)
4. [Advanced Scenarios](#advanced-scenarios)

## Shop Owner Workflows

### 1. Creating a Credit Account for a New Customer

```http
POST /credit/shops/shop-uuid-123/accounts
Content-Type: application/json

{
  "customerPhone": "+919876543210",
  "customerNickname": "Ravi Uncle",
  "customerName": "Ravi Kumar",
  "creditLimit": 5000,
  "notes": "Regular customer, vegetables vendor"
}
```

**Response:**
```json
{
  "id": "acc-uuid-456",
  "customerPhone": "+919876543210",
  "customerNickname": "Ravi Uncle",
  "customerName": "Ravi Kumar",
  "totalCreditAmount": 0,
  "totalPaidAmount": 0,
  "currentBalance": 0,
  "creditLimit": 5000,
  "status": "active",
  "notes": "Regular customer, vegetables vendor",
  "createdAt": "2024-01-15T10:30:00Z",
  "shop": {
    "id": "shop-uuid-123",
    "shopName": "Village General Store",
    "city": "Mandya",
    "state": "Karnataka"
  }
}
```

### 2. Adding Credit Manually (Non-Order Based)

```http
POST /credit/shops/shop-uuid-123/accounts/acc-uuid-456/credit
Content-Type: application/json

{
  "amount": 1500,
  "remarks": "Emergency medicine purchase for family"
}
```

**Response:**
```json
{
  "id": "txn-uuid-789",
  "transactionType": "credit",
  "transactionSource": "manual",
  "amount": 1500,
  "remarks": "Emergency medicine purchase for family",
  "balanceAfterTransaction": 1500,
  "createdAt": "2024-01-15T14:45:00Z",
  "creditAccount": {
    "id": "acc-uuid-456",
    "customerPhone": "+919876543210",
    "customerNickname": "Ravi Uncle",
    "currentBalance": 1500
  }
}
```

### 3. Recording a Payment from Customer

```http
POST /credit/shops/shop-uuid-123/accounts/acc-uuid-456/payment
Content-Type: application/json

{
  "amount": 800,
  "remarks": "Cash payment received"
}
```

**Response:**
```json
{
  "id": "txn-uuid-890",
  "transactionType": "payment",
  "transactionSource": "manual",
  "amount": 800,
  "remarks": "Cash payment received",
  "balanceAfterTransaction": 700,
  "createdAt": "2024-01-16T09:20:00Z",
  "creditAccount": {
    "id": "acc-uuid-456",
    "customerPhone": "+919876543210",
    "customerNickname": "Ravi Uncle",
    "currentBalance": 700
  }
}
```

### 4. Getting All Credit Accounts for Shop

```http
GET /credit/shops/shop-uuid-123/accounts?limit=10&offset=0&sortBy=currentBalance&sortOrder=DESC
```

**Response:**
```json
{
  "accounts": [
    {
      "id": "acc-uuid-456",
      "customerPhone": "+919876543210",
      "customerNickname": "Ravi Uncle",
      "customerName": "Ravi Kumar",
      "currentBalance": 700,
      "creditLimit": 5000,
      "status": "active",
      "lastCreditDate": "2024-01-15T14:45:00Z",
      "lastPaymentDate": "2024-01-16T09:20:00Z"
    },
    {
      "id": "acc-uuid-457",
      "customerPhone": "+919876543211",
      "customerNickname": "Lakshmi Aunty",
      "customerName": "Lakshmi Devi",
      "currentBalance": 350,
      "creditLimit": 2000,
      "status": "active",
      "lastCreditDate": "2024-01-14T16:30:00Z",
      "lastPaymentDate": "2024-01-12T11:15:00Z"
    }
  ],
  "total": 25,
  "page": 1,
  "limit": 10
}
```

### 5. Getting Credit Summary for Shop

```http
GET /credit/shops/shop-uuid-123/summary
```

**Response:**
```json
{
  "totalAccounts": 25,
  "activeAccounts": 23,
  "totalCreditGiven": 87500,
  "totalPaymentsReceived": 64000,
  "totalOutstandingBalance": 23500,
  "recentTransactions": [
    {
      "id": "txn-uuid-890",
      "transactionType": "payment",
      "amount": 800,
      "createdAt": "2024-01-16T09:20:00Z",
      "creditAccount": {
        "customerPhone": "+919876543210",
        "customerNickname": "Ravi Uncle"
      }
    }
  ]
}
```

### 6. Getting Account Transactions

```http
GET /credit/shops/shop-uuid-123/accounts/acc-uuid-456/transactions?limit=20
```

**Response:**
```json
{
  "transactions": [
    {
      "id": "txn-uuid-890",
      "transactionType": "payment",
      "transactionSource": "manual",
      "amount": 800,
      "remarks": "Cash payment received",
      "balanceAfterTransaction": 700,
      "createdAt": "2024-01-16T09:20:00Z"
    },
    {
      "id": "txn-uuid-789",
      "transactionType": "credit",
      "transactionSource": "manual",
      "amount": 1500,
      "remarks": "Emergency medicine purchase for family",
      "balanceAfterTransaction": 1500,
      "createdAt": "2024-01-15T14:45:00Z"
    },
    {
      "id": "txn-uuid-788",
      "transactionType": "credit",
      "transactionSource": "order",
      "amount": 450,
      "remarks": "Order ORD-2024-001 - 3 items",
      "balanceAfterTransaction": 450,
      "createdAt": "2024-01-14T16:30:00Z",
      "order": {
        "id": "order-uuid-123",
        "orderNumber": "ORD-2024-001",
        "total": 450,
        "status": "delivered",
        "createdAt": "2024-01-14T16:30:00Z"
      }
    }
  ],
  "total": 15,
  "page": 1,
  "limit": 20
}
```

## Customer Workflows

### 1. Getting Customer's Credit Accounts Across All Shops

```http
GET /credit/customers/+919876543210/accounts
```

**Response:**
```json
[
  {
    "id": "acc-uuid-456",
    "customerPhone": "+919876543210",
    "customerNickname": "Ravi Uncle",
    "currentBalance": 700,
    "creditLimit": 5000,
    "status": "active",
    "shop": {
      "id": "shop-uuid-123",
      "shopName": "Village General Store",
      "city": "Mandya",
      "state": "Karnataka"
    }
  },
  {
    "id": "acc-uuid-789",
    "customerPhone": "+919876543210",
    "customerNickname": "Regular Customer",
    "currentBalance": 250,
    "creditLimit": 1000,
    "status": "active",
    "shop": {
      "id": "shop-uuid-124",
      "shopName": "Medical Store",
      "city": "Mandya",
      "state": "Karnataka"
    }
  }
]
```

### 2. Getting Customer's Transaction History

```http
GET /credit/customers/+919876543210/transactions
```

**Response:**
```json
[
  {
    "id": "txn-uuid-890",
    "transactionType": "payment",
    "amount": 800,
    "remarks": "Cash payment received",
    "balanceAfterTransaction": 700,
    "createdAt": "2024-01-16T09:20:00Z",
    "creditAccount": {
      "shop": {
        "shopName": "Village General Store"
      }
    }
  },
  {
    "id": "txn-uuid-789",
    "transactionType": "credit",
    "amount": 1500,
    "remarks": "Emergency medicine purchase for family",
    "balanceAfterTransaction": 1500,
    "createdAt": "2024-01-15T14:45:00Z",
    "creditAccount": {
      "shop": {
        "shopName": "Village General Store"
      }
    }
  }
]
```

### 3. Getting Transactions for Specific Shop

```http
GET /credit/customers/+919876543210/transactions?shopId=shop-uuid-123
```

## Order Integration Examples

### 1. Placing Order with Credit Payment

```http
POST /orders
Content-Type: application/json

{
  "cartId": "cart-uuid-789",
  "orderType": "shop_pickup",
  "paymentMethod": "credit",
  "customerPhone": "+919876543210",
  "shopPickupDetails": {
    "pickupDate": "2024-01-17",
    "pickupTime": "14:00",
    "pickupNotes": "Will come after 2 PM"
  }
}
```

**What happens automatically:**
1. Order is created with total ₹850
2. System finds existing credit account for +919876543210
3. Adds ₹850 to customer's credit balance
4. Creates credit transaction linked to this order
5. Marks order payment status as "paid"
6. Order ID is recorded in credit transaction to prevent duplicate entries

**Order Response:**
```json
{
  "id": "order-uuid-124",
  "orderNumber": "ORD-2024-002",
  "status": "order_placed",
  "paymentMethod": "credit",
  "paymentStatus": "paid",
  "total": 850,
  "customerPhone": "+919876543210",
  "items": [...]
}
```

**Corresponding Credit Transaction (Auto-created):**
```json
{
  "id": "txn-uuid-891",
  "transactionType": "credit",
  "transactionSource": "order",
  "amount": 850,
  "remarks": "Order ORD-2024-002 - 5 items",
  "balanceAfterTransaction": 1550,
  "orderId": "order-uuid-124",
  "createdAt": "2024-01-17T11:30:00Z"
}
```

### 2. First-Time Credit Customer Order

```http
POST /orders
Content-Type: application/json

{
  "cartId": "cart-uuid-790",
  "orderType": "home_delivery",
  "paymentMethod": "credit",
  "customerPhone": "+919876543220",
  "homeDeliveryDetails": {
    "deliveryAddress": "123 Main Street, Village",
    "deliveryLandmark": "Near temple",
    "deliveryPincode": "571401",
    "deliveryCity": "Mandya",
    "deliveryState": "Karnataka",
    "deliveryContactNumber": "+919876543220"
  }
}
```

**What happens automatically:**
1. System doesn't find existing credit account for +919876543220
2. Creates new credit account automatically:
   ```json
   {
     "customerPhone": "+919876543220",
     "customerNickname": "Customer-+919876543220",
     "customerName": "John Doe", // From user account
     "notes": "Auto-created for order ORD-2024-003"
   }
   ```
3. Adds order total to new credit account
4. Processes order normally

## Advanced Scenarios

### 1. Credit Limit Exceeded

```http
POST /credit/shops/shop-uuid-123/accounts/acc-uuid-456/credit
Content-Type: application/json

{
  "amount": 6000,
  "remarks": "Large purchase request"
}
```

**Error Response (400 Bad Request):**
```json
{
  "statusCode": 400,
  "message": "Credit amount exceeds the credit limit for this customer",
  "error": "Bad Request"
}
```

### 2. Duplicate Order Credit Prevention

```http
POST /credit/shops/shop-uuid-123/accounts/acc-uuid-456/credit
Content-Type: application/json

{
  "amount": 500,
  "orderId": "order-uuid-124" // Order already added to credit
}
```

**Error Response (409 Conflict):**
```json
{
  "statusCode": 409,
  "message": "This order has already been added to credit system",
  "error": "Conflict"
}
```

### 3. Payment Exceeds Balance

```http
POST /credit/shops/shop-uuid-123/accounts/acc-uuid-456/payment
Content-Type: application/json

{
  "amount": 2000 // Customer balance is only ₹700
}
```

**Error Response (400 Bad Request):**
```json
{
  "statusCode": 400,
  "message": "Payment amount cannot exceed current balance",
  "error": "Bad Request"
}
```

### 4. Updating Credit Account Details

```http
PUT /credit/shops/shop-uuid-123/accounts/acc-uuid-456
Content-Type: application/json

{
  "customerNickname": "Ravi Anna",
  "creditLimit": 10000,
  "status": "active",
  "notes": "Increased limit due to excellent payment history"
}
```

**Response:**
```json
{
  "id": "acc-uuid-456",
  "customerPhone": "+919876543210",
  "customerNickname": "Ravi Anna",
  "customerName": "Ravi Kumar",
  "totalCreditAmount": 2350,
  "totalPaidAmount": 800,
  "currentBalance": 1550,
  "creditLimit": 10000,
  "status": "active",
  "notes": "Increased limit due to excellent payment history",
  "updatedAt": "2024-01-17T12:00:00Z"
}
```

### 5. Getting All Shop Transactions with Filters

```http
GET /credit/shops/shop-uuid-123/transactions?transactionType=credit&limit=10&sortBy=createdAt&sortOrder=DESC
```

**Response:**
```json
{
  "transactions": [
    {
      "id": "txn-uuid-891",
      "transactionType": "credit",
      "transactionSource": "order",
      "amount": 850,
      "remarks": "Order ORD-2024-002 - 5 items",
      "balanceAfterTransaction": 1550,
      "createdAt": "2024-01-17T11:30:00Z",
      "order": {
        "orderNumber": "ORD-2024-002",
        "total": 850
      },
      "creditAccount": {
        "customerPhone": "+919876543210",
        "customerNickname": "Ravi Uncle"
      }
    }
  ],
  "total": 45,
  "page": 1,
  "limit": 10
}
```

### 6. Searching Accounts by Phone Number

```http
GET /credit/shops/shop-uuid-123/accounts?customerPhone=98765
```

**Response:**
```json
{
  "accounts": [
    {
      "id": "acc-uuid-456",
      "customerPhone": "+919876543210",
      "customerNickname": "Ravi Uncle",
      "currentBalance": 1550
    },
    {
      "id": "acc-uuid-458",
      "customerPhone": "+919876543220",
      "customerNickname": "New Customer",
      "currentBalance": 450
    }
  ],
  "total": 2,
  "page": 1,
  "limit": 20
}
```

## Error Handling Examples

### Common Error Responses

#### 1. Account Not Found
```json
{
  "statusCode": 404,
  "message": "Credit account not found",
  "error": "Not Found"
}
```

#### 2. Shop Not Found
```json
{
  "statusCode": 404,
  "message": "Shop not found",
  "error": "Not Found"
}
```

#### 3. Validation Errors
```json
{
  "statusCode": 400,
  "message": [
    "amount must be a positive number",
    "customerPhone must be a valid phone number"
  ],
  "error": "Bad Request"
}
```

#### 4. Credit Account Already Exists
```json
{
  "statusCode": 409,
  "message": "Credit account already exists for this customer in this shop",
  "error": "Conflict"
}
```

## Best Practices

### 1. Always Use Absolute Phone Numbers
```javascript
// Good
const customerPhone = "+919876543210";

// Avoid
const customerPhone = "9876543210";
```

### 2. Handle Async Operations Properly
```javascript
try {
  const creditTransaction = await addCredit(shopId, accountId, {
    amount: 1000,
    remarks: "Weekly groceries"
  });
  
  console.log('Credit added successfully:', creditTransaction);
} catch (error) {
  if (error.statusCode === 400) {
    console.error('Credit limit exceeded or validation error');
  } else if (error.statusCode === 404) {
    console.error('Account or shop not found');
  }
}
```

### 3. Validate Credit Limits Before Large Transactions
```javascript
const account = await getCreditAccount(shopId, accountId);
const newBalance = account.currentBalance + amount;

if (account.creditLimit > 0 && newBalance > account.creditLimit) {
  throw new Error('This transaction would exceed credit limit');
}
```

### 4. Use Pagination for Large Result Sets
```javascript
// For shops with many customers
const accounts = await getCreditAccounts(shopId, {
  limit: 50,
  offset: 0,
  sortBy: 'currentBalance',
  sortOrder: 'DESC'
});
```

This credit management system provides a comprehensive solution for digitizing traditional credit-based commerce in local shops while maintaining the personal touch that makes these businesses successful.