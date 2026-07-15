const express = require('express');
const router = express.Router();
const { getDashboardStats, getLibrarianDashboard } = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.get('/stats', protect, authorize('admin'), getDashboardStats);
router.get('/librarian', protect, authorize('admin', 'librarian'), getLibrarianDashboard);

module.exports = router;
