const { getSession } = require('../config/neo4j');

/**
 * Search incidents based on various criteria
 */
const searchIncidents = async (filters) => {
    const session = getSession();
    const { query, type, status, severity, location, person, responder } = filters;
    
    let cypher = 'MATCH (i:Incident) ';
    const params = {};
    const whereClauses = [];

    // General query search (title, description, type, status, severity)
    if (query) {
        whereClauses.push('(toLower(i.title) CONTAINS toLower($query) OR toLower(i.description) CONTAINS toLower($query) OR toLower(i.type) CONTAINS toLower($query) OR toLower(i.status) CONTAINS toLower($query) OR toLower(i.severity) CONTAINS toLower($query))');
        params.query = query;
    }

    // Specific field filters
    if (type) {
        whereClauses.push('toLower(i.type) = toLower($type)');
        params.type = type;
    }
    if (status) {
        whereClauses.push('toLower(i.status) = toLower($status)');
        params.status = status;
    }
    if (severity) {
        whereClauses.push('toLower(i.severity) = toLower($severity)');
        params.severity = severity;
    }

    // Apply basic incident filters
    if (whereClauses.length > 0) {
        cypher += 'WHERE ' + whereClauses.join(' AND ') + ' ';
    }

    // Filter by connected Location
    if (location) {
        cypher += 'MATCH (i)-[:OCCURRED_AT]->(l_filter:Location) WHERE toLower(l_filter.name) CONTAINS toLower($location) ';
        params.location = location;
    }

    // Filter by connected Person
    if (person) {
        cypher += 'MATCH (p_filter:Person)-[r_p_filter]->(i) ';
        cypher += 'WHERE type(r_p_filter) IN ["INVOLVED_IN", "WITNESSED", "SUSPECTED_IN"] ';
        cypher += 'AND (toLower(p_filter.firstName) CONTAINS toLower($person) OR toLower(p_filter.lastName) CONTAINS toLower($person)) ';
        params.person = person;
    }

    // Filter by connected Responder
    if (responder) {
        cypher += 'MATCH (res_filter:Responder)-[:RESPONDED_TO]->(i) WHERE toLower(res_filter.name) CONTAINS toLower($responder) ';
        params.responder = responder;
    }

    // Now get the full graph context for matching incidents
    cypher += `
        WITH i
        OPTIONAL MATCH (i)-[:OCCURRED_AT]->(l:Location)
        WITH i, l
        OPTIONAL MATCH (p:Person)-[r]->(i)
        WHERE type(r) IN ["INVOLVED_IN", "WITNESSED", "SUSPECTED_IN"]
        WITH i, l, collect(CASE WHEN p IS NOT NULL THEN {person: properties(p), relationship: type(r)} END) as persons
        OPTIONAL MATCH (res:Responder)-[rel:RESPONDED_TO]->(i)
        RETURN i, l, persons, collect(CASE WHEN res IS NOT NULL THEN properties(res) END) as responders
        ORDER BY i.createdAt DESC
    `;

    try {
        const result = await session.run(cypher, params);
        return result.records.map(record => {
            const incident = record.get('i').properties;
            const locationNode = record.get('l');
            const locationData = locationNode ? locationNode.properties : null;
            const persons = record.get('persons');
            const responders = record.get('responders');

            return {
                ...incident,
                location: locationData,
                persons,
                responders
            };
        });
    } finally {
        await session.close();
    }
};

module.exports = {
    searchIncidents
};
