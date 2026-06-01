const { getSession } = require('../config/neo4j');
const { v4: uuidv4 } = require('uuid');

/**
 * Get all reports
 */
const getAllReports = async () => {
    const session = getSession();
    try {
        const result = await session.run('MATCH (r:Report) RETURN r ORDER BY r.createdAt DESC');
        return result.records.map(record => record.get('r').properties);
    } finally {
        await session.close();
    }
};

/**
 * Create Report and link to Incident
 */
const createReport = async (reportData) => {
    const session = getSession();
    const id = uuidv4();
    const now = new Date().toISOString();
    
    console.log('Creating Report:', reportData);
    
    try {
        const result = await session.run(
            `CREATE (r:Report {
                id: $id,
                reportNumber: $reportNumber,
                summary: $summary,
                fullText: $fullText,
                classification: $classification,
                createdAt: $now,
                updatedAt: $now
            }) RETURN r`,
            {
                id,
                reportNumber: reportData.reportNumber,
                summary: reportData.summary,
                fullText: reportData.fullText,
                classification: reportData.classification || 'Internal',
                now
            }
        );
        
        const report = result.records[0].get('r').properties;
        
        // Link to Incident
        if (reportData.incidentId) {
            await session.run(
                `MATCH (r:Report {id: $reportId}), (i:Incident {id: $incidentId})
                 MERGE (r)-[:DOCUMENTS]->(i)`,
                { reportId: id, incidentId: reportData.incidentId }
            );
        }
        
        return report;
    } finally {
        await session.close();
    }
};

/**
 * Delete Report
 */
const deleteReport = async (id) => {
    const session = getSession();
    try {
        await session.run('MATCH (r:Report {id: $id}) DETACH DELETE r', { id });
        return true;
    } finally {
        await session.close();
    }
};

module.exports = {
    getAllReports,
    createReport,
    deleteReport
};
