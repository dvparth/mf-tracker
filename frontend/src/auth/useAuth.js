import { useEffect, useState } from 'react';
import { getCsrfToken, resetCsrfToken } from './csrf';
import { BACKEND_URL } from '../config/env';

export function useAuth() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const check = async () => {
            try {
                const res = await fetch(BACKEND_URL + '/auth/me', { credentials: 'include' });
                if (res.ok) {
                    const data = await res.json();
                    if (data && data.authenticated) {
                        // ensure user has photo field (may be empty)
                        setUser({ id: data.user.id, name: data.user.name, email: data.user.email, photo: data.user.photo || '' });
                        getCsrfToken({ force: true }).catch(() => resetCsrfToken());
                    } else {
                        setUser(null);
                        resetCsrfToken();
                    }
                } else {
                    setUser(null);
                    resetCsrfToken();
                }
            } catch (e) {
                setUser(null);
                resetCsrfToken();
            } finally {
                setLoading(false);
            }
        };
        check();
    }, []);

    return { user, loading, setUser };
}
