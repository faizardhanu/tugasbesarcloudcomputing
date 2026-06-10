const rescheduleModel = require('../models/rescheduleModel');
const bookingModel = require('../models/bookingModel');
const { broadcastBookingsChanged } = require('../utils/websocket');

// Create reschedule request
async function createRescheduleRequest(req, res) {
  try {
    const { bookingId, newCheckIn, newCheckOut, reason } = req.body;

    if (!bookingId || !newCheckIn || !newCheckOut || !reason) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Validate new dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const newCheckInDate = new Date(newCheckIn);
    const newCheckOutDate = new Date(newCheckOut);

    if (newCheckInDate < today) {
      return res.status(400).json({ error: 'New check-in date cannot be in the past' });
    }

    if (newCheckOutDate <= newCheckInDate) {
      return res.status(400).json({ error: 'New check-out date must be after new check-in date' });
    }

    const booking = await rescheduleModel.getBookingWithRoomAndHotel(bookingId);

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Check for booking conflicts on the new dates at request time
    const conflicts = await bookingModel.getBookingConflictsForReschedule(
      booking.room_id,
      newCheckIn,
      newCheckOut,
      bookingId
    );

    if (conflicts.length > 0) {
      return res
        .status(400)
        .json({ error: 'Room is not available for the new dates' });
    }

    const insertId = await rescheduleModel.createRescheduleRequest(
      bookingId,
      booking.check_in,
      booking.check_out,
      newCheckIn,
      newCheckOut,
      reason
    );

    await rescheduleModel.updateBookingStatus(bookingId, 'reschedule_pending');

    const rescheduleRequest = {
      id: insertId,
      bookingId,
      originalCheckIn: booking.check_in,
      originalCheckOut: booking.check_out,
      newCheckIn,
      newCheckOut,
      reason,
      status: 'pending',
      requestedAt: new Date().toISOString().split('T')[0],
      reviewedAt: null,
      reviewedBy: null,
      reviewNotes: null,
      roomName: booking.room_name,
      hotelName: booking.hotel_name,
      userEmail: booking.guest_email,
    };

    // Notify all connected clients about new reschedule request
    broadcastBookingsChanged(req, 'RESCHEDULE_CREATED');
    broadcastBookingsChanged(req);

    return res.status(201).json(rescheduleRequest);
  } catch (error) {
    console.error('Error creating reschedule request:', error);
    return res.status(500).json({ error: 'Failed to create reschedule request' });
  }
}

// Get all reschedule requests (staff only)
async function getAllRescheduleRequests(req, res) {
  try {
    const requests = await rescheduleModel.getAllRescheduleRequestsWithJoins();

    const formattedRequests = requests.map((request) => ({
      id: request.id,
      bookingId: request.booking_id,
      originalCheckIn: request.original_check_in,
      originalCheckOut: request.original_check_out,
      newCheckIn: request.new_check_in,
      newCheckOut: request.new_check_out,
      reason: request.reason,
      status: request.status,
      requestedAt: request.requested_at.toISOString().split('T')[0],
      reviewedAt: request.reviewed_at ? request.reviewed_at.toISOString().split('T')[0] : null,
      reviewedBy: request.reviewed_by,
      reviewNotes: request.review_notes,
      roomName: request.room_name,
      hotelName: request.hotel_name,
      userEmail: request.user_email,
    }));

    return res.json(formattedRequests);
  } catch (error) {
    console.error('Error fetching reschedule requests:', error);
    return res.status(500).json({ error: 'Failed to fetch reschedule requests' });
  }
}

// Get user reschedule requests
async function getUserRescheduleRequests(req, res) {
  try {
    const userId = req.user.id;
    const requests = await rescheduleModel.getUserRescheduleRequestsWithJoins(userId);

    const formattedRequests = requests.map((request) => ({
      id: request.id,
      bookingId: request.booking_id,
      originalCheckIn: request.original_check_in,
      originalCheckOut: request.original_check_out,
      newCheckIn: request.new_check_in,
      newCheckOut: request.new_check_out,
      reason: request.reason,
      status: request.status,
      requestedAt: request.requested_at.toISOString().split('T')[0],
      reviewedAt: request.reviewed_at ? request.reviewed_at.toISOString().split('T')[0] : null,
      reviewedBy: request.reviewed_by,
      reviewNotes: request.review_notes,
      roomName: request.room_name,
      hotelName: request.hotel_name,
      userEmail: request.user_email,
    }));

    return res.json(formattedRequests);
  } catch (error) {
    console.error('Error fetching user reschedule requests:', error);
    return res.status(500).json({ error: 'Failed to fetch reschedule requests' });
  }
}

