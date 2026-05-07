const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Helper to issue a short-lived JWT and set as HttpOnly cookie
function issueJwtAndRedirect(req, res, user) {
    const payload = { id: user.id, name: user.name, email: user.email, photo: user.photo || '' };
    // (No verbose logging in production)
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
    // set cookie secure in production and httpOnly
    const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        // For cross-site requests (Netlify frontend -> Render backend) set SameSite=None in production
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 60 * 60 * 1000 // 1 hour
    };
    res.cookie('mf_auth', token, cookieOptions);
    // redirect back to frontend home (configurable via env)
    const redirectTo = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(redirectTo);
}

// Google OAuth start
router.get('/google', (req, res, next) => {
    // minimal scope; profile includes displayName and emails
    passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
});

// Google callback
router.get('/google/callback', passport.authenticate('google', { session: false, failureRedirect: '/auth/failure' }), (req, res) => {
    const user = req.user;
    issueJwtAndRedirect(req, res, user);
});

router.get('/failure', (req, res) => {
    res.status(401).json({ error: 'Authentication failed' });
});

// Logout clears the cookie
router.post('/logout', (req, res) => {
    res.clearCookie('mf_auth', { httpOnly: true, sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', secure: process.env.NODE_ENV === 'production' });
    res.json({ ok: true });
});

// Endpoint to return current user (if authenticated via cookie)
router.get('/me', (req, res) => {
    const token = req.cookies && req.cookies.mf_auth;
    if (!token) return res.status(401).json({ authenticated: false });
    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        return res.json({ authenticated: true, user: { id: payload.id, name: payload.name, email: payload.email, photo: payload.photo || '' } });
    } catch (e) {
        return res.status(401).json({ authenticated: false });
    }
});

module.exports = router;
