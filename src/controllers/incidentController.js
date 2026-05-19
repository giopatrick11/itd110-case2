const { getSession } = require('../config/neo4j');
const { v4: uuidv4 } = require('uuid');
const neo4j = require('neo4j-driver');

/**
 * Get all incidents with pagination
 */
const getAllIncidents = async (page = 1, limit = 10) => {
    const session = getSession();
    const skip = (page - 1) * limit;
    
    try {
        const result = await session.run(
            `MATCH (i:Incident)
             WITH count(i) as total
             MATCH (i:Incident)
             RETURN i, total
             ORDER BY i.createdAt DESC
             SKIP $skip LIMIT $limit`,
            { 
                skip: neo4j.int(parseInt(skip)), 
                limit: neo4j.int(parseInt(limit)) 
            }
        );
        
        const incidents = result.records.map(record => record.get('i').properties);
        const total = result.records.length > 0 ? result.records[0].get('total').toInt() : 0;
        
        return {
            incidents,
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(total / limit)
        };
    } finally {
        await session.close();
    }
};

/**
 * Get incident by ID
 */
const getIncidentById = async (id) => {
    const session = getSession();
    try {
        const result = await session.run(
            'MATCH (i:Incident {id: $id}) RETURN i',
            { id }
        );
        if (result.records.length === 0) return null;
        return result.records[0].get('i').properties;
    } finally {
        await session.close();
    }
};

/**
 * Create a new incident
 */
const createIncident = async (incidentData) => {
    const session = getSession();
    const id = uuidv4();
    const now = new Date().toISOString();
    
    try {
        const result = await session.run(
            `CREATE (i:Incident {
                id: $id,
                title: $title,
                type: $type,
                description: $description,
                status: $status,
                severity: $severity,
                date: $date,
                createdAt: $createdAt,
                updatedAt: $updatedAt
            }) RETURN i`,
            {
                id,
                title: incidentData.title,
                type: incidentData.type,
                description: incidentData.description,
                status: incidentData.status || 'Open',
                severity: incidentData.severity || 'Medium',
                date: incidentData.date || now,
                createdAt: now,
                updatedAt: now
            }
        );
        return result.records[0].get('i').properties;
    } finally {
        await session.close();
    }
};

/**
 * Update an incident
 */
const updateIncident = async (id, incidentData) => {
    const session = getSession();
    const now = new Date().toISOString();
    
    try {
        const result = await session.run(
            `MATCH (i:Incident {id: $id})
             SET i.title = $title,
                 i.type = $type,
                 i.description = $description,
                 i.status = $status,
                 i.severity = $severity,
                 i.date = $date,
                 i.updatedAt = $updatedAt
             RETURN i`,
            {
                id,
                title: incidentData.title,
                type: incidentData.type,
                description: incidentData.description,
                status: incidentData.status,
                severity: incidentData.severity,
                date: incidentData.date,
                updatedAt: now
            }
        );
        if (result.records.length === 0) return null;
        return result.records[0].get('i').properties;
    } finally {
        await session.close();
    }
};

/**
 * Delete an incident
 */
const deleteIncident = async (id) => {
    const session = getSession();
    try {
        const result = await session.run(
            'MATCH (i:Incident {id: $id}) DETACH DELETE i RETURN count(i) as deletedCount',
            { id }
        );
        return result.records[0].get('deletedCount').toInt() > 0;
    } finally {
        await session.close();
    }
};

/**
 * Connect incident to location
 */
const connectIncidentToLocation = async (incidentId, locationId) => {
    const session = getSession();
    try {
        const result = await session.run(
            `MATCH (i:Incident {id: $incidentId})
             MATCH (l:Location {id: $locationId})
             MERGE (i)-[r:OCCURRED_AT]->(l)
             RETURN i, r, l`,
            { incidentId, locationId }
        );
        if (result.records.length === 0) return null;
        return {
            incident: result.records[0].get('i').properties,
            location: result.records[0].get('l').properties
        };
    } finally {
        await session.close();
    }
};

/**
 * Get incident with its connected location
 */
