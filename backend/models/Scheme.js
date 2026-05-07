const mongoose = require('mongoose');

const SchemeSchema = new mongoose.Schema({
    scheme_code: { type: Number, required: true, unique: true, index: true },
    scheme_name: { type: String, default: '' },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: true });

SchemeSchema.index({ scheme_code: 1 });

module.exports = mongoose.model('Scheme', SchemeSchema);
