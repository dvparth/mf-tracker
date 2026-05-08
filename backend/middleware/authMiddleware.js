const jwt = require('jsonwebtoken');
const { JWT_ISSUER } = require('./csrf');

const JWT_AUDIENCE = process.env.JWT_AUDIENCE || 'mf-tracker-web';

function requireAuth(req, res, next) {
    const token = req.cookies && req.cookies.mf_auth;
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET, {
            issuer: JWT_ISSUER,
            audience: JWT_AUDIENCE
        });
        req.user = { id: payload.id, name: payload.name, email: payload.email };
        return next();
    } catch (e) {
        return res.status(401).json({ error: 'Invalid token' });
    }
}

module.exports = { requireAuth };
