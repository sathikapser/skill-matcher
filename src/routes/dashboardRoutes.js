const express = require('express');
const router = express.Router();
const { getDashboardData } = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');

// Protected routes
router.get('/', protect, getDashboardData);
router.get('/:userId', protect, getDashboardData);

module.exports = router;
