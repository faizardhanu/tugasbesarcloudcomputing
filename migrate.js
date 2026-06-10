const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  multipleStatements: true
};

async function createTables(connection) {
  // Users table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role ENUM('user', 'staff', 'admin') DEFAULT 'user',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  // Hotels table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS hotels (
      id INT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(255) NOT NULL,
      location VARCHAR(255) NOT NULL,
      rating DECIMAL(2,1) DEFAULT 0.0,
      image TEXT,
      images TEXT,
      price_per_night DECIMAL(10,2) NOT NULL,
      description TEXT,
      amenities TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  // Room types table (depends on hotels)
  await connection.query(`
    CREATE TABLE IF NOT EXISTS room_types (
      id INT PRIMARY KEY AUTO_INCREMENT,
      hotel_id INT NOT NULL,
      name VARCHAR(255) NOT NULL,
      base_type ENUM('Standard', 'Deluxe', 'Suite', 'Villa') NOT NULL,
      price DECIMAL(10,2) NOT NULL,
      capacity INT NOT NULL,
      beds INT NOT NULL,
      image TEXT,
      description TEXT,
      amenities TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE,
      UNIQUE KEY unique_room_type_per_hotel (hotel_id, name)
    )
  `);

  // Rooms table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS rooms (
      id INT PRIMARY KEY AUTO_INCREMENT,
      hotel_id INT NOT NULL,
      room_type_id INT,
      room_number VARCHAR(50) NOT NULL,
      name VARCHAR(255) NOT NULL,
      type ENUM('Standard', 'Deluxe', 'Suite', 'Villa') NOT NULL,
      price DECIMAL(10,2) NOT NULL,
      capacity INT NOT NULL,
      beds INT NOT NULL,
      image TEXT,
      description TEXT,
      amenities TEXT,
      available BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE,
      FOREIGN KEY (room_type_id) REFERENCES room_types(id) ON DELETE SET NULL,
      UNIQUE KEY unique_room_per_hotel (hotel_id, room_number)
    )
  `);

  // Bookings table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS bookings (
      id INT PRIMARY KEY AUTO_INCREMENT,
      user_id INT,
      room_id INT NOT NULL,
      hotel_id INT NOT NULL,
      guest_name VARCHAR(255) NOT NULL,
      guest_email VARCHAR(255) NOT NULL,
      guest_phone VARCHAR(50) NOT NULL,
      check_in DATE NOT NULL,
      check_out DATE NOT NULL,
      guests INT NOT NULL,
      total_price DECIMAL(10,2) NOT NULL,
      status ENUM('confirmed', 'cancelled', 'reschedule_pending', 'rescheduled', 'completed') DEFAULT 'confirmed',
      special_requests TEXT,
      cancelled_at TIMESTAMP NULL,
      rescheduled_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
      FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE
    )
  `);

  // Reschedule requests table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS reschedule_requests (
      id INT PRIMARY KEY AUTO_INCREMENT,
      booking_id INT NOT NULL,
      original_check_in DATE NOT NULL,
      original_check_out DATE NOT NULL,
      new_check_in DATE NOT NULL,
      new_check_out DATE NOT NULL,
      reason TEXT NOT NULL,
      status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
      requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      reviewed_at TIMESTAMP NULL,
      reviewed_by VARCHAR(255),
      review_notes TEXT,
      FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
    )
  `);
}

async function insertSampleData(connection) {
  // Insert sample users with hashed passwords
  const saltRounds = 10;
  const staffHash = await bcrypt.hash('staff123', saltRounds);
  const userHash  = await bcrypt.hash('user123',  saltRounds);
  const adminHash = await bcrypt.hash('admin123', saltRounds);

  const sampleUsers = [
    ['Hotel Staff', 'staff@hotel.com', staffHash, 'staff'],
    ['Regular User', 'user@hotel.com',  userHash,  'user'],
    ['Admin User',  'admin@hotel.com', adminHash, 'admin'],
  ];

  for (const [name, email, password, role] of sampleUsers) {
    await connection.execute(
      'INSERT IGNORE INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, password, role]
    );
  }

  // Insert sample hotels (using JSON strings for MariaDB compatibility)
  const hotels = [
    {
      name: 'Grand HoTel-U Jakarta',
      location: 'Jakarta Pusat',
      rating: 4.8,
      image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
        'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800',
        'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800',
        'https://images.unsplash.com/photo-1517840901100-8179e982acb7?w=800',
        'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800'
      ]),
      price_per_night: 850000,
      description: 'Hotel mewah di pusat kota Jakarta dengan fasilitas lengkap dan pemandangan kota yang menakjubkan.',
      amenities: JSON.stringify(['WiFi', 'Coffee', 'TV', 'AC', 'Pool', 'Gym', 'Restaurant', 'Parking'])
    },
    {
      name: 'HoTel-U Bali Beach',
      location: 'Seminyak, Bali',
      rating: 4.9,
      image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800',
        'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800',
        'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800',
        'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800',
        'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800'
      ]),
      price_per_night: 1200000,
      description: 'Resort tepi pantai dengan pemandangan sunset yang indah dan akses langsung ke pantai.',
      amenities: JSON.stringify(['WiFi', 'Coffee', 'TV', 'AC', 'Beach Access', 'Spa', 'Restaurant', 'Bar'])
    },
    {
      name: 'HoTel-U Bandung Hills',
      location: 'Lembang, Bandung',
      rating: 4.7,
      image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800',
        'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=800',
        'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800',
        'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800',
        'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800'
      ]),
      price_per_night: 650000,
      description: 'Hotel di pegunungan dengan udara sejuk dan pemandangan alam yang asri.',
      amenities: JSON.stringify(['WiFi', 'Coffee', 'TV', 'AC', 'Garden', 'Restaurant', 'Parking'])
    },
    {
      name: 'HoTel-U Surabaya',
      location: 'Surabaya',
      rating: 4.6,
      image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800',
        'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800',
        'https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=800',
        'https://images.unsplash.com/photo-1517840901100-8179e982acb7?w=800',
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800'
      ]),
      price_per_night: 750000,
      description: 'Hotel bisnis modern dengan fasilitas meeting room dan dekat dengan pusat bisnis.',
      amenities: JSON.stringify(['WiFi', 'Coffee', 'TV', 'AC', 'Meeting Room', 'Gym', 'Restaurant'])
    },
    {
      name: 'HoTel-U Yogyakarta',
      location: 'Malioboro, Yogyakarta',
      rating: 4.8,
      image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800',
        'https://images.unsplash.com/photo-1596436889106-be35e843f974?w=800',
        'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800',
        'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800',
        'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=800'
      ]),
      price_per_night: 550000,
      description: 'Hotel dengan nuansa tradisional Jawa di jantung kota Yogyakarta.',
      amenities: JSON.stringify(['WiFi', 'Coffee', 'TV', 'AC', 'Traditional Spa', 'Restaurant', 'Parking'])
    },
    {
      name: 'HoTel-U Lombok Paradise',
      location: 'Senggigi, Lombok',
      rating: 4.9,
      image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800',
        'https://images.unsplash.com/photo-1602002418082-a4443e081dd1?w=800',
        'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800',
        'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800',
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800'
      ]),
      price_per_night: 950000,
      description: 'Resort eksklusif dengan private beach dan pemandangan laut yang memukau.',
      amenities: JSON.stringify(['WiFi', 'Coffee', 'TV', 'AC', 'Private Beach', 'Spa', 'Restaurant', 'Water Sports'])
    }
  ];

  for (const hotel of hotels) {
    await connection.execute(`
      INSERT IGNORE INTO hotels (name, location, rating, image, images, price_per_night, description, amenities)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [hotel.name, hotel.location, hotel.rating, hotel.image, hotel.images, hotel.price_per_night, hotel.description, hotel.amenities]);
  }

  // Insert sample rooms and room types
  const rooms = [
    // Hotel 1 - Grand HoTel-U Jakarta
    { hotel_id: 1, room_number: '101', name: 'Standard Room 101', type: 'Standard', price: 650000, capacity: 2, beds: 1, image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800', description: 'Kamar standard yang nyaman dengan fasilitas lengkap.', amenities: JSON.stringify(['WiFi', 'TV', 'AC', 'Mini Bar']), available: true },
    { hotel_id: 1, room_number: '102', name: 'Standard Room 102', type: 'Standard', price: 650000, capacity: 2, beds: 1, image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800', description: 'Kamar standard yang nyaman dengan fasilitas lengkap.', amenities: JSON.stringify(['WiFi', 'TV', 'AC', 'Mini Bar']), available: true },
    { hotel_id: 1, room_number: '201', name: 'Deluxe Room 201', type: 'Deluxe', price: 850000, capacity: 2, beds: 1, image: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800', description: 'Kamar deluxe dengan pemandangan kota dan fasilitas modern.', amenities: JSON.stringify(['WiFi', 'TV', 'AC', 'Mini Bar', 'Safe Box']), available: true },
    { hotel_id: 1, room_number: '301', name: 'Executive Suite 301', type: 'Suite', price: 1500000, capacity: 4, beds: 2, image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800', description: 'Suite mewah dengan ruang tamu terpisah dan pemandangan panorama kota.', amenities: JSON.stringify(['WiFi', 'TV', 'AC', 'Mini Bar', 'Safe Box', 'Living Room', 'Bathtub']), available: true },
    
    // Hotel 2 - HoTel-U Bali Beach
    { hotel_id: 2, room_number: '101', name: 'Beachfront Room 101', type: 'Deluxe', price: 1200000, capacity: 2, beds: 1, image: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800', description: 'Kamar dengan akses langsung ke pantai dan balkon pribadi.', amenities: JSON.stringify(['WiFi', 'TV', 'AC', 'Mini Bar', 'Balcony', 'Beach Access']), available: true },
    { hotel_id: 2, room_number: 'V1', name: 'Ocean View Villa V1', type: 'Villa', price: 2500000, capacity: 4, beds: 2, image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800', description: 'Villa pribadi dengan kolam renang dan pemandangan laut langsung.', amenities: JSON.stringify(['WiFi', 'TV', 'AC', 'Private Pool', 'Kitchen', 'Beach Access']), available: true },
    
    // Hotel 3 - HoTel-U Bandung Hills
    { hotel_id: 3, room_number: '201', name: 'Mountain View Room 201', type: 'Deluxe', price: 650000, capacity: 2, beds: 1, image: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800', description: 'Kamar dengan pemandangan pegunungan yang indah.', amenities: JSON.stringify(['WiFi', 'TV', 'AC', 'Heater', 'Balcony']), available: true },
    { hotel_id: 3, room_number: '301', name: 'Family Suite 301', type: 'Suite', price: 1100000, capacity: 5, beds: 3, image: 'https://images.unsplash.com/photo-1566195992011-5f6b21e539aa?w=800', description: 'Suite keluarga dengan 2 kamar tidur dan ruang keluarga.', amenities: JSON.stringify(['WiFi', 'TV', 'AC', 'Heater', 'Living Room', 'Kitchen']), available: true },
    
    // Hotel 4 - HoTel-U Surabaya
    { hotel_id: 4, room_number: '401', name: 'Business Room 401', type: 'Deluxe', price: 750000, capacity: 2, beds: 1, image: 'https://images.unsplash.com/photo-1631049552240-59c37f38802b?w=800', description: 'Kamar bisnis dengan meja kerja luas dan WiFi kencang.', amenities: JSON.stringify(['WiFi', 'TV', 'AC', 'Work Desk', 'Mini Bar', 'Safe Box']), available: true },
    { hotel_id: 4, room_number: '501', name: 'Executive Room 501', type: 'Suite', price: 1200000, capacity: 3, beds: 2, image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800', description: 'Kamar eksekutif dengan ruang meeting pribadi.', amenities: JSON.stringify(['WiFi', 'TV', 'AC', 'Work Desk', 'Mini Bar', 'Safe Box', 'Meeting Area', 'Bathtub']), available: true },
    
    // Hotel 5 - HoTel-U Yogyakarta
    { hotel_id: 5, room_number: '101', name: 'Traditional Room 101', type: 'Standard', price: 550000, capacity: 2, beds: 1, image: 'https://images.unsplash.com/photo-1595576508898-0ad5c879a061?w=800', description: 'Kamar dengan dekorasi tradisional Jawa yang kental.', amenities: JSON.stringify(['WiFi', 'TV', 'AC', 'Mini Bar', 'Traditional Decor']), available: true },
    { hotel_id: 5, room_number: '201', name: 'Joglo Suite 201', type: 'Suite', price: 950000, capacity: 4, beds: 2, image: 'https://images.unsplash.com/photo-1596436889106-be35e843f974?w=800', description: 'Suite bergaya rumah joglo dengan taman pribadi.', amenities: JSON.stringify(['WiFi', 'TV', 'AC', 'Mini Bar', 'Traditional Spa', 'Private Garden', 'Bathtub']), available: true },
    
    // Hotel 6 - HoTel-U Lombok Paradise
    { hotel_id: 6, room_number: '101', name: 'Paradise Room 101', type: 'Deluxe', price: 950000, capacity: 2, beds: 1, image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800', description: 'Kamar dengan pemandangan laut dan akses ke pantai.', amenities: JSON.stringify(['WiFi', 'TV', 'AC', 'Mini Bar', 'Balcony', 'Beach Access']), available: true },
    { hotel_id: 6, room_number: 'LV1', name: 'Luxury Villa LV1', type: 'Villa', price: 3500000, capacity: 6, beds: 3, image: 'https://images.unsplash.com/photo-1602002418082-a4443e081dd1?w=800', description: 'Villa mewah dengan private pool, pantai pribadi, dan butler service.', amenities: JSON.stringify(['WiFi', 'TV', 'AC', 'Private Pool', 'Kitchen', 'Private Beach', 'Butler Service', 'Jacuzzi']), available: true }
  ];

  // Derive room types from sample rooms
  const roomTypeMap = new Map();

  for (const room of rooms) {
    const key = `${room.hotel_id}-${room.type}-${room.price}-${room.capacity}-${room.beds}-${room.image}`;

    if (!roomTypeMap.has(key)) {
      const nameParts = room.name.split(' ');
      const baseName = nameParts.length > 1 ? nameParts.slice(0, -1).join(' ') : room.name;

      await connection.execute(`
        INSERT IGNORE INTO room_types (hotel_id, name, base_type, price, capacity, beds, image, description, amenities)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        room.hotel_id,
        baseName,
        room.type,
        room.price,
        room.capacity,
        room.beds,
        room.image,
        room.description,
        room.amenities,
      ]);

      const [rows] = await connection.execute(
        `SELECT id FROM room_types WHERE hotel_id = ? AND name = ? AND base_type = ? AND price = ? AND capacity = ? AND beds = ? AND image = ? LIMIT 1`,
        [
          room.hotel_id,
          baseName,
          room.type,
          room.price,
          room.capacity,
          room.beds,
          room.image,
        ]
      );

      if (rows.length > 0) {
        roomTypeMap.set(key, rows[0].id);
      }
    }
  }

  // Insert rooms with linked room_type_id
  for (const room of rooms) {
    const key = `${room.hotel_id}-${room.type}-${room.price}-${room.capacity}-${room.beds}-${room.image}`;
    const roomTypeId = roomTypeMap.get(key) || null;

    await connection.execute(
      `
      INSERT IGNORE INTO rooms (hotel_id, room_type_id, room_number, name, type, price, capacity, beds, image, description, amenities, available)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        room.hotel_id,
        roomTypeId,
        room.room_number,
        room.name,
        room.type,
        room.price,
        room.capacity,
        room.beds,
        room.image,
        room.description,
        room.amenities,
        room.available,
      ]
    );
  }
}

async function runMigration() {
  let connection;
  
  try {
    console.log('Starting database migration...');
    console.log('Connecting to MySQL server...');
    
    // Connect to MySQL server (without specifying database)
    connection = await mysql.createConnection(dbConfig);
    console.log('Connected to MySQL server successfully');
    
    // Create database first
    const dbName = process.env.DB_NAME || 'hotel_u';
    console.log(`Creating database '${dbName}'...`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    await connection.query(`USE \`${dbName}\``);
    console.log(`Database ${dbName} created/selected`);
    
    // Create tables step by step
    console.log('Creating tables...');
    await createTables(connection);
    console.log('Tables created successfully');
    
    // Insert sample data
    console.log('Inserting sample data...');
    await insertSampleData(connection);
    console.log('Sample data inserted successfully');
    
    // Test connection to the new database
    const [tables] = await connection.execute('SHOW TABLES');
    
    console.log('\nMigration completed successfully!');
    console.log(`Database: ${process.env.DB_NAME || 'hotel_u'}`);
    console.log(`Tables created: ${tables.length}`);
    console.log('Sample hotels and rooms have been added');
    console.log('\nTest users created:');
    console.log('   staff@hotel.com / staff123 (Staff)');
    console.log('   user@hotel.com / user123 (User)');
    console.log('   admin@hotel.com / admin123 (Admin)');
    console.log('\nYou can now run: npm run dev');
    
  } catch (error) {
    console.error('\nMigration failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\nMySQL server is not running. Please:');
      console.log('   1. Install MySQL Server');
      console.log('   2. Start MySQL service');
      console.log('   3. Or install XAMPP and start MySQL from control panel');
      console.log('   4. Make sure MySQL is running on port 3306');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('\nAccess denied. Please check:');
      console.log('   1. MySQL username and password in .env file');
      console.log('   2. Make sure the user has CREATE DATABASE privileges');
      console.log('   3. Try connecting with MySQL Workbench first');
    } else if (error.code === 'ENOTFOUND') {
      console.log('\nCannot find MySQL host. Please check:');
      console.log('   1. DB_HOST in .env file (should be localhost)');
      console.log('   2. MySQL server is installed and running');
    }
    
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
  }
}

// Check if .env file exists
if (!fs.existsSync('.env')) {
  console.log('WARNING: .env file not found. Creating from .env.example...');
  if (fs.existsSync('.env.example')) {
    fs.copyFileSync('.env.example', '.env');
    console.log('.env file created. Please update database credentials if needed.');
  } else {
    console.log('ERROR: .env.example file not found. Please create .env file manually.');
    process.exit(1);
  }
}

// Run the migration
runMigration();
