# Multi-stage production Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package descriptors
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy full source
COPY tsconfig.json ./
COPY src ./src/

# Generate Prisma client and compile TypeScript
RUN npx prisma generate
RUN npm run build

# Prune development dependencies
RUN npm prune --production

# ----------------- Production Runner Stage -----------------
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Install openssl for Prisma engine runtime
RUN apk add --no-cache openssl

# Copy production runtime files
COPY package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Create directory for local uploads
RUN mkdir -p uploads && chown -R node:node /app

USER node

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

CMD ["node", "dist/server.js"]
