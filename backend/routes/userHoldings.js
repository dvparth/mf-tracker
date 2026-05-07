const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { requireAuth } = require('../middleware/authMiddleware');

// Get holdings for the logged-in user
router.get('/', requireAuth, async (req, res) => {
    try {
        const user = await User.findOne({ googleId: req.user.id }).lean();
        if (!user) return res.json({ holdings: [] });
        return res.json({ holdings: user.holdings || [] });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// Merge/add holdings for the logged-in user. Accepts either a single holding or an array.
router.post('/', requireAuth, async (req, res) => {
    try {
        let { holdings } = req.body;
        if (!holdings) return res.status(400).json({ error: 'holdings required' });
        if (!Array.isArray(holdings)) holdings = [holdings];

        // Ensure user exists (create if missing)
        await User.updateOne({ googleId: req.user.id }, { $setOnInsert: { googleId: req.user.id, email: req.user.email, name: req.user.name } }, { upsert: true });

        // For each holding, try to update an existing array element; if not present, push a new entry
        for (const h of holdings) {
            const code = Number(h.scheme_code);
            if (!Number.isFinite(code)) continue;
            const principal = Number(h.principal || 0);
            const unit = Number(h.unit || 0);
            // Try updating existing array element
            const updateRes = await User.updateOne(
                { googleId: req.user.id, 'holdings.scheme_code': code },
                { $set: { 'holdings.$.principal': principal, 'holdings.$.unit': unit } }
            );
            // If no existing holding matched, push a new one
            if (!updateRes.matchedCount || updateRes.matchedCount === 0) {
                await User.updateOne(
                    { googleId: req.user.id },
                    { $push: { holdings: { scheme_code: code, principal, unit, addedAt: h.addedAt ? new Date(h.addedAt) : new Date() } } }
                );
            }
        }

        const user = await User.findOne({ googleId: req.user.id }).lean();
        return res.json({ holdings: user.holdings || [] });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// Update a single holding by scheme_code
router.put('/:scheme_code', requireAuth, async (req, res) => {
    try {
        const code = Number(req.params.scheme_code);
        if (!Number.isFinite(code)) return res.status(400).json({ error: 'invalid scheme code' });
        const { principal, unit } = req.body;

        const principalNum = principal !== undefined ? Number(principal || 0) : undefined;
        const unitNum = unit !== undefined ? Number(unit || 0) : undefined;

        // Try to update existing holding
        const updateRes = await User.updateOne(
            { googleId: req.user.id, 'holdings.scheme_code': code },
            { $set: Object.assign({}, principalNum !== undefined ? { 'holdings.$.principal': principalNum } : {}, unitNum !== undefined ? { 'holdings.$.unit': unitNum } : {}) }
        );

        // If no existing holding matched, push a new one (create user if missing)
        if (!updateRes.matchedCount || updateRes.matchedCount === 0) {
            await User.updateOne(
                { googleId: req.user.id },
                { $setOnInsert: { googleId: req.user.id, email: req.user.email, name: req.user.name }, $push: { holdings: { scheme_code: code, principal: principalNum || 0, unit: unitNum || 0, addedAt: new Date() } } },
                { upsert: true }
            );
        }

        const user = await User.findOne({ googleId: req.user.id }).lean();
        if (!user) return res.status(404).json({ error: 'User not found' });
        return res.json({ holdings: user.holdings || [] });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// Delete a holding by scheme_code
router.delete('/:scheme_code', requireAuth, async (req, res) => {
    try {
        const code = Number(req.params.scheme_code);
        if (!Number.isFinite(code)) return res.status(400).json({ error: 'invalid scheme code' });
        const user = await User.findOneAndUpdate({ googleId: req.user.id }, { $pull: { holdings: { scheme_code: code } } }, { new: true }).lean();
        if (!user) return res.status(404).json({ error: 'User not found' });
        return res.json({ holdings: user.holdings || [] });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

module.exports = router;
