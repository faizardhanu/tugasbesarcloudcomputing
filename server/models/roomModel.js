const { pool } = require('../config/database');

// MODEL: All database operations related to rooms

async function getRoomsByHotelWithAvailability(hotelId, checkIn, checkOut) {
  let query = `
    SELECT r.*, h.name as hotel_name
    FROM rooms r
    JOIN hotels h ON r.hotel_id = h.id
    WHERE r.hotel_id = ? AND r.available = true
  `;

  const params = [hotelId];

  if (checkIn && checkOut) {
    query += `
      AND r.id NOT IN (
        SELECT DISTINCT b.room_id 
        FROM bookings b 
        WHERE b.status IN ('confirmed', 'rescheduled')
        AND NOT (b.check_out <= ? OR b.check_in >= ?)
      )
    `;
    params.push(checkIn, checkOut);
  }

  query += ' ORDER BY r.type, r.price';

  const [rows] = await pool.execute(query, params);
  return rows;
}

async function getRoomByIdWithAvailability(id, checkIn, checkOut) {
  let query = `
    SELECT r.*, h.name as hotel_name
    FROM rooms r
    JOIN hotels h ON r.hotel_id = h.id
    WHERE r.id = ? AND r.available = true
  `;

  const params = [id];

  if (checkIn && checkOut) {
    query += `
      AND r.id NOT IN (
        SELECT DISTINCT b.room_id 
        FROM bookings b 
        WHERE b.status IN ('confirmed', 'rescheduled')
        AND NOT (b.check_out <= ? OR b.check_in >= ?)
      )
    `;
    params.push(checkIn, checkOut);
  }

  const [rows] = await pool.execute(query, params);
  return rows[0] || null;
}

async function getAllRoomsWithHotel() {
  const [rows] = await pool.execute(`
    SELECT r.*, h.name as hotel_name
    FROM rooms r
    JOIN hotels h ON r.hotel_id = h.id
    ORDER BY h.name, r.room_number
  `);

  return rows;
}

async function insertRoom({
  hotel_id,
  room_number,
  name,
  type,
  price,
  capacity,
  beds,
  image,
  description,
  amenities,
  available,
}) {
  const [result] = await pool.execute(
    `
    INSERT INTO rooms (hotel_id, room_number, name, type, price, capacity, beds, image, description, amenities, available)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,
    [
      hotel_id,
      room_number,
      name,
      type,
      price,
      capacity,
      beds,
      image,
      description,
      JSON.stringify(amenities),
      available !== undefined ? available : true,
    ]
  );

  return result.insertId;
}

async function updateRoom({
  id,
  hotel_id,
  room_number,
  name,
  type,
  price,
  capacity,
  beds,
  image,
  description,
  amenities,
  available,
}) {
  await pool.execute(
    `
    UPDATE rooms 
    SET hotel_id = ?, room_number = ?, name = ?, type = ?, price = ?, 
        capacity = ?, beds = ?, image = ?, description = ?, amenities = ?, available = ?
    WHERE id = ?
  `,
    [
      hotel_id,
      room_number,
      name,
      type,
      price,
      capacity,
      beds,
      image,
      description,
      JSON.stringify(amenities),
      available !== undefined ? available : true,
      id,
    ]
  );
}

async function updateRoomAvailability(id, available) {
  await pool.execute('UPDATE rooms SET available = ? WHERE id = ?', [available, id]);
}

async function getRoomWithHotel(id) {
  const [rows] = await pool.execute(
    `
    SELECT r.*, h.name as hotel_name
    FROM rooms r
    JOIN hotels h ON r.hotel_id = h.id
    WHERE r.id = ?
  `,
    [id]
  );

  return rows[0] || null;
}

async function deleteRoomById(id) {
  await pool.execute('DELETE FROM rooms WHERE id = ?', [id]);
}

module.exports = {
  getRoomsByHotelWithAvailability,
  getRoomByIdWithAvailability,
  getAllRoomsWithHotel,
  insertRoom,
  updateRoom,
  updateRoomAvailability,
  getRoomWithHotel,
  deleteRoomById,
};
