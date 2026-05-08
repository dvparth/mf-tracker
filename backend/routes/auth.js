const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { requireAuth } = require('../middleware/authMiddleware');
const { createCsrfToken, requireCsrf, JWT_ISSUER } = require('../middleware/csrf');
const router = express.Router();

const JWT_AUDIENCE = process.env.JWT_AUDIENCE || 'mf-tracker-web';

function authCookieOptions() {
    return {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 60 * 60 * 1000
    };
}

function clearAuthCookieOptions() {
    return {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    };
}

function oauthStateCookieOptions() {
    return {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 10 * 60 * 1000
    };
}

// Helper to issue a short-lived JWT and set as HttpOnly cookie
function issueJwtAndRedirect(req, res, user) {
    const payload = { id: user.id, name: user.name, email: user.email, photo: user.photo || '' };
    // (No verbose logging in production)
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: '1h',
        issuer: JWT_ISSUER,
        audience: JWT_AUDIENCE,
        jwtid: crypto.randomUUID()
    });
    res.cookie('mf_auth', token, authCookieOptions());
    res.clearCookie('mf_oauth_state', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' });
    // redirect back to frontend home (configurable via env)
    const redirectTo = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(redirectTo);
}

// Google OAuth start
router.get('/google', (req, res, next) => {
    const state = crypto.randomBytes(32).toString('hex');
    res.cookie('mf_oauth_state', state, oauthStateCookieOptions());
    // minimal scope; profile includes displayName and emails
    passport.authenticate('google', { scope: ['profile', 'email'], state })(req, res, next);
});

// Google callback
router.get('/google/callback', (req, res, next) => {
    const expectedState = req.cookies && req.cookies.mf_oauth_state;
    const receivedState = req.query && req.query.state;
    if (!expectedState || !receivedState || expectedState !== receivedState) {
        res.clearCookie('mf_oauth_state', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' });
        return res.status(401).json({ error: 'Authentication failed' });
    }
    return next();
}, passport.authenticate('google', { session: false, failureRedirect: '/auth/failure' }), (req, res) => {
    const user = req.user;
    issueJwtAndRedirect(req, res, user);
});

router.get('/failure', (req, res) => {
    res.status(401).json({ error: 'Authentication failed' });
});

// Logout clears the cookie
router.post('/logout', requireAuth, requireCsrf, (req, res) => {
    res.clearCookie('mf_auth', clearAuthCookieOptions());
    res.json({ ok: true });
});

router.get('/csrf', requireAuth, (req, res) => {
    return res.json({ csrfToken: createCsrfToken(req.user) });
});

// Endpoint to return current user (if authenticated via cookie)
router.get('/me', (req, res) => {
    const token = req.cookies && req.cookies.mf_auth;
    if (!token) return res.status(401).json({ authenticated: false });
    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET, {
            issuer: JWT_ISSUER,
            audience: JWT_AUDIENCE
        });
        return res.json({ authenticated: true, user: { id: payload.id, name: payload.name, email: payload.email, photo: payload.photo || '' } });
    } catch (e) {
        return res.status(401).json({ authenticated: false });
    }
});

module.exports = router;
