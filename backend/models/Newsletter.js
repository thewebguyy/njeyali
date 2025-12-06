/**
 * Newsletter Model
 * Newsletter subscriptions
 */

const mongoose = require('mongoose');

const newsletterSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    name: {
        type: String,
        trim: true
    },
    active: {
        type: Boolean,
        default: true
    },
    subscribedAt: {
        type: Date,
        default: Date.now
    },
    unsubscribedAt: Date,
    source: {
        type: String,
        default: 'website'
    }
}, {
    timestamps: true
});

// Indexes
newsletterSchema.index({ email: 1 });
newsletterSchema.index({ active: 1 });
newsletterSchema.index({ subscribedAt: -1 });

module.exports = mongoose.model('Newsletter', newsletterSchema);
