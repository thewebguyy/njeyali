/**
 * Visa Routes
 * Handles visa checking and country data
 */

const express = require('express');
const router = express.Router();
const VisaRequirement = require('../models/VisaRequirement');

// Country code to name mapping
const COUNTRY_NAMES = {
    'AF': 'Afghanistan', 'AL': 'Albania', 'DZ': 'Algeria', 'AD': 'Andorra',
    'AO': 'Angola', 'AG': 'Antigua and Barbuda', 'AR': 'Argentina', 'AM': 'Armenia',
    'AU': 'Australia', 'AT': 'Austria', 'AZ': 'Azerbaijan', 'BS': 'Bahamas',
    'BH': 'Bahrain', 'BD': 'Bangladesh', 'BB': 'Barbados', 'BY': 'Belarus',
    'BE': 'Belgium', 'BZ': 'Belize', 'BJ': 'Benin', 'BT': 'Bhutan',
    'BO': 'Bolivia', 'BA': 'Bosnia and Herzegovina', 'BW': 'Botswana', 'BR': 'Brazil',
    'BN': 'Brunei', 'BG': 'Bulgaria', 'BF': 'Burkina Faso', 'BI': 'Burundi',
    'KH': 'Cambodia', 'CM': 'Cameroon', 'CA': 'Canada', 'CV': 'Cape Verde',
    'CF': 'Central African Republic', 'TD': 'Chad', 'CL': 'Chile', 'CN': 'China',
    'CO': 'Colombia', 'KM': 'Comoros', 'CG': 'Congo', 'CR': 'Costa Rica',
    'HR': 'Croatia', 'CU': 'Cuba', 'CY': 'Cyprus', 'CZ': 'Czech Republic',
    'DK': 'Denmark', 'DJ': 'Djibouti', 'DM': 'Dominica', 'DO': 'Dominican Republic',
    'EC': 'Ecuador', 'EG': 'Egypt', 'SV': 'El Salvador', 'GQ': 'Equatorial Guinea',
    'ER': 'Eritrea', 'EE': 'Estonia', 'ET': 'Ethiopia', 'FJ': 'Fiji',
    'FI': 'Finland', 'FR': 'France', 'GA': 'Gabon', 'GM': 'Gambia',
    'GE': 'Georgia', 'DE': 'Germany', 'GH': 'Ghana', 'GR': 'Greece',
    'GD': 'Grenada', 'GT': 'Guatemala', 'GN': 'Guinea', 'GW': 'Guinea-Bissau',
    'GY': 'Guyana', 'HT': 'Haiti', 'HN': 'Honduras', 'HU': 'Hungary',
    'IS': 'Iceland', 'IN': 'India', 'ID': 'Indonesia', 'IR': 'Iran',
    'IQ': 'Iraq', 'IE': 'Ireland', 'IL': 'Israel', 'IT': 'Italy',
    'JM': 'Jamaica', 'JP': 'Japan', 'JO': 'Jordan', 'KZ': 'Kazakhstan',
    'KE': 'Kenya', 'KI': 'Kiribati', 'KP': 'North Korea', 'KR': 'South Korea',
    'KW': 'Kuwait', 'KG': 'Kyrgyzstan', 'LA': 'Laos', 'LV': 'Latvia',
    'LB': 'Lebanon', 'LS': 'Lesotho', 'LR': 'Liberia', 'LY': 'Libya',
    'LI': 'Liechtenstein', 'LT': 'Lithuania', 'LU': 'Luxembourg', 'MK': 'North Macedonia',
    'MG': 'Madagascar', 'MW': 'Malawi', 'MY': 'Malaysia', 'MV': 'Maldives',
    'ML': 'Mali', 'MT': 'Malta', 'MH': 'Marshall Islands', 'MR': 'Mauritania',
    'MU': 'Mauritius', 'MX': 'Mexico', 'FM': 'Micronesia', 'MD': 'Moldova',
    'MC': 'Monaco', 'MN': 'Mongolia', 'ME': 'Montenegro', 'MA': 'Morocco',
    'MZ': 'Mozambique', 'MM': 'Myanmar', 'NA': 'Namibia', 'NR': 'Nauru',
    'NP': 'Nepal', 'NL': 'Netherlands', 'NZ': 'New Zealand', 'NI': 'Nicaragua',
    'NE': 'Niger', 'NG': 'Nigeria', 'NO': 'Norway', 'OM': 'Oman',
    'PK': 'Pakistan', 'PW': 'Palau', 'PA': 'Panama', 'PG': 'Papua New Guinea',
    'PY': 'Paraguay', 'PE': 'Peru', 'PH': 'Philippines', 'PL': 'Poland',
    'PT': 'Portugal', 'QA': 'Qatar', 'RO': 'Romania', 'RU': 'Russia',
    'RW': 'Rwanda', 'KN': 'Saint Kitts and Nevis', 'LC': 'Saint Lucia', 'VC': 'Saint Vincent',
    'WS': 'Samoa', 'SM': 'San Marino', 'ST': 'Sao Tome', 'SA': 'Saudi Arabia',
    'SN': 'Senegal', 'RS': 'Serbia', 'SC': 'Seychelles', 'SL': 'Sierra Leone',
    'SG': 'Singapore', 'SK': 'Slovakia', 'SI': 'Slovenia', 'SB': 'Solomon Islands',
    'SO': 'Somalia', 'ZA': 'South Africa', 'SS': 'South Sudan', 'ES': 'Spain',
    'LK': 'Sri Lanka', 'SD': 'Sudan', 'SR': 'Suriname', 'SZ': 'Eswatini',
    'SE': 'Sweden', 'CH': 'Switzerland', 'SY': 'Syria', 'TW': 'Taiwan',
    'TJ': 'Tajikistan', 'TZ': 'Tanzania', 'TH': 'Thailand', 'TL': 'Timor-Leste',
    'TG': 'Togo', 'TO': 'Tonga', 'TT': 'Trinidad and Tobago', 'TN': 'Tunisia',
    'TR': 'Turkey', 'TM': 'Turkmenistan', 'TV': 'Tuvalu', 'UG': 'Uganda',
    'UA': 'Ukraine', 'AE': 'United Arab Emirates', 'GB': 'United Kingdom', 'US': 'United States',
    'UY': 'Uruguay', 'UZ': 'Uzbekistan', 'VU': 'Vanuatu', 'VA': 'Vatican City',
    'VE': 'Venezuela', 'VN': 'Vietnam', 'YE': 'Yemen', 'ZM': 'Zambia', 'ZW': 'Zimbabwe'
};

