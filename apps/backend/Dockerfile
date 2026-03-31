# ============================================
# Backend Dockerfile - Multi-stage Build
# ============================================

# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat python3 make g++ openssl
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages ./packages

RUN npm install -g pnpm@9 && pnpm install --frozen-lockfile

# Stage 2: Builder (for production artifacts)
FROM node:20-alpine AS builder
WORKDIR /app

RUN apk add --no-cache libc6-compat python3 make g++ openssl

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages ./packages
COPY apps/backend ./apps/backend

RUN npm install -g pnpm@9 && \
    pnpm install --frozen-lockfile && \
    cd packages/db && npx prisma generate && cd ../.. && \
    npx tsc -p apps/backend/tsconfig.build.json

# Stage 3: Development (with hot-reload)
FROM node:20-alpine AS development
WORKDIR /app

RUN apk add --no-cache libc6-compat python3 make g++ openssl dumb-init

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages ./packages
COPY apps/backend ./apps/backend

RUN npm install -g pnpm@9 && pnpm install --frozen-lockfile

WORKDIR /app/apps/backend

EXPOSE 3000

ENTRYPOINT ["dumb-init", "--"]
CMD ["sh", "-c", "cd /app/packages/db && pnpm exec prisma generate && pnpm --filter @restaurant/backend dev"]

# Stage 4: Production
FROM node:20-alpine AS production
WORKDIR /app

ENV NODE_ENV=production

RUN apk add --no-cache libc6-compat openssl python3 make g++

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages ./packages
COPY apps/backend ./apps/backend

RUN npm install -g pnpm@9 && \
    npm install -g ts-node@10.9.2 @types/node@22 @types/bcrypt && \
    pnpm install --frozen-lockfile --prod && \
    cd packages/db && pnpm exec prisma generate

COPY --from=builder /app/apps/backend/dist ./apps/backend/dist

RUN chown -R nestjs:nodejs /app

USER nestjs

WORKDIR /app/apps/backend

EXPOSE 3000

CMD ["sh", "-c", "cd /app/packages/db && pnpm exec prisma migrate deploy && node /app/apps/backend/dist/main"]
