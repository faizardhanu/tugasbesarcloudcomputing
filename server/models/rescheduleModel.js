const { pool } = require('../config/database');

// MODEL: All database operations related to reschedule requests and related bookings

async function getBookingWithRoomAndHotel(bookingId) {
  const [rows] = await pool.execute(`
    SELECT b.*, r.name as room_name, h.name as hotel_name
    FROM bookings b
    JOIN rooms r ON b.room_id = r.id
    JOIN hotels h ON b.hotel_id = h.id
    WHERE b.id = ?
  `, [bookingId]);

  return rows[0] || null;
}

async function createRescheduleRequest(bookingId, originalCheckIn, originalCheckOut, newCheckIn, newCheckOut, reason) {
  const [result] = await pool.execute(`
    INSERT INTO reschedule_requests (
      booking_id, original_check_in, original_check_out,
      new_check_in, new_check_out, reason
    ) VALUES (?, ?, ?, ?, ?, ?)
  `, [bookingId, originalCheckIn, originalCheckOut, newCheckIn, newCheckOut, reason]);

  return result.insertId;
}

async function updateBookingStatus(bookingId, status) {
  await pool.execute(
    'UPDATE bookings SET status = ? WHERE id = ?',
    [status, bookingId]
  );
}

async function updateBookingDatesFromReschedule(bookingId, newCheckIn, newCheckOut) {
  await pool.execute(
    `
    UPDATE bookings
    SET check_in = ?, check_out = ?, rescheduled_at = NOW()
    WHERE id = ?
  `,
    [newCheckIn, newCheckOut, bookingId]
  );
}

async function getAllRescheduleRequestsWithJoins() {
  const [requests] = await pool.execute(`
    SELECT rr.*, b.guest_email as user_email, r.name as room_name, h.name as hotel_name
    FROM reschedule_requests rr
    JOIN bookings b ON rr.booking_id = b.id
    JOIN rooms r ON b.room_id = r.id
    JOIN hotels h ON b.hotel_id = h.id
    ORDER BY rr.requested_at DESC
  `);

  return requests;
}

async function getRescheduleRequestById(id) {
  const [rows] = await pool.execute(
    'SELECT * FROM reschedule_requests WHERE id = ?',
    [id]
  );

  return rows[0] || null;
}

async function deleteRescheduleRequestById(id) {
  await pool.execute('DELETE FROM reschedule_requests WHERE id = ?', [id]);
}

async function getBookingSummaryForApprove(bookingId) {
  const [rows] = await pool.execute(`
    SELECT b.*, r.name as room_name, r.room_number, h.name as hotel_name
    FROM bookings b
    JOIN rooms r ON b.room_id = r.id
    JOIN hotels h ON b.hotel_id = h.id
    WHERE b.id = ?
  `, [bookingId]);

  return rows[0] || null;
}

async function updateRescheduleRequestRejected(id, reviewNotes) {
  await pool.execute(`
    UPDATE reschedule_requests 
    SET status = 'rejected', reviewed_at = NOW(), reviewed_by = 'Admin', review_notes = ?
    WHERE id = ?
  `, [reviewNotes, id]);
}

async function updateRescheduleRequestApproved(id, reviewNotes) {
  await pool.execute(`
    UPDATE reschedule_requests 
    SET status = 'approved', reviewed_at = NOW(), reviewed_by = 'Admin', review_notes = ?
    WHERE id = ?
  `, [reviewNotes, id]);
}

async function getRescheduleRequestDetailsWithJoins(id) {
  const [rows] = await pool.execute(`
    SELECT rr.*, b.guest_email as user_email, r.name as room_name, h.name as hotel_name
    FROM reschedule_requests rr
    JOIN bookings b ON rr.booking_id = b.id
    JOIN rooms r ON b.room_id = r.id
    JOIN hotels h ON b.hotel_id = h.id
    WHERE rr.id = ?
  `, [id]);

  return rows[0] || null;
}

async function getUserRescheduleRequestsWithJoins(userId) {
  const [requests] = await pool.execute(`
    SELECT rr.*, b.guest_email as user_email, r.name as room_name, h.name as hotel_name
    FROM reschedule_requests rr
    JOIN bookings b ON rr.booking_id = b.id
    JOIN rooms r ON b.room_id = r.id
    JOIN hotels h ON b.hotel_id = h.id
    WHERE b.user_id = ? OR b.guest_email = (
      SELECT email FROM users WHERE id = ?
    )
    ORDER BY rr.requested_at DESC
  `, [userId, userId]);

  return requests;
}

module.exports = {
  getBookingWithRoomAndHotel,
  createRescheduleRequest,
  updateBookingStatus,
  updateBookingDatesFromReschedule,
  getAllRescheduleRequestsWithJoins,
  getRescheduleRequestById,
  deleteRescheduleRequestById,
  getBookingSummaryForApprove,
  updateRescheduleRequestRejected,
  updateRescheduleRequestApproved,
  getRescheduleRequestDetailsWithJoins,
  getUserRescheduleRequestsWithJoins,
};
