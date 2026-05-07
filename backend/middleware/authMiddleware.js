const jwt = require('jsonwebtoken');

function requireAuth(req, res, next) {
    const token = req.cookies && req.cookies.mf_auth;
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        req.user = { id: payload.id, name: payload.name, email: payload.email };
        return next();
    } catch (e) {
        return res.status(401).json({ error: 'Invalid token' });
    }
}

module.exports = { requireAuth };
