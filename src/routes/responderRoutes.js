const express = require('express');
const router = express.Router();
const responderController = require('../controllers/responderController');

/**
 * @route GET /api/responders
 * @desc Get all responders
 */
router.get('/', async (req, res) => {
    try {
        const responders = await responderController.getAllResponders();
        res.json(responders);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @route GET /api/responders/:id
 * @desc Get responder by ID
 */
router.get('/:id', async (req, res) => {
    try {
        const responder = await responderController.getResponderById(req.params.id);
        if (!responder) {
            return res.status(404).json({ message: 'Responder not found' });
        }
        res.json(responder);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @route POST /api/responders
 * @desc Create a new responder
 */
router.post('/', async (req, res) => {
    try {
        const responder = await responderController.createResponder(req.body);
        res.status(201).json(responder);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @route PUT /api/responders/:id
 * @desc Update a responder
 */
router.put('/:id', async (req, res) => {
    try {
        const responder = await responderController.updateResponder(req.params.id, req.body);
        if (!responder) {
            return res.status(404).json({ message: 'Responder not found' });
        }
        res.json(responder);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @route DELETE /api/responders/:id
 * @desc Delete a responder
 */
router.delete('/:id', async (req, res) => {
    try {
        const success = await responderController.deleteResponder(req.params.id);
        if (!success) {
            return res.status(404).json({ message: 'Responder not found' });
        }
        res.json({ message: 'Responder deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
