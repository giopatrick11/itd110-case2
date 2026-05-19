const { getSession } = require('../config/neo4j');
const { v4: uuidv4 } = require('uuid');

/**
 * Get all persons
 */
const getAllPersons = async () => {
    const session = getSession();
    try {
        const result = await session.run(
            'MATCH (p:Person) RETURN p ORDER BY p.createdAt DESC'
        );
        return result.records.map(record => record.get('p').properties);
    } finally {
        await session.close();
    }
};

/**
 * Get person by ID
 */
const getPersonById = async (id) => {
    const session = getSession();
    try {
        const result = await session.run(
            'MATCH (p:Person {id: $id}) RETURN p',
            { id }
        );
        if (result.records.length === 0) return null;
        return result.records[0].get('p').properties;
    } finally {
        await session.close();
    }
};

/**
 * Create a new person
 */
const createPerson = async (personData) => {
    const session = getSession();
    const id = uuidv4();
    const now = new Date().toISOString();
    
    try {
        const result = await session.run(
            `CREATE (p:Person {
                id: $id,
                firstName: $firstName,
                lastName: $lastName,
                role: $role,
                contactNumber: $contactNumber,
                notes: $notes,
                createdAt: $createdAt,
                updatedAt: $updatedAt
            }) RETURN p`,
            {
                id,
                firstName: personData.firstName,
                lastName: personData.lastName,
                role: personData.role,
                contactNumber: personData.contactNumber,
                notes: personData.notes,
                createdAt: now,
                updatedAt: now
            }
        );
        return result.records[0].get('p').properties;
    } finally {
        await session.close();
    }
};

/**
 * Update a person
 */
const updatePerson = async (id, personData) => {
    const session = getSession();
    const now = new Date().toISOString();
    
    try {
        const result = await session.run(
            `MATCH (p:Person {id: $id})
             SET p.firstName = $firstName,
                 p.lastName = $lastName,
                 p.role = $role,
                 p.contactNumber = $contactNumber,
                 p.notes = $notes,
                 p.updatedAt = $updatedAt
             RETURN p`,
            {
                id,
                firstName: personData.firstName,
                lastName: personData.lastName,
                role: personData.role,
                contactNumber: personData.contactNumber,
                notes: personData.notes,
                updatedAt: now
            }
        );
        if (result.records.length === 0) return null;
        return result.records[0].get('p').properties;
    } finally {
        await session.close();
    }
};

/**
 * Delete a person
 */
const deletePerson = async (id) => {
    const session = getSession();
    try {
        const result = await session.run(
            'MATCH (p:Person {id: $id}) DETACH DELETE p RETURN count(p) as deletedCount',
            { id }
        );
        return result.records[0].get('deletedCount').toInt() > 0;
    } finally {
        await session.close();
    }
};

module.exports = {
    getAllPersons,
    getPersonById,
    createPerson,
    updatePerson,
    deletePerson
};
