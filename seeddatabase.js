const mongoose = require('mongoose');
const Country = require('./models/Country');
const Visa = require('./models/Visa');
require('dotenv').config();

// Sample countries data
const countries = [
    { name: 'United States', code: 'USA', region: 'North America' },
    { name: 'United Kingdom', code: 'GBR', region: 'Europe' },
    { name: 'Canada', code: 'CAN', region: 'North America' },
    { name: 'Nigeria', code: 'NGA', region: 'Africa' },
    { name: 'Ghana', code: 'GHA', region: 'Africa' },
    { name: 'Kenya', code: 'KEN', region: 'Africa' },
    { name: 'South Africa', code: 'ZAF', region: 'Africa' },
    { name: 'France', code: 'FRA', region: 'Europe' },
    { name: 'Germany', code: 'DEU', region: 'Europe' },
    { name: 'Spain', code: 'ESP', region: 'Europe' },
    { name: 'Italy', code: 'ITA', region: 'Europe' },
    { name: 'United Arab Emirates', code: 'ARE', region: 'Middle East' },
    { name: 'Saudi Arabia', code: 'SAU', region: 'Middle East' },
    { name: 'Qatar', code: 'QAT', region: 'Middle East' },
    { name: 'China', code: 'CHN', region: 'Asia' },
    { name: 'Japan', code: 'JPN', region: 'Asia' },
    { name: 'India', code: 'IND', region: 'Asia' },
    { name: 'Singapore', code: 'SGP', region: 'Asia' },
    { name: 'Thailand', code: 'THA', region: 'Asia' },
    { name: 'Malaysia', code: 'MYS', region: 'Asia' },
    { name: 'Australia', code: 'AUS', region: 'Oceania' },
    { name: 'New Zealand', code: 'NZL', region: 'Oceania' },
    { name: 'Brazil', code: 'BRA', region: 'South America' },
    { name: 'Argentina', code: 'ARG', region: 'South America' },
    { name: 'Mexico', code: 'MEX', region: 'North America' },
    { name: 'Egypt', code: 'EGY', region: 'Africa' },
    { name: 'Morocco', code: 'MAR', region: 'Africa' },
    { name: 'Tunisia', code: 'TUN', region: 'Africa' },
    { name: 'Ethiopia', code: 'ETH', region: 'Africa' },
    { name: 'Rwanda', code: 'RWA', region: 'Africa' },
    { name: 'Tanzania', code: 'TZA', region: 'Africa' },
    { name: 'Uganda', code: 'UGA', region: 'Africa' },
    { name: 'Senegal', code: 'SEN', region: 'Africa' },
    { name: 'Ivory Coast', code: 'CIV', region: 'Africa' },
    { name: 'Cameroon', code: 'CMR', region: 'Africa' },
    { name: 'Zambia', code: 'ZMB', region: 'Africa' },
    { name: 'Zimbabwe', code: 'ZWE', region: 'Africa' },
    { name: 'Botswana', code: 'BWA', region: 'Africa' },
    { name: 'Namibia', code: 'NAM', region: 'Africa' },
    { name: 'Mauritius', code: 'MUS', region: 'Africa' },
    { name: 'Seychelles', code: 'SYC', region: 'Africa' },
    { name: 'Turkey', code: 'TUR', region: 'Europe/Asia' },
    { name: 'Russia', code: 'RUS', region: 'Europe/Asia' },
    { name: 'South Korea', code: 'KOR', region: 'Asia' },
    { name: 'Indonesia', code: 'IDN', region: 'Asia' },
    { name: 'Philippines', code: 'PHL', region: 'Asia' },
    { name: 'Vietnam', code: 'VNM', region: 'Asia' },
    { name: 'Pakistan', code: 'PAK', region: 'Asia' },
    { name: 'Bangladesh', code: 'BGD', region: 'Asia' },
    { name: 'Sri Lanka', code: 'LKA', region: 'Asia' }
];

