-- Hotel-U Database Schema
-- Create database
CREATE DATABASE IF NOT EXISTS hotel_u;
USE hotel_u;

-- Users table
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('user', 'staff', 'admin') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE hotels (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    rating DECIMAL(2,1) DEFAULT 0.0,
    image TEXT,
    images JSON,
    price_per_night DECIMAL(10,2) NOT NULL,
    description TEXT,
    amenities JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Room types table
CREATE TABLE room_types (
    id INT PRIMARY KEY AUTO_INCREMENT,
    hotel_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    base_type ENUM('Standard', 'Deluxe', 'Suite', 'Villa') NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    capacity INT NOT NULL,
    beds INT NOT NULL,
    image TEXT,
    description TEXT,
    amenities JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE,
    UNIQUE KEY unique_room_type_per_hotel (hotel_id, name)
);

-- Rooms table
CREATE TABLE rooms (
    id INT PRIMARY KEY AUTO_INCREMENT,
    hotel_id INT NOT NULL,
    room_type_id INT NULL,
    room_number VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    type ENUM('Standard', 'Deluxe', 'Suite', 'Villa') NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    capacity INT NOT NULL,
    beds INT NOT NULL,
    image TEXT,
    description TEXT,
    amenities JSON,
    available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE,
    FOREIGN KEY (room_type_id) REFERENCES room_types(id) ON DELETE SET NULL,
    UNIQUE KEY unique_room_per_hotel (hotel_id, room_number)
);

-- Bookings table
CREATE TABLE bookings (
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
);

-- Reschedule requests table
CREATE TABLE reschedule_requests (
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
);

-- Insert sample hotels data
INSERT INTO hotels (name, location, rating, image, images, price_per_night, description, amenities) VALUES
('Grand HoTel-U Jakarta', 'Jakarta Pusat', 4.8, 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800', 
 JSON_ARRAY('https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800', 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800', 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800', 'https://images.unsplash.com/photo-1517840901100-8179e982acb7?w=800', 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800'), 
 850000, 'Hotel mewah di pusat kota Jakarta dengan fasilitas lengkap dan pemandangan kota yang menakjubkan.', 
 JSON_ARRAY('WiFi', 'Coffee', 'TV', 'AC', 'Pool', 'Gym', 'Restaurant', 'Parking')),

('HoTel-U Bali Beach', 'Seminyak, Bali', 4.9, 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800',
 JSON_ARRAY('https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800', 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800', 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800', 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800', 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800'),
 1200000, 'Resort tepi pantai dengan pemandangan sunset yang indah dan akses langsung ke pantai.',
 JSON_ARRAY('WiFi', 'Coffee', 'TV', 'AC', 'Beach Access', 'Spa', 'Restaurant', 'Bar')),

('HoTel-U Bandung Hills', 'Lembang, Bandung', 4.7, 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800',
 JSON_ARRAY('https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800', 'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=800', 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800', 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800', 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800'),
 650000, 'Hotel di pegunungan dengan udara sejuk dan pemandangan alam yang asri.',
 JSON_ARRAY('WiFi', 'Coffee', 'TV', 'AC', 'Garden', 'Restaurant', 'Parking')),

('HoTel-U Surabaya', 'Surabaya', 4.6, 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800',
 JSON_ARRAY('https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800', 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800', 'https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=800', 'https://images.unsplash.com/photo-1517840901100-8179e982acb7?w=800', 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800'),
 750000, 'Hotel bisnis modern dengan fasilitas meeting room dan dekat dengan pusat bisnis.',
 JSON_ARRAY('WiFi', 'Coffee', 'TV', 'AC', 'Meeting Room', 'Gym', 'Restaurant')),

('HoTel-U Yogyakarta', 'Malioboro, Yogyakarta', 4.8, 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800',
 JSON_ARRAY('https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800', 'https://images.unsplash.com/photo-1596436889106-be35e843f974?w=800', 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800', 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800', 'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=800'),
 550000, 'Hotel dengan nuansa tradisional Jawa di jantung kota Yogyakarta.',
 JSON_ARRAY('WiFi', 'Coffee', 'TV', 'AC', 'Traditional Spa', 'Restaurant', 'Parking')),

('HoTel-U Lombok Paradise', 'Senggigi, Lombok', 4.9, 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800',
 JSON_ARRAY('https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800', 'https://images.unsplash.com/photo-1602002418082-a4443e081dd1?w=800', 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800', 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800', 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800'),
 950000, 'Resort eksklusif dengan private beach dan pemandangan laut yang memukau.',
 JSON_ARRAY('WiFi', 'Coffee', 'TV', 'AC', 'Private Beach', 'Spa', 'Restaurant', 'Water Sports'));

-- Insert sample rooms data
INSERT INTO rooms (hotel_id, room_number, name, type, price, capacity, beds, image, description, amenities, available) VALUES
-- Hotel 1 - Grand HoTel-U Jakarta
(1, '101', 'Standard Room 101', 'Standard', 650000, 2, 1, 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800', 'Kamar standard yang nyaman dengan fasilitas lengkap.', JSON_ARRAY('WiFi', 'TV', 'AC', 'Mini Bar'), TRUE),
(1, '102', 'Standard Room 102', 'Standard', 650000, 2, 1, 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800', 'Kamar standard yang nyaman dengan fasilitas lengkap.', JSON_ARRAY('WiFi', 'TV', 'AC', 'Mini Bar'), TRUE),
(1, '103', 'Standard Room 103', 'Standard', 650000, 2, 1, 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800', 'Kamar standard yang nyaman dengan fasilitas lengkap.', JSON_ARRAY('WiFi', 'TV', 'AC', 'Mini Bar'), FALSE),
(1, '201', 'Deluxe Room 201', 'Deluxe', 850000, 2, 1, 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800', 'Kamar deluxe dengan pemandangan kota dan fasilitas modern.', JSON_ARRAY('WiFi', 'TV', 'AC', 'Mini Bar', 'Safe Box'), TRUE),
(1, '202', 'Deluxe Room 202', 'Deluxe', 850000, 2, 1, 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800', 'Kamar deluxe dengan pemandangan kota dan fasilitas modern.', JSON_ARRAY('WiFi', 'TV', 'AC', 'Mini Bar', 'Safe Box'), TRUE),
(1, '301', 'Executive Suite 301', 'Suite', 1500000, 4, 2, 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800', 'Suite mewah dengan ruang tamu terpisah dan pemandangan panorama kota.', JSON_ARRAY('WiFi', 'TV', 'AC', 'Mini Bar', 'Safe Box', 'Living Room', 'Bathtub'), TRUE),

-- Hotel 2 - HoTel-U Bali Beach
(2, '101', 'Beachfront Room 101', 'Deluxe', 1200000, 2, 1, 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800', 'Kamar dengan akses langsung ke pantai dan balkon pribadi.', JSON_ARRAY('WiFi', 'TV', 'AC', 'Mini Bar', 'Balcony', 'Beach Access'), TRUE),
(2, '102', 'Beachfront Room 102', 'Deluxe', 1200000, 2, 1, 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800', 'Kamar dengan akses langsung ke pantai dan balkon pribadi.', JSON_ARRAY('WiFi', 'TV', 'AC', 'Mini Bar', 'Balcony', 'Beach Access'), TRUE),
(2, 'V1', 'Ocean View Villa V1', 'Villa', 2500000, 4, 2, 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800', 'Villa pribadi dengan kolam renang dan pemandangan laut langsung.', JSON_ARRAY('WiFi', 'TV', 'AC', 'Private Pool', 'Kitchen', 'Beach Access'), TRUE),

-- Hotel 3 - HoTel-U Bandung Hills
(3, '201', 'Mountain View Room 201', 'Deluxe', 650000, 2, 1, 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800', 'Kamar dengan pemandangan pegunungan yang indah.', JSON_ARRAY('WiFi', 'TV', 'AC', 'Heater', 'Balcony'), TRUE),
(3, '202', 'Mountain View Room 202', 'Deluxe', 650000, 2, 1, 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800', 'Kamar dengan pemandangan pegunungan yang indah.', JSON_ARRAY('WiFi', 'TV', 'AC', 'Heater', 'Balcony'), TRUE),
(3, '301', 'Family Suite 301', 'Suite', 1100000, 5, 3, 'https://images.unsplash.com/photo-1566195992011-5f6b21e539aa?w=800', 'Suite keluarga dengan 2 kamar tidur dan ruang keluarga.', JSON_ARRAY('WiFi', 'TV', 'AC', 'Heater', 'Living Room', 'Kitchen'), TRUE),

-- Hotel 4 - HoTel-U Surabaya
(4, '401', 'Business Room 401', 'Deluxe', 750000, 2, 1, 'https://images.unsplash.com/photo-1631049552240-59c37f38802b?w=800', 'Kamar bisnis dengan meja kerja luas dan WiFi kencang.', JSON_ARRAY('WiFi', 'TV', 'AC', 'Work Desk', 'Mini Bar', 'Safe Box'), TRUE),
(4, '402', 'Business Room 402', 'Deluxe', 750000, 2, 1, 'https://images.unsplash.com/photo-1631049552240-59c37f38802b?w=800', 'Kamar bisnis dengan meja kerja luas dan WiFi kencang.', JSON_ARRAY('WiFi', 'TV', 'AC', 'Work Desk', 'Mini Bar', 'Safe Box'), TRUE),
(4, '501', 'Executive Room 501', 'Suite', 1200000, 3, 2, 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800', 'Kamar eksekutif dengan ruang meeting pribadi.', JSON_ARRAY('WiFi', 'TV', 'AC', 'Work Desk', 'Mini Bar', 'Safe Box', 'Meeting Area', 'Bathtub'), TRUE),

-- Hotel 5 - HoTel-U Yogyakarta
(5, '101', 'Traditional Room 101', 'Standard', 550000, 2, 1, 'https://images.unsplash.com/photo-1595576508898-0ad5c879a061?w=800', 'Kamar dengan dekorasi tradisional Jawa yang kental.', JSON_ARRAY('WiFi', 'TV', 'AC', 'Mini Bar', 'Traditional Decor'), TRUE),
(5, '102', 'Traditional Room 102', 'Standard', 550000, 2, 1, 'https://images.unsplash.com/photo-1595576508898-0ad5c879a061?w=800', 'Kamar dengan dekorasi tradisional Jawa yang kental.', JSON_ARRAY('WiFi', 'TV', 'AC', 'Mini Bar', 'Traditional Decor'), TRUE),
(5, '201', 'Joglo Suite 201', 'Suite', 950000, 4, 2, 'https://images.unsplash.com/photo-1596436889106-be35e843f974?w=800', 'Suite bergaya rumah joglo dengan taman pribadi.', JSON_ARRAY('WiFi', 'TV', 'AC', 'Mini Bar', 'Traditional Spa', 'Private Garden', 'Bathtub'), TRUE),

-- Hotel 6 - HoTel-U Lombok Paradise
(6, '101', 'Paradise Room 101', 'Deluxe', 950000, 2, 1, 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800', 'Kamar dengan pemandangan laut dan akses ke pantai.', JSON_ARRAY('WiFi', 'TV', 'AC', 'Mini Bar', 'Balcony', 'Beach Access'), TRUE),
(6, '102', 'Paradise Room 102', 'Deluxe', 950000, 2, 1, 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800', 'Kamar dengan pemandangan laut dan akses ke pantai.', JSON_ARRAY('WiFi', 'TV', 'AC', 'Mini Bar', 'Balcony', 'Beach Access'), TRUE),
(6, 'LV1', 'Luxury Villa LV1', 'Villa', 3500000, 6, 3, 'https://images.unsplash.com/photo-1602002418082-a4443e081dd1?w=800', 'Villa mewah dengan private pool, pantai pribadi, dan butler service.', JSON_ARRAY('WiFi', 'TV', 'AC', 'Private Pool', 'Kitchen', 'Private Beach', 'Butler Service', 'Jacuzzi'), TRUE);

-- Insert sample users
INSERT INTO users (name, email, password, role) VALUES
('Hotel Staff', 'staff@hotel.com', '$2b$10$example_hashed_password', 'staff'),
('Regular User', 'user@hotel.com', '$2b$10$example_hashed_password', 'user'),
('Admin User', 'admin@hotel.com', '$2b$10$example_hashed_password', 'admin');
