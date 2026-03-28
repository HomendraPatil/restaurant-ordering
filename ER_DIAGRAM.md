# Database Schema - Entity Relationship Diagram

## Schema Overview

### Tables

| Table | Purpose | Key Relationships |
|-------|---------|-------------------|
| `users` | Customer and admin accounts | 1:many → sessions, addresses, orders, cart_items |
| `sessions` | Session/refresh token management | many:1 → users |
| `addresses` | Delivery addresses | many:1 → users, 1:many → orders |
| `categories` | Menu categories | 1:many → menu_items |
| `menu_items` | Menu items with dietary flags | many:1 → categories, 1:many → customization_groups, cart_items, order_items |
| `item_customization_groups` | Groups for sizes/add-ons | many:1 → menu_items, 1:many → customization_options |
| `customization_options` | Individual options | many:1 → groups, 1:many → cart_item_customizations |
| `cart_items` | Shopping cart | many:1 → users/sessions, menu_items; 1:many → cart_item_customizations |
| `cart_item_customizations` | Junction table for cart customizations | many:1 → cart_items, customization_options |
| `orders` | Order headers | many:1 → users, addresses; 1:many → order_items, payments, status_history |
| `order_items` | Items in orders | many:1 → orders, menu_items |
| `payments` | Payment transactions | many:1 → orders (1:1) |
| `order_status_history` | Audit trail | many:1 → orders, users |

## ER Diagram (Mermaid)

```mermaid
erDiagram
    USER ||--o{ SESSION : has
    USER ||--o{ ADDRESS : has
    USER ||--o{ CART_ITEM : owns
    USER ||--o{ ORDER : places
    USER ||--o{ ORDER_STATUS_HISTORY : changed
    
    USER {
        string id PK
        string email UK
        string passwordHash
        string name
        string phone
        string role "CUSTOMER|ADMIN"
        datetime createdAt
        datetime updatedAt
    }
    
    SESSION {
        string id PK
        string sessionToken UK
        string userId FK
        string refreshToken
        datetime expiresAt
        datetime createdAt
    }
    
    ADDRESS {
        string id PK
        string userId FK
        string addressLine
        string city
        string state
        string pincode
        boolean isDefault
        datetime createdAt
    }
    
    CATEGORY ||--o{ MENU_ITEM : contains
    
    CATEGORY {
        string id PK
        string name
        string description
        string imageUrl
        string slug UK
        int sortOrder
        boolean isActive
        datetime createdAt
    }
    
    MENU_ITEM ||--o{ ITEM_CUSTOMIZATION_GROUP : has
    MENU_ITEM ||--o{ CART_ITEM : in
    MENU_ITEM ||--o{ ORDER_ITEM : in
    
    MENU_ITEM {
        string id PK
        string categoryId FK
        string slug UK
        string name
        string description
        string imageUrl
        decimal price
        int preparationTime
        boolean isAvailable
        boolean isVegetarian
        boolean isVegan
        boolean isGlutenFree
        int stockQuantity
        boolean isLimited
        datetime createdAt
        datetime updatedAt
    }
    
    ITEM_CUSTOMIZATION_GROUP ||--o{ CUSTOMIZATION_OPTION : contains
    ITEM_CUSTOMIZATION_GROUP {
        string id PK
        string menuItemId FK
        string type "SIZE|ADDON|TEXT"
        string name
        boolean isRequired
        int minSelections
        int maxSelections
        int sortOrder
    }
    
    CUSTOMIZATION_OPTION ||--o{ CART_ITEM_CUSTOMIZATION : selected
    CUSTOMIZATION_OPTION {
        string id PK
        string groupId FK
        string name
        decimal priceModifier
        boolean isDefault
        int sortOrder
    }
    
    CART_ITEM ||--o{ CART_ITEM_CUSTOMIZATION : has
    CART_ITEM }o--|| USER : "owns (if logged in)"
    CART_ITEM }o--|| SESSION : "belongs to (guest)"
    
    CART_ITEM {
        string id PK
        string sessionId FK
        string userId FK
        string menuItemId FK
        int quantity
        decimal unitPrice
        decimal customizationPrice
        string specialInstructions
        datetime createdAt
    }
    
    CART_ITEM_CUSTOMIZATION {
        string id PK
        string cartItemId FK
        string optionId FK
    }
    
    ORDER ||--o{ ORDER_ITEM : contains
    ORDER ||--o| PAYMENT : has
    ORDER ||--o{ ORDER_STATUS_HISTORY : has
    
    ORDER {
        string id PK
        string userId FK
        string status "PENDING|RECEIVED|PREPARING|READY|COMPLETED|CANCELLED|PAYMENT_FAILED"
        decimal subtotal
        decimal taxAmount
        decimal totalAmount
        string addressId FK
        string razorpayPaymentId UK
        string specialInstructions
        datetime createdAt
    }
    
    ORDER_ITEM {
        string id PK
        string orderId FK
        string menuItemId FK
        int quantity
        decimal unitPrice
        decimal customizationPrice
        string specialInstructions
        json selectedOptions
    }
    
    PAYMENT {
        string id PK
        string orderId FK UK
        string razorpayPaymentId UK
        decimal amount
        string status "PENDING|SUCCESS|FAILED"
        datetime createdAt
    }
    
    ORDER_STATUS_HISTORY {
        string id PK
        string orderId FK
        string oldStatus
        string newStatus
        string changedById FK
        datetime changedAt
    }
```

## Enums

### Role
- `CUSTOMER`
- `ADMIN`

### OrderStatus
- `PENDING` - Order created, waiting for payment
- `RECEIVED` - Payment successful, order received
- `PREPARING` - Kitchen preparing the order
- `READY` - Order ready for pickup/delivery
- `COMPLETED` - Order delivered/completed
- `CANCELLED` - Order cancelled
- `PAYMENT_FAILED` - Payment failed

### PaymentStatus
- `PENDING`
- `SUCCESS`
- `FAILED`

### CustomizationType
- `SIZE` - Size options (e.g., Small, Medium, Large)
- `ADDON` - Additional toppings/extras
- `TEXT` - Custom text input (e.g., special instructions)

## Indexes

| Table | Index Columns |
|-------|---------------|
| users | email (unique) |
| categories | slug (unique) |
| menu_items | categoryId, slug (unique) |
| cart_items | userId, sessionId |
| orders | userId, status, createdAt |
| payments | orderId (unique), razorpayPaymentId (unique) |

## Generated From

This ER diagram is generated from the Prisma schema located at:
`packages/db/prisma/schema.prisma`
