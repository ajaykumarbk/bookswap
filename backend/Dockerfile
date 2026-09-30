# Multi-stage Dockerfile for BookSwap Backend

# ----------------------------
# Base Stage
# ----------------------------
FROM node:20-alpine AS base
WORKDIR /app

# Copy dependency specifications
COPY package*.json ./

# Install all dependencies (including devDependencies for dev/build)
RUN npm install

# Copy source files
COPY . .

# Expose server port
EXPOSE 5000

# ----------------------------
# Development Target (Hot Reloading)
# ----------------------------
FROM base AS development
ENV NODE_ENV=development
CMD ["npm", "run", "dev"]

# ----------------------------
# Production Build Stage
# ----------------------------
FROM base AS build
RUN npm run build

# ----------------------------
# Production Target
# ----------------------------
FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --only=production

COPY --from=build /app/dist ./dist
COPY --from=build /app/data ./data

EXPOSE 5000
CMD ["node", "dist/index.js"]
