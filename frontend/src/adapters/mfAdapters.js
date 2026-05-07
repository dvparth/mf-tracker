import axios from 'axios';

// Cache for backend requests to dedupe concurrent calls
const backendRequestCache = new Map();

/**
 * Fetch scheme data from backend API.
 * Supports single scheme or batch multiple schemes.
 * Uses single endpoint with query parameter for hybrid mode.
 * @param {Object|Object[]} schemeOrSchemes - single scheme object or array of scheme objects
 * @returns {Promise<Object|Object[]>} - normalized data from backend (single object or array)
 */
export async function fetchSchemeDataUsingAdapter(schemeOrSchemes) {
    const isArray = Array.isArray(schemeOrSchemes);
    const schemes = isArray ? schemeOrSchemes : [schemeOrSchemes];
    const codes = schemes.map(s => String(s.scheme_code));
    const adapter = process.env.REACT_APP_DATA_ADAPTER || 'mfapi'; // default to mfapi

    // Create cache key for the batch
    const cacheKey = `${adapter}-${codes.sort().join(',')}`;

    if (backendRequestCache.has(cacheKey)) {
        const cached = backendRequestCache.get(cacheKey);
        return isArray ? cached : cached[0].data;
    }

    const backendURL = process.env.REACT_APP_BACKEND_URL;
    let url;

    if (codes.length === 1) {
        // Single scheme - use path parameter
        const baseUrl = `${backendURL}/api/mf/${codes[0]}`;
        url = adapter === 'hybrid' ? `${baseUrl}?hybrid=true` : baseUrl;
    } else {
        // Multiple schemes - use comma-separated path or query parameter
        const codesStr = codes.join(',');
        if (codesStr.length < 100) { // Use path if not too long
            const baseUrl = `${backendURL}/api/mf/${codesStr}`;
            url = adapter === 'hybrid' ? `${baseUrl}?hybrid=true` : baseUrl;
        } else { // Use query parameter for very long lists
            const baseUrl = `${backendURL}/api/mf?schemeCodes=${codesStr}`;
            url = adapter === 'hybrid' ? `${baseUrl}&hybrid=true` : baseUrl;
        }
    }

    const p = axios.get(url).then(res => {
        const responseData = res.data;

        if (codes.length === 1) {
            // Single response - wrap in array format for consistency
            return [{ schemeCode: codes[0], data: responseData }];
        } else {
            // Multiple response - already in array format
            return Array.isArray(responseData) ? responseData : [responseData];
        }
    });

    backendRequestCache.set(cacheKey, p);
    try {
        const results = await p;

        // Return single object for single scheme, array for multiple
        if (isArray) {
            return results;
        } else {
            const result = results.find(r => r.schemeCode === codes[0]);
            return result ? result.data : null;
        }
    } catch (err) {
        backendRequestCache.delete(cacheKey);
        throw err;
    }
}

export const availableAdapters = ['mfapi', 'hybrid'];
