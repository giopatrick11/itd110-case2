const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { getSession } = require('./config/neo4j');
const incidentRoutes = require('./routes/incidentRoutes');
const locationRoutes = require('./routes/locationRoutes');
const personRoutes = require('./routes/personRoutes');
const responderRoutes = require('./routes/responderRoutes');
const searchRoutes = require('./routes/searchRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const backupRoutes = require('./routes/backupRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Routes
app.use('/api/incidents', incidentRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/persons', personRoutes);
app.use('/api/responders', responderRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/backup', backupRoutes);

// Test Route
app.get('/api/test', async (req, res) => {
    const session = getSession();
    try {
        const result = await session.run('RETURN "Neo4j connection successful!" as message');
        const message = result.records[0].get('message');
        res.status(200).json({ 
            status: 'success', 
            message: 'API is running', 
            database: message 
        });
    } catch (error) {
        console.error('Database connection error:', error);
        res.status(500).json({ 
            status: 'error', 
            message: 'API is running, but database connection failed', 
            error: error.message 
        });
    } finally {
        await session.close();
    }
});

module.exports = app;
