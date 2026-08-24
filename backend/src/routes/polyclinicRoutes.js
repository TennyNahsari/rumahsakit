const express = require('express');
const router = express.Router();
const polyclinicController = require('../controllers/polyclinicController');
const { auth, authorize } = require('../middleware/authMiddleware');

// Public route for landing page
router.get('/public', polyclinicController.getPublicPolyclinics);

// Protected routes
router.get(
  '/',
  auth,
  authorize('ADMIN', 'DOCTOR', 'NURSE', 'FRONT_DESK', 'PATIENT'),
  polyclinicController.getPolyclinics
);

router.get(
  '/:id',
  auth,
  authorize('ADMIN', 'DOCTOR', 'NURSE', 'FRONT_DESK', 'PATIENT'),
  polyclinicController.getPolyclinicById
);

router.post(
  '/',
  auth,
  authorize('ADMIN', 'FRONT_DESK'),
  polyclinicController.createPolyclinic
);

router.put(
  '/:id',
  auth,
  authorize('ADMIN', 'FRONT_DESK'),
  polyclinicController.updatePolyclinic
);

router.delete(
  '/:id',
  auth,
  authorize('ADMIN', 'FRONT_DESK'),
  polyclinicController.deletePolyclinic
);

module.exports = router;
