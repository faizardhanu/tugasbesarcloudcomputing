const hotelModel = require('../models/hotelModel');

// Get all hotels with starting price
async function getHotels(req, res) {
  try {
    const hotels = await hotelModel.getAllHotelsWithStartingPrice();

    const hotelsWithParsedData = hotels.map((hotel) => ({
      ...hotel,
      images: hotel.images
        ? typeof hotel.images === 'string'
          ? JSON.parse(hotel.images)
          : hotel.images
        : [],
      amenities: hotel.amenities
        ? typeof hotel.amenities === 'string'
          ? JSON.parse(hotel.amenities)
          : hotel.amenities
        : [],
      startingPrice: hotel.starting_price,
    }));

    return res.json(hotelsWithParsedData);
  } catch (error) {
    console.error('Error fetching hotels:', error);
    return res.status(500).json({ error: 'Failed to fetch hotels' });
  }
}

// Get hotel by ID
async function getHotelById(req, res) {
  try {
    const { id } = req.params;

    const hotel = await hotelModel.getHotelWithStartingPriceById(id);

    if (!hotel) {
      return res.status(404).json({ error: 'Hotel not found' });
    }

    const hotelWithParsedData = {
      ...hotel,
      images: hotel.images
        ? typeof hotel.images === 'string'
          ? JSON.parse(hotel.images)
          : hotel.images
        : [],
      amenities: hotel.amenities
        ? typeof hotel.amenities === 'string'
          ? JSON.parse(hotel.amenities)
          : hotel.amenities
        : [],
      startingPrice: hotel.starting_price,
    };

    return res.json(hotelWithParsedData);
  } catch (error) {
    console.error('Error fetching hotel:', error);
    return res.status(500).json({ error: 'Failed to fetch hotel' });
  }
}

module.exports = {
  getHotels,
  getHotelById,
};
