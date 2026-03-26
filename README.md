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
│   ├── customer/         # Next.js Customer App
│   └── admin/            # Next.js Admin Dashboard
├── packages/
│   ├── config/           # ESLint, Prettier configs
│   ├── db/               # Prisma schema & seed data
│   └── types/            # Shared TypeScript types
├── docker-compose.yml     # PostgreSQL, Redis, MinIO
└── turbo.json            # Turborepo config
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

## Architecture

Backend follows **layered architecture**:
```
Controllers → Services → Repositories → Prisma
```

## Key Features

- JWT Authentication with role-based access (CUSTOMER, ADMIN)
- UUID for all database IDs
- Real-time order tracking via WebSockets
- Image upload via S3/MinIO presigned URLs
- Comprehensive seed data with Unsplash images

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
