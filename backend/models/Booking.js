/**
 * Booking Model
 * Handles all service bookings (visa, flights, hotels, etc.)
 */

const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    // Service type
    serviceType: {
        type: String,
        required: true,
        enum: [
            'visa-application',
            'flight-booking',
            'hotel-booking',
            'concierge',
            'corporate-travel',
            'consultation',
            'package-request'
        ]
    },

    // Common fields
    name: {
        type: String,
        trim: true
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },
    phone: {
        type: String,
        trim: true
    },

    // Visa application specific
    nationality: String,
    destination: String,
    travelDate: Date,
    returnDate: Date,
    purpose: String,
    passportNumber: String,
    passportExpiry: Date,
    dateOfBirth: Date,
    passportFile: String,
    photoFile: String,
    documentFiles: [String],

    // Flight booking specific
    departure: String,
    departureDate: Date,
    passengers: Number,
    class: {
        type: String,
        enum: ['economy', 'premium-economy', 'business', 'first']
    },

    // Hotel booking specific
    checkIn: Date,
    checkOut: Date,
    guests: Number,
    rooms: Number,
    hotelPreference: String,

    // Concierge specific
    startDate: Date,
    endDate: Date,
    travelers: Number,
    interests: String,
    budget: String,
    specialRequests: String,

    // Corporate travel specific
    companyName: String,
    contactName: String,
    numberOfTravelers: Number,
    requirements: String,

    // Consultation specific
    preferredDate: Date,
    preferredTime: String,
    topic: String,
    details: String,

    // Package request specific
    packageId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Package'
    },
    packageName: String,

    // Common optional fields
    preferences: String,
    additionalInfo: String,

    // Status tracking
    status: {
        type: String,
        enum: ['pending', 'processing', 'confirmed', 'completed', 'cancelled'],
        default: 'pending'
    },

    // Internal notes
    internalNotes: String,
    assignedTo: String,

    // Timestamps
    submittedAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Indexes for better query performance
bookingSchema.index({ email: 1 });
bookingSchema.index({ serviceType: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ submittedAt: -1 });

// Update the updatedAt field on save
bookingSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

// Virtual for booking reference number
bookingSchema.virtual('referenceNumber').get(function() {
    return `NJ-${this.serviceType.toUpperCase().substring(0, 3)}-${this._id.toString().substring(0, 8).toUpperCase()}`;
});

// Include virtuals in JSON
bookingSchema.set('toJSON', { virtuals: true });
bookingSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Booking', bookingSchema);
