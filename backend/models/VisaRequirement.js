/**
 * VisaRequirement Model
 * Stores visa requirements for country pairs
 */

const mongoose = require('mongoose');

const visaRequirementSchema = new mongoose.Schema({
    fromCountry: {
        type: String,
        required: true,
        uppercase: true,
        trim: true
    },
    toCountry: {
        type: String,
        required: true,
        uppercase: true,
        trim: true
    },
    visaRequired: {
        type: Boolean,
        required: true,
        default: true
    },
    visaType: {
        type: String,
        enum: ['tourist', 'business', 'transit', 'student', 'work', 'multiple'],
        default: 'tourist'
    },
    processingTime: {
        type: String,
        default: '5-10 business days'
    },
    validityPeriod: {
        type: String,
        default: '90 days'
    },
    maxStayDuration: {
        type: String,
        default: '30 days'
    },
    estimatedCost: {
        type: Number
    },
    currency: {
        type: String,
        default: 'USD'
    },
    requirements: [{
        type: String
    }],
    details: {
        type: String
    },
    notes: {
        type: String
    },
    visaOnArrival: {
        type: Boolean,
        default: false
    },
    eVisaAvailable: {
        type: Boolean,
        default: false
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Compound index for efficient lookups
visaRequirementSchema.index({ fromCountry: 1, toCountry: 1 }, { unique: true });
visaRequirementSchema.index({ fromCountry: 1 });
visaRequirementSchema.index({ toCountry: 1 });
visaRequirementSchema.index({ visaRequired: 1 });

module.exports = mongoose.model('VisaRequirement', visaRequirementSchema);
