const axios = require('axios');

/**
 * Canonical data shape used by the API:
 * @typedef {Object} CanonicalEntry
 * @property {string} date - date in 'DD-MM-YYYY'
 * @property {string|number} nav - NAV value as string or number
 *
 * @typedef {Object} CanonicalMeta
 * @property {string} scheme_name
 *
 * @typedef {Object} CanonicalPayload
 * @property {CanonicalEntry[]} entries
 * @property {CanonicalMeta} meta
 */

// Internal helper to ensure the adapter returns the canonical shape.
function ensureCanonical(payload) {
    const safe = payload || {};
    const entriesRaw = Array.isArray(safe.entries) ? safe.entries : (Array.isArray(safe.data) ? safe.data : []);
    
    // helper: normalize various date formats into DD-MM-YYYY
    const normalizeDate = (d) => {
        if (!d) return null;
        const s = String(d).trim();
        // already DD-MM-YYYY
        if (/^\d{2}-\d{2}-\d{4}$/.test(s)) return s;
        // DD-MMM-YYYY (e.g. 26-Sep-2025)
        const mmmMatch = s.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/);
        if (mmmMatch) {
            const dd = mmmMatch[1].padStart(2, '0');
            const mon = mmmMatch[2].toLowerCase();
            const map = { jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06', jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12' };
            const mm = map[mon] || mmmMatch[2];
            return `${dd}-${mm}-${mmmMatch[3]}`;
        }
        // ISO YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS
        const isoMatch = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (isoMatch) {
            const dd = isoMatch[3];
            const mm = isoMatch[2];
            const yyyy = isoMatch[1];
            return `${dd}-${mm}-${yyyy}`;
        }
        // '26 Sep 2025' or '26 September 2025'
        const spaceMatch = s.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
        if (spaceMatch) {
            const dd = String(spaceMatch[1]).padStart(2, '0');
            const monStr = spaceMatch[2].slice(0, 3).toLowerCase();
            const map = { jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06', jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12' };
            const mm = map[monStr] || '01';
            return `${dd}-${mm}-${spaceMatch[3]}`;
        }
        // fallback: try Date constructor
        try {
            const dt = new Date(s);
            if (!Number.isNaN(dt.getTime())) {
                const dd = String(dt.getDate()).padStart(2, '0');
                const mm = String(dt.getMonth() + 1).padStart(2, '0');
                const yyyy = String(dt.getFullYear());
                return `${dd}-${mm}-${yyyy}`;
            }
        } catch (e) {
            // ignore
        }
        return null;
    };

    // helper: sanitize NAV-like strings (remove currency symbols, commas)
    const sanitizeNav = (n) => {
        if (n === undefined || n === null) return null;
        const s = String(n).trim();
        if (s === '') return null;
        // remove anything except digits, dot, minus
        const cleaned = s.replace(/[^0-9.\-]/g, '');
        return cleaned === '' ? null : cleaned;
    };

    const entries = entriesRaw.map(e => ({
        date: e && (e.date || e.Date) ? normalizeDate(e.date || e.Date) : null,
        nav: (() => {
            // some apis use different keys like 'nav', 'Net_Asset_Value', 'close'
            const raw = e && (e.nav !== undefined ? e.nav : (e.Net_Asset_Value !== undefined ? e.Net_Asset_Value : (e.close !== undefined ? e.close : (e.Nav !== undefined ? e.Nav : null))));
            return sanitizeNav(raw);
        })(),
    }));
    
    const metaRaw = safe.meta || {};
    const meta = { scheme_name: metaRaw.scheme_name || metaRaw.name || '' };
    return { entries, meta };
}

// --- RapidAPI batching helpers (module-level) ---
// Collect scheme codes requested in a short window and fetch latest values in one CSV request.
let rapidRequestQueue = new Set();
let rapidBatchPromise = null;

// Simple mfapi request cache to dedupe duplicate calls for the same scheme code
// Keyed by scheme_code -> Promise resolving to canonical payload
const mfapiRequestCache = new Map();

async function triggerRapidBatchFetch(rapidKey, rapidHost) {
    // If a batch is already in progress, return it
    if (rapidBatchPromise) return rapidBatchPromise;
    
    // schedule a microtask batch so concurrent hybrid() calls can enqueue codes
    rapidBatchPromise = new Promise((resolve) => {
        setTimeout(async () => {
            const codes = Array.from(rapidRequestQueue).map(String).join(',');
            // clear early so concurrent callers can enqueue for next batch
            rapidRequestQueue.clear();
            
            if (!codes) {
                rapidBatchPromise = null;
                return resolve(null);
            }
            
            try {
                const options = {
                    method: 'GET',
                    url: `https://${rapidHost}/latest`,
                    params: {
                        Scheme_Type: 'Open',
                        Scheme_Code: codes
                    },
                    headers: {
                        'x-rapidapi-key': rapidKey,
                        'x-rapidapi-host': rapidHost
                    }
                };
                
                const r = await axios.request(options);
                const rapidLastResponse = Array.isArray(r && r.data) ? r.data : (r && r.data ? r.data : null);
                resolve(rapidLastResponse);
            } catch (err) {
                console.error('RapidAPI batch request failed:', err.message);
                resolve(null);
            } finally {
                rapidBatchPromise = null;
            }
        }, 0);
    });
    
    return rapidBatchPromise;
}

