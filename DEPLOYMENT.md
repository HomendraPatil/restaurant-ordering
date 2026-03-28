# Deployment Guide

This guide covers deploying the Restaurant Ordering System to production.

## Prerequisites

- Node.js 20+
- pnpm 9+
- PostgreSQL database
- Redis
- MinIO or S3 bucket
- Razorpay account

## Environment Variables

### Backend

| Variable | Description | Example |
|----------|-------------|---------|
| DATABASE_URL | PostgreSQL connection string | postgresql://user:pass@host:5432/db |
| JWT_ACCESS_SECRET | JWT access token secret | random-256-bit-string |
| JWT_ACCESS_EXPIRY | Access token expiry | 7d |
| JWT_REFRESH_SECRET | JWT refresh token secret | random-256-bit-string |
| JWT_REFRESH_EXPIRY | Refresh token expiry | 30d |
| RAZORPAY_KEY_ID | Razorpay key ID | rzp_xxx |
| RAZORPAY_KEY_SECRET | Razorpay key secret | rzp_xxx |
| MINIO_ENDPOINT | MinIO server | localhost |
| MINIO_PORT | MinIO port | 9000 |
| MINIO_ACCESS_KEY | MinIO access key | minioadmin |
| MINIO_SECRET_KEY | MinIO secret key | minioadmin |
| MINIO_BUCKET | S3 bucket name | restaurant |
| REDIS_HOST | Redis host | localhost |
| REDIS_PORT | Redis port | 6379 |

### Customer App

| Variable | Description | Example |
|----------|-------------|---------|
| NEXT_PUBLIC_API_URL | Backend API URL | https://api.example.com |

## Deployment Options

### Option 1: Docker Compose (Development/Testing)

```bash
# Build and start all services
docker-compose up -d --build
```

### Option 2: Manual Deployment

#### Backend

```bash
# Install dependencies
pnpm install

# Build
pnpm --filter @restaurant/backend build

# Start production
NODE_ENV=production pnpm --filter @restaurant/backend start:prod
```

#### Customer App

```bash
# Install dependencies
pnpm install

# Build
pnpm --filter @restaurant/customer build
```

### Option 3: Cloud Platforms

#### Backend (Render/Railway/DigitalOcean)

1. Connect your GitHub repository
2. Set environment variables
3. Build command: `pnpm install && pnpm --filter @restaurant/backend build`
4. Start command: `node apps/backend/dist/main.js`

#### Customer App (Vercel)

1. Import your repository to Vercel
2. Set environment variables
3. Framework: Next.js
4. Build command: `pnpm --filter @restaurant/customer build`
5. Output directory: `apps/customer/.next`

## Database Setup

```bash
# Run migrations
pnpm db:migrate

# Seed data (optional)
pnpm db:seed
```

## Health Check

Once deployed, verify the health endpoint:

```bash
curl https://your-api.com/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 12345.67
}
```

## SSL/HTTPS

- Use a reverse proxy (nginx, Traefik) for HTTPS
- Or use cloud provider's SSL (AWS CloudFront, Vercel, Render)

## Monitoring

Consider adding:
- Logging (Winston, Pino)
- Error tracking (Sentry)
- Metrics (Prometheus + Grafana)

## Security Checklist

- [ ] Change default JWT secrets
- [ ] Use strong database passwords
- [ ] Enable HTTPS
- [ ] Configure CORS properly for production
- [ ] Set up rate limiting (already included with @nestjs/throttler)
- [ ] Regular security updates
- [ ] Backup database regularly
