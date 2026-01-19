# Backend Dockerfile
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install Python and build dependencies
RUN apk add --no-cache python3 py3-pip

# Copy package files
COPY package*.json ./

# Install Node.js dependencies
RUN npm ci --only=production

# Copy application files
COPY . .

# Create necessary directories
RUN mkdir -p uploads data/generated data/styles

# Expose port
EXPOSE 5000

# Set environment to production
ENV NODE_ENV=production

# Start the application
CMD ["node", "server.js"]
