const express = require('express');
const router = express.Router();
const personController = require('../controllers/personController');
const { protect } = require('../middleware/authMiddleware');

/**
 * @route GET /api/persons
 * @desc Get all persons
 */
router.get('/', protect, async (req, res) => {
    try {
        const persons = await personController.getAllPersons();
        res.json(persons);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @route GET /api/persons/:id
 * @desc Get person by ID
 */
router.get('/:id', protect, async (req, res) => {
    try {
        const person = await personController.getPersonById(req.params.id);
        if (!person) {
            return res.status(404).json({ message: 'Person not found' });
        }
        res.json(person);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @route POST /api/persons
 * @desc Create a new person
 */
router.post('/', protect, async (req, res) => {
    try {
        const person = await personController.createPerson(req.body);
        res.status(201).json(person);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @route PUT /api/persons/:id
 * @desc Update a person
 */
router.put('/:id', protect, async (req, res) => {
    try {
        const person = await personController.updatePerson(req.params.id, req.body);
        if (!person) {
            return res.status(404).json({ message: 'Person not found' });
        }
        res.json(person);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @route DELETE /api/persons/:id
 * @desc Delete a person
 */
router.delete('/:id', protect, async (req, res) => {
    try {
        const success = await personController.deletePerson(req.params.id);
        if (!success) {
            return res.status(404).json({ message: 'Person not found' });
        }
        res.json({ message: 'Person deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