/**
 * GET /api/visa/countries
 * Get list of all countries for dropdowns
 */
router.get('/countries', async (req, res) => {
    try {
        // Get unique countries from visa requirements
        const fromCountries = await VisaRequirement.distinct('fromCountry');
        const toCountries = await VisaRequirement.distinct('toCountry');
        
        // Combine and remove duplicates
        const allCountryCodes = [...new Set([...fromCountries, ...toCountries])];
        
        // If no data in database, return all countries
        const countryCodes = allCountryCodes.length > 0 
            ? allCountryCodes 
            : Object.keys(COUNTRY_NAMES);
        
        // Map to country objects with names
        const countries = countryCodes
            .map(code => ({
                code: code,
                name: COUNTRY_NAMES[code] || code
            }))
            .sort((a, b) => a.name.localeCompare(b.name));

        res.json({ 
            success: true,
            countries: countries,
            count: countries.length
        });
    } catch (error) {
        console.error('Error fetching countries:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to load countries',
            error: error.message
        });
    }
});

/**
 * POST /api/visa/check
 * Check visa requirements for a country pair
 */
router.post('/check', async (req, res) => {
    try {
        const { nationality, residency, destination } = req.body;

        // Validate inputs
        if (!nationality || !destination) {
            return res.status(400).json({
                success: false,
                message: 'Nationality and destination are required'
            });
        }

        // Look up visa requirement
        const requirement = await VisaRequirement.findOne({
            fromCountry: nationality,
            toCountry: destination
        });

        if (requirement) {
            // Found specific requirement
            const destinationName = COUNTRY_NAMES[destination] || destination;
            
            const response = {
                success: true,
                visaRequired: requirement.visaRequired,
                message: requirement.visaRequired 
                    ? `Visa required for ${destinationName}`
                    : `No visa required for ${destinationName}`,
                details: requirement.details || (requirement.visaRequired 
                    ? 'You will need to apply for a visa before traveling.'
                    : 'You can travel without a visa.'),
                processingTime: requirement.processingTime || 'Varies',
                validityPeriod: requirement.validityPeriod || 'Varies',
                requirements: requirement.requirements || [],
                estimatedCost: requirement.estimatedCost || null,
                nationality: COUNTRY_NAMES[nationality] || nationality,
                destination: destinationName
            };

            res.json(response);
        } else {
            // No data found - default to visa required for safety
            const destinationName = COUNTRY_NAMES[destination] || destination;
            
            res.json({
                success: true,
                visaRequired: true,
                message: `Visa information not available for ${destinationName}`,
                details: 'We will help you determine the specific requirements for your destination. Please contact us for personalized assistance.',
                processingTime: 'To be determined',
                validityPeriod: 'To be determined',
                requirements: ['Contact us for requirements'],
                nationality: COUNTRY_NAMES[nationality] || nationality,
                destination: destinationName
            });
        }
    } catch (error) {
        console.error('Error checking visa:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to check visa requirements',
            error: error.message
        });
    }
});

/**
 * GET /api/visa/requirements
 * Get detailed visa requirements for a country pair
 */
router.get('/requirements', async (req, res) => {
    try {
        const { from, to } = req.query;

        if (!from || !to) {
            return res.status(400).json({
                success: false,
                message: 'From and to countries are required'
            });
        }

        const requirement = await VisaRequirement.findOne({
            fromCountry: from,
            toCountry: to
        });

        if (requirement) {
            res.json({
                success: true,
                requirement: {
                    ...requirement.toObject(),
                    fromCountryName: COUNTRY_NAMES[from] || from,
                    toCountryName: COUNTRY_NAMES[to] || to
                }
            });
        } else {
            res.json({
                success: true,
                requirement: null,
                message: 'No visa requirement data found for this country pair'
            });
        }
    } catch (error) {
        console.error('Error fetching visa requirements:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to fetch visa requirements',
            error: error.message
        });
    }
});

/**
 * GET /api/visa/popular-destinations
 * Get popular visa destinations
 */
router.get('/popular-destinations', async (req, res) => {
    try {
        const popularDestinations = ['US', 'GB', 'CA', 'UAE', 'FR', 'DE', 'AU', 'SG'];
        
        const destinations = popularDestinations.map(code => ({
            code: code,
            name: COUNTRY_NAMES[code] || code
        }));

        res.json({
            success: true,
            destinations: destinations
        });
    } catch (error) {
        console.error('Error fetching popular destinations:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to load popular destinations',
            error: error.message
        });
    }
});

module.exports = router;
