const mongoose = require('mongoose');

const serviceRequestSchema = new mongoose.Schema({
    referenceNumber: {
        type: String,
        required: true,
        unique: true
    },
    serviceType: {
        type: String,
        required: true,
        enum: ['visa', 'flight', 'hotel', 'concierge', 'corporate', 'consultation', 'package']
    },
    status: {
        type: String,
        enum: ['pending', 'in-progress', 'completed', 'cancelled'],
        default: 'pending'
    },
    
    // Common fields
    fullName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    nationality: String,
    
    // Service-specific fields
    serviceData: {
        type: mongoose.Schema.Types.Mixed
    },
    
    // File uploads
    files: [{
        fieldName: String,
        originalName: String,
        fileName: String,
        path: String,
        size: Number
    }],
    
    // Additional info
    additionalComments: String,
    
    // Admin notes
    adminNotes: String
}, {
    timestamps: true
});

// Generate reference number
serviceRequestSchema.pre('save', async function(next) {
    if (!this.referenceNumber) {
        const count = await this.constructor.countDocuments();
        this.referenceNumber = `REQ-${Date.now()}-${String(count + 1).padStart(4, '0')}`;
    }
    next();
});

module.exports = mongoose.model('ServiceRequest', serviceRequestSchema);