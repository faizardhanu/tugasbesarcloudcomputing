const roomModel = require('../models/roomModel');

// Get rooms by hotel ID with availability check
async function getRoomsByHotel(req, res) {
  try {
    const { hotelId } = req.params;
    const { checkIn, checkOut } = req.query;

    const rooms = await roomModel.getRoomsByHotelWithAvailability(hotelId, checkIn, checkOut);

    // Group rooms by type and calculate availability
    const roomTypes = new Map();

    rooms.forEach((room) => {
      const key = `${room.type}-${room.price}`;

      if (!roomTypes.has(key)) {
        roomTypes.set(key, {
          type: room.type,
          name: room.name.split(' ').slice(0, -1).join(' '), // Remove room number
          price: room.price,
          capacity: room.capacity,
          beds: room.beds,
          image: room.image,
          description: room.description,
          amenities: room.amenities
            ? typeof room.amenities === 'string'
              ? JSON.parse(room.amenities)
              : room.amenities
            : [],
          hotelId: room.hotel_id,
          hotelName: room.hotel_name,
          totalRooms: 0,
          availableRooms: 0,
          roomIds: [],
          availableRoomData: [],
        });
      }

      const roomType = roomTypes.get(key);
      roomType.totalRooms++;
      roomType.availableRooms++;
      roomType.roomIds.push(room.id);
      roomType.availableRoomData.push(room);
    });

    const result = Array.from(roomTypes.values()).filter(
      (roomType) => roomType.availableRooms > 0
    );

    return res.json(result);
  } catch (error) {
    console.error('Error fetching rooms:', error);
    return res.status(500).json({ error: 'Failed to fetch rooms' });
  }
}

// Get room by ID
async function getRoomById(req, res) {
  try {
    const { id } = req.params;
    const { checkIn, checkOut } = req.query;

    const room = await roomModel.getRoomByIdWithAvailability(id, checkIn, checkOut);

    if (!room) {
      return res.status(404).json({ error: 'Room not found or not available' });
    }

    const roomWithParsedData = {
      ...room,
      hotelId: room.hotel_id,
      roomNumber: room.room_number,
      amenities: room.amenities
        ? typeof room.amenities === 'string'
          ? JSON.parse(room.amenities)
          : room.amenities
        : [],
      hotelName: room.hotel_name,
    };

    return res.json(roomWithParsedData);
  } catch (error) {
    console.error('Error fetching room:', error);
    return res.status(500).json({ error: 'Failed to fetch room' });
  }
}

// Get all rooms (for staff management)
async function getAllRooms(req, res) {
  try {
    const rooms = await roomModel.getAllRoomsWithHotel();

    const roomsWithParsedData = rooms.map((room) => ({
      ...room,
      hotelId: room.hotel_id,
      roomNumber: room.room_number,
      amenities: room.amenities
        ? typeof room.amenities === 'string'
          ? JSON.parse(room.amenities)
          : room.amenities
        : [],
      hotelName: room.hotel_name,
    }));

    return res.json(roomsWithParsedData);
  } catch (error) {
    console.error('Error fetching all rooms:', error);
    return res.status(500).json({ error: 'Failed to fetch rooms' });
  }
}

// Create new room (staff only)
async function createRoom(req, res) {
  try {
    console.log('Received room creation request:', req.body);
    const {
      hotel_id,
      room_number,
      name,
      type,
      price,
      capacity,
      beds,
      image,
      description,
      amenities,
      available,
    } = req.body;

    if (!hotel_id || !room_number || !name || !type || !price || !capacity || !beds) {
      console.log('Missing required fields:', {
        hotel_id,
        room_number,
        name,
        type,
        price,
        capacity,
        beds,
      });
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const insertId = await roomModel.insertRoom({
      hotel_id,
      room_number,
      name,
      type,
      price,
      capacity,
      beds,
      image,
      description,
      amenities,
      available,
    });

    const room = await roomModel.getRoomWithHotel(insertId);

    const roomWithParsedData = {
      ...room,
      amenities: room.amenities
        ? typeof room.amenities === 'string'
          ? JSON.parse(room.amenities)
          : room.amenities
        : [],
      hotelName: room.hotel_name,
    };

    return res.status(201).json(roomWithParsedData);
  } catch (error) {
    console.error('Error creating room:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Room number already exists for this hotel' });
    }
    return res.status(500).json({ error: 'Failed to create room' });
  }
}

// Update room (staff only)
async function updateRoom(req, res) {
  try {
    const { id } = req.params;
    const {
      hotel_id,
      room_number,
      name,
      type,
      price,
      capacity,
      beds,
      image,
      description,
      amenities,
      available,
    } = req.body;

    await roomModel.updateRoom({
      id,
      hotel_id,
      room_number,
      name,
      type,
      price,
      capacity,
      beds,
      image,
      description,
      amenities,
      available,
    });

    const room = await roomModel.getRoomWithHotel(id);

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const roomWithParsedData = {
      ...room,
      amenities: room.amenities
        ? typeof room.amenities === 'string'
          ? JSON.parse(room.amenities)
          : room.amenities
        : [],
      hotelName: room.hotel_name,
    };

    return res.json(roomWithParsedData);
  } catch (error) {
    console.error('Error updating room:', error);
    return res.status(500).json({ error: 'Failed to update room' });
  }
}

// Update room availability (staff only)
async function updateRoomAvailability(req, res) {
  try {
    const { id } = req.params;
    const { available } = req.body;

    await roomModel.updateRoomAvailability(id, available);

    const room = await roomModel.getRoomWithHotel(id);

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const roomWithParsedData = {
      ...room,
      amenities: room.amenities
        ? typeof room.amenities === 'string'
          ? JSON.parse(room.amenities)
          : room.amenities
        : [],
      hotelName: room.hotel_name,
    };

    return res.json(roomWithParsedData);
  } catch (error) {
    console.error('Error updating room availability:', error);
    return res.status(500).json({ error: 'Failed to update room availability' });
  }
}

// Delete room (staff only)
async function deleteRoom(req, res) {
  try {
    const { id } = req.params;

    const room = await roomModel.getRoomWithHotel(id);

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    await roomModel.deleteRoomById(id);

    const roomWithParsedData = {
      ...room,
      amenities: room.amenities
        ? typeof room.amenities === 'string'
          ? JSON.parse(room.amenities)
          : room.amenities
        : [],
      hotelName: room.hotel_name,
    };

    return res.json(roomWithParsedData);
  } catch (error) {
    console.error('Error deleting room:', error);
    return res.status(500).json({ error: 'Failed to delete room' });
  }
}

module.exports = {
  getRoomsByHotel,
  getRoomById,
  getAllRooms,
  createRoom,
  updateRoom,
  updateRoomAvailability,
  deleteRoom,
};
