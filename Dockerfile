# Build stage
FROM node:22-alpine AS builder

# Install pnpm and required build tools
RUN corepack enable && corepack prepare pnpm@latest --activate
RUN apk add --no-cache openssl

WORKDIR /app

# Copy package files first for better caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/web/package.json ./apps/web/
COPY apps/web/scripts ./apps/web/scripts
COPY apps/api/package.json ./apps/api/
COPY packages/ui/package.json ./packages/ui/
COPY packages/types/package.json ./packages/types/
COPY packages/utils/package.json ./packages/utils/
COPY packages/config/package.json ./packages/config/
COPY packages/erp-entities/package.json ./packages/erp-entities/
COPY packages/domains/package.json ./packages/domains/
COPY packages/api-client/package.json ./packages/api-client/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build arguments for environment variables needed at build time
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_APP_URL
ARG DATABASE_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV DATABASE_URL=$DATABASE_URL

# Generate Prisma client
RUN cd apps/api && npx prisma generate

# Build all packages
RUN pnpm turbo run build

# Production stage
FROM node:22-alpine AS runner

RUN apk add --no-cache openssl

WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME="0.0.0.0"

# Copy built web application (standalone)
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public

# Copy built API application
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/
COPY --from=builder /app/node_modules ./node_modules

# Copy prisma schema for migrations
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma

# Create startup script
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'cd /app/apps/api && node dist/main.js &' >> /app/start.sh && \
    echo 'cd /app && node apps/web/server.js' >> /app/start.sh && \
    chmod +x /app/start.sh

EXPOSE 3000 3002

CMD ["/bin/sh", "/app/start.sh"]
