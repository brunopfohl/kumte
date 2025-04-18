FROM node:20-alpine as builder

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package files and install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev

# Copy built app from builder stage
COPY --from=builder /app/dist ./dist
COPY .env ./

# Expose the port
EXPOSE 3000

# Start the application
CMD ["node", "dist/index.js"] 