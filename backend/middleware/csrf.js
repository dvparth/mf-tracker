const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const JWT_ISSUER = process.env.JWT_ISSUER || 'mf-tracker-api';
const CSRF_AUDIENCE = process.env.JWT_CSRF_AUDIENCE || 'mf-tracker-csrf';

function createCsrfToken(user) {
    return jwt.sign(
        {
            sub: user.id,
            typ: 'csrf',
            nonce: crypto.randomUUID()
        },
        process.env.JWT_SECRET,
        {
            expiresIn: '2h',
            issuer: JWT_ISSUER,
            audience: CSRF_AUDIENCE
        }
    );
}

function requireCsrf(req, res, next) {
    const token = req.get('x-csrf-token');
    if (!token) {
        return res.status(403).json({ error: 'CSRF token required' });
    }

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET, {
            issuer: JWT_ISSUER,
            audience: CSRF_AUDIENCE
        });

        if (payload.typ !== 'csrf' || payload.sub !== req.user.id) {
            return res.status(403).json({ error: 'Invalid CSRF token' });
        }

        return next();
    } catch (e) {
        return res.status(403).json({ error: 'Invalid CSRF token' });
    }
}

module.exports = {
    createCsrfToken,
    requireCsrf,
    JWT_ISSUER
};