const getIncidentGraph = async (id) => {
    const session = getSession();
    try {
        const result = await session.run(
            `MATCH (i:Incident {id: $id})
             OPTIONAL MATCH (i)-[:OCCURRED_AT]->(l:Location)
             RETURN i, l`,
            { id }
        );
        if (result.records.length === 0) return null;
        
        const incident = result.records[0].get('i').properties;
        const locationNode = result.records[0].get('l');
        const location = locationNode ? locationNode.properties : null;
        
        return {
            ...incident,
            location
        };
    } finally {
        await session.close();
    }
};

/**
 * Connect person to incident
 */
const connectPersonToIncident = async (incidentId, personId, relationship) => {
    const session = getSession();
    try {
        // Use APOC or simple dynamic relationship creation if possible, 
        // but here we use a switch/case to be safe with standard Cypher parameters
        let query = '';
        switch (relationship) {
            case 'INVOLVED_IN':
                query = 'MATCH (p:Person {id: $personId}), (i:Incident {id: $incidentId}) MERGE (p)-[r:INVOLVED_IN]->(i) RETURN p, r, i';
                break;
            case 'WITNESSED':
                query = 'MATCH (p:Person {id: $personId}), (i:Incident {id: $incidentId}) MERGE (p)-[r:WITNESSED]->(i) RETURN p, r, i';
                break;
            case 'SUSPECTED_IN':
                query = 'MATCH (p:Person {id: $personId}), (i:Incident {id: $incidentId}) MERGE (p)-[r:SUSPECTED_IN]->(i) RETURN p, r, i';
                break;
            default:
                throw new Error('Invalid relationship type');
        }

        const result = await session.run(query, { incidentId, personId });
        
        if (result.records.length === 0) return null;
        
        return {
            person: result.records[0].get('p').properties,
            incident: result.records[0].get('i').properties,
            relationship: result.records[0].get('r').type
        };
    } finally {
        await session.close();
    }
};

/**
 * Connect responder to incident
 */
const connectResponderToIncident = async (incidentId, responderId) => {
    const session = getSession();
    try {
        const result = await session.run(
            `MATCH (r:Responder {id: $responderId})
             MATCH (i:Incident {id: $incidentId})
             MERGE (r)-[rel:RESPONDED_TO]->(i)
             RETURN r, rel, i`,
            { incidentId, responderId }
        );
        if (result.records.length === 0) return null;
        return {
            responder: result.records[0].get('r').properties,
            incident: result.records[0].get('i').properties
        };
    } finally {
        await session.close();
    }
};

/**
 * Get incident with its connected location, persons, and responders
 */
const getIncidentGraphExtended = async (id) => {
    const session = getSession();
    try {
        const result = await session.run(
            `MATCH (i:Incident {id: $id})
             OPTIONAL MATCH (i)-[:OCCURRED_AT]->(l:Location)
             WITH i, l
             OPTIONAL MATCH (p:Person)-[r]->(i)
             WHERE type(r) IN ["INVOLVED_IN", "WITNESSED", "SUSPECTED_IN"]
             WITH i, l, collect(CASE WHEN p IS NOT NULL THEN {person: properties(p), relationship: type(r)} END) as persons
             OPTIONAL MATCH (res:Responder)-[rel:RESPONDED_TO]->(i)
             RETURN i, l, persons, collect(CASE WHEN res IS NOT NULL THEN properties(res) END) as responders`,
            { id }
        );
        if (result.records.length === 0) return null;
        
        const incident = result.records[0].get('i').properties;
        const locationNode = result.records[0].get('l');
        const location = locationNode ? locationNode.properties : null;
        const persons = result.records[0].get('persons');
        const responders = result.records[0].get('responders');
        
        return {
            ...incident,
            location,
            persons,
            responders
        };
    } finally {
        await session.close();
    }
};

module.exports = {
    getAllIncidents,
    getIncidentById,
    createIncident,
    updateIncident,
    deleteIncident,
    connectIncidentToLocation,
    getIncidentGraph,
    connectPersonToIncident,
    getIncidentGraphExtended,
    connectResponderToIncident
};
