# Shop Module API Examples

## Create a new shop
```bash
POST /api/v1/shops
Content-Type: application/json

{
  "shopName": "Fresh Mart Grocery",
  "address": "123 Main Street, Downtown Plaza",
  "zipCode": "12345",
  "city": "New York",
  "state": "NY",
  "district": "Manhattan",
  "hasOwnDeliveryPartner": true,
  "latitude": 40.7128,
  "longitude": -74.0060,
  "openingTime": "08:00",
  "closingTime": "22:00",
  "workingDays": ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"],
  "contactPhone": "+1234567890",
  "contactEmail": "freshmart@example.com",
  "description": "Fresh groceries and daily essentials",
  "isDeliveryAvailable": true,
  "deliveryRadius": 5.0,
  "minimumOrderAmount": 25.00,
  "deliveryFee": 3.50,
  "ownerId": "uuid-of-shop-owner"
}
```

## Search shops with filters
```bash
GET /api/v1/shops?city=New York&status=active&isDeliveryAvailable=true&minRating=4.0&page=1&limit=10
```

## Find nearby shops
```bash
GET /api/v1/shops/nearby?lat=40.7128&lng=-74.0060&radius=5
```

## Get currently open shops
```bash
GET /api/v1/shops/currently-open
```

## Update shop status
```bash
PATCH /api/v1/shops/{shop-id}/status
Content-Type: application/json

{
  "status": "active"
}
```

## Get shop statistics
```bash
GET /api/v1/shops/stats
```

## Response will include:
- Total shops count
- Shops by status breakdown
- Shops by city breakdown  
- Number of shops with delivery
- Number of currently open shops