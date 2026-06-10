const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/authMiddleware');
const {
  getRoomsByHotel,
  getRoomById,
  getAllRooms,
  createRoom,
  updateRoom,
  updateRoomAvailability,
  deleteRoom,
} = require('../controllers/roomController');

// Get rooms by hotel ID with availability check
router.get('/hotel/:hotelId', getRoomsByHotel);

// Get room by ID
router.get('/:id', getRoomById);

// Get all rooms (for staff management)
router.get('/', verifyToken, getAllRooms);

// Create new room (staff only)
router.post('/', verifyToken, createRoom);

// Update room (staff only)
router.put('/:id', verifyToken, updateRoom);

// Update room availability (staff only)
router.patch('/:id/availability', verifyToken, updateRoomAvailability);

// Delete room (staff only)
router.delete('/:id', verifyToken, deleteRoom);

module.exports = router;
