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
│   ├── backend/          # NestJS API (Port 3000)
│   │   └── Dockerfile    # Multi-stage Docker build
│   ├── customer/         # Next.js Customer App (Port 3001)
│   │   └── Dockerfile    # Multi-stage Docker build
│   └── admin/            # Next.js Admin Dashboard (Port 3002)
│       └── Dockerfile    # Multi-stage Docker build
├── packages/
│   ├── db/              # Prisma schema & seed data
│   └── types/            # Shared TypeScript types
├── docker-compose.yml            # Development Docker setup
├── docker-compose.prod.yml      # Production Docker setup
└── Makefile                      # Docker convenience commands
```

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Docker Desktop | 4.0+ | [docker.com/get-started](https://www.docker.com/get-started/) |
| pnpm | 9+ | `npm install -g pnpm@9` |

## First-Time Setup

### 1. Clone and Configure

```bash
git clone https://github.com/HomendraPatil/restaurant-ordering
cd restaurant-ordering
```

### 2. Start Services with Database Setup

**Using pnpm (recommended - works on all platforms):**

```bash
# For development (with hot-reload)
pnpm docker:setup:dev

# For production (optimized builds)
pnpm docker:setup
```

**Using Make (Linux/macOS only):**

```bash
# For development
make setup-dev

# For production
make setup
```

**Or using Docker Compose directly:**

```bash
# Development
docker-compose build && docker-compose up -d && sleep 15 && docker exec restaurant-backend sh -c "cd /app/packages/db && pnpm exec prisma db push && pnpm exec prisma db seed"

# Production
docker-compose -f docker-compose.yml -f docker-compose.prod.yml build && docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d && sleep 15 && docker exec restaurant-backend sh -c "cd /app/packages/db && pnpm exec prisma db push && pnpm exec prisma db seed"
```

### 3. Verify Setup

```bash
docker ps
```

Expected output:

```
CONTAINER ID   IMAGE                            PORTS
...            restaurant-ordering-backend       0.0.0.0:3000->3000/tcp
...            restaurant-ordering-customer      0.0.0.0:3001->3001/tcp
...            restaurant-ordering-admin         0.0.0.0:3002->3002/tcp
...            postgres:16-alpine                 0.0.0.0:5432->5432/tcp
...            redis:7-alpine                   0.0.0.0:6379->6379/tcp
...            minio/minio                      0.0.0.0:9000-9001->9000-9001/tcp
```

Check backend logs to confirm migrations and seeding completed:

```bash
docker logs restaurant-backend
```

Look for:
- `✔ Applied all migrations`
- `🌱 Database seeded successfully`

## Quick Commands

| Task | pnpm Command | Docker Compose Command | Make Command |
|------|-------------|------------------------|--------------|
| **First-time setup (dev)** | `pnpm docker:setup:dev` | `docker-compose build && docker-compose up -d && ...` | `make setup-dev` |
| **First-time setup (prod)** | `pnpm docker:setup` | `docker-compose -f docker-compose.yml -f docker-compose.prod.yml build && ...` | `make setup` |
| Start dev | `pnpm docker:start` | `docker-compose up -d` | `make docker-up` |
| Start prod | `pnpm docker:start:prod` | `docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d` | `make docker-prod-up` |
| Stop | `pnpm docker:stop` | `docker-compose down` | `make docker-down` |
| View logs | `pnpm docker:logs` | `docker-compose logs -f` | `make docker-logs` |
| View backend logs | `pnpm docker:logs:backend` | `docker-compose logs -f restaurant-backend` | - |
| Show containers | `pnpm docker:ps` | `docker-compose ps` | `make docker-ps` |
| Reset database | `pnpm docker:db:reset` | `docker exec restaurant-backend sh -c "cd /app/packages/db && pnpm exec prisma db push && pnpm exec prisma db seed"` | `make docker-db-reset` |
| Prisma Studio | `pnpm docker:db:studio` | `docker exec -it restaurant-backend sh -c "cd /app/packages/db && pnpm exec prisma studio"` | `make docker-db-studio` |
| Clean everything | `pnpm docker:clean` | `docker-compose down -v --rmi local` | `make docker-clean` |

## Services

| Service | URL |
|---------|-----|
| Customer App | http://localhost:3001 |
| Admin Dashboard | http://localhost:3002 |
| Backend API | http://localhost:3000/api/v1 |
| API Docs (Swagger) | http://localhost:3000/docs |
| MinIO Console | http://localhost:9001 |

## Docker Images & Containers

### Images Built

| Image | Description | Size |
|-------|-------------|------|
| `restaurant-ordering-backend` | NestJS API server | ~277MB |
| `restaurant-ordering-customer` | Next.js customer app | ~1.15GB |
| `restaurant-ordering-admin` | Next.js admin app | ~661MB |

### Container Names

| Container | Port | Description |
|-----------|------|-------------|
| `restaurant-postgres` | 5432 | PostgreSQL database |
| `restaurant-redis` | 6379 | Redis cache |
| `restaurant-minio` | 9000, 9001 | S3-compatible storage |
| `restaurant-backend` | 3000 | NestJS API |
| `restaurant-customer` | 3001 | Customer Next.js app |
| `restaurant-admin` | 3002 | Admin Next.js app |

## pnpm Docker Scripts

> Works on Windows, macOS, and Linux - no Make required.

```bash
# Setup (full automation)
pnpm docker:setup:dev    # First-time setup for development
pnpm docker:setup        # First-time setup for production

