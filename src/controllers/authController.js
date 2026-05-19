const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { getSession } = require('../config/neo4j');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

/**
 * Register a new user
 */
const register = async (userData) => {
    const session = getSession();
    const { name, email, password, role, status } = userData;
    const id = uuidv4();
    const now = new Date().toISOString();
    
    try {
        // Check if user already exists
        const existing = await session.run(
            'MATCH (u:User {email: $email}) RETURN u',
            { email }
        );
        if (existing.records.length > 0) {
            throw new Error('User with this email already exists');
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const result = await session.run(
            `CREATE (u:User {
                id: $id,
                name: $name,
                email: $email,
                passwordHash: $passwordHash,
                role: $role,
                status: $status,
                createdAt: $createdAt,
                updatedAt: $updatedAt
            }) RETURN u`,
            {
                id,
                name,
                email,
                passwordHash,
                role: role || 'User',
                status: status || 'Pending', // Use provided status or default to Pending
                createdAt: now,
                updatedAt: now
            }
        );

        const user = result.records[0].get('u').properties;
        delete user.passwordHash;
        return user;
    } finally {
        await session.close();
    }
};

/**
 * Login user
 */
const login = async (email, password) => {
    const session = getSession();
    try {
        const result = await session.run(
            'MATCH (u:User {email: $email}) RETURN u',
            { email }
        );

        if (result.records.length === 0) {
            throw new Error('Invalid email or password');
        }

        const user = result.records[0].get('u').properties;

        // Check if user is active
        if (user.status !== 'Active') {
            throw new Error('Account pending approval. Please contact a System Administrator.');
        }

        const isMatch = await bcrypt.compare(password, user.passwordHash);

        if (!isMatch) {
            throw new Error('Invalid email or password');
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        delete user.passwordHash;
        return { user, token };
    } finally {
        await session.close();
    }
};

/**
 * Get all pending users (Admin only)
 */
const getPendingUsers = async () => {
    const session = getSession();
    try {
        const result = await session.run(
            'MATCH (u:User {status: "Pending"}) RETURN u ORDER BY u.createdAt DESC'
        );
        return result.records.map(r => {
            const user = r.get('u').properties;
            delete user.passwordHash;
            return user;
        });
    } finally {
        await session.close();
    }
};

/**
 * Approve a user (Admin only)
 */
const approveUser = async (id) => {
    const session = getSession();
    try {
        const result = await session.run(
            'MATCH (u:User {id: $id}) SET u.status = "Active", u.updatedAt = $now RETURN u',
            { id, now: new Date().toISOString() }
        );
        if (result.records.length === 0) return null;
        const user = result.records[0].get('u').properties;
        delete user.passwordHash;
        return user;
    } finally {
        await session.close();
    }
};

/**
 * Deny/Delete a user (Admin only)
 */
const denyUser = async (id) => {
    const session = getSession();
    try {
        const result = await session.run(
            'MATCH (u:User {id: $id}) DETACH DELETE u RETURN count(u) as deletedCount',
            { id }
        );
        return result.records[0].get('deletedCount').toInt() > 0;
    } finally {
        await session.close();
    }
};

/**
 * Get current user
 */
const getUserById = async (id) => {
    const session = getSession();
    try {
        const result = await session.run(
            'MATCH (u:User {id: $id}) RETURN u',
            { id }
        );

        if (result.records.length === 0) return null;

        const user = result.records[0].get('u').properties;
        delete user.passwordHash;
        return user;
    } finally {
        await session.close();
    }
};

module.exports = {
    register,
    login,
    getUserById,
    getPendingUsers,
    approveUser,
    denyUser
};
