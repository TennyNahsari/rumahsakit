const express = require('express');
const { body } = require('express-validator');
const { auth, authorize } = require('../middleware/authMiddleware');
const { 
  getPatients, 
  getPatient, 
  createPatient, 
  updatePatient, 
  deletePatient,
  searchPatients,
  exportPatientsExcel
} = require('../controllers/patientController');

const router = express.Router();

// @route   GET /api/patients/export/excel
// @desc    Export all patients to Excel
// @access  Private
router.get('/export/excel', auth, exportPatientsExcel);

// @route   GET /api/patients
// @desc    Get all patients with pagination
// @access  Private
router.get('/', auth, getPatients);

// @route   GET /api/patients/search
// @desc    Search patients
// @access  Private
router.get('/search', auth, searchPatients);

// @route   GET /api/patients/:id
// @desc    Get patient by ID
// @access  Private
router.get('/:id', auth, getPatient);

// @route   POST /api/patients
// @desc    Create new patient
// @access  Private (Admin, Front Desk, Doctor, Nurse)
router.post('/', [
  auth,
  authorize('ADMIN', 'FRONT_DESK', 'DOCTOR', 'NURSE'),
  body('name').trim().isLength({ min: 2 }),
  body('dateOfBirth').isISO8601(),
  body('gender').isIn(['MALE', 'FEMALE', 'OTHER']),
  body('phone').optional().trim(),
  body('address').optional().trim()
], createPatient);

// @route   PUT /api/patients/:id
// @desc    Update patient
// @access  Private (Admin, Front Desk, Doctor, Nurse)
router.put('/:id', [
  auth,
  authorize('ADMIN', 'FRONT_DESK', 'DOCTOR', 'NURSE'),
  body('name').optional().trim().isLength({ min: 2 }),
  body('dateOfBirth').optional().isISO8601(),
  body('gender').optional().isIn(['MALE', 'FEMALE', 'OTHER']),
  body('phone').optional().trim(),
  body('address').optional().trim()
], updatePatient);

// @route   DELETE /api/patients/:id
// @desc    Delete patient (soft delete)
// @access  Private (Admin only)
router.delete('/:id', auth, authorize('ADMIN'), deletePatient);

module.exports = router;