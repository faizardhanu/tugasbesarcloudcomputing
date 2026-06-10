const { pool } = require('../config/database');

// MODEL: All database operations related to hotels

async function getAllHotelsWithStartingPrice() {
  const [rows] = await pool.execute(`
    SELECT h.*, 
           COALESCE(MIN(r.price), h.price_per_night) as starting_price
    FROM hotels h
    LEFT JOIN rooms r ON h.id = r.hotel_id AND r.available = true
    GROUP BY h.id
    ORDER BY h.id
  `);

  return rows;
}

async function getHotelWithStartingPriceById(id) {
  const [rows] = await pool.execute(
    `
    SELECT h.*, 
           COALESCE(MIN(r.price), h.price_per_night) as starting_price
    FROM hotels h
    LEFT JOIN rooms r ON h.id = r.hotel_id AND r.available = true
    WHERE h.id = ?
    GROUP BY h.id
  `,
    [id]
  );

  return rows[0] || null;
}

module.exports = {
  getAllHotelsWithStartingPrice,
  getHotelWithStartingPriceById,
};