// Sample visa requirements data
const visaRequirements = [
    // Nigerian passport holders
    {
        nationalityCode: 'NGA',
        residencyCode: 'NGA',
        destinationCode: 'USA',
        visaRequired: 'yes',
        visaType: 'B1/B2 Tourist/Business Visa',
        processingTime: '3-5 weeks',
        fees: { consular: 160, service: 50, total: 210 },
        documents: ['Valid passport', 'DS-160 form', 'Visa appointment confirmation', 'Passport photos', 'Bank statements', 'Employment letter'],
        title: 'Visa Required',
        message: 'Nigerian citizens require a visa to enter the United States.'
    },
    {
        nationalityCode: 'NGA',
        residencyCode: 'NGA',
        destinationCode: 'GBR',
        visaRequired: 'yes',
        visaType: 'UK Standard Visitor Visa',
        processingTime: '3 weeks',
        fees: { consular: 115, service: 45, total: 160 },
        documents: ['Valid passport', 'Online application form', 'Passport photos', 'Bank statements', 'Travel itinerary', 'Accommodation proof'],
        title: 'Visa Required',
        message: 'Nigerian citizens require a visa to enter the United Kingdom.'
    },
    {
        nationalityCode: 'NGA',
        residencyCode: 'NGA',
        destinationCode: 'CAN',
        visaRequired: 'yes',
        visaType: 'Temporary Resident Visa',
        processingTime: '2-4 weeks',
        fees: { consular: 100, service: 40, total: 140 },
        documents: ['Valid passport', 'IMM 5257 form', 'Passport photos', 'Financial proof', 'Travel purpose letter'],
        title: 'Visa Required',
        message: 'Nigerian citizens require a visa to enter Canada.'
    },
    {
        nationalityCode: 'NGA',
        residencyCode: 'NGA',
        destinationCode: 'GHA',
        visaRequired: 'no',
        title: 'No Visa Required',
        message: 'As a Nigerian citizen, you can travel to Ghana without a visa for stays up to 90 days.',
        notes: 'ECOWAS member countries enjoy visa-free travel between member states.'
    },
    {
        nationalityCode: 'NGA',
        residencyCode: 'NGA',
        destinationCode: 'KEN',
        visaRequired: 'e-visa',
        visaType: 'Kenya eVisa',
        processingTime: '2-3 days',
        fees: { consular: 51, service: 25, total: 76 },
        documents: ['Valid passport', 'Passport photo', 'Flight tickets', 'Accommodation proof'],
        title: 'eVisa Available',
        message: 'Nigerian citizens can obtain an eVisa online before traveling to Kenya.',
        notes: 'Apply at www.evisa.go.ke'
    },
    {
        nationalityCode: 'NGA',
        residencyCode: 'NGA',
        destinationCode: 'ARE',
        visaRequired: 'visa-on-arrival',
        visaType: 'UAE Tourist Visa',
        processingTime: 'On arrival',
        fees: { consular: 100, service: 0, total: 100 },
        documents: ['Valid passport', 'Return ticket', 'Hotel reservation'],
        title: 'Visa on Arrival',
        message: 'Nigerian citizens can obtain a visa on arrival in the UAE.',
        notes: 'Valid for 30 days. Passport must be valid for at least 6 months.'
    },
    // Add more combinations for other nationalities
    {
        nationalityCode: 'GBR',
        residencyCode: 'GBR',
        destinationCode: 'USA',
        visaRequired: 'no',
        title: 'Visa Waiver Program',
        message: 'UK citizens can travel to the USA under the Visa Waiver Program (ESTA) for stays up to 90 days.',
        notes: 'ESTA authorization must be obtained online before travel ($21 fee).'
    },
    {
        nationalityCode: 'USA',
        residencyCode: 'USA',
        destinationCode: 'NGA',
        visaRequired: 'visa-on-arrival',
        visaType: 'Nigerian Visa on Arrival',
        processingTime: 'On arrival',
        fees: { consular: 160, service: 0, total: 160 },
        documents: ['Valid passport', 'Return ticket', 'Hotel reservation', 'Yellow fever certificate'],
        title: 'Visa on Arrival',
        message: 'US citizens can obtain a visa on arrival in Nigeria.',
        notes: 'Pre-approval recommended. Valid for 30 days.'
    }
];

// Seed database function
const seedDatabase = async () => {
    try {
        console.log('🔄 Connecting to MongoDB...');
        
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        console.log('✅ Connected to MongoDB');

        // Clear existing data
        console.log('🗑️  Clearing existing data...');
        await Country.deleteMany({});
        await Visa.deleteMany({});

        // Insert countries
        console.log('📥 Inserting countries...');
        await Country.insertMany(countries);
        console.log(`✅ Inserted ${countries.length} countries`);

        // Insert visa requirements
        console.log('📥 Inserting visa requirements...');
        await Visa.insertMany(visaRequirements);
        console.log(`✅ Inserted ${visaRequirements.length} visa requirements`);

        console.log('🎉 Database seeded successfully!');
        console.log('\n📊 Summary:');
        console.log(`   Countries: ${countries.length}`);
        console.log(`   Visa Requirements: ${visaRequirements.length}`);
        console.log('\n✨ You can now start your server with: npm run dev');

        process.exit(0);

    } catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    }
};

// Run seeder
seedDatabase();