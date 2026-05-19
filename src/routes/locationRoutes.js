const express = require('express');
const router = express.Router();
const locationController = require('../controllers/locationController');

/**
 * @route GET /api/locations
 * @desc Get all locations
 */
router.get('/', async (req, res) => {
    try {
        const locations = await locationController.getAllLocations();
        res.json(locations);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @route GET /api/locations/:id
 * @desc Get location by ID
 */
router.get('/:id', async (req, res) => {
    try {
        const location = await locationController.getLocationById(req.params.id);
        if (!location) {
            return res.status(404).json({ message: 'Location not found' });
        }
        res.json(location);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @route POST /api/locations
 * @desc Create a new location
 */
router.post('/', async (req, res) => {
    try {
        const location = await locationController.createLocation(req.body);
        res.status(201).json(location);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @route PUT /api/locations/:id
 * @desc Update a location
 */
router.put('/:id', async (req, res) => {
    try {
        const location = await locationController.updateLocation(req.params.id, req.body);
        if (!location) {
            return res.status(404).json({ message: 'Location not found' });
        }
        res.json(location);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @route DELETE /api/locations/:id
 * @desc Delete a location
 */
router.delete('/:id', async (req, res) => {
    try {
        const success = await locationController.deleteLocation(req.params.id);
        if (!success) {
            return res.status(404).json({ message: 'Location not found' });
        }
        res.json({ message: 'Location deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
