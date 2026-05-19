const express = require('express');
const router = express.Router();
const backupController = require('../controllers/backupController');
const { protect } = require('../middleware/authMiddleware');

/**
 * @route GET /api/backup
 * @desc Export all graph data as a JSON file
 */
router.get('/', protect, async (req, res) => {
    try {
        const data = await backupController.exportBackupData();
        
        // Set headers for file download
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename="safelink-backup.json"');
        
        res.send(JSON.stringify(data, null, 2));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
