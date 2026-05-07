const express = require('express');
const router = express.Router();
const Scheme = require('../models/Scheme');

// DB-backed endpoint to return scheme metadata. Expects a `schemes` collection
// to be populated (migration scripts can be used to seed data).
router.get('/', async (req, res) => {
    try {
        const schemes = await Scheme.find({}, { _id: 0, __v: 0 }).lean().sort({ scheme_code: 1 }).exec();
        return res.json({ schemes: schemes || [] });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

module.exports = router;
