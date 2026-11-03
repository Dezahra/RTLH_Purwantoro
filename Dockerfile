# Gunakan image resmi Node.js LTS (Node 22)
FROM node:22-alpine

# Direktori kerja di dalam container
WORKDIR /app

# Salin package.json dan lockfile
COPY package*.json ./

# Install dependensi
RUN npm install

# Salin seluruh source code proyek
COPY . .

# Build frontend Vite (menghasilkan folder dist/)
RUN npm run build

# Expose port backend API
EXPOSE 8000

# Jalankan server
CMD ["node", "server.js"]

