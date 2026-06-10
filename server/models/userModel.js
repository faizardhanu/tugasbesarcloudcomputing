const { pool } = require('../config/database');

// MODEL: All database operations related to users/auth

async function findUserByEmail(email) {
  const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
  return rows[0] || null;
}

async function createUser({ name, email, password, role }) {
  const [result] = await pool.execute(
    'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
    [name, email, password, role]
  );

  return {
    id: result.insertId,
    name,
    email,
    role,
  };
}

async function getUserById(id) {
  const [rows] = await pool.execute(
    'SELECT id, name, email, role, created_at FROM users WHERE id = ?',
    [id]
  );

  return rows[0] || null;
}

async function getAllUsers() {
  const [rows] = await pool.execute(
    'SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC'
  );

  return rows;
}

module.exports = {
  findUserByEmail,
  createUser,
  getUserById,
  getAllUsers,
};
