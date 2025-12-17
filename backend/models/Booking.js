/**
 * Enhanced Booking Model
 * Includes payment tracking, status workflows, notifications, and audit trail
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
        ],
        index: true
    },

    // Reference number (auto-generated)
    referenceNumber: {
        type: String,
        unique: true,
        index: true
    },

    // Common customer information
    customer: {
        name: {
            type: String,
            required: true,
            trim: true
        },
        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
            index: true
        },
        phone: {
            type: String,
            trim: true
        },
        alternatePhone: String,
        address: {
            street: String,
            city: String,
            state: String,
            country: String,
            postalCode: String
        },
        dateOfBirth: Date,
        nationality: String,
        passportNumber: String
    },

    // Visa application specific
    visaApplication: {
        destination: String,
        travelDate: Date,
        returnDate: Date,
        purpose: {
            type: String,
            enum: ['tourism', 'business', 'study', 'work', 'transit', 'other']
        },
        passportExpiry: Date,
        previousVisas: [{
            country: String,
            issuedDate: Date,
            expiryDate: Date
        }],
        documents: {
            passport: String,
            photo: String,
            supportingDocs: [String]
        },
        occupation: String,
        employer: String,
        travelHistory: String
    },

    // Flight booking specific
    flightBooking: {
        departure: String,
        destination: String,
        departureDate: Date,
        returnDate: Date,
        passengers: {
            adults: { type: Number, default: 1 },
            children: { type: Number, default: 0 },
            infants: { type: Number, default: 0 }
        },
        class: {
            type: String,
            enum: ['economy', 'premium-economy', 'business', 'first']
        },
        preferences: {
            mealPreference: String,
            seatPreference: String,
            frequentFlyerNumber: String
        },
        totalPassengers: Number
    },

    // Hotel booking specific
    hotelBooking: {
        destination: String,
        checkIn: Date,
        checkOut: Date,
        guests: Number,
        rooms: Number,
        roomType: {
            type: String,
            enum: ['standard', 'deluxe', 'suite', 'executive']
        },
        hotelPreference: String,
        specialRequests: String
    },

    // Concierge specific
    concierge: {
        destination: String,
        startDate: Date,
        endDate: Date,
        travelers: Number,
        interests: [String],
        budget: {
            min: Number,
            max: Number,
            currency: { type: String, default: 'USD' }
        },
        accommodation: String,
        transportation: String,
        activities: [String],
        specialRequests: String
    },

    // Corporate travel specific
    corporateTravel: {
        companyName: {
            type: String,
            required: function() { return this.serviceType === 'corporate-travel'; }
        },
        contactPerson: String,
        numberOfTravelers: Number,
        travelPurpose: String,
        budgetApproval: Boolean,
        billingAddress: {
            street: String,
            city: String,
            state: String,
            country: String,
            postalCode: String
        },
        requirements: String
    },

    // Package request specific
    packageRequest: {
        packageId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Package'
        },
        packageName: String,
        travelers: Number,
        preferredDate: Date,
        customizations: String
    },

    // Payment information
    payment: {
        status: {
            type: String,
            enum: ['pending', 'partial', 'paid', 'refunded', 'cancelled'],
            default: 'pending'
        },
        method: {
            type: String,
            enum: ['cash', 'card', 'bank-transfer', 'paypal', 'stripe', 'other']
        },
        totalAmount: {
            type: Number,
            default: 0
        },
        currency: {
            type: String,
            default: 'USD'
        },
        paidAmount: {
            type: Number,
            default: 0
        },
        transactions: [{
            transactionId: String,
            amount: Number,
            currency: String,
            method: String,
            status: String,
            date: { type: Date, default: Date.now },
            notes: String
        }],
        invoiceNumber: String,
        invoiceUrl: String,
        paymentDueDate: Date
    },

    // Booking status and workflow
    status: {
        type: String,
        enum: ['pending', 'processing', 'confirmed', 'completed', 'cancelled', 'on-hold', 'rejected'],
        default: 'pending',
        index: true
    },

    // Status history for audit trail
    statusHistory: [{
        status: String,
        changedBy: String,
        changedAt: { type: Date, default: Date.now },
        reason: String,
        notes: String
    }],

    // Priority level
    priority: {
        type: String,
        enum: ['low', 'normal', 'high', 'urgent'],
        default: 'normal'
    },

    // Assignment and handling
    assignedTo: {
        userId: String,
        name: String,
        email: String,
        assignedAt: Date
    },

    // Communication
    communications: [{
        type: {
            type: String,
            enum: ['email', 'phone', 'sms', 'whatsapp', 'internal-note']
        },
        direction: {
            type: String,
            enum: ['inbound', 'outbound']
        },
        from: String,
        to: String,
        subject: String,
        message: String,
        sentAt: { type: Date, default: Date.now },
        read: { type: Boolean, default: false }
    }],

    // Documents and files
    documents: [{
        type: {
            type: String,
            enum: ['passport', 'photo', 'visa', 'ticket', 'invoice', 'receipt', 'contract', 'other']
        },
        filename: String,
        url: String,
        uploadedAt: { type: Date, default: Date.now },
        uploadedBy: String
    }],

    // Internal notes
    internalNotes: String,
    
    // Additional metadata
    preferences: String,
    additionalInfo: String,
    tags: [String],
    
    // Source tracking
    source: {
        type: String,
        enum: ['website', 'phone', 'email', 'walk-in', 'referral', 'social-media', 'other'],
        default: 'website'
    },
    referralSource: String,

    // Notifications
    notifications: {
        emailSent: { type: Boolean, default: false },
        smsSent: { type: Boolean, default: false },
        remindersSent: { type: Number, default: 0 },
        lastReminderAt: Date
    },

    // Important dates
    submittedAt: {
        type: Date,
        default: Date.now,
        index: true
    },
    processedAt: Date,
    confirmedAt: Date,
    completedAt: Date,
    cancelledAt: Date,

    // Timestamps
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// ============================================================================
// INDEXES FOR PERFORMANCE
// ============================================================================

bookingSchema.index({ 'customer.email': 1 });
bookingSchema.index({ serviceType: 1, status: 1 });
bookingSchema.index({ submittedAt: -1 });
bookingSchema.index({ referenceNumber: 1 });
bookingSchema.index({ 'payment.status': 1 });
bookingSchema.index({ 'assignedTo.userId': 1 });
bookingSchema.index({ createdAt: -1 });

// Compound indexes
bookingSchema.index({ serviceType: 1, status: 1, submittedAt: -1 });
bookingSchema.index({ 'customer.email': 1, serviceType: 1 });

// ============================================================================
// PRE-SAVE MIDDLEWARE
// ============================================================================

// Generate reference number
bookingSchema.pre('save', async function(next) {
    if (this.isNew && !this.referenceNumber) {
        const serviceCode = {
            'visa-application': 'VSA',
            'flight-booking': 'FLT',
            'hotel-booking': 'HTL',
            'concierge': 'CON',
            'corporate-travel': 'CRP',
            'consultation': 'CST',
            'package-request': 'PKG'
        }[this.serviceType] || 'GEN';
        
        const date = new Date();
        const year = date.getFullYear().toString().substr(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        
        // Count today's bookings for sequential number
        const count = await this.constructor.countDocuments({
            submittedAt: {
                $gte: new Date(date.setHours(0, 0, 0, 0)),
                $lt: new Date(date.setHours(23, 59, 59, 999))
            }
        });
        
        const sequence = (count + 1).toString().padStart(4, '0');
        
        this.referenceNumber = `NJ-${serviceCode}-${year}${month}${day}-${sequence}`;
    }
    
    // Update timestamp
    this.updatedAt = new Date();
    
    next();
});

// ============================================================================
// POST-SAVE MIDDLEWARE - NOTIFICATIONS
// ============================================================================

bookingSchema.post('save', async function(doc, next) {
    // Send confirmation email on new booking
    if (doc.isNew && !doc.notifications.emailSent) {
        try {
            const emailUtil = require('../utils/email');
            
            // Determine which confirmation email to send
            let emailMethod;
            switch(doc.serviceType) {
                case 'visa-application':
                    emailMethod = emailUtil.sendVisaConfirmation;
                    break;
                case 'flight-booking':
                    emailMethod = emailUtil.sendFlightConfirmation;
                    break;
                case 'hotel-booking':
                    emailMethod = emailUtil.sendHotelConfirmation;
                    break;
                default:
                    emailMethod = null;
            }
            
            if (emailMethod) {
                await emailMethod(doc.customer.email, {
                    name: doc.customer.name,
                    referenceNumber: doc.referenceNumber,
                    bookingDetails: doc
                });
                
                // Mark email as sent
                doc.notifications.emailSent = true;
                await doc.save();
            }
        } catch (error) {
            console.error('Failed to send confirmation email:', error);
        }
    }
    
    next();
});

// ============================================================================
// VIRTUALS
// ============================================================================

// Days until travel
bookingSchema.virtual('daysUntilTravel').get(function() {
    let travelDate;
    
    if (this.visaApplication?.travelDate) {
        travelDate = this.visaApplication.travelDate;
    } else if (this.flightBooking?.departureDate) {
        travelDate = this.flightBooking.departureDate;
    } else if (this.hotelBooking?.checkIn) {
        travelDate = this.hotelBooking.checkIn;
    } else if (this.concierge?.startDate) {
        travelDate = this.concierge.startDate;
    }
    
    if (travelDate) {
        const now = new Date();
        const diffTime = new Date(travelDate) - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 ? diffDays : 0;
    }
    
    return null;
});

// Payment balance
bookingSchema.virtual('paymentBalance').get(function() {
    if (this.payment) {
        return this.payment.totalAmount - this.payment.paidAmount;
    }
    return 0;
});

// Is overdue
bookingSchema.virtual('isOverdue').get(function() {
    if (this.payment?.paymentDueDate) {
        return new Date() > new Date(this.payment.paymentDueDate) && this.payment.status !== 'paid';
    }
    return false;
});

// ============================================================================
// INSTANCE METHODS
// ============================================================================

// Update status with history
bookingSchema.methods.updateStatus = async function(newStatus, changedBy, reason, notes) {
    this.statusHistory.push({
        status: this.status,
        changedBy,
        changedAt: new Date(),
        reason,
        notes
    });
    
    this.status = newStatus;
    
    // Update relevant dates
    if (newStatus === 'processing' && !this.processedAt) {
        this.processedAt = new Date();
    } else if (newStatus === 'confirmed' && !this.confirmedAt) {
        this.confirmedAt = new Date();
    } else if (newStatus === 'completed' && !this.completedAt) {
        this.completedAt = new Date();
    } else if (newStatus === 'cancelled' && !this.cancelledAt) {
        this.cancelledAt = new Date();
    }
    
    await this.save();
};

// Add payment transaction
bookingSchema.methods.addPayment = async function(transaction) {
    this.payment.transactions.push(transaction);
    this.payment.paidAmount += transaction.amount;
    
    // Update payment status
    if (this.payment.paidAmount >= this.payment.totalAmount) {
        this.payment.status = 'paid';
    } else if (this.payment.paidAmount > 0) {
        this.payment.status = 'partial';
    }
    
    await this.save();
};

// Add communication log
bookingSchema.methods.addCommunication = async function(communication) {
    this.communications.push(communication);
    await this.save();
};

// Assign to team member
bookingSchema.methods.assignTo = async function(userId, name, email) {
    this.assignedTo = {
        userId,
        name,
        email,
        assignedAt: new Date()
    };
    await this.save();
};

// ============================================================================
// STATIC METHODS
// ============================================================================

// Get bookings by status
bookingSchema.statics.getByStatus = function(status) {
    return this.find({ status }).sort({ submittedAt: -1 });
};

// Get overdue payments
bookingSchema.statics.getOverduePayments = function() {
    return this.find({
        'payment.paymentDueDate': { $lt: new Date() },
        'payment.status': { $ne: 'paid' }
    });
};

// Get bookings requiring attention
bookingSchema.statics.getRequiringAttention = function() {
    return this.find({
        $or: [
            { status: 'pending', submittedAt: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
            { status: 'on-hold' },
            { priority: 'urgent' }
        ]
    }).sort({ priority: -1, submittedAt: 1 });
};

// Get statistics
bookingSchema.statics.getStats = async function(startDate, endDate) {
    const match = {};
    if (startDate || endDate) {
        match.submittedAt = {};
        if (startDate) match.submittedAt.$gte = new Date(startDate);
        if (endDate) match.submittedAt.$lte = new Date(endDate);
    }
    
    const stats = await this.aggregate([
        { $match: match },
        {
            $group: {
                _id: null,
                total: { $sum: 1 },
                pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
                processing: { $sum: { $cond: [{ $eq: ['$status', 'processing'] }, 1, 0] } },
                confirmed: { $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] } },
                completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
                cancelled: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
                totalRevenue: { $sum: '$payment.totalAmount' },
                paidRevenue: { $sum: '$payment.paidAmount' }
            }
        }
    ]);
    
    return stats[0] || {
        total: 0,
        pending: 0,
        processing: 0,
        confirmed: 0,
        completed: 0,
        cancelled: 0,
        totalRevenue: 0,
        paidRevenue: 0
    };
};

module.exports = mongoose.model('Booking', bookingSchema);