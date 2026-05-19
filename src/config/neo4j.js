const neo4j = require('neo4j-driver');
require('dotenv').config();

const uri = process.env.NEO4J_URI;
const user = process.env.NEO4J_USER;
const password = process.env.NEO4J_PASSWORD;

let driver;

try {
    driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
    console.log(`Neo4j Driver initialized with URI: ${uri}`);
} catch (error) {
    console.error('Failed to initialize Neo4j driver:', error);
}

const getSession = () => {
    return driver.session();
};

module.exports = {
    driver,
    getSession
};
