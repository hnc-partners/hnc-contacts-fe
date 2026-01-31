# ============================================
# Contacts Frontend - Production Dockerfile
# ============================================
# Uses pre-built dist folder (build locally or in CI with pnpm build)
# This pattern avoids requiring GitHub token at image build time
# ============================================

FROM docker.io/library/nginx:alpine AS runner

# Copy pre-built dist (built locally or in CI)
COPY dist /usr/share/nginx/html

# Copy nginx config template (uses envsubst for PORT)
COPY nginx.conf /etc/nginx/templates/default.conf.template

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:${PORT:-80}/ || exit 1

EXPOSE ${PORT:-80}

# nginx:alpine uses docker-entrypoint which auto-runs envsubst on templates
CMD ["nginx", "-g", "daemon off;"]
