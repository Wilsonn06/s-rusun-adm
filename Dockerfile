# ===========================
# 1) Build Stage
# ===========================
FROM node:18-alpine AS build

WORKDIR /app

# Copy package file saja dulu untuk caching layer
COPY package*.json ./

# Install dependencies (production only)
RUN npm install --production

# Copy source code
COPY . .

# ===========================
# 2) Release Stage
# ===========================
FROM node:18-alpine

WORKDIR /app

# Copy hasil install dari stage build
COPY --from=build /app ./

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

CMD ["node", "app.js"]
