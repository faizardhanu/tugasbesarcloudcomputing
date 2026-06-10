const express = require('express');
const router = express.Router();
const { getHotels, getHotelById } = require('../controllers/hotelController');

// Get all hotels with starting price
router.get('/', getHotels);

// Get hotel by ID
router.get('/:id', getHotelById);

module.exports = router;
