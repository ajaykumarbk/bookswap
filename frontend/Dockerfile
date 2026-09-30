# Multi-stage Dockerfile for BookSwap Frontend

# ----------------------------
# Base Stage
# ----------------------------
FROM node:20-alpine AS base
WORKDIR /app

# Copy dependency specifications
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Expose Vite dev server port
EXPOSE 5173

# ----------------------------
# Development Target (HMR Enabled)
# ----------------------------
FROM base AS development
ENV NODE_ENV=development
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# ----------------------------
# Production Build Stage
# ----------------------------
FROM base AS build
RUN npm run build

# ----------------------------
# Production Target (Nginx)
# ----------------------------
FROM nginx:alpine AS production
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
