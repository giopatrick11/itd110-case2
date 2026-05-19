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

module.exports = router;
