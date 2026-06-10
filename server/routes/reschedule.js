const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/authMiddleware');
const {
  createRescheduleRequest,
  getAllRescheduleRequests,
  getUserRescheduleRequests,
  approveRescheduleRequest,
  rejectRescheduleRequest,
} = require('../controllers/rescheduleController');

// Create reschedule request
router.post('/', verifyToken, createRescheduleRequest);

// Get all reschedule requests (staff only)
router.get('/', verifyToken, getAllRescheduleRequests);

// Get user reschedule requests
router.get('/user', verifyToken, getUserRescheduleRequests);

// Approve reschedule request (staff only)
router.patch('/:id/approve', verifyToken, approveRescheduleRequest);

// Reject reschedule request (staff only)
router.patch('/:id/reject', verifyToken, rejectRescheduleRequest);

module.exports = router;
