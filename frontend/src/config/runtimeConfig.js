// Centralized runtime configuration and .env readers.
// This module reads build-time process.env.* (CRA inlines these at build) and
// also checks common runtime fallbacks (window globals, URL param, localStorage, meta tag).
// Export helpers so other modules can rely on a single source of truth.

// Preferred env names
const ENV = {
    RAPIDAPI_KEY: 'REACT_APP_RAPIDAPI_KEY',
    RAPIDAPI_HOST: 'REACT_APP_RAPIDAPI_HOST',
    DATA_ADAPTER: 'REACT_APP_DATA_ADAPTER',
    AI_MODEL: 'REACT_APP_AI_MODEL'
};

// Look for rapidapi key in several places and return key + source.
export function getRapidKeyAndSource() {
    try {
        // 1) Build-time env
        if (typeof process !== 'undefined' && process.env && process.env[ENV.RAPIDAPI_KEY]) {
            const v = String(process.env[ENV.RAPIDAPI_KEY]).trim();
            return { key: v, source: 'process.env' };
        }
    } catch (e) {
        // ignore
    }

    try {
        if (typeof window !== 'undefined') {
            if (window.__RAPIDAPI_KEY__) {
                const v = String(window.__RAPIDAPI_KEY__).trim();
                return { key: v, source: 'window.__RAPIDAPI_KEY__' };
            }
            if (window.RAPIDAPI_KEY) {
                const v = String(window.RAPIDAPI_KEY).trim();
                return { key: v, source: 'window.RAPIDAPI_KEY' };
            }
            const qp = new URLSearchParams(window.location.search).get('rapidapi_key');
            if (qp) {
                const v = String(qp).trim();
                return { key: v, source: 'url_param' };
            }
            try {
                const ls = window.localStorage.getItem('rapidapi_key');
                if (ls) {
                    const v = String(ls).trim();
                    return { key: v, source: 'localStorage' };
                }
            } catch (e) {
                // ignore localStorage access errors
            }
            const el = document && document.querySelector ? document.querySelector('meta[name="rapidapi-key"]') : null;
            if (el && el.content) {
                const v = String(el.content).trim();
                return { key: v, source: 'meta' };
            }
        }
    } catch (e) {
        // ignore
    }
    return { key: '', source: null };
}

export function getRapidHost() {
    try {
        if (typeof process !== 'undefined' && process.env && process.env[ENV.RAPIDAPI_HOST]) {
            return String(process.env[ENV.RAPIDAPI_HOST]).trim();
        }
    } catch (e) {
        // ignore
    }
    if (typeof window !== 'undefined' && window.__RAPIDAPI_HOST__) return String(window.__RAPIDAPI_HOST__).trim();
    return 'latest-mutual-fund-nav.p.rapidapi.com';
}

export function getDataAdapter() {
    try {
        if (typeof process !== 'undefined' && process.env && process.env[ENV.DATA_ADAPTER]) return String(process.env[ENV.DATA_ADAPTER]).trim();
    } catch (e) {
        // ignore
    }
    if (typeof window !== 'undefined' && window.__DATA_ADAPTER__) return String(window.__DATA_ADAPTER__).trim();
    return '';
}

export function getAIModel() {
    try {
        if (typeof process !== 'undefined' && process.env && process.env[ENV.AI_MODEL]) return String(process.env[ENV.AI_MODEL]).trim();
    } catch (e) {
        // ignore
    }
    if (typeof window !== 'undefined' && window.__AI_MODEL__) return String(window.__AI_MODEL__).trim();
    return 'Qwen/Qwen2.5-7B-Instruct';
}

// Initialize window globals from build-time env (idempotent)
export function initRuntimeConfig() {
    try {
        if (typeof window === 'undefined') return;
        window.__RAPIDAPI_KEY__ = window.__RAPIDAPI_KEY__ || (process && process.env && process.env[ENV.RAPIDAPI_KEY]) || window.__RAPIDAPI_KEY__ || '';
        window.__RAPIDAPI_HOST__ = window.__RAPIDAPI_HOST__ || (process && process.env && process.env[ENV.RAPIDAPI_HOST]) || window.__RAPIDAPI_HOST__ || 'latest-mutual-fund-nav.p.rapidapi.com';
        window.__DATA_ADAPTER__ = window.__DATA_ADAPTER__ || (process && process.env && process.env[ENV.DATA_ADAPTER]) || window.__DATA_ADAPTER__ || '';
        window.__AI_MODEL__ = window.__AI_MODEL__ || (process && process.env && process.env[ENV.AI_MODEL]) || window.__AI_MODEL__ || '';
        // initialized window runtime config (API_URL, RAPIDAPI_HOST, DATA_ADAPTER, AI_MODEL)
    } catch (e) {
        // ignore
    }
}

const runtimeConfig = {
    getRapidKeyAndSource,
    getRapidHost,
    getDataAdapter,
    initRuntimeConfig
};

export default runtimeConfig;
