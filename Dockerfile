# Multi-stage Dockerfile for DecorDesign
# This builds both frontend and backend in one container

# Stage 1: Build Frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy frontend package files
COPY frontend/package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy frontend source
COPY frontend/ ./

# Build frontend
RUN npm run build

# Stage 2: Backend Runtime
FROM node:18-alpine

WORKDIR /app

# Install PM2 globally
RUN npm install -g pm2

# Copy backend package files
COPY backend/package*.json ./backend/

# Install backend dependencies
WORKDIR /app/backend
RUN npm ci --only=production

# Copy backend source
COPY backend/ ./

# Copy built frontend from previous stage
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

# Copy PM2 ecosystem file
COPY ecosystem.config.js /app/

# Create logs directory
RUN mkdir -p /app/logs

# Expose port
EXPOSE 3000

WORKDIR /app

# Start with PM2
CMD ["pm2-runtime", "start", "ecosystem.config.js"]
