# 📡 Documentation API - TopSteel ERP

## 🌐 Vue d'Ensemble

L'API TopSteel est construite avec NestJS et suit les principes RESTful. Elle offre une interface complète pour toutes les fonctionnalités de l'ERP.

## 🔑 Authentication

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123"
}

Response: 200 OK
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "dGhpcyBpcyBhIHJlZnJlc2g...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "ADMIN"
  }
}
```

### Refresh Token
```http
POST /api/auth/refresh
Authorization: Bearer {refresh_token}

Response: 200 OK
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "dGhpcyBpcyBhIHJlZnJlc2g..."
}
```

### Logout
```http
POST /api/auth/logout
Authorization: Bearer {access_token}

Response: 204 No Content
```

## 📦 Articles (Inventory)

### Get All Articles
```http
GET /api/articles?page=1&limit=20&search=steel&category=raw_material
Authorization: Bearer {access_token}

Response: 200 OK
{
  "data": [
    {
      "id": "uuid",
      "reference": "ART-001",
      "designation": "Steel Beam HEB 200",
      "category": "raw_material",
      "quantity": 150,
      "unit": "M",
      "price": {
        "amount": 45.50,
        "currency": "EUR"
      },
      "specifications": {
        "height": 200,
        "width": 200,
        "weight": 61.3,
        "grade": "S235JR"
      }
    }
  ],
  "meta": {
    "total": 245,
    "page": 1,
    "limit": 20,
    "totalPages": 13
  }
}
```

### Get Article by ID
```http
GET /api/articles/{id}
Authorization: Bearer {access_token}

Response: 200 OK
{
  "id": "uuid",
  "reference": "ART-001",
  "designation": "Steel Beam HEB 200",
  "category": "raw_material",
  "quantity": 150,
  "unit": "M",
  "price": {
    "amount": 45.50,
    "currency": "EUR"
  },
  "stockMovements": [...],
  "suppliers": [...],
  "certifications": [...]
}
```

### Create Article
```http
POST /api/articles
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "reference": "ART-002",
  "designation": "Steel Plate 10mm",
  "category": "raw_material",
  "unit": "M2",
  "price": {
    "amount": 125.00,
    "currency": "EUR"
  },
  "specifications": {
    "thickness": 10,
    "width": 2000,
    "length": 6000,
    "grade": "S355J2"
  },
  "minStock": 50,
  "maxStock": 200
}

Response: 201 Created
{
  "id": "uuid",
  "reference": "ART-002",
  ...
}
```

### Update Article
```http
PATCH /api/articles/{id}
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "price": {
    "amount": 130.00,
    "currency": "EUR"
  },
  "minStock": 60
}

Response: 200 OK
{
  "id": "uuid",
  "reference": "ART-002",
  ...
}
```

### Delete Article
```http
DELETE /api/articles/{id}
Authorization: Bearer {access_token}

Response: 204 No Content
```

## 📊 Stock Movements

### Create Movement
```http
POST /api/stock-movements
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "articleId": "uuid",
  "type": "IN",
  "quantity": 100,
  "unit": "M",
  "reference": "PO-2024-001",
  "supplierId": "uuid",
  "warehouseId": "uuid",
  "location": "A-12-3",
  "notes": "Reception from supplier XYZ"
}

Response: 201 Created
{
  "id": "uuid",
  "articleId": "uuid",
  "type": "IN",
  "quantity": 100,
  "previousStock": 150,
  "newStock": 250,
  "createdAt": "2024-08-21T10:30:00Z",
  "createdBy": "user-uuid"
}
```

### Get Movement History
```http
GET /api/stock-movements?articleId={id}&from=2024-01-01&to=2024-12-31
Authorization: Bearer {access_token}

Response: 200 OK
{
  "data": [
    {
      "id": "uuid",
      "type": "IN",
      "quantity": 100,
      "date": "2024-08-21T10:30:00Z",
      "reference": "PO-2024-001",
      "user": {
        "id": "uuid",
        "name": "John Doe"
      }
    }
  ],
  "summary": {
    "totalIn": 500,
    "totalOut": 350,
    "balance": 150
  }
}
```

## 👥 Partners

### Get Partners
```http
GET /api/partners?type=client&status=active
Authorization: Bearer {access_token}

