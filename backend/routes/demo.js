const express = require('express');
const User = require('../models/User');
const { DEMO_USER_GOOGLE_ID } = require('../config/demoPortfolio');

const router = express.Router();

router.get('/holdings', async (req, res) => {
    try {
        const user = await User.findOne({ googleId: DEMO_USER_GOOGLE_ID }).lean();
        if (!user) {
            return res.status(404).json({
                error: 'Demo portfolio is not available.',
                message: 'Demo user has not been seeded yet.'
            });
        }

        return res.json({
            user: {
                name: user.name || 'Demo Investor',
                email: user.email || '',
                photo: user.photo || ''
            },
            holdings: user.holdings || [],
            readOnly: true
        });
    } catch (err) {
        console.error('[demo] error', err);
        return res.status(500).json({ error: 'Unable to load demo portfolio.' });
    }
});

module.exports = router;
