FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY packages/api-server/package*.json ./
RUN npm ci --only=production

# Copy source
COPY packages/api-server/ ./

# Expose port
EXPOSE 3030

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3030/health || exit 1

# Start server
CMD ["node", "src/index.js"]
