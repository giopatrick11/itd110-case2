const { getSession } = require('../config/neo4j');

/**
 * Get dashboard metrics
 */
const getDashboardMetrics = async () => {
    const session = getSession();
    
    try {
        // Run multiple queries in parallel for efficiency if needed, 
        // but for simplicity and readability, we'll use a single session and multiple run calls
        // or a single complex query. A single query with multiple returns is often efficient in Neo4j.
        
        const summaryResult = await session.run(`
            CALL {
                MATCH (i:Incident) RETURN count(i) as totalIncidents
            }
            CALL {
                MATCH (l:Location) RETURN count(l) as totalLocations
            }
            CALL {
                MATCH (p:Person) RETURN count(p) as totalPersons
            }
            CALL {
                MATCH (r:Responder) RETURN count(r) as totalResponders
            }
            RETURN totalIncidents, totalLocations, totalPersons, totalResponders
        `);

        const typeResult = await session.run(`
            MATCH (i:Incident) 
            RETURN i.type as name, count(i) as value 
            ORDER BY value DESC
        `);

        const statusResult = await session.run(`
            MATCH (i:Incident) 
            RETURN i.status as name, count(i) as value 
            ORDER BY value DESC
        `);

        const severityResult = await session.run(`
            MATCH (i:Incident) 
            RETURN i.severity as name, count(i) as value 
            ORDER BY value DESC
        `);

        const locationStatsResult = await session.run(`
            MATCH (i:Incident)-[:OCCURRED_AT]->(l:Location) 
            RETURN l.name as name, count(i) as value 
            ORDER BY value DESC LIMIT 10
        `);

        const recentIncidentsResult = await session.run(`
            MATCH (i:Incident) 
            RETURN i 
            ORDER BY i.createdAt DESC LIMIT 5
        `);

        const highRiskLocationsResult = await session.run(`
            MATCH (l:Location) 
            WHERE toLower(l.riskLevel) IN ["high", "critical"] 
            RETURN l 
            ORDER BY l.name
        `);

        const summary = summaryResult.records[0];

        return {
            summary: {
                totalIncidents: summary.get('totalIncidents').toInt(),
                totalLocations: summary.get('totalLocations').toInt(),
                totalPersons: summary.get('totalPersons').toInt(),
                totalResponders: summary.get('totalResponders').toInt()
            },
            incidentsByType: typeResult.records.map(r => ({ name: r.get('name'), value: r.get('value').toInt() })),
            incidentsByStatus: statusResult.records.map(r => ({ name: r.get('name'), value: r.get('value').toInt() })),
            incidentsBySeverity: severityResult.records.map(r => ({ name: r.get('name'), value: r.get('value').toInt() })),
            incidentsByLocation: locationStatsResult.records.map(r => ({ name: r.get('name'), value: r.get('value').toInt() })),
            recentIncidents: recentIncidentsResult.records.map(r => r.get('i').properties),
            highRiskLocations: highRiskLocationsResult.records.map(r => r.get('l').properties)
        };
    } finally {
        await session.close();
    }
};

module.exports = {
    getDashboardMetrics
};
