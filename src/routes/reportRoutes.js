const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, async (req, res) => {
    try {
        const result = await reportController.getAllReports();
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/', protect, async (req, res) => {
    try {
        const result = await reportController.createReport(req.body);
        res.status(201).json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/:id', protect, async (req, res) => {
    try {
        await reportController.deleteReport(req.params.id);
        res.json({ message: 'Report deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
