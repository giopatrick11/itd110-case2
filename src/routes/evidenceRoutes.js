const express = require('express');
const router = express.Router();
const evidenceController = require('../controllers/evidenceController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, async (req, res) => {
    try {
        const result = await evidenceController.getAllEvidence();
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/', protect, async (req, res) => {
    if (req.user.role === 'Responder') {
        return res.status(403).json({ message: 'First Responders have view-only access.' });
    }
    try {
        const result = await evidenceController.createEvidence(req.body);
        res.status(201).json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/:id', protect, async (req, res) => {
    if (req.user.role === 'Responder') {
        return res.status(403).json({ message: 'First Responders have view-only access.' });
    }
    try {
        await evidenceController.deleteEvidence(req.params.id);
        res.json({ message: 'Evidence deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
