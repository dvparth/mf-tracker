/**
 * Migration helper: import frontend/src/config/schemes.json into the `schemes` collection.
 * Usage: set MONGO_URI then run `node importSchemesFromJson.js` from this folder.
 */
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const Scheme = require('../models/Scheme');

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
    console.error('MONGO_URI not set. Set it in environment and re-run.');
    process.exit(1);
}

(async () => {
    try {
        await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log('Connected to MongoDB');

        const fallback = path.resolve(__dirname, '..', '..', 'frontend', 'src', 'config', 'schemes.json');
        if (!fs.existsSync(fallback)) {
            console.error('No frontend config file found at', fallback);
            process.exit(1);
        }

        const raw = fs.readFileSync(fallback, 'utf8');
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) {
            console.error('Unexpected JSON shape; expected array of schemes');
            process.exit(1);
        }

        console.log(`Upserting ${parsed.length} schemes...`);
        for (const s of parsed) {
            const filter = { scheme_code: Number(s.scheme_code) };
            const update = { $set: { scheme_code: Number(s.scheme_code), scheme_name: s.scheme_name || s.name || '', meta: s } };
            await Scheme.updateOne(filter, update, { upsert: true });
        }
        console.log('Import complete');
        process.exit(0);
    } catch (e) {
        console.error('Error importing schemes:', e);
        process.exit(1);
    }
})();
