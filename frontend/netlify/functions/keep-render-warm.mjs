const RENDER_HEALTH_URL = 'https://mf-tracker-9isa.onrender.com/health';

export default async () => {
    const startedAt = Date.now();

    try {
        const response = await fetch(RENDER_HEALTH_URL, {
            method: 'GET',
            headers: {
                'User-Agent': 'mf-tracker-netlify-scheduled-function'
            }
        });

        const elapsedMs = Date.now() - startedAt;
        console.log(`[keep-render-warm] ${response.status} ${response.statusText} in ${elapsedMs}ms`);

        if (!response.ok) {
            return new Response(`Render health check failed with status ${response.status}`, {
                status: 502
            });
        }

        return new Response('Render health check completed', {
            status: 200
        });
    } catch (error) {
        console.error('[keep-render-warm] request failed', error);
        return new Response('Render health check failed', {
            status: 502
        });
    }
};
