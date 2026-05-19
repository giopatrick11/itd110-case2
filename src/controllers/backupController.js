const { getSession } = require('../config/neo4j');

/**
 * Export all graph data for backup
 */
const exportBackupData = async () => {
    const session = getSession();
    
    try {
        // Fetch all nodes by labels
        const incidentsResult = await session.run('MATCH (n:Incident) RETURN n');
        const locationsResult = await session.run('MATCH (n:Location) RETURN n');
        const personsResult = await session.run('MATCH (n:Person) RETURN n');
        const respondersResult = await session.run('MATCH (n:Responder) RETURN n');

        // Fetch all relationships
        const relationshipsResult = await session.run(`
            MATCH (s)-[r]->(e) 
            RETURN s.id as from, e.id as to, type(r) as type
        `);

        return {
            exportedAt: new Date().toISOString(),
            nodes: {
                incidents: incidentsResult.records.map(r => r.get('n').properties),
                locations: locationsResult.records.map(r => r.get('n').properties),
                persons: personsResult.records.map(r => r.get('n').properties),
                responders: respondersResult.records.map(r => r.get('n').properties)
            },
            relationships: relationshipsResult.records.map(r => ({
                type: r.get('type'),
                from: r.get('from'),
                to: r.get('to')
            }))
        };
    } finally {
        await session.close();
    }
};

module.exports = {
    exportBackupData
};
