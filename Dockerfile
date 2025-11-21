# Base image Node.js
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package.json dan package-lock.json (kalau ada) test
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy seluruh source code
COPY . .

# Expose port aplikasi
EXPOSE 3001

# Jalankan aplikasi
CMD ["node", "app.js"]
