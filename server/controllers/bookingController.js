const bookingModel = require('../models/bookingModel');
const { broadcastBookingsChanged } = require('../utils/websocket');

// Book a specific room by ID
async function bookRoom(req, res) {
  try {
    const {
      room_id,
      guest_name,
      guest_email,
      guest_phone,
      check_in,
      check_out,
      guests,
      total_price,
      special_requests,
    } = req.body;
    const userId = req.user.id; // Get user ID from JWT token

    // Validate required fields
    if (!room_id || !guest_name || !guest_email || !guest_phone || !check_in || !check_out || !guests) {
      return res.status(400).json({ error: 'Missing required booking data' });
    }

    // Validate dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkInDate = new Date(check_in);
    const checkOutDate = new Date(check_out);

    if (checkInDate < today) {
      return res.status(400).json({ error: 'Check-in date cannot be in the past' });
    }

    if (checkOutDate <= checkInDate) {
      return res.status(400).json({ error: 'Check-out date must be after check-in date' });
    }

    // Check if room exists and is available
    const room = await bookingModel.getRoomWithHotel(room_id);

    if (!room) {
      return res.status(404).json({ error: 'Room not found or not available' });
    }

    // Check for booking conflicts
    const conflicts = await bookingModel.getBookingConflicts(room_id, check_in, check_out);

    if (conflicts.length > 0) {
      return res.status(400).json({ error: 'Room is not available for the selected dates' });
    }

    // Create booking
    const insertId = await bookingModel.insertUserBooking({
      userId,
      roomId: room_id,
      hotelId: room.hotel_id,
      guestName: guest_name,
      guestEmail: guest_email,
      guestPhone: guest_phone,
      checkIn: check_in,
      checkOut: check_out,
      guests,
      totalPrice: total_price || room.price,
      specialRequests: special_requests || '',
    });

    // Get the created booking
    const booking = await bookingModel.getBookingWithRoomAndHotel(insertId);

    // Notify all connected clients
    broadcastBookingsChanged(req, 'BOOKING_CREATED');
    broadcastBookingsChanged(req);

    return res.status(201).json({
      message: 'Booking created successfully',
      booking,
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    return res.status(500).json({ error: 'Failed to create booking' });
  }
}

// Book a room type
async function bookRoomType(req, res) {
  try {
    const { hotelId, roomType, bookingData } = req.body;
    const userId = req.user.id; // Get user ID from JWT token

    // Validate required fields
    if (!hotelId || !roomType || !bookingData) {
      return res.status(400).json({ error: 'Missing required booking data' });
    }

    const { checkIn, checkOut, guestName, guestEmail, guestPhone, guests, specialRequests } = bookingData;

    // Validate dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    if (checkInDate < today) {
      return res.status(400).json({ error: 'Check-in date cannot be in the past' });
    }

    if (checkOutDate <= checkInDate) {
      return res.status(400).json({ error: 'Check-out date must be after check-in date' });
    }

    // Find available room of the requested type
    const room = await bookingModel.findAvailableRoomByType(
      hotelId,
      roomType,
      checkIn,
      checkOut
    );

    if (!room) {
      return res.status(400).json({ error: 'No rooms available for this type and dates' });
    }

    // Calculate total price (simplified - just room price * nights)
    const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
    const totalPrice = room.price * nights;

    // Create booking
    const insertId = await bookingModel.insertUserBooking({
      userId,
      roomId: room.id,
      hotelId,
      guestName,
      guestEmail,
      guestPhone,
      checkIn,
      checkOut,
      guests,
      totalPrice,
      specialRequests,
    });

    // Get the created booking with room and hotel details
    const booking = await bookingModel.getBookingSummaryWithRoomAndHotel(insertId);

    // Notify all connected clients
    broadcastBookingsChanged(req, 'BOOKING_CREATED');
    broadcastBookingsChanged(req);

    return res.status(201).json({
      id: booking.id,
      roomId: booking.room_id,
      roomName: booking.room_name,
      roomNumber: booking.room_number,
      hotelId: booking.hotel_id,
      hotelName: booking.hotel_name,
      guestName: booking.guest_name,
      guestEmail: booking.guest_email,
      guestPhone: booking.guest_phone,
      checkIn: booking.check_in,
      checkOut: booking.check_out,
      guests: booking.guests,
      totalPrice: booking.total_price,
      specialRequests: booking.special_requests,
      status: booking.status,
      createdAt: booking.created_at.toISOString().split('T')[0],
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    return res.status(500).json({ error: 'Failed to create booking' });
  }
}

// Get user bookings
async function getUserBookings(req, res) {
  try {
    // Get user_id from JWT token
    const userId = req.user.id;
    console.log('Fetching bookings for user ID:', userId);

    const bookings = await bookingModel.getUserBookingsWithJoins(userId);

    const formattedBookings = bookings.map((booking) => ({
      id: booking.id,
      userId: booking.user_id,
      roomId: booking.room_id,
      roomName: booking.room_name,
      roomNumber: booking.room_number,
      roomImage:
        booking.room_image ||
        'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800',
      hotelId: booking.hotel_id,
      hotelName: booking.hotel_name,
      hotelLocation: booking.hotel_location,
      guestName: booking.guest_name,
      guestEmail: booking.guest_email,
      guestPhone: booking.guest_phone,
      checkIn: booking.check_in,
      checkOut: booking.check_out,
      guests: booking.guests,
      totalPrice: booking.total_price,
      paymentMethod: booking.payment_method || 'credit-card',
      specialRequests: booking.special_requests,
      status: booking.status,
      createdAt: booking.created_at.toISOString().split('T')[0],
      cancelledAt: booking.cancelled_at
        ? booking.cancelled_at.toISOString().split('T')[0]
        : null,
      rescheduledAt: booking.rescheduled_at
        ? booking.rescheduled_at.toISOString().split('T')[0]
        : null,
    }));

    return res.json(formattedBookings);
  } catch (error) {
    console.error('Error fetching user bookings:', error);
    return res.status(500).json({ error: 'Failed to fetch bookings' });
  }
}

// Get all bookings (staff-only view used by staff pages)
async function getAllBookings(req, res) {
  try {
    const bookings = await bookingModel.getAllBookingsWithJoins();

    const formattedBookings = bookings.map((booking) => ({
      id: booking.id,
      roomId: booking.room_id,
      hotelId: booking.hotel_id,
      guestName: booking.guest_name,
      guestEmail: booking.guest_email,
      guestPhone: booking.guest_phone,
      checkIn: booking.check_in,
      checkOut: booking.check_out,
      guests: booking.guests,
      totalPrice: booking.total_price,
      status: booking.status,
      specialRequests: booking.special_requests,
      roomDetails: {
        id: booking.room_id,
        name: booking.room_name,
        roomNumber: booking.room_number,
        amenities:
          typeof booking.room_amenities === 'string'
            ? JSON.parse(booking.room_amenities)
            : booking.room_amenities,
      },
      hotelDetails: {
        id: booking.hotel_id,
        name: booking.hotel_name,
        location: booking.hotel_location,
      },
      createdAt: booking.created_at.toISOString().split('T')[0],
      cancelledAt: booking.cancelled_at
        ? booking.cancelled_at.toISOString().split('T')[0]
        : null,
      rescheduledAt: booking.rescheduled_at
        ? booking.rescheduled_at.toISOString().split('T')[0]
        : null,
    }));

    return res.json(formattedBookings);
  } catch (error) {
    console.error('Error fetching all bookings:', error);
    return res.status(500).json({ error: 'Failed to fetch bookings' });
  }
}

// Cancel booking
async function cancelBooking(req, res) {
  try {
    const { id } = req.params;

    // Update booking status to cancelled
    await bookingModel.cancelBookingById(id);

    // Get updated booking
    const booking = await bookingModel.getBookingForCancel(id);

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Notify all connected clients
    broadcastBookingsChanged(req, 'BOOKING_CANCELLED');
    broadcastBookingsChanged(req);

    return res.json({
      id: booking.id,
      roomId: booking.room_id,
      roomName: booking.room_name,
      roomNumber: booking.room_number,
      hotelId: booking.hotel_id,
      hotelName: booking.hotel_name,
      guestName: booking.guest_name,
      guestEmail: booking.guest_email,
      guestPhone: booking.guest_phone,
      checkIn: booking.check_in,
      checkOut: booking.check_out,
      guests: booking.guests,
      totalPrice: booking.total_price,
      specialRequests: booking.special_requests,
      status: booking.status,
      createdAt: booking.created_at.toISOString().split('T')[0],
      cancelledAt: booking.cancelled_at
        ? booking.cancelled_at.toISOString().split('T')[0]
        : null,
    });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    return res.status(500).json({ error: 'Failed to cancel booking' });
  }
}

module.exports = {
  bookRoom,
  bookRoomType,
  getUserBookings,
  getAllBookings,
  cancelBooking,
};
