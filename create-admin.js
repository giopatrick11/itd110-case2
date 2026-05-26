const { getSession } = require('./src/config/neo4j');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const createAdmin = async () => {
    const session = getSession();
    const password = 'adminpassword123';
    const email = 'admin@safelink.gov';
    
    try {
        const passwordHash = await bcrypt.hash(password, 10);
        await session.run(`
            MERGE (u:User {email: $email})
            ON CREATE SET 
                u.id = $id,
                u.name = "System Admin",
                u.passwordHash = $passwordHash,
                u.role = "Admin",
                u.status = "Active",
                u.createdAt = $now,
                u.updatedAt = $now
        `, {
            id: uuidv4(),
            email,
            passwordHash,
            now: new Date().toISOString()
        });
        console.log('---------------------------------');
        console.log('Admin user created successfully!');
        console.log(`Email: ${email}`);
        console.log(`Password: ${password}`);
        console.log('---------------------------------');
    } catch (error) {
        console.error('Failed to create admin:', error);
    } finally {
        await session.close();
        process.exit(0);
    }
};

createAdmin();