const adapters = {
    // adapter for https://api.mfapi.in/mf/<scheme_code>
    mfapi: async (scheme) => {
        const code = String(scheme.scheme_code);
        if (mfapiRequestCache.has(code)) {
            return mfapiRequestCache.get(code);
        }
        
        const p = (async () => {
            const res = await axios.get(`https://api.mfapi.in/mf/${code}`);
            const payload = res && res.data ? res.data : {};
            // mfapi returns { meta, data }
            return ensureCanonical({ entries: payload.data, meta: payload.meta });
        })();
        
        // store the promise so concurrent callers share it
        mfapiRequestCache.set(code, p);
        try {
            const out = await p;
            return out;
        } catch (err) {
            // remove cache on failure so subsequent retries can attempt again
            mfapiRequestCache.delete(code);
            throw err;
        }
    },

    // hybrid adapter: use RapidAPI latest endpoint for the newest NAV and mfapi for historical entries
    hybrid: async (scheme, rapidKey, rapidHost) => {
        // mfapi fetch (historical) - reuse the mfapi adapter
        const mfapiPromise = adapters.mfapi(scheme).catch(() => ({ entries: [], meta: {} }));

        let rapidResp = null;
        if (!rapidKey || !rapidHost) {
            // RapidAPI key not found; skipping RapidAPI for this scheme
        } else {
            // enqueue this scheme code and trigger a batched fetch
            rapidRequestQueue.add(String(scheme.scheme_code));
            
            try {
                const batchResult = await triggerRapidBatchFetch(rapidKey, rapidHost);
                rapidResp = batchResult;
            } catch (e) {
                console.error('Batch fetch error:', e.message);
                rapidResp = null;
            }
        }

        const mfapiResp = await mfapiPromise;
        const mfPayload = ensureCanonical(mfapiResp || {});

        let entries = Array.isArray(mfPayload.entries) ? mfPayload.entries.slice() : [];
        let meta = mfPayload.meta || { scheme_name: '' };

        if (rapidResp && Array.isArray(rapidResp) && rapidResp.length > 0) {
            // find the matching scheme code entry
            const codeNum = Number(scheme.scheme_code);
            const found = rapidResp.find(item => Number(item.Scheme_Code) === codeNum) || rapidResp[0];
            
            if (found) {
                // RapidAPI date format can differ (e.g. '01-Oct-2025').
                // Use ensureCanonical to normalize the latest entry so comparisons match mfapi's DD-MM-YYYY format.
                const latestRaw = { date: found.Date, nav: String(found.Net_Asset_Value) };
                const latestCanonicalPayload = ensureCanonical({ entries: [latestRaw] });
                const latestEntry = (Array.isArray(latestCanonicalPayload.entries) && latestCanonicalPayload.entries[0]) ? latestCanonicalPayload.entries[0] : { date: null, nav: latestRaw.nav };

                // prepend canonical latestEntry if its date is different from current first entry
                if (!entries.length || entries[0].date !== latestEntry.date) {
                    entries.unshift(latestEntry);
                } else {
                    // replace existing first entry with latest value to ensure consistency
                    entries[0] = latestEntry;
                }
                
                // prefer meta from mfapi, else use rapid's name
                if (!meta || !meta.scheme_name) meta = { scheme_name: found.Scheme_Name || '' };
            }
        }

        return ensureCanonical({ entries, meta });
    }
};

/**
 * Fetch scheme data using a named adapter
 * @param {string} adapterKey - 'mfapi' or 'hybrid'
 * @param {Object} scheme - scheme object with scheme_code
 * @param {string} rapidKey - RapidAPI key (required for hybrid)
 * @param {string} rapidHost - RapidAPI host (required for hybrid)
 * @returns {Promise<CanonicalPayload>}
 */
async function fetchSchemeDataUsingAdapter(adapterKey, scheme, rapidKey = '', rapidHost = 'latest-mutual-fund-nav.p.rapidapi.com') {
    const adapter = adapters[adapterKey];
    if (!adapter) throw new Error(`Unknown data adapter: ${adapterKey}`);
    
    if (adapterKey === 'hybrid') {
        const raw = await adapter(scheme, rapidKey, rapidHost);
        return ensureCanonical(raw);
    } else {
        const raw = await adapter(scheme);
        return ensureCanonical(raw);
    }
}

const availableAdapters = ['mfapi', 'hybrid'];

module.exports = {
    fetchSchemeDataUsingAdapter,
    availableAdapters,
    adapters,
    ensureCanonical
};
