const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');

/**
 * @route GET /api/dashboard
 * @desc Get dashboard metrics and summary
 */
router.get('/', protect, async (req, res) => {
    try {
        const metrics = await dashboardController.getDashboardMetrics();
        res.json(metrics);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
