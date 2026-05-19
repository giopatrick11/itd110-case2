const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');

/**
 * @route GET /api/search
 * @desc Search incidents with various filters
 */
router.get('/', async (req, res) => {
    try {
        const results = await searchController.searchIncidents(req.query);
        res.json(results);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
