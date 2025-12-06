const mongoose = require('mongoose');

const countrySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true
    },
    region: String,
    active: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Country', countrySchema);