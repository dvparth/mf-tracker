const { rateLimit, ipKeyGenerator } = require('express-rate-limit');

const commonOptions = {
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: 'Too many requests. Please try again later.' }
};

const generalLimiter = rateLimit({
    ...commonOptions,
    windowMs: 15 * 60 * 1000,
    limit: 300
});

const authLimiter = rateLimit({
    ...commonOptions,
    windowMs: 15 * 60 * 1000,
    limit: 80
});

const dataLimiter = rateLimit({
    ...commonOptions,
    windowMs: 60 * 1000,
    limit: 80
});

const aiLimiter = rateLimit({
    ...commonOptions,
    windowMs: 15 * 60 * 1000,
    limit: 20,
    keyGenerator: (req) => (req.user && req.user.id) || ipKeyGenerator(req.ip)
});

module.exports = {
    generalLimiter,
    authLimiter,
    dataLimiter,
    aiLimiter
};
