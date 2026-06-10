const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/authMiddleware');
const {
  login,
  register,
  getMe,
  getAllUsers,
} = require('../controllers/authController');

// Login
router.post('/login', login);

// Register
router.post('/register', register);

// Get current user profile
router.get('/me', verifyToken, getMe);

// Get all users (admin only)
router.get('/users', verifyToken, getAllUsers);

module.exports = router;
