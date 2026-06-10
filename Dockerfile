# =============================================================
# Stage 1: Install semua deps (termasuk devDeps untuk build)
# =============================================================
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# =============================================================
# Stage 2: Install hanya production deps (paralel dengan builder)
# =============================================================
FROM node:20-alpine AS deps-prod
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# =============================================================
# Stage 3: Build Next.js frontend (standalone output)
# =============================================================
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* harus tersedia saat build (di-embed ke JS bundle)
ARG NEXT_PUBLIC_API_URL=/api
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN npm run build

# Pastikan public/ ada (meski kosong) agar COPY tidak gagal
RUN mkdir -p public

# =============================================================
# Stage 4: Production image (backend Express + frontend Next.js)
# =============================================================
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy production node_modules dari stage 2 (tanpa npm install ulang)
COPY --from=deps-prod /app/node_modules ./node_modules

# Copy backend source code (Express server, migration, config)
COPY server/ ./server/
COPY migrate.js ./
COPY docker-entrypoint.sh ./
COPY .env.example ./

# Copy Next.js config dan package.json (dibutuhkan next start)
COPY next.config.js ./
COPY package.json ./

# Copy Next.js full build output (bukan standalone)
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# Fix CRLF -> LF (file dibuat di Windows) agar bisa dijalankan di Alpine Linux
RUN sed -i 's/\r$//' docker-entrypoint.sh && chmod +x docker-entrypoint.sh

EXPOSE 3000 5000

# Default: jalankan backend (entrypoint = migrasi + Express server)
CMD ["sh", "docker-entrypoint.sh"]
