/**
 * Testimonial Model
 * Customer testimonials and reviews
 */

const mongoose = require('mongoose');

const testimonialSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        lowercase: true,
        trim: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    message: {
        type: String,
        required: true
    },
    serviceType: {
        type: String,
        enum: ['visa', 'flight', 'hotel', 'concierge', 'package', 'general']
    },
    location: String,
    avatar: String,
    approved: {
        type: Boolean,
        default: false
    },
    featured: {
        type: Boolean,
        default: false
    },
    submittedAt: {
        type: Date,
        default: Date.now
    },
    approvedAt: Date
}, {
    timestamps: true
});

// Indexes
testimonialSchema.index({ approved: 1 });
testimonialSchema.index({ featured: 1 });
testimonialSchema.index({ rating: -1 });

// Indexes
testimonialSchema.index({ approved: 1 });
testimonialSchema.index({ featured: 1 });
testimonialSchema.index({ rating: -1 });

module.exports = mongoose.model('Testimonial', testimonialSchema);
