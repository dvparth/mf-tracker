import React from 'react';

export default function Login() {
    const backend = process.env.REACT_APP_BACKEND_URL || '';
    return (
        <div style={{ padding: 24, maxWidth: 600, margin: '40px auto' }}>
            <h1>Login</h1>
            <p>Sign in with your Google account.</p>
            <div style={{ display: 'flex', gap: 12 }}>
                <a href={`${backend}/auth/google`} style={{ padding: '10px 14px', background: '#4285F4', color: '#fff', borderRadius: 8, textDecoration: 'none', fontWeight: 700 }}>Sign in with Google</a>
            </div>
        </div>
    );
}
