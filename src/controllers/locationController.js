const { getSession } = require('../config/neo4j');
const { v4: uuidv4 } = require('uuid');

/**
 * Get all locations
 */
const getAllLocations = async () => {
    const session = getSession();
    try {
        const result = await session.run(
            'MATCH (l:Location) RETURN l ORDER BY l.createdAt DESC'
        );
        return result.records.map(record => record.get('l').properties);
    } finally {
        await session.close();
    }
};

/**
 * Get location by ID
 */
const getLocationById = async (id) => {
    const session = getSession();
    try {
        const result = await session.run(
            'MATCH (l:Location {id: $id}) RETURN l',
            { id }
        );
        if (result.records.length === 0) return null;
        return result.records[0].get('l').properties;
    } finally {
        await session.close();
    }
};

/**
 * Create a new location
 */
const createLocation = async (locationData) => {
    const session = getSession();
    const id = uuidv4();
    const now = new Date().toISOString();
    
    try {
        const result = await session.run(
            `CREATE (l:Location {
                id: $id,
                name: $name,
                address: $address,
                type: $type,
                riskLevel: $riskLevel,
                latitude: $latitude,
                longitude: $longitude,
                createdAt: $createdAt,
                updatedAt: $updatedAt
            }) RETURN l`,
            {
                id,
                name: locationData.name,
                address: locationData.address,
                type: locationData.type,
                riskLevel: locationData.riskLevel || 'Low',
                latitude: locationData.latitude,
                longitude: locationData.longitude,
                createdAt: now,
                updatedAt: now
            }
        );
        return result.records[0].get('l').properties;
    } finally {
        await session.close();
    }
};

/**
 * Update a location
 */
const updateLocation = async (id, locationData) => {
    const session = getSession();
    const now = new Date().toISOString();
    
    try {
        const result = await session.run(
            `MATCH (l:Location {id: $id})
             SET l.name = $name,
                 l.address = $address,
                 l.type = $type,
                 l.riskLevel = $riskLevel,
                 l.latitude = $latitude,
                 l.longitude = $longitude,
                 l.updatedAt = $updatedAt
             RETURN l`,
            {
                id,
                name: locationData.name,
                address: locationData.address,
                type: locationData.type,
                riskLevel: locationData.riskLevel,
                latitude: locationData.latitude,
                longitude: locationData.longitude,
                updatedAt: now
            }
        );
        if (result.records.length === 0) return null;
        return result.records[0].get('l').properties;
    } finally {
        await session.close();
    }
};

/**
 * Delete a location
 */
const deleteLocation = async (id) => {
    const session = getSession();
    try {
        const result = await session.run(
            'MATCH (l:Location {id: $id}) DETACH DELETE l RETURN count(l) as deletedCount',
            { id }
        );
        return result.records[0].get('deletedCount').toInt() > 0;
    } finally {
        await session.close();
    }
};

module.exports = {
    getAllLocations,
    getLocationById,
    createLocation,
    updateLocation,
    deleteLocation
};
