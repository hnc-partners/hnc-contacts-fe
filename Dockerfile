# ============================================
# Stage 1: Builder
# ============================================
FROM docker.io/library/node:20-alpine AS builder
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files (no lockfile - pnpm workspace uses root lockfile)
COPY package.json ./

# Install dependencies
RUN pnpm install

# Copy source files
COPY . .

# Build the application
# Set NODE_OPTIONS to handle potential memory/file limits in container builds
ENV NODE_OPTIONS="--max-old-space-size=4096"
RUN pnpm build

# ============================================
# Stage 2: Runner (nginx)
# ============================================
FROM docker.io/library/nginx:alpine AS runner

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx config for SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
