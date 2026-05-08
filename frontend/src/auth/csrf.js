let csrfTokenPromise = null;

export function resetCsrfToken() {
    csrfTokenPromise = null;
}

export async function getCsrfToken({ force = false } = {}) {
    if (!force && csrfTokenPromise) return csrfTokenPromise;

    const backend = process.env.REACT_APP_BACKEND_URL || '';
    csrfTokenPromise = fetch(`${backend}/auth/csrf`, { credentials: 'include' })
        .then(async (response) => {
            if (!response.ok) {
                throw new Error('Unable to prepare secure request');
            }
            const data = await response.json();
            if (!data?.csrfToken) {
                throw new Error('Secure request token missing');
            }
            return data.csrfToken;
        })
        .catch((error) => {
            csrfTokenPromise = null;
            throw error;
        });

    return csrfTokenPromise;
}

export async function fetchWithCsrf(url, options = {}) {
    const token = await getCsrfToken();
    const headers = new Headers(options.headers || {});
    headers.set('X-CSRF-Token', token);

    return fetch(url, {
        ...options,
        headers,
        credentials: 'include'
    });
}
