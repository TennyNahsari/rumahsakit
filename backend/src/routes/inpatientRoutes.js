const express = require('express');
const { body } = require('express-validator');
const { auth, authorize } = require('../middleware/authMiddleware');
const {
  getInpatients,
  getInpatient,
  checkInPatient,
  updateOccupancy,
  updateStatus,
  deleteInpatient,
  checkOutPatient,
  getOccupancyHistory,
  exportHistoryExcel
} = require('../controllers/inpatientController');

const router = express.Router();

// @route   GET /api/inpatients/history/export
// @desc    Export occupancy history to Excel
// @access  Private
router.get('/history/export', auth, exportHistoryExcel);

// @route   GET /api/inpatients/history
// @desc    Get occupancy history
// @access  Private
router.get('/history', auth, getOccupancyHistory);

// @route   POST /api/inpatients/check-in
// @desc    Check-in patient to room
// @access  Private (Admin, Nurse, Front Desk)
router.post('/check-in', [
  auth,
  authorize('ADMIN', 'NURSE', 'FRONT_DESK'),
  body('patientId').isInt().withMessage('Patient ID is required'),
  body('roomId').isInt().withMessage('Room ID is required'),
  body('doctorId').isInt().withMessage('Doctor ID is required'),
  body('initialDiagnosis').notEmpty().withMessage('Initial diagnosis is required'),
  body('bedNumber').optional().isInt({ min: 1 }),
  body('checkedInAt').optional().isISO8601(),
  body('estimatedCheckoutAt').optional().isISO8601(),
  body('careClass').optional().isString(),
  body('status').optional().isIn(['PENDING', 'CONFIRMED', 'CHECKED_IN', 'ACTIVE']),
  body('notes').optional().isString()
], checkInPatient);

// @route   PATCH /api/inpatients/:id/status
// @desc    Update inpatient status (PENDING, CONFIRMED, CHECKED_IN, CHECKED_OUT, CANCELLED)
// @access  Private (Admin, Nurse, Front Desk)
router.patch('/:id/status', [
  auth,
  authorize('ADMIN', 'NURSE', 'FRONT_DESK'),
  body('status').isIn(['PENDING', 'CONFIRMED', 'CHECKED_IN', 'ACTIVE', 'CHECKED_OUT', 'CANCELLED']).withMessage('Valid status is required')
], updateStatus);

// @route   POST /api/inpatients/:id/check-out
// @desc    Check-out patient from room
// @access  Private (Admin, Nurse, Doctor)
router.post('/:id/check-out', [
  auth,
  authorize('ADMIN', 'NURSE', 'DOCTOR'),
  body('checkedOutAt').optional().isISO8601(),
  body('dischargeCondition').isIn(['SEMBUH', 'MEMBAIK', 'RUJUK', 'MENINGGAL', 'APS']),
  body('finalDiagnosis').optional().isString(),
  body('dischargeNotes').optional().isString()
], checkOutPatient);

// @route   GET /api/inpatients
// @desc    Get all active inpatients
// @access  Private
router.get('/', auth, getInpatients);

// @route   GET /api/inpatients/:id
// @desc    Get single inpatient detail
// @access  Private
router.get('/:id', auth, getInpatient);

// @route   PUT /api/inpatients/:id
// @desc    Update occupancy (change room, doctor, diagnosis, status, etc)
// @access  Private (Admin, Nurse, Front Desk)
router.put('/:id', [
  auth,
  authorize('ADMIN', 'NURSE', 'FRONT_DESK'),
  body('roomId').optional().isInt(),
  body('bedNumber').optional().isInt({ min: 1 }),
  body('doctorId').optional().isInt(),
  body('estimatedCheckoutAt').optional().isISO8601(),
  body('status').optional().isIn(['PENDING', 'CONFIRMED', 'CHECKED_IN', 'ACTIVE', 'CHECKED_OUT', 'CANCELLED'])
], updateOccupancy);

// @route   DELETE /api/inpatients/:id
// @desc    Delete inpatient occupancy record
// @access  Private (Admin, Nurse, Front Desk)
router.delete('/:id', [
  auth,
  authorize('ADMIN', 'NURSE', 'FRONT_DESK')
], deleteInpatient);

module.exports = router;
