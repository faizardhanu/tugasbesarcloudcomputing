#!/bin/sh
set -e

echo "⏳ Menunggu MySQL siap di ${DB_HOST}:3306..."

MAX_RETRIES=20
RETRY_COUNT=0

# Coba connect ke MySQL via Node.js (mysql2 sudah terinstall)
until node -e "
const mysql = require('mysql2/promise');
mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  connectTimeout: 3000
}).then(c => { c.end(); process.exit(0); }).catch(() => process.exit(1));
" 2>/dev/null; do
  RETRY_COUNT=$((RETRY_COUNT + 1))
  if [ "$RETRY_COUNT" -ge "$MAX_RETRIES" ]; then
    echo "❌ MySQL tidak bisa dihubungi setelah ${MAX_RETRIES} percobaan. Keluar."
    exit 1
  fi
  echo "  MySQL belum siap, percobaan ke-${RETRY_COUNT}/${MAX_RETRIES}... (retry dalam 3 detik)"
  sleep 3
done

echo "✅ MySQL siap!"
echo "🔄 Menjalankan migrasi database..."
node migrate.js
echo "✅ Migrasi selesai!"
echo "🚀 Menjalankan server Express di port ${PORT:-5000}..."
exec node server/server.js
