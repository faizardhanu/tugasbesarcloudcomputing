const { pool } = require('../config/database');

async function getAllRoomTypesWithHotel() {
  const [rows] = await pool.execute(`
    SELECT rt.*, h.name AS hotel_name, h.location AS hotel_location
    FROM room_types rt
    JOIN hotels h ON rt.hotel_id = h.id
    ORDER BY h.name, rt.name
  `);

  return rows;
}

async function getRoomTypesByHotel(hotelId) {
  const [rows] = await pool.execute(
    `
    SELECT rt.*, h.name AS hotel_name, h.location AS hotel_location
    FROM room_types rt
    JOIN hotels h ON rt.hotel_id = h.id
    WHERE rt.hotel_id = ?
    ORDER BY rt.name
  `,
    [hotelId]
  );

  return rows;
}

async function getRoomTypeById(id) {
  const [rows] = await pool.execute(
    `
    SELECT rt.*, h.name AS hotel_name, h.location AS hotel_location
    FROM room_types rt
    JOIN hotels h ON rt.hotel_id = h.id
    WHERE rt.id = ?
  `,
    [id]
  );

  return rows[0] || null;
}

async function insertRoomType({
  hotel_id,
  name,
  base_type,
  price,
  capacity,
  beds,
  image,
  description,
  amenities,
}) {
  const [result] = await pool.execute(
    `
    INSERT INTO room_types (hotel_id, name, base_type, price, capacity, beds, image, description, amenities)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,
    [
      hotel_id,
      name,
      base_type,
      price,
      capacity,
      beds,
      image,
      description,
      JSON.stringify(amenities || []),
    ]
  );

  return result.insertId;
}

async function updateRoomType({
  id,
  hotel_id,
  name,
  base_type,
  price,
  capacity,
  beds,
  image,
  description,
  amenities,
}) {
  await pool.execute(
    `
    UPDATE room_types
    SET hotel_id = ?, name = ?, base_type = ?, price = ?, capacity = ?, beds = ?, image = ?, description = ?, amenities = ?
    WHERE id = ?
  `,
    [
      hotel_id,
      name,
      base_type,
      price,
      capacity,
      beds,
      image,
      description,
      JSON.stringify(amenities || []),
      id,
    ]
  );
}

async function deleteRoomTypeById(id) {
  await pool.execute('DELETE FROM room_types WHERE id = ?', [id]);
}

module.exports = {
  getAllRoomTypesWithHotel,
  getRoomTypesByHotel,
  getRoomTypeById,
  insertRoomType,
  updateRoomType,
  deleteRoomTypeById,
};
