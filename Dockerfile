# =============================================================
# Stage 1: Install semua dependencies (termasuk devDeps untuk build)
# =============================================================
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# =============================================================
# Stage 2: Build Next.js frontend
# =============================================================
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* harus tersedia saat build (di-embed ke JS bundle)
ARG NEXT_PUBLIC_API_URL=http://localhost/api
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN npm run build

# =============================================================
# Stage 3: Production image (dipakai backend & frontend)
# =============================================================
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Install hanya production dependencies
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy seluruh source code
COPY . .

# Timpa folder .next dengan hasil build dari stage builder
COPY --from=builder /app/.next ./.next

# Fix CRLF → LF (file dibuat di Windows) agar bisa dijalankan di Alpine Linux
RUN sed -i 's/\r$//' docker-entrypoint.sh && chmod +x docker-entrypoint.sh

EXPOSE 3000 5000
