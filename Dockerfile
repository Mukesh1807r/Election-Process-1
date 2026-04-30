# ─── Build Stage ─────────────────────────────────────────────────────────────
FROM node:18-alpine AS build
WORKDIR /app

# Copy manifests first for Docker layer cache efficiency
COPY package*.json ./

# npm ci: deterministic, reproducible installs (no package-lock drift)
RUN npm ci --omit=dev

COPY . .
RUN npm run build

# ─── Production Stage ─────────────────────────────────────────────────────────
FROM nginx:alpine

# Run Nginx as non-root user for container security hardening
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Grant appuser access to required Nginx runtime directories
RUN chown -R appuser:appgroup /var/cache/nginx /var/run /var/log/nginx /usr/share/nginx/html
USER appuser

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
