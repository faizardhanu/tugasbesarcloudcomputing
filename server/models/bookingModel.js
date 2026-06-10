const { pool } = require('../config/database');

// MODEL: All database operations related to bookings

async function getRoomWithHotel(roomId) {
  const [rows] = await pool.execute(
    `
    SELECT r.*, h.name as hotel_name 
    FROM rooms r 
    JOIN hotels h ON r.hotel_id = h.id 
    WHERE r.id = ? AND r.available = true
  `,
    [roomId]
  );

  return rows[0] || null;
}

async function getBookingConflicts(roomId, checkIn, checkOut) {
  const [rows] = await pool.execute(
    `
    SELECT id FROM bookings 
    WHERE room_id = ? AND status IN ('confirmed', 'rescheduled')
    AND NOT (check_out <= ? OR check_in >= ?)
  `,
    [roomId, checkIn, checkOut]
  );

  return rows;
}

async function getBookingConflictsForReschedule(roomId, checkIn, checkOut, bookingIdToExclude) {
  const [rows] = await pool.execute(
    `
    SELECT id FROM bookings 
    WHERE room_id = ? AND status IN ('confirmed', 'rescheduled')
    AND NOT (check_out <= ? OR check_in >= ?)
    AND id <> ?
  `,
    [roomId, checkIn, checkOut, bookingIdToExclude]
  );

  return rows;
}

async function insertUserBooking({
  userId,
  roomId,
  hotelId,
  guestName,
  guestEmail,
  guestPhone,
  checkIn,
  checkOut,
  guests,
  totalPrice,
  specialRequests,
}) {
  const [result] = await pool.execute(
    `
    INSERT INTO bookings (user_id, room_id, hotel_id, guest_name, guest_email, guest_phone, check_in, check_out, guests, total_price, special_requests, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed')
  `,
    [
      userId,
      roomId,
      hotelId,
      guestName,
      guestEmail,
      guestPhone,
      checkIn,
      checkOut,
      guests,
      totalPrice,
      specialRequests,
    ]
  );

  return result.insertId;
}

async function getBookingWithRoomAndHotel(bookingId) {
  const [rows] = await pool.execute(
    `
    SELECT b.*, r.name as room_name, r.type as room_type, h.name as hotel_name
    FROM bookings b
    JOIN rooms r ON b.room_id = r.id
    JOIN hotels h ON b.hotel_id = h.id
    WHERE b.id = ?
  `,
    [bookingId]
  );

  return rows[0] || null;
}

async function findAvailableRoomByType(hotelId, roomType, checkIn, checkOut) {
  const [rows] = await pool.execute(
    `
    SELECT r.* FROM rooms r
    WHERE r.hotel_id = ? AND r.type = ? AND r.available = true
    AND r.id NOT IN (
      SELECT DISTINCT b.room_id 
      FROM bookings b 
      WHERE b.status IN ('confirmed', 'rescheduled')
      AND NOT (b.check_out <= ? OR b.check_in >= ?)
    )
    LIMIT 1
  `,
    [hotelId, roomType, checkIn, checkOut]
  );

  return rows[0] || null;
}

async function insertBooking({
  roomId,
  hotelId,
  guestName,
  guestEmail,
  guestPhone,
  checkIn,
  checkOut,
  guests,
  totalPrice,
  specialRequests,
}) {
  const [result] = await pool.execute(
    `
    INSERT INTO bookings (
      room_id, hotel_id, guest_name, guest_email, guest_phone, 
      check_in, check_out, guests, total_price, special_requests, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed')
  `,
    [roomId, hotelId, guestName, guestEmail, guestPhone, checkIn, checkOut, guests, totalPrice, specialRequests]
  );

  return result.insertId;
}

async function getBookingSummaryWithRoomAndHotel(bookingId) {
  const [rows] = await pool.execute(
    `
    SELECT b.*, r.name as room_name, r.room_number, h.name as hotel_name
    FROM bookings b
    JOIN rooms r ON b.room_id = r.id
    JOIN hotels h ON b.hotel_id = h.id
    WHERE b.id = ?
  `,
    [bookingId]
  );

  return rows[0] || null;
}

async function getUserBookingsWithJoins(userId) {
  const [rows] = await pool.execute(
    `
    SELECT b.*, r.name as room_name, r.room_number, r.image as room_image, 
           h.name as hotel_name, h.location as hotel_location
    FROM bookings b
    JOIN rooms r ON b.room_id = r.id
    JOIN hotels h ON b.hotel_id = h.id
    WHERE b.user_id = ? OR b.guest_email = (
      SELECT email FROM users WHERE id = ?
    )
    ORDER BY b.created_at DESC
  `,
    [userId, userId]
  );

  return rows;
}

async function getAllBookingsWithJoins() {
  const [rows] = await pool.execute(
    `
    SELECT b.*, r.name as room_name, r.room_number, r.amenities as room_amenities,
           h.name as hotel_name, h.location as hotel_location
    FROM bookings b
    JOIN rooms r ON b.room_id = r.id
    JOIN hotels h ON b.hotel_id = h.id
    ORDER BY b.created_at DESC
  `
  );

  return rows;
}

async function cancelBookingById(bookingId) {
  await pool.execute('UPDATE bookings SET status = ?, cancelled_at = NOW() WHERE id = ?', [
    'cancelled',
    bookingId,
  ]);
}

async function getBookingForCancel(bookingId) {
  const [rows] = await pool.execute(
    `
    SELECT b.*, r.name as room_name, r.room_number, h.name as hotel_name
    FROM bookings b
    JOIN rooms r ON b.room_id = r.id
    JOIN hotels h ON b.hotel_id = h.id
    WHERE b.id = ?
  `,
    [bookingId]
  );

  return rows[0] || null;
}

module.exports = {
  getRoomWithHotel,
  getBookingConflicts,
  getBookingConflictsForReschedule,
  insertUserBooking,
  getBookingWithRoomAndHotel,
  findAvailableRoomByType,
  insertBooking,
  getBookingSummaryWithRoomAndHotel,
  getUserBookingsWithJoins,
  getAllBookingsWithJoins,
  cancelBookingById,
  getBookingForCancel,
};
