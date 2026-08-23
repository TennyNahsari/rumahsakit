const express = require('express');
const { body } = require('express-validator');
const { auth, authorize } = require('../middleware/authMiddleware');
const {
  getPublicDoctors,
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  exportUsersExcel
} = require('../controllers/userController');

const router = express.Router();

// @route   GET /api/users/public/doctors
// @desc    Get active doctors for public display
// @access  Public
router.get('/public/doctors', getPublicDoctors);

// @route   GET /api/users/export/excel
// @desc    Export all users to Excel
// @access  Private (Admin)
router.get('/export/excel', auth, authorize('ADMIN'), exportUsersExcel);

// @route   GET /api/users
// @desc    Get all users
// @access  Private (Admin)
router.get('/', auth, authorize('ADMIN'), getUsers);

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private (Admin)
router.get('/:id', auth, authorize('ADMIN'), getUser);

// @route   POST /api/users
// @desc    Create new user
// @access  Private (Admin)
router.post('/', [
  auth,
  authorize('ADMIN'),
  body('name').trim().isLength({ min: 2 }),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('role').isIn(['ADMIN', 'DOCTOR', 'NURSE', 'FRONT_DESK', 'PHARMACY', 'LABORATORY', 'PATIENT'])
], createUser);

// @route   PUT /api/users/:id
// @desc    Update user
// @access  Private (Admin)
router.put('/:id', [
  auth,
  authorize('ADMIN')
], updateUser);

// @route   DELETE /api/users/:id
// @desc    Delete user
// @access  Private (Admin)
router.delete('/:id', auth, authorize('ADMIN'), deleteUser);

module.exports = router;