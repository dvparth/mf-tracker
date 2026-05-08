const express = require('express');
const { fetchSchemeDataUsingAdapter } = require('../adapters/mfAdapter');

const router = express.Router();
const MAX_SCHEME_CODES = 25;
const MAX_SCHEME_CODE_LENGTH = 12;

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

async function mapWithConcurrency(items, limit, iterator) {
    const results = new Array(items.length);
    let nextIndex = 0;

    async function worker() {
        while (nextIndex < items.length) {
            const currentIndex = nextIndex;
            nextIndex += 1;
            results[currentIndex] = await iterator(items[currentIndex], currentIndex);
        }
    }

    await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
    return results;
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
        return res.json([]);
    }
    if (schemeCodes.length > MAX_SCHEME_CODES) {
        return res.status(400).json({ error: `Maximum ${MAX_SCHEME_CODES} scheme codes per request.` });
    }

    const results = await mapWithConcurrency(
        schemeCodes,
        5,
        async (schemeCode) => {
            if (!schemeCode || schemeCode.length > MAX_SCHEME_CODE_LENGTH || !/^\d+$/.test(schemeCode)) {
                return { schemeCode, error: 'Invalid scheme code' };
            }

            try {
                const data = await fetchSchemePayload(schemeCode, useHybrid);
                return { schemeCode, data };
            } catch (err) {
                return { schemeCode, error: err.message || 'Failed to fetch scheme data' };
            }
        }
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
 * GET /api/mf
 * Fetch multiple scheme data using the schemeCodes query parameter.
 */
router.get('/', async (req, res) => {
    const useHybrid = parseHybridQuery(req);
    return handleSchemeRequest(req, res, useHybrid);
});

/**
 * GET /api/mf/:schemeCode
 * Fetch scheme data using mfapi adapter by default, or hybrid mode when requested.
 */
router.get('/:schemeCode', async (req, res) => {
    const useHybrid = parseHybridQuery(req);
    return handleSchemeRequest(req, res, useHybrid);
});

module.exports = router;
