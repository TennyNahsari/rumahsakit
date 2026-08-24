const express = require('express');
const { body } = require('express-validator');
const { auth, authorize } = require('../middleware/authMiddleware');
const {
  getVisits,
  getVisit,
  createVisit,
  updateVisit,
  deleteVisit,
  exportVisitsExcel,
  callVisit,
  startVisit,
  completeVisit,
  skipVisit,
  getQueueDisplay,
  createPublicBooking,
  autoCompleteDayVisits
} = require('../controllers/visitController');

const router = express.Router();

// Public Endpoints (No Auth Required)
// @route   POST /api/visits/public-booking
// @desc    Register online appointment from Landing Page
router.post('/public-booking', createPublicBooking);

// @route   GET /api/visits/queue-display
// @desc    Get real-time TV Queue Display
router.get('/queue-display', getQueueDisplay);

// Protected Endpoints (Auth Required)
// @route   POST /api/visits/auto-complete-day
router.post('/auto-complete-day', auth, authorize('ADMIN', 'FRONT_DESK'), autoCompleteDayVisits);

// @route   GET /api/visits/export/excel
router.get('/export/excel', auth, exportVisitsExcel);

// @route   GET /api/visits
router.get('/', auth, getVisits);

// @route   GET /api/visits/:id
router.get('/:id', auth, getVisit);

// @route   POST /api/visits
router.post('/', [
  auth,
  authorize('ADMIN', 'FRONT_DESK', 'DOCTOR'),
  body('patientId').isInt(),
  body('doctorId').isInt()
], createVisit);

// Queue Operational Actions
// @route   POST /api/visits/:id/call
router.post('/:id/call', auth, authorize('ADMIN', 'FRONT_DESK', 'DOCTOR'), callVisit);

// @route   POST /api/visits/:id/start
router.post('/:id/start', auth, authorize('ADMIN', 'DOCTOR'), startVisit);

// @route   POST /api/visits/:id/complete
router.post('/:id/complete', auth, authorize('ADMIN', 'DOCTOR'), completeVisit);

// @route   POST /api/visits/:id/skip
router.post('/:id/skip', auth, authorize('ADMIN', 'FRONT_DESK', 'DOCTOR'), skipVisit);

// @route   PUT /api/visits/:id
router.put('/:id', auth, authorize('ADMIN', 'FRONT_DESK', 'DOCTOR', 'NURSE'), updateVisit);

// @route   DELETE /api/visits/:id
router.delete('/:id', auth, authorize('ADMIN'), deleteVisit);

module.exports = router;