const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { auth, authorize } = require('../middleware/authMiddleware');

// Get social links (Public)
router.get('/social-links', settingsController.getSocialLinks);

// Update social links (Admin only)
router.put('/social-links', auth, authorize('ADMIN'), settingsController.updateSocialLinks);

module.exports = router;
