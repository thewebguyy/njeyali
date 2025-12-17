/**
 * Package Model
 * Travel package offerings
 */

const mongoose = require('mongoose');

const packageSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    slug: {
        type: String,
        unique: true,
        lowercase: true
    },
    destination: {
        type: String,
        required: true
    },
    duration: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: 'USD'
    },
    description: {
        type: String,
        required: true
    },
    highlights: [String],
    itinerary: [{
        day: Number,
        title: String,
        description: String,
        activities: [String]
    }],
    inclusions: [String],
    exclusions: [String],
    images: [String],
    mainImage: String,
    startDate: Date,
    endDate: Date,
    maxParticipants: Number,
    currentParticipants: {
        type: Number,
        default: 0
    },
    featured: {
        type: Boolean,
        default: false
    },
    priority: {
        type: Number,
        default: 0
    },
    active: {
        type: Boolean,
        default: true
    },
    category: {
        type: String,
        enum: ['luxury', 'adventure', 'cultural', 'beach', 'safari', 'city-break', 'group'],
        default: 'cultural'
    },
    difficulty: {
        type: String,
        enum: ['easy', 'moderate', 'challenging'],
        default: 'moderate'
    },
    tags: [String],
    views: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Create slug from name before saving
packageSchema.pre('save', function(next) {
    if (this.isModified('name') && !this.slug) {
        this.slug = this.name
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
    }
    next();
});

// Indexes
packageSchema.index({ slug: 1 });
packageSchema.index({ destination: 1 });
packageSchema.index({ featured: 1 });
packageSchema.index({ active: 1 });
packageSchema.index({ price: 1 });

module.exports = mongoose.model('Package', packageSchema);