# Start/Stop
pnpm docker:start        # Start containers (no build)
pnpm docker:start:prod   # Start production containers
pnpm docker:stop         # Stop containers
pnpm docker:restart      # Restart containers
pnpm docker:clean        # Remove everything (volumes + images)

# Logs & Status
pnpm docker:logs         # View all logs
pnpm docker:logs:backend # View backend logs only
pnpm docker:ps           # Show running containers

# Database
pnpm docker:db:push      # Push Prisma schema
pnpm docker:db:seed       # Seed database
pnpm docker:db:reset      # Reset database (push + seed)
pnpm docker:db:studio     # Open Prisma Studio
```

## Make Commands

> For Linux and macOS only.

```bash
# General
make help              # Show all available commands
make setup             # First-time setup (build + start + migrate + seed) - PRODUCTION
make setup-dev         # First-time setup (build + start + migrate + seed) - DEVELOPMENT

# Development
make docker-build          # Build all Docker images for development
make docker-up            # Start all services for development
make docker-down          # Stop all services
make docker-logs          # Show logs from all services
make docker-restart       # Restart all services
make docker-clean         # Clean up Docker resources (volumes, containers, images)

# Production
make docker-prod-build    # Build all Docker images for production
make docker-prod-up       # Start all services for production
make docker-prod-down     # Stop all production services
make docker-prod-logs     # Show logs from production services
make docker-prod-restart  # Restart all production services

# Database
make docker-db-migrate    # Push schema to database
make docker-db-push      # Push schema to database (same as migrate)
make docker-db-seed       # Seed database with sample data
make docker-db-reset      # Reset database and re-seed
make docker-db-studio     # Open Prisma Studio

# Utilities
make docker-ps               # Show running containers
make docker-shell-backend    # Open shell in backend container
make docker-shell-customer   # Open shell in customer container
make docker-shell-admin      # Open shell in admin container
make docker-volumes          # List Docker volumes
make docker-network-inspect  # Inspect the Docker network
```

## Windows Support

Make commands don't work natively on Windows. Use Docker Compose commands directly:

```bash
# Development
docker-compose up -d
docker-compose logs -f
docker-compose down

# Production
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Rebuild without cache
docker-compose build --no-cache && docker-compose up -d

# Clean start
docker-compose down -v && docker-compose up -d

# View logs
docker-compose logs -f restaurant-backend
docker-compose logs -f restaurant-customer
docker-compose logs -f restaurant-admin
```

### Install Make on Windows (Optional)

If you prefer Make commands:
- **Chocolatey**: `choco install make`
- **Scoop**: `scoop install make`
- **WSL**: Use Windows Subsystem for Linux
- **Git Bash**: Make comes with Git for Windows

## Database Commands

```bash
# Push schema to database (creates/updates tables)
make docker-db-migrate

# Seed database with sample data
make docker-db-seed

# Reset database (delete all data and re-seed)
make docker-db-reset

# Open Prisma Studio
make docker-db-studio
```

### Windows Database Commands

```bash
# Push schema
docker exec restaurant-backend sh -c "cd /app/packages/db && pnpm exec prisma db push"

# Seed database
docker exec restaurant-backend sh -c "cd /app/packages/db && pnpm exec prisma db seed"

# Reset database
docker exec restaurant-backend sh -c "cd /app/packages/db && pnpm exec prisma db push && pnpm exec prisma db seed"
```

## Test Credentials

- **Admin**: admin@restaurant.com / admin123
- **Customer**: customer@test.com / customer123

## Environment Variables

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/restaurant

# Redis
REDIS_URL=redis://redis:6379

# JWT
JWT_ACCESS_SECRET=your-access-secret
JWT_REFRESH_SECRET=your-refresh-secret

# S3/MinIO
S3_ENDPOINT=http://minio:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=restaurant-images

# URLs
CUSTOMER_APP_URL=http://localhost:3001
ADMIN_APP_URL=http://localhost:3002
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

## Troubleshooting

### Ports Already in Use

```bash
lsof -i :3000
lsof -i :3001
lsof -i :5432
```

### Container Won't Start

```bash
docker logs restaurant-backend
docker logs restaurant-customer
docker logs restaurant-admin
```

### Database Connection Issues

```bash
docker-compose ps postgres
docker-compose restart postgres
docker-compose exec restaurant-backend npx prisma migrate deploy
```

### Clean Start

```bash
docker-compose down -v
docker-compose up -d
docker-compose exec restaurant-backend npx prisma migrate deploy
docker-compose exec restaurant-backend npx prisma db seed
```

## Production Deployment

1. Update secrets in `.env`:
   - `JWT_ACCESS_SECRET`
   - `JWT_REFRESH_SECRET`
   - `RAZORPAY_KEY_SECRET`

2. Replace MinIO with AWS S3 or equivalent managed storage

3. Deploy:
   ```bash
   docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
   ```

## License

MIT
