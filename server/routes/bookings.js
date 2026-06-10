const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/authMiddleware');
const {
  bookRoom,
  bookRoomType,
  getUserBookings,
  getAllBookings,
  cancelBooking,
} = require('../controllers/bookingController');

// Book a specific room by ID
router.post('/book-room', verifyToken, bookRoom);

// Book a room type
router.post('/book-room-type', verifyToken, bookRoomType);

// Get user bookings
router.get('/user', verifyToken, getUserBookings);

// Get all bookings (staff views)
router.get('/all', verifyToken, getAllBookings);

// Cancel booking
router.patch('/:id/cancel', verifyToken, cancelBooking);

module.exports = router;
