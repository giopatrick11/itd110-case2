const express = require('express');
const router = express.Router();
const incidentController = require('../controllers/incidentController');

/**
 * @route GET /api/incidents
 * @desc Get all incidents
 */
router.get('/', async (req, res) => {
    try {
        const incidents = await incidentController.getAllIncidents();
        res.json(incidents);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @route GET /api/incidents/:id
 * @desc Get incident by ID
 */
router.get('/:id', async (req, res) => {
    try {
        const incident = await incidentController.getIncidentById(req.params.id);
        if (!incident) {
            return res.status(404).json({ message: 'Incident not found' });
        }
        res.json(incident);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @route POST /api/incidents
 * @desc Create a new incident
 */
router.post('/', async (req, res) => {
    try {
        const incident = await incidentController.createIncident(req.body);
        res.status(201).json(incident);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @route PUT /api/incidents/:id
 * @desc Update an incident
 */
router.put('/:id', async (req, res) => {
    try {
        const incident = await incidentController.updateIncident(req.params.id, req.body);
        if (!incident) {
            return res.status(404).json({ message: 'Incident not found' });
        }
        res.json(incident);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @route DELETE /api/incidents/:id
 * @desc Delete an incident
 */
router.delete('/:id', async (req, res) => {
    try {
        const success = await incidentController.deleteIncident(req.params.id);
        if (!success) {
            return res.status(404).json({ message: 'Incident not found' });
        }
        res.json({ message: 'Incident deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @route POST /api/incidents/:incidentId/location/:locationId
 * @desc Connect incident to location
 */
router.post('/:incidentId/location/:locationId', async (req, res) => {
    try {
        const result = await incidentController.connectIncidentToLocation(
            req.params.incidentId,
            req.params.locationId
        );
        if (!result) {
            return res.status(404).json({ message: 'Incident or Location not found' });
        }
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @route GET /api/incidents/:id/graph
 * @desc Get incident with connected location and persons
 */
router.get('/:id/graph', async (req, res) => {
    try {
        const graph = await incidentController.getIncidentGraphExtended(req.params.id);
        if (!graph) {
            return res.status(404).json({ message: 'Incident not found' });
        }
        res.json(graph);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @route POST /api/incidents/:incidentId/persons/:personId
 * @desc Connect person to incident
 */
router.post('/:incidentId/persons/:personId', async (req, res) => {
    const { relationship } = req.body;
    const allowedRelationships = ['INVOLVED_IN', 'WITNESSED', 'SUSPECTED_IN'];

    if (!allowedRelationships.includes(relationship)) {
        return res.status(400).json({ 
            message: 'Invalid relationship type. Allowed: ' + allowedRelationships.join(', ') 
        });
    }

    try {
        const result = await incidentController.connectPersonToIncident(
            req.params.incidentId,
            req.params.personId,
            relationship
        );
        if (!result) {
            return res.status(404).json({ message: 'Incident or Person not found' });
        }
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @route POST /api/incidents/:incidentId/responders/:responderId
 * @desc Connect responder to incident
 */
router.post('/:incidentId/responders/:responderId', async (req, res) => {
    try {
        const result = await incidentController.connectResponderToIncident(
            req.params.incidentId,
            req.params.responderId
        );
        if (!result) {
            return res.status(404).json({ message: 'Incident or Responder not found' });
        }
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
