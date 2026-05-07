const mongoose = require('mongoose');

const HoldingSchema = new mongoose.Schema({
    scheme_code: { type: Number, required: true, index: true },
    principal: { type: Number, default: 0 },
    unit: { type: Number, default: 0 },
    addedAt: { type: Date, default: Date.now }
}, { _id: false });

const UserSchema = new mongoose.Schema({
    googleId: { type: String, required: true, unique: true, index: true },
    email: { type: String },
    name: { type: String },
    photo: { type: String },
    holdings: { type: [HoldingSchema], default: [] }
}, { timestamps: true });

// Compound index to speed up lookups by googleId + holdings.scheme_code
UserSchema.index({ googleId: 1 });
UserSchema.index({ 'holdings.scheme_code': 1 });

module.exports = mongoose.model('User', UserSchema);
