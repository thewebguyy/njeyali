/**
 * Booking Model
 * Handles polymorphic service bookings with discriminators, validation, and auditing.
 * Version: 2.0 (World-Class Edition)
 * @module models/Booking
 */

const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete'); // Soft deletes (npm i mongoose-delete)
const mongoosePaginate = require('mongoose-paginate-v2'); // Pagination (npm i mongoose-paginate-v2)
const mongooseAuditLog = require('mongoose-audit-log'); // Auditing (npm i mongoose-audit-log) – tracks changes

// Base schema for common fields
const baseBookingSchema = new mongoose.Schema({
  serviceType: {
    type: String,
    required: [true, 'Service type is required'],
    enum: {
      values: [
        'visa-application',
        'flight-booking',
        'hotel-booking',
        'concierge',
        'corporate-travel',
        'consultation',
        'package-request'
      ],
      message: '{VALUE} is not a supported service type'
    }
  },
  name: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email format'] // Regex validation
  },
  phone: {
    type: String,
    trim: true,
    match: [/^\+?[1-9]\d{1,14}$/, 'Invalid phone format (E.164 recommended)'] // Basic international validation
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' // Link to User model for auth/tracking
  },
  preferences: {
    type: String,
    trim: true
  },
  additionalInfo: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: {
      values: ['pending', 'processing', 'confirmed', 'completed', 'cancelled'],
      message: '{VALUE} is not a valid status'
    },
    default: 'pending'
  },
  internalNotes: {
    type: String,
    trim: true
  },
  assignedTo: {
    type: String,
    trim: true
  },
  submittedAt: {
    type: Date,
    default: Date.now,
    immutable: true // Prevent changes post-creation
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
  autoIndex: false, // Disable in prod; use migrations
  autoCreate: false,
  toJSON: { virtuals: true, getters: true },
  toObject: { virtuals: true, getters: true },
  optimisticConcurrency: true, // 2025 best practice for concurrent edits
  collectionOptions: {
    collation: { locale: 'en_US', strength: 2 } // Case-insensitive
  },
  // $jsonSchema for collection validation (enforced at DB level)
  $jsonSchema: {
    bsonType: 'object',
    required: ['serviceType', 'email'],
    properties: {
      email: { bsonType: 'string', pattern: '^[^\s@]+@[^\s@]+\.[^\s@]+$' }
    }
  }
});

// Virtual: Reference number
baseBookingSchema.virtual('referenceNumber').get(function() {
  return `NJ-${this.serviceType.toUpperCase().substring(0, 3)}-${this._id.toString().substring(0, 8).toUpperCase()}`;
});

// Virtual: Overdue check (e.g., for processing)
baseBookingSchema.virtual('isOverdue').get(function() {
  return this.status === 'pending' && (Date.now() - this.submittedAt) > 86400000; // 24 hours
});

// Pre-save: Update timestamps
baseBookingSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Indexes (manual in prod)
baseBookingSchema.index({ email: 1 });
baseBookingSchema.index({ serviceType: 1 });
baseBookingSchema.index({ status: 1 });
baseBookingSchema.index({ submittedAt: -1 });
baseBookingSchema.index({ userId: 1 }); // New: For user history
baseBookingSchema.index({ text: 'text' }); // Full-text on searchable fields (add to paths)

// Plugins
baseBookingSchema.plugin(mongooseDelete, { deletedAt: true, overrideMethods: 'all' });
baseBookingSchema.plugin(mongoosePaginate); // e.g., Booking.paginate(query, options)
baseBookingSchema.plugin(mongooseAuditLog, { fields: ['status', 'internalNotes'] }); // Track changes to key fields

// Discriminators for polymorphic sub-schemas
const Booking = mongoose.model('Booking', baseBookingSchema);

// Visa Application sub-model
const visaSchema = new mongoose.Schema({
  nationality: { type: String, required: [true, 'Nationality required for visa'] },
  destination: { type: String, required: [true, 'Destination required for visa'] },
  travelDate: { type: Date, required: [true, 'Travel date required'] },
  returnDate: Date,
  purpose: { type: String, required: [true, 'Purpose required'] },
  passportNumber: { type: String, required: [true, 'Passport number required'] },
  passportExpiry: { type: Date, required: [true, 'Passport expiry required'] },
  dateOfBirth: { type: Date, required: [true, 'DOB required'] },
  passportFile: String,
  photoFile: String,
  documentFiles: [String]
});
Booking.VisaApplication = Booking.discriminator('visa-application', visaSchema);

// Flight Booking sub-model
const flightSchema = new mongoose.Schema({
  departure: { type: String, required: [true, 'Departure required'] },
  departureDate: { type: Date, required: [true, 'Departure date required'] },
  passengers: { type: Number, required: [true, 'Passengers required'], min: 1 },
  class: {
    type: String,
    enum: ['economy', 'premium-economy', 'business', 'first'],
    default: 'economy'
  }
});
Booking.FlightBooking = Booking.discriminator('flight-booking', flightSchema);

// Hotel Booking sub-model
const hotelSchema = new mongoose.Schema({
  checkIn: { type: Date, required: [true, 'Check-in required'] },
  checkOut: { type: Date, required: [true, 'Check-out required'] },
  guests: { type: Number, required: [true, 'Guests required'], min: 1 },
  rooms: { type: Number, required: [true, 'Rooms required'], min: 1 },
  hotelPreference: String
});
Booking.HotelBooking = Booking.discriminator('hotel-booking', hotelSchema);

// Concierge sub-model
const conciergeSchema = new mongoose.Schema({
  startDate: { type: Date, required: [true, 'Start date required'] },
  endDate: { type: Date, required: [true, 'End date required'] },
  travelers: { type: Number, required: [true, 'Travelers required'], min: 1 },
  interests: String,
  budget: String,
  specialRequests: String
});
Booking.Concierge = Booking.discriminator('concierge', conciergeSchema);

// Corporate Travel sub-model
const corporateSchema = new mongoose.Schema({
  companyName: { type: String, required: [true, 'Company name required'] },
  contactName: { type: String, required: [true, 'Contact name required'] },
  numberOfTravelers: { type: Number, required: [true, 'Number of travelers required'], min: 1 },
  requirements: String
});
Booking.CorporateTravel = Booking.discriminator('corporate-travel', corporateSchema);

// Consultation sub-model
const consultationSchema = new mongoose.Schema({
  preferredDate: { type: Date, required: [true, 'Preferred date required'] },
  preferredTime: String,
  topic: { type: String, required: [true, 'Topic required'] },
  details: String
});
Booking.Consultation = Booking.discriminator('consultation', consultationSchema);

// Package Request sub-model
const packageSchema = new mongoose.Schema({
  packageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Package',
    required: [true, 'Package ID required']
  },
  packageName: { type: String, required: [true, 'Package name required'] }
});
Booking.PackageRequest = Booking.discriminator('package-request', packageSchema);

module.exports = Booking;