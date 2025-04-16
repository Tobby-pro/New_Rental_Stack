const express = require('express');
const { getLandlordById } = require('./controllers/landlordController');
const { authenticateToken } = require('./middleware/authMiddleware');

const router = express.Router();

// Wrap async function inside a promise-based handler
router.get('/landlords/:landlordId', authenticateToken, async (req, res) => {
    try {
        await getLandlordById(req, res);
    } catch (error) {
        console.error('Error in route:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;
