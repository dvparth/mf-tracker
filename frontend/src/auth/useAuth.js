import { useEffect, useState } from 'react';

export function useAuth() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const check = async () => {
            try {
                const res = await fetch((process.env.REACT_APP_BACKEND_URL || '') + '/auth/me', { credentials: 'include' });
                if (res.ok) {
                    const data = await res.json();
                    if (data && data.authenticated) {
                        // ensure user has photo field (may be empty)
                        setUser({ id: data.user.id, name: data.user.name, email: data.user.email, photo: data.user.photo || '' });
                    } else {
                        setUser(null);
                    }
                } else {
                    setUser(null);
                }
            } catch (e) {
                setUser(null);
            } finally {
                setLoading(false);
            }
        };
        check();
    }, []);

    return { user, loading, setUser };
}
