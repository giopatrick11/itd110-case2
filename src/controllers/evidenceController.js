const { getSession } = require('../config/neo4j');
const { v4: uuidv4 } = require('uuid');

/**
 * Get all evidence
 */
const getAllEvidence = async () => {
    const session = getSession();
    try {
        const result = await session.run('MATCH (e:Evidence) RETURN e ORDER BY e.createdAt DESC');
        return result.records.map(record => record.get('e').properties);
    } finally {
        await session.close();
    }
};

/**
 * Create Evidence and link to Incident and optionally Location
 */
const createEvidence = async (evidenceData) => {
    const session = getSession();
    const id = uuidv4();
    const now = new Date().toISOString();
    
    console.log('Creating Evidence:', evidenceData);
    
    try {
        const result = await session.run(
            `CREATE (e:Evidence {
                id: $id,
                name: $name,
                type: $type,
                status: $status,
                storageLocation: $storageLocation,
                createdAt: $now,
                updatedAt: $now
            }) RETURN e`,
            {
                id,
                name: evidenceData.name,
                type: evidenceData.type,
                status: evidenceData.status || 'Logged',
                storageLocation: evidenceData.storageLocation || 'N/A',
                now
            }
        );
        
        const evidence = result.records[0].get('e').properties;
        
        // Link to Incident
        if (evidenceData.incidentId) {
            await session.run(
                `MATCH (e:Evidence {id: $evidenceId}), (i:Incident {id: $incidentId})
                 MERGE (e)-[:RELATED_TO]->(i)`,
                { evidenceId: id, incidentId: evidenceData.incidentId }
            );
        }
        
        // Link to Location
        if (evidenceData.locationId) {
            await session.run(
                `MATCH (e:Evidence {id: $evidenceId}), (l:Location {id: $locationId})
                 MERGE (e)-[:FOUND_AT]->(l)`,
                { evidenceId: id, locationId: evidenceData.locationId }
            );
        }
        
        return evidence;
    } finally {
        await session.close();
    }
};

/**
 * Delete Evidence
 */
const deleteEvidence = async (id) => {
    const session = getSession();
    try {
        await session.run('MATCH (e:Evidence {id: $id}) DETACH DELETE e', { id });
        return true;
    } finally {
        await session.close();
    }
};

module.exports = {
    getAllEvidence,
    createEvidence,
    deleteEvidence
};
