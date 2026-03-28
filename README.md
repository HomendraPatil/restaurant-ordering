# Restaurant Ordering System

A full-stack restaurant ordering platform with real-time order tracking.

## Tech Stack

- **Frontend**: Next.js 16 + React 19 + React Compiler
- **Backend**: NestJS 11
- **Database**: PostgreSQL + Prisma
- **Cache**: Redis
- **Storage**: S3/MinIO
- **Monorepo**: Turborepo + pnpm

## Project Structure

```
restaurant-ordering/
├── apps/
│   ├── backend/          # NestJS API (Controllers → Services → Repositories)
│   ├── customer/        # Next.js Customer App (Port 3001)
│   └── admin/           # Next.js Admin Dashboard (Port 3002)
├── packages/
│   ├── config/          # ESLint, Prettier configs
│   ├── db/             # Prisma schema & seed data
│   └── types/          # Shared TypeScript types
├── docker-compose.yml    # PostgreSQL, Redis, MinIO
└── turbo.json          # Turborepo config
```

## Getting Started

### 1. Start Infrastructure

```bash
docker-compose up -d
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Set Up Environment

```bash
cp .env.example .env
```

Edit `.env` with your configuration (see Environment Variables section below).

### 4. Generate Prisma Client

```bash
pnpm db:generate
```

### 5. Run Migrations

```bash
pnpm db:migrate
```

### 6. Seed Database

```bash
pnpm db:seed
```

### 7. Start Development

```bash
pnpm dev
```

## Services

| Service | URL |
|---------|-----|
| Customer App | http://localhost:3001 |
| Admin App | http://localhost:3002 |
| Backend API | http://localhost:3000/api/v1 |
| API Docs | http://localhost:3000/docs |
| Prisma Studio | npx prisma studio |
| MinIO Console | http://localhost:9001 |
| PostgreSQL | localhost:5432 |
| Redis | localhost:6379 |

## Test Credentials

- **Admin**: admin@restaurant.com / admin123
- **Customer**: customer@test.com / customer123

## Environment Variables

### Backend (.env)

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/restaurant?schema=public"

# JWT
JWT_ACCESS_SECRET="your-access-secret-key"
JWT_ACCESS_EXPIRY="7d"
JWT_REFRESH_SECRET="your-refresh-secret-key"
JWT_REFRESH_EXPIRY="30d"

# Razorpay (Payment)
RAZORPAY_KEY_ID="your-razorpay-key-id"
RAZORPAY_KEY_SECRET="your-razorpay-key-secret"

# MinIO (File Storage)
MINIO_ENDPOINT="localhost"
MINIO_PORT=9000
MINIO_ACCESS_KEY="minioadmin"
MINIO_SECRET_KEY="minioadmin"
MINIO_BUCKET="restaurant"

# Redis
REDIS_HOST="localhost"
REDIS_PORT=6379
```

### Customer App (.env.local)

```env
NEXT_PUBLIC_API_URL="http://localhost:3000/api/v1"
```

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /auth/register | Register new user |
| POST | /auth/login | Login user |
| POST | /auth/refresh | Refresh access token |
| POST | /auth/logout | Logout user |

### Menu
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /menu | Get all menu items |
| GET | /menu/:id | Get menu item by ID |
| GET | /categories | Get all categories |

### Cart
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /cart | Get user cart |
| POST | /cart/items | Add item to cart |
| PATCH | /cart/items/:id | Update cart item |
| DELETE | /cart/items/:id | Remove item from cart |
| DELETE | /cart | Clear cart |
| POST | /cart/merge | Merge guest cart on login |

### Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /orders | Create new order |
| GET | /orders/my-orders | Get user orders |
| GET | /orders/:id | Get order by ID |
| PATCH | /orders/:id/status | Update order status |

### Payment
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /payments/create/:orderId | Create Razorpay order |
| POST | /payments/verify | Verify payment |

### User
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /users/me | Get current user |
| GET | /users/addresses | Get user addresses |
| POST | /users/addresses | Add new address |
| DELETE | /users/addresses/:id | Delete address |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /admin/orders | Get all orders |
| PATCH | /admin/orders/:id/status | Update order status |
| GET | /admin/menu | Get all menu items |
| POST | /admin/menu | Create menu item |
| PATCH | /admin/menu/:id | Update menu item |
| DELETE | /admin/menu/:id | Delete menu item |

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Health check endpoint |

## Architecture

Backend follows **layered architecture**:
```
Controllers → Services → Repositories → Prisma
```

### Modules
- **AuthModule**: JWT authentication, login, register
- **UserModule**: User profile, addresses
- **CategoryModule**: Food categories
- **MenuModule**: Menu items, customizations
- **CartModule**: Shopping cart, merge on login
- **OrderModule**: Order creation, status updates
- **PaymentModule**: Razorpay integration
- **AdminModule**: Admin dashboard operations
- **UploadModule**: Image uploads via MinIO
- **EventsModule**: WebSocket gateway for real-time updates

## Key Features

- JWT Authentication with role-based access (CUSTOMER, ADMIN)
- UUID for all database IDs
- Real-time order tracking via WebSockets
- Image upload via S3/MinIO presigned URLs
- Comprehensive seed data with Unsplash images
- Stock management with race condition protection
- Pending order timeout (15 minutes)
- Price change detection with user confirmation

## Database Schema

### Core Entities
- **User**: Customers and admins
- **Address**: Delivery addresses
- **Category**: Food categories
- **MenuItem**: Menu items with customizations
- **CartItem**: Shopping cart items
- **Order**: Customer orders
- **OrderItem**: Individual items in orders
- **Payment**: Payment records
- **OrderStatusHistory**: Order status change log

## Development Commands

```bash
# Build all packages
pnpm build

# Start all services
pnpm dev

# Run tests
pnpm test

# Run linter
pnpm lint

# TypeScript check
pnpm typecheck

# Database commands
pnpm db:migrate      # Run migrations
pnpm db:push         # Push schema to DB
pnpm db:seed         # Seed database
pnpm db:studio       # Open Prisma Studio
pnpm db:generate     # Generate Prisma client
```

## Slices

1. **Foundation** - Monorepo, DB, Auth, Seed Data
2. **Menu Browsing** - Categories, Items, Filters
3. **Cart + Customizations** - Sizes, Add-ons, Merge
4. **Order Placement** - Address, Order Creation
5. **Payment** - Razorpay Integration
6. **Real-time Tracking** - WebSockets
7. **Admin Order Management**
8. **Admin Menu Management**
9. **Edge Cases** - Stock, Sessions, Stale Data
10. **Documentation & Polish**

## Production Build

### Customer App
```bash
pnpm --filter @restaurant/customer build
```

### Backend
```bash
pnpm --filter @restaurant/backend build
```

## License

MIT