// Approve reschedule request (staff only)
async function approveRescheduleRequest(req, res) {
  try {
    const { id } = req.params;
    const { reviewNotes } = req.body;

    const request = await rescheduleModel.getRescheduleRequestById(id);

    if (!request) {
      return res.status(404).json({ error: 'Reschedule request not found' });
    }

    // Get current booking details (including room_id) for availability check
    const currentBooking = await rescheduleModel.getBookingSummaryForApprove(
      request.booking_id
    );

    if (!currentBooking) {
      return res.status(404).json({ error: 'Booking not found for this request' });
    }

    // Check for booking conflicts on the new dates, excluding this booking itself
    const conflicts = await bookingModel.getBookingConflictsForReschedule(
      currentBooking.room_id,
      request.new_check_in,
      request.new_check_out,
      request.booking_id
    );

    if (conflicts.length > 0) {
      return res
        .status(400)
        .json({ error: 'Room is not available for the new dates' });
    }

    // Update booking dates and status via model helpers
    await rescheduleModel.updateBookingDatesFromReschedule(
      request.booking_id,
      request.new_check_in,
      request.new_check_out
    );
    await rescheduleModel.updateBookingStatus(request.booking_id, 'rescheduled');

    // Mark reschedule request as approved instead of deleting it (audit trail)
    await rescheduleModel.updateRescheduleRequestApproved(id, reviewNotes || null);

    const booking = await rescheduleModel.getBookingSummaryForApprove(
      request.booking_id
    );

    // Notify all connected clients about reschedule update
    broadcastBookingsChanged(req, 'RESCHEDULE_UPDATED');
    broadcastBookingsChanged(req);

    return res.json({
      booking: {
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
        rescheduledAt: booking.rescheduled_at
          ? booking.rescheduled_at.toISOString().split('T')[0]
          : null,
      },
      request: {
        ...request,
        status: 'approved',
        reviewedAt: new Date().toISOString().split('T')[0],
        reviewedBy: 'Admin',
        reviewNotes,
      },
    });
  } catch (error) {
    console.error('Error approving reschedule request:', error);
    return res.status(500).json({ error: 'Failed to approve reschedule request' });
  }
}

// Reject reschedule request (staff only)
async function rejectRescheduleRequest(req, res) {
  try {
    const { id } = req.params;
    const { reviewNotes } = req.body;

    if (!reviewNotes) {
      return res.status(400).json({ error: 'Review notes are required for rejection' });
    }

    const request = await rescheduleModel.getRescheduleRequestById(id);

    if (!request) {
      return res.status(404).json({ error: 'Reschedule request not found' });
    }

    await rescheduleModel.updateBookingStatus(request.booking_id, 'confirmed');
    await rescheduleModel.updateRescheduleRequestRejected(id, reviewNotes);

    const updatedRequest = await rescheduleModel.getRescheduleRequestDetailsWithJoins(id);

    // Notify all connected clients about reschedule update
    broadcastBookingsChanged(req, 'RESCHEDULE_UPDATED');
    broadcastBookingsChanged(req);

    return res.json({
      id: updatedRequest.id,
      bookingId: updatedRequest.booking_id,
      originalCheckIn: updatedRequest.original_check_in,
      originalCheckOut: updatedRequest.original_check_out,
      newCheckIn: updatedRequest.new_check_in,
      newCheckOut: updatedRequest.new_check_out,
      reason: updatedRequest.reason,
      status: updatedRequest.status,
      requestedAt: updatedRequest.requested_at.toISOString().split('T')[0],
      reviewedAt: updatedRequest.reviewed_at.toISOString().split('T')[0],
      reviewedBy: updatedRequest.reviewed_by,
      reviewNotes: updatedRequest.review_notes,
      roomName: updatedRequest.room_name,
      hotelName: updatedRequest.hotel_name,
      userEmail: updatedRequest.user_email,
    });
  } catch (error) {
    console.error('Error rejecting reschedule request:', error);
    return res.status(500).json({ error: 'Failed to reject reschedule request' });
  }
}

module.exports = {
  createRescheduleRequest,
  getAllRescheduleRequests,
  getUserRescheduleRequests,
  approveRescheduleRequest,
  rejectRescheduleRequest,
};
