# --------- Build Stage ---------
# FROM node:20-alpine AS build
# WORKDIR /app

# COPY package*.json ./
# # IMPORTANT: build needs devDependencies, and peer deps are conflicting
# RUN npm ci --legacy-peer-deps

# COPY . .
# # If you have prod config:
# RUN npm run build -- --configuration=production

# # --------- Runtime Stage ---------
# FROM nginx:alpine

# # (Optional but good) SPA nginx config
# # COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf

# # Adjust dist path if your Angular outputs into a subfolder
# COPY --from=build /app/dist/ /usr/share/nginx/html/

# EXPOSE 8081
# CMD ["nginx","-g","daemon off;"]


# Simple Dockerfile to run Angular development server

FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json yarn.lock ./

# Install dependencies using yarn (which handles the dependencies better)
RUN yarn install

# Copy source code
COPY . .

# Expose port 4200 (Angular dev server default)
EXPOSE 4200

# Start the development server on all interfaces
CMD ["yarn", "start", "--host", "0.0.0.0"]