Response: 200 OK
{
  "data": [
    {
      "id": "uuid",
      "code": "CLI-001",
      "name": "Steel Construction Ltd",
      "type": "client",
      "status": "active",
      "contact": {
        "email": "contact@steelconstruction.com",
        "phone": "+33123456789",
        "address": {
          "street": "123 Industrial Ave",
          "city": "Paris",
          "postalCode": "75001",
          "country": "France"
        }
      },
      "creditLimit": 50000,
      "paymentTerms": 30,
      "rating": 4.5
    }
  ]
}
```

### Create Partner
```http
POST /api/partners
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "code": "SUP-001",
  "name": "Metal Supplies Inc",
  "type": "supplier",
  "contact": {
    "email": "sales@metalsupplies.com",
    "phone": "+33987654321",
    "address": {
      "street": "456 Steel Road",
      "city": "Lyon",
      "postalCode": "69001",
      "country": "France"
    }
  },
  "taxId": "FR12345678901",
  "paymentTerms": 60
}

Response: 201 Created
```

### Get Partner Analytics
```http
GET /api/partners/{id}/analytics
Authorization: Bearer {access_token}

Response: 200 OK
{
  "revenue": {
    "total": 250000,
    "thisMonth": 35000,
    "growth": 12.5
  },
  "orders": {
    "total": 45,
    "pending": 5,
    "completed": 40
  },
  "payments": {
    "onTime": 38,
    "late": 2,
    "averageDays": 28
  },
  "ranking": {
    "position": 3,
    "totalPartners": 127,
    "percentile": 97.6
  }
}
```

## 💰 Quotes

### Create Quote
```http
POST /api/quotes
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "clientId": "uuid",
  "validityDays": 30,
  "items": [
    {
      "articleId": "uuid",
      "quantity": 10,
      "unitPrice": 150.00,
      "discount": 5,
      "tvaRate": 20
    }
  ],
  "notes": "Delivery included",
  "conditions": "Payment 30 days"
}

Response: 201 Created
{
  "id": "uuid",
  "reference": "DEV-2024-001",
  "status": "DRAFT",
  "totalHT": 1425.00,
  "totalTVA": 285.00,
  "totalTTC": 1710.00,
  "validUntil": "2024-09-20",
  "createdAt": "2024-08-21T14:00:00Z"
}
```

### Convert Quote to Order
```http
POST /api/quotes/{id}/convert-to-order
Authorization: Bearer {access_token}

Response: 200 OK
{
  "orderId": "uuid",
  "orderReference": "CMD-2024-001",
  "status": "CONFIRMED"
}
```

### Send Quote by Email
```http
POST /api/quotes/{id}/send
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "to": ["client@example.com"],
  "cc": ["sales@topsteel.com"],
  "subject": "Devis DEV-2024-001",
  "message": "Please find attached our quotation."
}

Response: 200 OK
{
  "success": true,
  "messageId": "email-uuid",
  "sentAt": "2024-08-21T14:30:00Z"
}
```

## 🏭 Production

### Create Production Order
```http
POST /api/production/orders
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "projectId": "uuid",
  "reference": "OF-2024-001",
  "priority": "HIGH",
  "startDate": "2024-08-25",
  "endDate": "2024-09-05",
  "items": [
    {
      "articleId": "uuid",
      "quantity": 50,
      "operations": [
        {
          "type": "CUTTING",
          "duration": 120,
          "resourceId": "uuid"
        },
        {
          "type": "WELDING",
          "duration": 240,
          "resourceId": "uuid"
        }
      ]
    }
  ]
}

Response: 201 Created
```

### Update Production Status
```http
PATCH /api/production/orders/{id}/status
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "status": "IN_PROGRESS",
  "startedAt": "2024-08-25T08:00:00Z",
  "operatorId": "uuid"
}

Response: 200 OK
```

## 📈 Analytics

### Get Dashboard Metrics
```http
GET /api/analytics/dashboard
Authorization: Bearer {access_token}

Response: 200 OK
{
  "revenue": {
    "current": 125000,
    "previous": 110000,
    "growth": 13.6
  },
  "orders": {
    "new": 12,
    "inProgress": 8,
    "completed": 45
  },
  "production": {
    "efficiency": 87.5,
    "capacity": 92.3,
    "delays": 2
  },
  "inventory": {
    "value": 450000,
    "turnover": 4.2,
    "alerts": 5
  }
}
```

### Export Report
```http
POST /api/analytics/export
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "type": "INVENTORY_REPORT",
  "format": "PDF",
  "period": {
    "from": "2024-01-01",
    "to": "2024-12-31"
  },
  "filters": {
    "category": ["raw_material"],
    "warehouse": ["main"]
  }
}

Response: 200 OK
Content-Type: application/pdf
Content-Disposition: attachment; filename="inventory_report_2024.pdf"

