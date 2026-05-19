const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

/**
 * @route POST /api/auth/register
 * @desc Register a new user
 */
router.post('/register', async (req, res) => {
    try {
        const user = await authController.register(req.body);
        res.status(201).json(user);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

/**
 * @route POST /api/auth/login
 * @desc Login user and get token
 */
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const data = await authController.login(email, password);
        res.json(data);
    } catch (error) {
        res.status(401).json({ error: error.message });
    }
});

/**
 * @route POST /api/auth/logout
 * @desc Logout user (client-side usually handles this by deleting token, but we provide a 200)
 */
router.post('/logout', (req, res) => {
    res.json({ message: 'Logged out successfully' });
});

/**
 * @route GET /api/auth/me
 * @desc Get current user profile
 */
router.get('/me', protect, async (req, res) => {
    try {
        const user = await authController.getUserById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @route GET /api/auth/pending
 * @desc Get all pending users (Admin only)
 */
router.get('/pending', protect, async (req, res) => {
    if (req.user.role !== 'Admin') {
        return res.status(403).json({ error: 'Access denied. Administrators only.' });
    }
    try {
        const users = await authController.getPendingUsers();
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @route POST /api/auth/approve/:id
 * @desc Approve a pending user (Admin only)
 */
router.post('/approve/:id', protect, async (req, res) => {
    if (req.user.role !== 'Admin') {
        return res.status(403).json({ error: 'Access denied. Administrators only.' });
    }
    try {
        const user = await authController.approveUser(req.params.id);
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @route DELETE /api/auth/deny/:id
 * @desc Deny a pending user (Admin only)
 */
router.delete('/deny/:id', protect, async (req, res) => {
    if (req.user.role !== 'Admin') {
        return res.status(403).json({ error: 'Access denied. Administrators only.' });
    }
    try {
        const success = await authController.denyUser(req.params.id);
        if (!success) return res.status(404).json({ error: 'User not found' });
        res.json({ message: 'User denied and removed.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
