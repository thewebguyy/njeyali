const Tesseract = require('tesseract.js');
const Country = require('../models/Country');

// Extract passport data from image
exports.extractPassportData = async (imagePath) => {
    try {
        // Perform OCR on the image
        const { data: { text } } = await Tesseract.recognize(
            imagePath,
            'eng',
            {
                logger: info => console.log('OCR Progress:', info)
            }
        );

        // Parse the extracted text
        const passportData = {
            fullName: '',
            nationality: '',
            passportNumber: '',
            dateOfBirth: '',
            expiryDate: ''
        };

        // Extract passport number (usually starts with letters followed by numbers)
        const passportNumberMatch = text.match(/[A-Z]{1,2}\d{6,9}/);
        if (passportNumberMatch) {
            passportData.passportNumber = passportNumberMatch[0];
        }

        // Extract names (look for "Name" or "Surname" keywords)
        const namePatterns = [
            /Surname[:\s]+([A-Z\s]+)/i,
            /Given Names?[:\s]+([A-Z\s]+)/i,
            /Name[:\s]+([A-Z\s]+)/i
        ];

        let surname = '';
        let givenName = '';

        for (const pattern of namePatterns) {
            const match = text.match(pattern);
            if (match) {
                if (pattern.source.includes('Surname')) {
                    surname = match[1].trim();
                } else if (pattern.source.includes('Given')) {
                    givenName = match[1].trim();
                } else {
                    passportData.fullName = match[1].trim();
                }
            }
        }

        if (surname && givenName) {
            passportData.fullName = `${givenName} ${surname}`;
        }

        // Extract nationality (look for 3-letter country codes)
        const nationalityMatch = text.match(/Nationality[:\s]+([A-Z]{3})/i);
        if (nationalityMatch) {
            const countryCode = nationalityMatch[1];
            const country = await Country.findOne({ code: countryCode });
            if (country) {
                passportData.nationality = country.code;
            }
        }

        // Extract dates (format: DD MMM YYYY or DD/MM/YYYY)
        const datePatterns = [
            /Date of Birth[:\s]+(\d{2}[\s/]\w{3}[\s/]\d{4})/i,
            /Date of Expiry[:\s]+(\d{2}[\s/]\w{3}[\s/]\d{4})/i
        ];

        for (const pattern of datePatterns) {
            const match = text.match(pattern);
            if (match) {
                if (pattern.source.includes('Birth')) {
                    passportData.dateOfBirth = match[1];
                } else if (pattern.source.includes('Expiry')) {
                    passportData.expiryDate = match[1];
                }
            }
        }

        return passportData;

    } catch (error) {
        console.error('OCR Error:', error);
        throw new Error('Failed to extract passport data');
    }
};

module.exports = exports;