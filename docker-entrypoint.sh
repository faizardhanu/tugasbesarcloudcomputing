#!/bin/sh
set -e

echo "⏳ Menunggu MySQL siap di ${DB_HOST}:3306..."

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
  echo "  MySQL belum siap, mencoba ulang dalam 3 detik..."
  sleep 3
done

echo "✅ MySQL siap!"
echo "🔄 Menjalankan migrasi database..."
node migrate.js
echo "✅ Migrasi selesai!"
echo "🚀 Menjalankan server Express..."
exec node server/server.js
