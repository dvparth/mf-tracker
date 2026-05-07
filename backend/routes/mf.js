const express = require('express');
const { fetchSchemeDataUsingAdapter } = require('../adapters/mfAdapter');

const router = express.Router();

function parseHybridQuery(req) {
    const raw = String(req.query.hybrid || req.query.mode || '').toLowerCase();
    return raw === 'true' || raw === 'hybrid';
}

function parseSchemeCodes(req) {
    const rawValue = req.params.schemeCode || req.query.schemeCodes || '';
    return String(rawValue)
        .split(/[,\s]+/)
        .map(code => code.trim())
        .filter(Boolean);
}

async function fetchSchemePayload(schemeCode, useHybrid) {
    const scheme = { scheme_code: schemeCode };
    if (useHybrid) {
        const rapidKey = process.env.RAPIDAPI_KEY || '';
        const rapidHost = process.env.RAPIDAPI_HOST || 'latest-mutual-fund-nav.p.rapidapi.com';

        if (!rapidKey) {
            return await fetchSchemeDataUsingAdapter('mfapi', scheme);
        }

        return await fetchSchemeDataUsingAdapter('hybrid', scheme, rapidKey, rapidHost);
    }

    return await fetchSchemeDataUsingAdapter('mfapi', scheme);
}

async function handleSchemeRequest(req, res, useHybrid = false) {
    const schemeCodes = parseSchemeCodes(req);
    if (!schemeCodes.length) {
        return res.status(400).json({ error: 'No scheme codes provided' });
    }

    const results = await Promise.all(
        schemeCodes.map(async (schemeCode) => {
            if (!schemeCode || isNaN(schemeCode)) {
                return { schemeCode, error: 'Invalid scheme code' };
            }

            try {
                const data = await fetchSchemePayload(schemeCode, useHybrid);
                return { schemeCode, data };
            } catch (err) {
                return { schemeCode, error: err.message || 'Failed to fetch scheme data' };
            }
        })
    );

    if (results.length === 1) {
        return res.json(results[0]);
    }

    return res.json(results);
}

/**
 * GET /api/mf/hybrid/:schemeCode
 * Legacy hybrid alias for backward compatibility
 */
router.get('/hybrid/:schemeCode', async (req, res) => {
    return handleSchemeRequest(req, res, true);
});

/**
 * GET /api/mf/:schemeCode
 * Fetch scheme data using mfapi adapter by default, or hybrid mode when requested
 */
router.get('/:schemeCode?', async (req, res) => {
    const useHybrid = parseHybridQuery(req);
    return handleSchemeRequest(req, res, useHybrid);
});

module.exports = router;
