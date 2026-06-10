const roomTypeModel = require('../models/roomTypeModel');

function parseAmenities(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try {
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

async function getAllRoomTypes(req, res) {
  try {
    const types = await roomTypeModel.getAllRoomTypesWithHotel();

    const result = types.map((type) => ({
      ...type,
      hotelId: type.hotel_id,
      amenities: parseAmenities(type.amenities),
    }));

    return res.json(result);
  } catch (error) {
    console.error('Error fetching room types:', error);
    return res.status(500).json({ error: 'Failed to fetch room types' });
  }
}

async function getRoomTypesByHotel(req, res) {
  try {
    const { hotelId } = req.params;

    const types = await roomTypeModel.getRoomTypesByHotel(hotelId);

    const result = types.map((type) => ({
      ...type,
      hotelId: type.hotel_id,
      amenities: parseAmenities(type.amenities),
    }));

    return res.json(result);
  } catch (error) {
    console.error('Error fetching room types by hotel:', error);
    return res.status(500).json({ error: 'Failed to fetch room types' });
  }
}

async function createRoomType(req, res) {
  try {
    const {
      hotel_id,
      name,
      base_type,
      price,
      capacity,
      beds,
      image,
      description,
      amenities,
    } = req.body;

    if (!hotel_id || !name || !base_type || !price || !capacity || !beds) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const insertId = await roomTypeModel.insertRoomType({
      hotel_id,
      name,
      base_type,
      price,
      capacity,
      beds,
      image,
      description,
      amenities,
    });

    const roomType = await roomTypeModel.getRoomTypeById(insertId);

    if (!roomType) {
      return res.status(500).json({ error: 'Failed to fetch created room type' });
    }

    const roomTypeWithParsedData = {
      ...roomType,
      hotelId: roomType.hotel_id,
      amenities: parseAmenities(roomType.amenities),
    };

    return res.status(201).json(roomTypeWithParsedData);
  } catch (error) {
    console.error('Error creating room type:', error);
    return res.status(500).json({ error: 'Failed to create room type' });
  }
}

async function updateRoomType(req, res) {
  try {
    const { id } = req.params;
    const {
      hotel_id,
      name,
      base_type,
      price,
      capacity,
      beds,
      image,
      description,
      amenities,
    } = req.body;

    await roomTypeModel.updateRoomType({
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
    });

    const roomType = await roomTypeModel.getRoomTypeById(id);

    if (!roomType) {
      return res.status(404).json({ error: 'Room type not found' });
    }

    const roomTypeWithParsedData = {
      ...roomType,
      hotelId: roomType.hotel_id,
      amenities: parseAmenities(roomType.amenities),
    };

    return res.json(roomTypeWithParsedData);
  } catch (error) {
    console.error('Error updating room type:', error);
    return res.status(500).json({ error: 'Failed to update room type' });
  }
}

async function deleteRoomType(req, res) {
  try {
    const { id } = req.params;

    const roomType = await roomTypeModel.getRoomTypeById(id);

    if (!roomType) {
      return res.status(404).json({ error: 'Room type not found' });
    }

    await roomTypeModel.deleteRoomTypeById(id);

    const roomTypeWithParsedData = {
      ...roomType,
      hotelId: roomType.hotel_id,
      amenities: parseAmenities(roomType.amenities),
    };

    return res.json(roomTypeWithParsedData);
  } catch (error) {
    console.error('Error deleting room type:', error);
    return res.status(500).json({ error: 'Failed to delete room type' });
  }
}

module.exports = {
  getAllRoomTypes,
  getRoomTypesByHotel,
  createRoomType,
  updateRoomType,
  deleteRoomType,
};
