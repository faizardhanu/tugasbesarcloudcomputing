const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkRooms() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root', 
    password: process.env.DB_PASSWORD || '',
    database: 'hotel_u'
  });
  
  const [rooms] = await connection.execute('SELECT COUNT(*) as total FROM rooms');
  console.log('Total rooms in database:', rooms[0].total);
  
  const [allRooms] = await connection.execute('SELECT id, name, hotel_id FROM rooms ORDER BY id');
  console.log('All rooms:');
  allRooms.forEach(room => console.log(`  ${room.id}: ${room.name} (hotel_id: ${room.hotel_id})`));
  
  await connection.end();
}

checkRooms().catch(console.error);
