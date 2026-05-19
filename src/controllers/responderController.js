const { getSession } = require('../config/neo4j');
const { v4: uuidv4 } = require('uuid');

/**
 * Get all responders
 */
const getAllResponders = async () => {
    const session = getSession();
    try {
        const result = await session.run(
            'MATCH (r:Responder) RETURN r ORDER BY r.createdAt DESC'
        );
        return result.records.map(record => record.get('r').properties);
    } finally {
        await session.close();
    }
};

/**
 * Get responder by ID
 */
const getResponderById = async (id) => {
    const session = getSession();
    try {
        const result = await session.run(
            'MATCH (r:Responder {id: $id}) RETURN r',
            { id }
        );
        if (result.records.length === 0) return null;
        return result.records[0].get('r').properties;
    } finally {
        await session.close();
    }
};

/**
 * Create a new responder
 */
const createResponder = async (responderData) => {
    const session = getSession();
    const id = uuidv4();
    const now = new Date().toISOString();
    
    try {
        const result = await session.run(
            `CREATE (r:Responder {
                id: $id,
                name: $name,
                agency: $agency,
                role: $role,
                contactNumber: $contactNumber,
                status: $status,
                createdAt: $createdAt,
                updatedAt: $updatedAt
            }) RETURN r`,
            {
                id,
                name: responderData.name,
                agency: responderData.agency,
                role: responderData.role,
                contactNumber: responderData.contactNumber,
                status: responderData.status || 'Available',
                createdAt: now,
                updatedAt: now
            }
        );
        return result.records[0].get('r').properties;
    } finally {
        await session.close();
    }
};

/**
 * Update a responder
 */
const updateResponder = async (id, responderData) => {
    const session = getSession();
    const now = new Date().toISOString();
    
    try {
        const result = await session.run(
            `MATCH (r:Responder {id: $id})
             SET r.name = $name,
                 r.agency = $agency,
                 r.role = $role,
                 r.contactNumber = $contactNumber,
                 r.status = $status,
                 r.updatedAt = $updatedAt
             RETURN r`,
            {
                id,
                name: responderData.name,
                agency: responderData.agency,
                role: responderData.role,
                contactNumber: responderData.contactNumber,
                status: responderData.status,
                updatedAt: now
            }
        );
        if (result.records.length === 0) return null;
        return result.records[0].get('r').properties;
    } finally {
        await session.close();
    }
};

/**
 * Delete a responder
 */
const deleteResponder = async (id) => {
    const session = getSession();
    try {
        const result = await session.run(
            'MATCH (r:Responder {id: $id}) DETACH DELETE r RETURN count(r) as deletedCount',
            { id }
        );
        return result.records[0].get('deletedCount').toInt() > 0;
    } finally {
        await session.close();
    }
};

module.exports = {
    getAllResponders,
    getResponderById,
    createResponder,
    updateResponder,
    deleteResponder
};