[Binary PDF Data]
```

## 🔔 Notifications

### Get Notifications
```http
GET /api/notifications?unread=true
Authorization: Bearer {access_token}

Response: 200 OK
{
  "data": [
    {
      "id": "uuid",
      "type": "STOCK_ALERT",
      "category": "inventory",
      "title": "Low Stock Alert",
      "message": "Article ART-001 is below minimum stock",
      "priority": "HIGH",
      "createdAt": "2024-08-21T15:00:00Z",
      "readAt": null,
      "actionUrl": "/inventory/articles/uuid"
    }
  ],
  "unreadCount": 5
}
```

### Mark as Read
```http
PATCH /api/notifications/{id}/read
Authorization: Bearer {access_token}

Response: 200 OK
{
  "id": "uuid",
  "readAt": "2024-08-21T15:30:00Z"
}
```

## 🔍 Search

### Global Search
```http
GET /api/search?q=steel&types=article,partner,project
Authorization: Bearer {access_token}

Response: 200 OK
{
  "results": [
    {
      "type": "article",
      "id": "uuid",
      "title": "Steel Beam HEB 200",
      "description": "Reference: ART-001",
      "url": "/inventory/articles/uuid",
      "score": 0.95
    },
    {
      "type": "partner",
      "id": "uuid",
      "title": "Steel Construction Ltd",
      "description": "Client - CLI-001",
      "url": "/partners/uuid",
      "score": 0.87
    }
  ],
  "totalResults": 15,
  "searchTime": 0.125
}
```

## ⚠️ Error Responses

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Invalid or expired token"
}
```

### 403 Forbidden
```json
{
  "statusCode": 403,
  "message": "Forbidden",
  "error": "Insufficient permissions"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Resource not found",
  "error": "Article with id 'uuid' not found"
}
```

### 500 Internal Server Error
```json
{
  "statusCode": 500,
  "message": "Internal server error",
  "error": "An unexpected error occurred"
}
```

## 📊 Rate Limiting

L'API implémente un rate limiting pour protéger contre les abus :

- **Global** : 1000 requêtes/minute par IP
- **Authentifié** : 5000 requêtes/minute par utilisateur
- **Endpoints sensibles** : 10 requêtes/minute (login, password reset)

Headers de réponse :
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 950
X-RateLimit-Reset: 1629553200
```

## 🔄 Webhooks

### Configuration
```http
POST /api/webhooks
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "url": "https://your-app.com/webhook",
  "events": ["order.created", "stock.low", "payment.received"],
  "secret": "your-webhook-secret"
}

Response: 201 Created
{
  "id": "uuid",
  "url": "https://your-app.com/webhook",
  "events": ["order.created", "stock.low", "payment.received"],
  "active": true
}
```

### Webhook Payload
```json
{
  "event": "order.created",
  "timestamp": "2024-08-21T16:00:00Z",
  "data": {
    "orderId": "uuid",
    "reference": "CMD-2024-001",
    "clientId": "uuid",
    "total": 1710.00
  },
  "signature": "sha256=..."
}
```

## 🚀 WebSocket Events

### Connection
```javascript
const socket = io('wss://api.topsteel.com', {
  auth: {
    token: 'your-jwt-token'
  }
})

socket.on('connect', () => {
  console.log('Connected to TopSteel API')
})

socket.on('notification', (data) => {
  console.log('New notification:', data)
})

socket.on('stock.update', (data) => {
  console.log('Stock updated:', data)
})
```

## 📝 API Versioning

L'API supporte le versioning via headers :

```http
Accept: application/vnd.topsteel.v1+json
```

Versions disponibles :
- **v1** : Version stable actuelle
- **v2** : Beta (certains endpoints seulement)

## 🔐 Security Headers

Toutes les réponses incluent les headers de sécurité suivants :

```http
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'
```

## 📚 SDKs

### JavaScript/TypeScript
```bash
npm install @topsteel/api-client
```

```typescript
import { TopSteelClient } from '@topsteel/api-client'

const client = new TopSteelClient({
  apiKey: 'your-api-key',
  baseURL: 'https://api.topsteel.com'
})

const articles = await client.articles.list({
  page: 1,
  limit: 20
})
```

### Python
```bash
pip install topsteel-api
```

```python
from topsteel import TopSteelClient

client = TopSteelClient(
    api_key='your-api-key',
    base_url='https://api.topsteel.com'
)

articles = client.articles.list(page=1, limit=20)
```

---

**📖 Pour plus d'informations, consultez la [documentation complète](https://docs.topsteel-erp.com/api)**