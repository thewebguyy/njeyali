/**
 * VisaRequirement Model
 * Stores visa requirements for country pairs using ISO 3166-1 alpha-2 codes.
 * Enhanced for validation, performance, and maintainability.
 * Version: 2.0 (World-Class Edition)
 */

const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete'); // For soft deletes (npm install mongoose-delete)

// Complete list of ISO 3166-1 alpha-2 codes (sourced from standards as of 2025)
const ISO_COUNTRY_CODES = [
  'AD', 'AE', 'AF', 'AG', 'AI', 'AL', 'AM', 'AO', 'AQ', 'AR', 'AS', 'AT', 'AU', 'AW', 'AX', 'AZ',
  'BA', 'BB', 'BD', 'BE', 'BF', 'BG', 'BH', 'BI', 'BJ', 'BL', 'BM', 'BN', 'BO', 'BQ', 'BR', 'BS',
  'BT', 'BV', 'BW', 'BY', 'BZ', 'CA', 'CC', 'CD', 'CF', 'CG', 'CH', 'CI', 'CK', 'CL', 'CM', 'CN',
  'CO', 'CR', 'CU', 'CV', 'CW', 'CX', 'CY', 'CZ', 'DE', 'DJ', 'DK', 'DM', 'DO', 'DZ', 'EC', 'EE',
  'EG', 'EH', 'ER', 'ES', 'ET', 'FI', 'FJ', 'FK', 'FM', 'FO', 'FR', 'GA', 'GB', 'GD', 'GE', 'GF',
  'GG', 'GH', 'GI', 'GL', 'GM', 'GN', 'GP', 'GQ', 'GR', 'GS', 'GT', 'GU', 'GW', 'GY', 'HK', 'HM',
  'HN', 'HR', 'HT', 'HU', 'ID', 'IE', 'IL', 'IM', 'IN', 'IO', 'IQ', 'IR', 'IS', 'IT', 'JE', 'JM',
  'JO', 'JP', 'KE', 'KG', 'KH', 'KI', 'KM', 'KN', 'KP', 'KR', 'KW', 'KY', 'KZ', 'LA', 'LB', 'LC',
  'LI', 'LK', 'LR', 'LS', 'LT', 'LU', 'LV', 'LY', 'MA', 'MC', 'MD', 'ME', 'MF', 'MG', 'MH', 'MK',
  'ML', 'MM', 'MN', 'MO', 'MP', 'MQ', 'MR', 'MS', 'MT', 'MU', 'MV', 'MW', 'MX', 'MY', 'MZ', 'NA',
  'NC', 'NE', 'NF', 'NG', 'NI', 'NL', 'NO', 'NP', 'NR', 'NU', 'NZ', 'OM', 'PA', 'PE', 'PF', 'PG',
  'PH', 'PK', 'PL', 'PM', 'PN', 'PR', 'PS', 'PT', 'PW', 'PY', 'QA', 'RE', 'RO', 'RS', 'RU', 'RW',
  'SA', 'SB', 'SC', 'SD', 'SE', 'SG', 'SH', 'SI', 'SJ', 'SK', 'SL', 'SM', 'SN', 'SO', 'SR', 'SS',
  'ST', 'SV', 'SX', 'SY', 'SZ', 'TC', 'TD', 'TF', 'TG', 'TH', 'TJ', 'TK', 'TL', 'TM', 'TN', 'TO',
  'TR', 'TT', 'TV', 'TW', 'TZ', 'UA', 'UG', 'UM', 'US', 'UY', 'UZ', 'VA', 'VC', 'VE', 'VG', 'VI',
  'VN', 'VU', 'WF', 'WS', 'YE', 'YT', 'ZA', 'ZM', 'ZW'
];

/**
 * Sub-schema for requirements to allow structured data.
 */
const requirementSubSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  required: { type: Boolean, default: true }
}, { _id: false }); // No _id for subdocs

const visaRequirementSchema = new mongoose.Schema({
  fromCountry: {
    type: String,
    required: [true, 'From country code is required'],
    uppercase: true,
    trim: true,
    validate: {
      validator: function(v) {
        return ISO_COUNTRY_CODES.includes(v);
      },
      message: props => `${props.value} is not a valid ISO 3166-1 alpha-2 country code`
    }
  },
  toCountry: {
    type: String,
    required: [true, 'To country code is required'],
    uppercase: true,
    trim: true,
    validate: {
      validator: function(v) {
        return ISO_COUNTRY_CODES.includes(v);
      },
      message: props => `${props.value} is not a valid ISO 3166-1 alpha-2 country code`
    }
  },
  visaRequired: {
    type: Boolean,
    required: true,
    default: true
  },
  visaType: {
    type: String,
    enum: {
      values: ['tourist', 'business', 'transit', 'student', 'work', 'medical', 'multiple', 'other'],
      message: '{VALUE} is not a supported visa type'
    },
    default: 'tourist'
  },
  processingTime: {
    type: String,
    default: '5-10 business days',
    trim: true
  },
  validityPeriod: {
    type: String,
    default: '90 days',
    trim: true
  },
  maxStayDuration: {
    type: String,
    default: '30 days',
    trim: true
  },
  estimatedCost: {
    type: mongoose.Schema.Types.Decimal128, // Precise for money
    min: [0, 'Cost cannot be negative'],
    get: v => (v ? parseFloat(v.toString()) : null) // Getter for clean output
  },
  currency: {
    type: String,
    default: 'USD',
    uppercase: true,
    trim: true
  },
  requirements: [requirementSubSchema], // Structured array
  details: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  visaOnArrival: {
    type: Boolean,
    default: false
  },
  eVisaAvailable: {
    type: Boolean,
    default: false
  },
  source: {
    type: String, // e.g., 'manual', 'VisaHQ API'
    default: 'manual',
    trim: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
  autoIndex: false, // Disable in prod; manage via migrations
  autoCreate: false,
  toJSON: { virtuals: true, getters: true }, // Include virtuals in API output
  toObject: { virtuals: true, getters: true },
  optimisticConcurrency: true, // Prevent race conditions
  collectionOptions: {
    collation: { locale: 'en_US', strength: 2 } // Case-insensitive queries
  }
});

// Virtual: Computed property for visa-free check
visaRequirementSchema.virtual('isVisaFree').get(function() {
  return !this.visaRequired && !this.visaOnArrival && !this.eVisaAvailable;
});

// Pre-save hook: Update lastUpdated on changes
visaRequirementSchema.pre('save', function(next) {
  if (this.isModified()) {
    this.lastUpdated = Date.now();
  }
  next();
});

// Indexes (create manually in prod)
visaRequirementSchema.index({ fromCountry: 1, toCountry: 1 }, { unique: true });
visaRequirementSchema.index({ fromCountry: 1 });
visaRequirementSchema.index({ toCountry: 1 });
visaRequirementSchema.index({ visaRequired: 1 });
visaRequirementSchema.index({ visaType: 1 }); // New: For type-based queries

// Plugin: Soft deletes (deleted: true, deletedAt: Date)
visaRequirementSchema.plugin(mongooseDelete, { deletedAt: true, overrideMethods: 'all' });

module.exports = mongoose.model('VisaRequirement', visaRequirementSchema);