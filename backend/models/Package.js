/**
 * Package Model
 * Manages travel package offerings with enhanced validation, relations, and performance.
 * Version: 2.0 (World-Class Edition)
 * @module models/Package
 */

const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete'); // Soft deletes (npm i mongoose-delete)
const mongoosePaginate = require('mongoose-paginate-v2'); // Pagination (npm i mongoose-paginate-v2)
const slugify = require('slugify'); // Better slug generation (npm i slugify)

/**
 * Sub-schema for itinerary items to allow structured, validated data.
 */
const itinerarySubSchema = new mongoose.Schema({
  day: {
    type: Number,
    required: [true, 'Day number is required'],
    min: [1, 'Day must be at least 1']
  },
  title: {
    type: String,
    required: [true, 'Itinerary title is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  activities: [{
    type: String,
    trim: true
  }]
}, { _id: false }); // No _id for subdocs

const packageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Package name is required'],
    trim: true,
    minlength: [3, 'Name must be at least 3 characters'],
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true
  },
  destination: {
    type: String, // Could ref: 'Destination' for relations
    required: [true, 'Destination is required'],
    trim: true
  },
  duration: {
    type: String,
    required: [true, 'Duration is required'],
    trim: true // e.g., "7 days / 6 nights"
  },
  price: {
    type: mongoose.Schema.Types.Decimal128, // Precise for money
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative'],
    get: v => (v ? parseFloat(v.toString()) : null) // Getter for clean output
  },
  currency: {
    type: String,
    default: 'USD',
    uppercase: true,
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    minlength: [50, 'Description must be at least 50 characters']
  },
  highlights: [{
    type: String,
    trim: true
  }],
  itinerary: [itinerarySubSchema],
  inclusions: [{
    type: String,
    trim: true
  }],
  exclusions: [{
    type: String,
    trim: true
  }],
  images: [{
    type: String, // URLs
    trim: true
  }],
  mainImage: {
    type: String,
    trim: true
  },
  startDate: {
    type: Date,
    validate: {
      validator: function(v) {
        return !this.endDate || v < this.endDate;
      },
      message: 'Start date must be before end date'
    }
  },
  endDate: Date,
  maxParticipants: {
    type: Number,
    min: [1, 'Max participants must be at least 1']
  },
  currentParticipants: {
    type: Number,
    default: 0,
    min: [0, 'Participants cannot be negative']
  },
  featured: {
    type: Boolean,
    default: false
  },
  priority: {
    type: Number,
    default: 0,
    min: 0
  },
  active: {
    type: Boolean,
    default: true
  },
  category: {
    type: String,
    enum: {
      values: ['luxury', 'adventure', 'cultural', 'beach', 'safari', 'city-break', 'group', 'other'],
      message: '{VALUE} is not a supported category'
    },
    default: 'cultural'
  },
  difficulty: {
    type: String,
    enum: {
      values: ['easy', 'moderate', 'challenging'],
      message: '{VALUE} is not a supported difficulty level'
    },
    default: 'moderate'
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  views: {
    type: Number,
    default: 0,
    min: 0
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  }
}, {
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
  autoIndex: false, // Disable in prod; manage via migrations
  autoCreate: false,
  toJSON: { virtuals: true, getters: true }, // Include virtuals in API output
  toObject: { virtuals: true, getters: true },
  optimisticConcurrency: true, // Prevent race conditions on updates
  collectionOptions: {
    collation: { locale: 'en_US', strength: 2 } // Case-insensitive queries
  }
});

// Virtual: Remaining spots
packageSchema.virtual('availability').get(function() {
  return this.maxParticipants ? this.maxParticipants - this.currentParticipants : null;
});

// Virtual: Bookable status
packageSchema.virtual('isBookable').get(function() {
  return this.active && this.status === 'published' && (!this.maxParticipants || this.availability > 0);
});

// Pre-save hook: Generate unique slug
packageSchema.pre('save', async function(next) {
  if (this.isModified('name')) {
    let baseSlug = slugify(this.name, { lower: true, strict: true, trim: true });
    let slug = baseSlug;
    let counter = 1;

    // Check for uniqueness and append suffix if needed
    while (await this.constructor.exists({ slug })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    this.slug = slug;
  }
  next();
});

// Indexes (create manually in prod via db migrations)
packageSchema.index({ slug: 1 }, { unique: true });
packageSchema.index({ destination: 1 });
packageSchema.index({ featured: 1 });
packageSchema.index({ active: 1 });
packageSchema.index({ price: 1 });
packageSchema.index({ category: 1 });
packageSchema.index({ tags: 'text', name: 'text', description: 'text' }); // Full-text search

// Plugins
packageSchema.plugin(mongooseDelete, { deletedAt: true, overrideMethods: 'all' }); // Soft deletes
packageSchema.plugin(mongoosePaginate); // Pagination support (e.g., Package.paginate(query, options))

module.exports = mongoose.model('Package', packageSchema);