/**
 * Database Seeding Script
 * Seeds the database with sample visa requirements and packages
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import models
const VisaRequirement = require('../models/VisaRequirement');
const Package = require('../models/Package');
const Testimonial = require('../models/Testimonial');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/njeyali-travel';

// Sample visa requirements data
const visaRequirements = [
    // Nigerian passport holders
    {
        fromCountry: 'NG',
        toCountry: 'US',
        visaRequired: true,
        visaType: 'tourist',
        processingTime: '10-15 business days',
        validityPeriod: '10 years',
        maxStayDuration: '6 months per entry',
        estimatedCost: 185,
        currency: 'USD',
        eVisaAvailable: false,
        visaOnArrival: false,
        requirements: [
            'Valid passport (at least 6 months validity)',
            'Completed DS-160 form',
            'Passport-sized photographs',
            'Proof of financial capability',
            'Travel itinerary',
            'Proof of ties to home country',
            'Interview appointment'
        ],
        details: 'US tourist visa (B1/B2) required for Nigerian passport holders.'
    },
    {
        fromCountry: 'NG',
        toCountry: 'GB',
        visaRequired: true,
        visaType: 'tourist',
        processingTime: '15-20 business days',
        validityPeriod: '6 months to 10 years',
        maxStayDuration: '6 months per entry',
        estimatedCost: 115,
        currency: 'GBP',
        eVisaAvailable: false,
        visaOnArrival: false,
        requirements: [
            'Valid passport',
            'Completed visa application form',
            'Passport-sized photographs',
            'Proof of accommodation',
            'Financial evidence',
            'Travel itinerary',
            'Biometric information'
        ],
        details: 'UK Standard Visitor visa required for Nigerian citizens.'
    },
    {
        fromCountry: 'NG',
        toCountry: 'CA',
        visaRequired: true,
        visaType: 'tourist',
        processingTime: '10-20 business days',
        validityPeriod: 'Up to 10 years',
        maxStayDuration: '6 months per entry',
        estimatedCost: 100,
        currency: 'CAD',
        eVisaAvailable: true,
        visaOnArrival: false,
        requirements: [
            'Valid passport',
            'Online application',
            'Passport photos',
            'Proof of funds',
            'Travel history',
            'Biometrics required'
        ],
        details: 'Canadian Temporary Resident Visa (TRV) required.'
    },
    {
        fromCountry: 'NG',
        toCountry: 'AE',
        visaRequired: true,
        visaType: 'tourist',
        processingTime: '2-5 business days',
        validityPeriod: '60 days',
        maxStayDuration: '30 days',
        estimatedCost: 350,
        currency: 'AED',
        eVisaAvailable: true,
        visaOnArrival: false,
        requirements: [
            'Valid passport (6 months validity)',
            'Passport copy',
            'Passport-sized photograph',
            'Return ticket',
            'Hotel booking'
        ],
        details: 'Dubai tourist visa can be obtained online or through sponsors.'
    },
    {
        fromCountry: 'NG',
        toCountry: 'ZA',
        visaRequired: true,
        visaType: 'tourist',
        processingTime: '10-15 business days',
        validityPeriod: '90 days',
        maxStayDuration: '90 days',
        estimatedCost: 50,
        currency: 'USD',
        eVisaAvailable: false,
        visaOnArrival: false,
        requirements: [
            'Valid passport',
            'Completed application form',
            'Passport photographs',
            'Proof of accommodation',
            'Financial means',
            'Return ticket',
            'Yellow fever certificate'
        ],
        details: 'South African tourist visa required for Nigerian passport holders.'
    },
    {
        fromCountry: 'NG',
        toCountry: 'GH',
        visaRequired: false,
        visaType: 'tourist',
        processingTime: 'N/A',
        validityPeriod: '90 days',
        maxStayDuration: '90 days',
        estimatedCost: 0,
        currency: 'USD',
        eVisaAvailable: false,
        visaOnArrival: false,
        requirements: [],
        details: 'No visa required for ECOWAS citizens. Stay up to 90 days.'
    },
    {
        fromCountry: 'NG',
        toCountry: 'KE',
        visaRequired: true,
        visaType: 'tourist',
        processingTime: '2-5 business days',
        validityPeriod: '90 days',
        maxStayDuration: '90 days',
        estimatedCost: 51,
        currency: 'USD',
        eVisaAvailable: true,
        visaOnArrival: false,
        requirements: [
            'Valid passport',
            'Passport photograph',
            'Return ticket',
            'Proof of accommodation',
            'Yellow fever certificate'
        ],
        details: 'Kenya eVisa available online. Quick processing time.'
    },
    {
        fromCountry: 'NG',
        toCountry: 'FR',
        visaRequired: true,
        visaType: 'tourist',
        processingTime: '15-20 business days',
        validityPeriod: '90 days',
        maxStayDuration: '90 days within 180 days',
        estimatedCost: 80,
        currency: 'EUR',
        eVisaAvailable: false,
        visaOnArrival: false,
        requirements: [
            'Valid passport',
            'Completed application form',
            'Passport photographs',
            'Travel insurance',
            'Proof of accommodation',
            'Financial means',
            'Return ticket'
        ],
        details: 'Schengen visa allows travel to France and other Schengen countries.'
    },
    {
        fromCountry: 'NG',
        toCountry: 'TR',
        visaRequired: true,
        visaType: 'tourist',
        processingTime: '1-3 business days',
        validityPeriod: '180 days',
        maxStayDuration: '90 days',
        estimatedCost: 60,
        currency: 'USD',
        eVisaAvailable: true,
        visaOnArrival: false,
        requirements: [
            'Valid passport',
            'Credit card for payment',
            'Email address',
            'Return ticket',
            'Hotel booking'
        ],
        details: 'Turkey eVisa available online with quick approval.'
    },
    {
        fromCountry: 'NG',
        toCountry: 'EG',
        visaRequired: true,
        visaType: 'tourist',
        processingTime: '3-7 business days',
        validityPeriod: '90 days',
        maxStayDuration: '30 days',
        estimatedCost: 25,
        currency: 'USD',
        eVisaAvailable: true,
        visaOnArrival: true,
        requirements: [
            'Valid passport',
            'Passport photograph',
            'Return ticket',
            'Hotel booking'
        ],
        details: 'Egypt offers both eVisa and visa on arrival options.'
    }
];

// Sample travel packages
const packages = [
    {
        name: 'Dubai Luxury Experience',
        slug: 'dubai-luxury-experience',
        destination: 'Dubai, UAE',
        duration: '5 Days, 4 Nights',
        price: 2500,
        currency: 'USD',
        description: 'Experience the height of luxury in Dubai with 5-star accommodation, desert safari, and exclusive dining experiences.',
        highlights: [
            'Burj Khalifa visit with Sky Deck access',
            'Desert Safari with BBQ dinner',
            'Luxury hotel stay at 5-star property',
            'Dubai Marina cruise',
            'Shopping at Dubai Mall',
            'Visit to Palm Jumeirah'
        ],
        itinerary: [
            {
                day: 1,
                title: 'Arrival and Dubai Marina',
                description: 'Airport pickup and check-in to luxury hotel. Evening Dubai Marina cruise with dinner.',
                activities: ['Airport transfer', 'Hotel check-in', 'Marina cruise', 'Welcome dinner']
            },
            {
                day: 2,
                title: 'Burj Khalifa and Downtown Dubai',
                description: 'Visit the world\'s tallest building and explore downtown Dubai.',
                activities: ['Burj Khalifa visit', 'Dubai Mall shopping', 'Dubai Fountain show', 'Fine dining']
            },
            {
                day: 3,
                title: 'Desert Safari Adventure',
                description: 'Thrilling desert safari with dune bashing, camel rides, and traditional entertainment.',
                activities: ['Desert safari', 'Dune bashing', 'Camel riding', 'BBQ dinner', 'Cultural show']
            },
            {
                day: 4,
                title: 'Palm Jumeirah and Beach Day',
                description: 'Relax at the beach and explore Palm Jumeirah.',
                activities: ['Beach activities', 'Palm Jumeirah tour', 'Atlantis visit', 'Spa session']
            },
            {
                day: 5,
                title: 'Departure',
                description: 'Last-minute shopping and airport transfer.',
                activities: ['Check-out', 'Souk visit', 'Airport transfer']
            }
        ],
        inclusions: [
            '4 nights in 5-star hotel',
            'Daily breakfast',
            'Airport transfers',
            'All tours and activities mentioned',
            'Desert safari with BBQ dinner',
            'Dubai Marina cruise',
            'Burj Khalifa tickets',
            'Professional tour guide'
        ],
        exclusions: [
            'International flights',
            'Visa fees',
            'Personal expenses',
            'Lunch and dinners (except mentioned)',
            'Travel insurance',
            'Optional activities'
        ],
        images: ['dubai-1.jpg', 'dubai-2.jpg', 'dubai-3.jpg'],
        mainImage: 'dubai-main.jpg',
        featured: true,
        priority: 10,
        active: true,
        category: 'luxury',
        difficulty: 'easy',
        tags: ['luxury', 'city-break', 'shopping', 'desert', 'beach'],
        maxParticipants: 20
    },
    {
        name: 'South Africa Safari & Cape Town',
        slug: 'south-africa-safari-cape-town',
        destination: 'South Africa',
        duration: '7 Days, 6 Nights',
        price: 3200,
        currency: 'USD',
        description: 'Combine wildlife safari in Kruger National Park with the beauty of Cape Town in this unforgettable adventure.',
        highlights: [
            'Big 5 safari in Kruger National Park',
            'Table Mountain cable car',
            'Cape of Good Hope tour',
            'Wine tasting in Stellenbosch',
            'Robben Island visit',
            'V&A Waterfront exploration'
        ],
        itinerary: [
            {
                day: 1,
                title: 'Arrival in Johannesburg',
                description: 'Meet and transfer to hotel. City orientation.',
                activities: ['Airport transfer', 'Hotel check-in', 'Welcome briefing']
            },
            {
                day: 2-3,
                title: 'Kruger National Park Safari',
                description: 'Two full days of game drives in Kruger National Park.',
                activities: ['Morning game drive', 'Afternoon game drive', 'Bush walk', 'Wildlife spotting']
            },
            {
                day: 4,
                title: 'Fly to Cape Town',
                description: 'Transfer to Cape Town. Table Mountain visit.',
                activities: ['Flight to Cape Town', 'Table Mountain', 'City tour']
            },
            {
                day: 5,
                title: 'Cape Peninsula Tour',
                description: 'Full day tour to Cape of Good Hope and penguins.',
                activities: ['Chapman\'s Peak Drive', 'Cape of Good Hope', 'Boulders Beach', 'Penguin colony']
            },
            {
                day: 6,
                title: 'Winelands and Robben Island',
                description: 'Morning wine tasting, afternoon Robben Island tour.',
                activities: ['Stellenbosch visit', 'Wine tasting', 'Robben Island tour']
            },
            {
                day: 7,
                title: 'Departure',
                description: 'Last-minute shopping and departure.',
                activities: ['V&A Waterfront', 'Airport transfer']
            }
        ],
        inclusions: [
            '6 nights accommodation',
            'Daily breakfast',
            'All transfers',
            'Kruger safari with ranger',
            'All tours mentioned',
            'Entrance fees',
            'Professional guide'
        ],
        exclusions: [
            'International flights',
            'Domestic flight (Johannesburg-Cape Town)',
            'Visa fees',
            'Lunch and dinners',
            'Travel insurance',
            'Optional activities'
        ],
        featured: true,
        priority: 9,
        active: true,
        category: 'safari',
        difficulty: 'moderate',
        tags: ['safari', 'wildlife', 'adventure', 'nature', 'wine'],
        maxParticipants: 15
    },
    {
        name: 'Istanbul Cultural Journey',
        slug: 'istanbul-cultural-journey',
        destination: 'Istanbul, Turkey',
        duration: '4 Days, 3 Nights',
        price: 1200,
        currency: 'USD',
        description: 'Discover the rich history and culture of Istanbul, where East meets West.',
        highlights: [
            'Hagia Sophia and Blue Mosque',
            'Topkapi Palace tour',
            'Grand Bazaar shopping',
            'Bosphorus cruise',
            'Traditional Turkish bath',
            'Ottoman cuisine tasting'
        ],
        featured: true,
        priority: 8,
        active: true,
        category: 'cultural',
        difficulty: 'easy',
        tags: ['history', 'culture', 'city-break', 'food'],
        maxParticipants: 25,
        inclusions: [
            '3 nights in boutique hotel',
            'Daily breakfast',
            'All tours and entrance fees',
            'Bosphorus cruise',
            'Airport transfers',
            'English-speaking guide'
        ],
        exclusions: [
            'International flights',
            'Visa fees',
            'Lunch and dinners',
            'Personal expenses',
            'Travel insurance'
        ]
    },
    {
        name: 'Maldives Beach Paradise',
        slug: 'maldives-beach-paradise',
        destination: 'Maldives',
        duration: '6 Days, 5 Nights',
        price: 4500,
        currency: 'USD',
        description: 'Ultimate relaxation in an overwater villa with pristine beaches and crystal-clear waters.',
        highlights: [
            'Overwater villa stay',
            'Snorkeling and diving',
            'Spa treatments',
            'Sunset cruise',
            'Private beach access',
            'Water sports'
        ],
        featured: true,
        priority: 7,
        active: true,
        category: 'beach',
        difficulty: 'easy',
        tags: ['beach', 'luxury', 'honeymoon', 'relaxation', 'diving'],
        maxParticipants: 10,
        inclusions: [
            '5 nights overwater villa',
            'All meals included',
            'Airport speedboat transfer',
            'Daily snorkeling trip',
            'One spa treatment',
            'Sunset cruise'
        ],
        exclusions: [
            'International flights',
            'Additional spa treatments',
            'Diving courses',
            'Alcoholic beverages',
            'Travel insurance'
        ]
    },
    {
        name: 'Zanzibar Island Escape',
        slug: 'zanzibar-island-escape',
        destination: 'Zanzibar, Tanzania',
        duration: '5 Days, 4 Nights',
        price: 1800,
        currency: 'USD',
        description: 'Explore the spice island with beautiful beaches, historic Stone Town, and rich culture.',
        highlights: [
            'Stone Town walking tour',
            'Spice plantation visit',
            'Beach resort stay',
            'Snorkeling at Mnemba',
            'Jozani Forest tour',
            'Sunset dhow cruise'
        ],
        featured: false,
        priority: 6,
        active: true,
        category: 'beach',
        difficulty: 'easy',
        tags: ['beach', 'culture', 'history', 'snorkeling'],
        maxParticipants: 18,
        inclusions: [
            '4 nights beach resort',
            'Daily breakfast and dinner',
            'Airport transfers',
            'Stone Town tour',
            'Spice tour',
            'Snorkeling trip'
        ],
        exclusions: [
            'International flights',
            'Visa fees',
            'Lunch',
            'Personal expenses',
            'Travel insurance',
            'Optional activities'
        ]
    },
    {
        name: 'Morocco Desert Adventure',
        slug: 'morocco-desert-adventure',
        destination: 'Morocco',
        duration: '8 Days, 7 Nights',
        price: 2800,
        currency: 'USD',
        description: 'Experience the magic of Morocco from Marrakech to the Sahara Desert and imperial cities.',
        highlights: [
            'Marrakech souks and palaces',
            'Sahara desert camel trek',
            'Overnight in desert camp',
            'Fes medina tour',
            'Atlas Mountains crossing',
            'Traditional Moroccan cuisine'
        ],
        featured: false,
        priority: 5,
        active: true,
        category: 'adventure',
        difficulty: 'moderate',
        tags: ['desert', 'adventure', 'culture', 'food', 'trekking'],
        maxParticipants: 16,
        inclusions: [
            '7 nights accommodation',
            'Daily breakfast',
            'Desert camp experience',
            'All transportation',
            'Professional guide',
            'Entrance fees',
            'Some dinners'
        ],
        exclusions: [
            'International flights',
            'Visa fees',
            'Most lunches and dinners',
            'Personal expenses',
            'Travel insurance',
            'Tips'
        ]
    }
];

// Sample testimonials
const testimonials = [
    {
        name: 'Chidinma Okafor',
        email: 'chidinma@example.com',
        rating: 5,
        message: 'Njeyali Travel made my Dubai trip absolutely seamless! From visa application to hotel booking, everything was perfect. The team was professional and responsive throughout.',
        serviceType: 'visa',
        location: 'Lagos, Nigeria',
        approved: true,
        featured: true
    },
    {
        name: 'Tunde Adeyemi',
        email: 'tunde@example.com',
        rating: 5,
        message: 'Best travel agency I\'ve ever worked with! They handled our corporate retreat to Cape Town flawlessly. Highly recommended!',
        serviceType: 'corporate-travel',
        location: 'Abuja, Nigeria',
        approved: true,
        featured: true
    },
    {
        name: 'Amara Nwosu',
        email: 'amara@example.com',
        rating: 5,
        message: 'The concierge service was exceptional. They planned every detail of our honeymoon in Maldives. It was truly magical!',
        serviceType: 'concierge',
        location: 'Port Harcourt, Nigeria',
        approved: true,
        featured: true
    }
];

// Seed function
async function seedDatabase() {
    try {
        console.log('🌱 Starting database seeding...');
        console.log(`📊 Connecting to: ${MONGODB_URI}`);
        
        await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        
        console.log('✅ Connected to MongoDB');

        // Clear existing data
        console.log('🗑️  Clearing existing data...');
        await VisaRequirement.deleteMany({});
        await Package.deleteMany({});
        await Testimonial.deleteMany({});
        
        console.log('✅ Existing data cleared');

        // Seed visa requirements
        console.log('📝 Seeding visa requirements...');
        const visaResults = await VisaRequirement.insertMany(visaRequirements);
        console.log(`✅ Created ${visaResults.length} visa requirements`);

        // Seed packages
        console.log('📦 Seeding travel packages...');
        const packageResults = await Package.insertMany(packages);
        console.log(`✅ Created ${packageResults.length} travel packages`);

        // Seed testimonials
        console.log('💬 Seeding testimonials...');
        const testimonialResults = await Testimonial.insertMany(testimonials);
        console.log(`✅ Created ${testimonialResults.length} testimonials`);

        console.log('');
        console.log('='.repeat(60));
        console.log('🎉 Database seeding completed successfully!');
        console.log('='.repeat(60));
        console.log('');
        console.log('Summary:');
        console.log(`  Visa Requirements: ${visaResults.length}`);
        console.log(`  Travel Packages: ${packageResults.length}`);
        console.log(`  Testimonials: ${testimonialResults.length}`);
        console.log('');
        console.log('You can now start your server with: npm start');
        console.log('='.repeat(60));

    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        console.log('📊 Database connection closed');
        process.exit(0);
    }
}

// Run seeding
if (require.main === module) {
    seedDatabase();
}

module.exports = { seedDatabase };
