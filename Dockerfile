# Stage 1: Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force
COPY . .
RUN npm run build

# Stage 2: Production serve stage via Nginx (hardened)
FROM nginx:1.31-alpine

# Remove default nginx config and artifacts
RUN rm -f /etc/nginx/conf.d/default.conf && \
    rm -rf /usr/share/nginx/html/* && \
    rm -f /etc/nginx/nginx.conf

# Create non-root user for security
RUN addgroup -g 1001 -S appgroup && \
    adduser -S -u 1001 -G appgroup appuser

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Set proper permissions
RUN chown -R appuser:appgroup /usr/share/nginx/html && \
    chown -R appuser:appgroup /var/cache/nginx && \
    chown -R appuser:appgroup /var/log/nginx && \
    chown -R appuser:appgroup /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown -R appuser:appgroup /var/run/nginx.pid

# Drop root and switch to non-root user
USER appuser

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
