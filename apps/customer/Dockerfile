# ============================================
# Customer App Dockerfile - Multi-stage Build
# ============================================

# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages ./packages

RUN npm install -g pnpm@9 && pnpm install --frozen-lockfile

# Stage 2: Builder (for production artifacts)
FROM node:20-alpine AS builder
WORKDIR /app

RUN apk add --no-cache libc6-compat python3 make g++

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages ./packages
COPY apps/customer ./apps/customer

ENV NEXT_TELEMETRY_DISABLED=1

RUN npm install -g pnpm@9 && \
    pnpm install --frozen-lockfile && \
    pnpm --filter @restaurant/customer build

# Stage 3: Development (with hot-reload)
FROM node:20-alpine AS development
WORKDIR /app

RUN apk add --no-cache libc6-compat dumb-init

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages ./packages
COPY apps/customer ./apps/customer

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=development

RUN npm install -g pnpm@9 && pnpm install --frozen-lockfile

WORKDIR /app/apps/customer

EXPOSE 3001

ENTRYPOINT ["dumb-init", "--"]
CMD ["pnpm", "dev"]

# Stage 4: Production
FROM node:20-alpine AS production
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN apk add --no-cache dumb-init

RUN addgroup -g 1001 -S nextjs && \
    adduser -S nextjs -u 1001

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages ./packages
COPY apps/customer ./apps/customer

RUN npm install -g pnpm@9 && \
    pnpm install --frozen-lockfile --prod

COPY --from=builder /app/apps/customer/.next/standalone ./
COPY --from=builder /app/apps/customer/.next/static ./.next/static
RUN test -d /app/apps/customer/public && cp -r /app/apps/customer/public ./public || true

RUN chown -R nextjs /app

USER nextjs

EXPOSE 3001

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]
