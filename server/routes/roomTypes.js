const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/authMiddleware');
const {
  getAllRoomTypes,
  getRoomTypesByHotel,
  createRoomType,
  updateRoomType,
  deleteRoomType,
} = require('../controllers/roomTypeController');

// Get all room types (staff only)
router.get('/', verifyToken, getAllRoomTypes);

// Get room types by hotel (staff only)
router.get('/hotel/:hotelId', verifyToken, getRoomTypesByHotel);

// Create new room type (staff only)
router.post('/', verifyToken, createRoomType);

// Update room type (staff only)
router.put('/:id', verifyToken, updateRoomType);

// Delete room type (staff only)
router.delete('/:id', verifyToken, deleteRoomType);

module.exports = router;
