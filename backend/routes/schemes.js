const express = require('express');
const axios = require('axios');
const router = express.Router();
const Scheme = require('../models/Scheme');

function normalizeScheme(raw) {
    const schemeCode = raw && (raw.scheme_code || raw.schemeCode || raw.code);
    const schemeName = raw && (raw.scheme_name || raw.schemeName || raw.name);
    return {
        scheme_code: Number(schemeCode),
        scheme_name: schemeName ? String(schemeName) : '',
        meta: raw && raw.meta ? raw.meta : {}
    };
}

async function searchMfApi(query) {
    const response = await axios.get('https://api.mfapi.in/mf/search', {
        params: { q: query },
        timeout: 5000,
        maxRedirects: 0
    });
    const data = Array.isArray(response.data) ? response.data : [];
    return data.map(normalizeScheme).filter(s => Number.isFinite(s.scheme_code) && s.scheme_name);
}

// DB-backed endpoint to return scheme metadata. Expects a `schemes` collection
// to be populated (migration scripts can be used to seed data).
router.get('/', async (req, res) => {
    try {
        const query = String(req.query.q || '').trim();
        if (query.length > 120) {
            return res.status(400).json({ error: 'Search query is too long.' });
        }
        const projection = { _id: 0, __v: 0 };

        if (query) {
            const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const dbSchemes = await Scheme.find(
                {
                    $or: [
                        { scheme_name: { $regex: escapedQuery, $options: 'i' } },
                        ...(Number.isFinite(Number(query)) ? [{ scheme_code: Number(query) }] : [])
                    ]
                },
                projection
            ).lean().sort({ scheme_name: 1 }).limit(25).exec();

            if (dbSchemes.length) {
                return res.json({ schemes: dbSchemes });
            }

            const mfApiSchemes = await searchMfApi(query);
            return res.json({ schemes: mfApiSchemes.slice(0, 25) });
        }

        const schemes = await Scheme.find({}, projection).lean().sort({ scheme_code: 1 }).limit(500).exec();
        return res.json({ schemes: schemes || [] });
    } catch (err) {
        console.error('[schemes] error', err);
        return res.status(500).json({ error: 'Unable to load schemes.' });
    }
});

module.exports = router;
