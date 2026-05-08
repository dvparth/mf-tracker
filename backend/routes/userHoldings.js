const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { requireAuth } = require('../middleware/authMiddleware');
const { requireCsrf } = require('../middleware/csrf');

const MAX_HOLDINGS_PER_REQUEST = 25;
const MAX_HOLDINGS_PER_USER = 100;
const MAX_AMOUNT = 1_000_000_000_000;
const MAX_UNITS = 1_000_000_000;

function parsePositiveInteger(value, fieldName) {
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed <= 0) {
        const error = new Error(`${fieldName} must be a positive integer`);
        error.status = 400;
        throw error;
    }
    return parsed;
}

function parseBoundedNumber(value, fieldName, maxValue) {
    const parsed = value === undefined || value === null || value === '' ? 0 : Number(value);
    if (!Number.isFinite(parsed) || parsed < 0 || parsed > maxValue) {
        const error = new Error(`${fieldName} must be a number between 0 and ${maxValue}`);
        error.status = 400;
        throw error;
    }
    return parsed;
}

function normalizeHolding(raw) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
        const error = new Error('holding must be an object');
        error.status = 400;
        throw error;
    }

    return {
        scheme_code: parsePositiveInteger(raw.scheme_code, 'scheme_code'),
        principal: parseBoundedNumber(raw.principal, 'principal', MAX_AMOUNT),
        unit: parseBoundedNumber(raw.unit, 'unit', MAX_UNITS)
    };
}

function sendError(res, error) {
    const status = Number.isInteger(error.status) ? error.status : 500;
    if (status >= 500) {
        console.error('[userHoldings] error', error);
        return res.status(500).json({ error: 'Unable to process holdings request.' });
    }
    return res.status(status).json({ error: error.message || 'Invalid holdings request.' });
}

// Get holdings for the logged-in user
router.get('/', requireAuth, async (req, res) => {
    try {
        const user = await User.findOne({ googleId: req.user.id }).lean();
        if (!user) return res.json({ holdings: [] });
        return res.json({ holdings: user.holdings || [] });
    } catch (err) {
        return sendError(res, err);
    }
});

// Merge/add holdings for the logged-in user. Accepts either a single holding or an array.
router.post('/', requireAuth, requireCsrf, async (req, res) => {
    try {
        let { holdings } = req.body;
        if (!holdings) return res.status(400).json({ error: 'holdings required' });
        if (!Array.isArray(holdings)) holdings = [holdings];
        if (holdings.length > MAX_HOLDINGS_PER_REQUEST) {
            return res.status(400).json({ error: `Maximum ${MAX_HOLDINGS_PER_REQUEST} holdings per request.` });
        }
        const normalizedHoldings = holdings.map(normalizeHolding);

        // Ensure user exists (create if missing)
        await User.updateOne({ googleId: req.user.id }, { $setOnInsert: { googleId: req.user.id, email: req.user.email, name: req.user.name } }, { upsert: true });
        const existingUser = await User.findOne({ googleId: req.user.id }).lean();
        const existingCodes = new Set((existingUser?.holdings || []).map((h) => Number(h.scheme_code)));
        const newCodes = new Set(normalizedHoldings.map((h) => h.scheme_code).filter((code) => !existingCodes.has(code)));
        if ((existingCodes.size + newCodes.size) > MAX_HOLDINGS_PER_USER) {
            return res.status(400).json({ error: `Maximum ${MAX_HOLDINGS_PER_USER} funds can be tracked.` });
        }

        // For each holding, try to update an existing array element; if not present, push a new entry
        for (const h of normalizedHoldings) {
            const code = h.scheme_code;
            const principal = h.principal;
            const unit = h.unit;
            // Try updating existing array element
            const updateRes = await User.updateOne(
                { googleId: req.user.id, 'holdings.scheme_code': code },
                { $set: { 'holdings.$.principal': principal, 'holdings.$.unit': unit } }
            );
            // If no existing holding matched, push a new one
            if (!updateRes.matchedCount || updateRes.matchedCount === 0) {
                await User.updateOne(
                    { googleId: req.user.id },
                    { $push: { holdings: { scheme_code: code, principal, unit, addedAt: new Date() } } }
                );
            }
        }

        const user = await User.findOne({ googleId: req.user.id }).lean();
        return res.json({ holdings: user.holdings || [] });
    } catch (err) {
        return sendError(res, err);
    }
});

// Update a single holding by scheme_code
router.put('/:scheme_code', requireAuth, requireCsrf, async (req, res) => {
    try {
        const code = parsePositiveInteger(req.params.scheme_code, 'scheme_code');
        const { principal, unit } = req.body;
        if (principal === undefined && unit === undefined) {
            return res.status(400).json({ error: 'principal or unit is required' });
        }

        const principalNum = principal !== undefined ? parseBoundedNumber(principal, 'principal', MAX_AMOUNT) : undefined;
        const unitNum = unit !== undefined ? parseBoundedNumber(unit, 'unit', MAX_UNITS) : undefined;

        // Try to update existing holding
        const updateRes = await User.updateOne(
            { googleId: req.user.id, 'holdings.scheme_code': code },
            { $set: Object.assign({}, principalNum !== undefined ? { 'holdings.$.principal': principalNum } : {}, unitNum !== undefined ? { 'holdings.$.unit': unitNum } : {}) }
        );

        // If no existing holding matched, push a new one (create user if missing)
        if (!updateRes.matchedCount || updateRes.matchedCount === 0) {
            const existingUser = await User.findOne({ googleId: req.user.id }).lean();
            if ((existingUser?.holdings || []).length >= MAX_HOLDINGS_PER_USER) {
                return res.status(400).json({ error: `Maximum ${MAX_HOLDINGS_PER_USER} funds can be tracked.` });
            }
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
        return sendError(res, err);
    }
});

// Delete a holding by scheme_code
router.delete('/:scheme_code', requireAuth, requireCsrf, async (req, res) => {
    try {
        const code = parsePositiveInteger(req.params.scheme_code, 'scheme_code');
        const user = await User.findOneAndUpdate({ googleId: req.user.id }, { $pull: { holdings: { scheme_code: code } } }, { new: true }).lean();
        if (!user) return res.status(404).json({ error: 'User not found' });
        return res.json({ holdings: user.holdings || [] });
    } catch (err) {
        return sendError(res, err);
    }
});

module.exports = router;
