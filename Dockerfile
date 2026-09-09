# Multi-stage Dockerfile for Dinenos Cafe Fullstack Platform
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package manifests
COPY package*.json ./
COPY frontend/package*.json ./frontend/
COPY backend/package*.json ./backend/
COPY admin/package*.json ./admin/

# Install all dependencies including devDependencies for build
RUN npm ci

# Copy full source
COPY . .

# Build both Frontend (Storefront) and Admin Portal
RUN npm run build

# --- Runtime Stage ---
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Install production dependencies for backend only
COPY package*.json ./
COPY backend/package*.json ./backend/
RUN npm ci --omit=dev --workspace=backend

# Copy built artifacts from builder stage
COPY --from=builder /app/frontend/dist ./frontend/dist
COPY --from=builder /app/admin/dist ./admin/dist

# Copy backend application code
COPY backend ./backend

# Ensure data directory exists for SQLite database
RUN mkdir -p /app/backend/data

VOLUME ["/app/backend/data"]

EXPOSE 5000

CMD ["npm", "run", "start"]
