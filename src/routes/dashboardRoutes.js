const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

/**
 * @route GET /api/dashboard
 * @desc Get dashboard metrics and summary
 */
router.get('/', async (req, res) => {
    try {
        const metrics = await dashboardController.getDashboardMetrics();
        res.json(metrics);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
