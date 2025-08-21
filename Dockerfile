# --------- Build Stage ---------
FROM node:18-alpine AS builder

WORKDIR /app

# Install dependencies (cache-efficient steps)
COPY package*.json ./
RUN npm ci --only=production

# Copy source code & build the app
COPY . .
RUN npm run build

# --------- Runtime Stage ---------
FROM nginx:stable-alpine AS runtime

# Copy built static files from builder
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 8081

CMD ["nginx", "-g", "daemon off;"]
