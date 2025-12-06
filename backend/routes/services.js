/**
 * Services Routes
 * Handles all service requests (visa, flights, hotels, etc.)
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Booking = require('../models/Booking');
const { sendEmail } = require('../utils/email');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function(req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        const basename = path.basename(file.originalname, ext);
        cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPG, PNG, and PDF files are allowed.'), false);
    }
};

const upload = multer({ 
    storage: storage,
    limits: { 
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: fileFilter
});

/**
 * POST /api/services/visa-application
 * Submit visa application with documents
 */
router.post('/visa-application', upload.fields([
    { name: 'passport', maxCount: 1 },
    { name: 'photo', maxCount: 1 },
    { name: 'documents', maxCount: 5 }
]), async (req, res) => {
    try {
        const bookingData = {
            serviceType: 'visa-application',
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone,
            nationality: req.body.nationality,
            destination: req.body.destination,
            travelDate: req.body.travelDate,
            returnDate: req.body.returnDate,
            purpose: req.body.purpose,
            passportNumber: req.body.passportNumber,
            passportExpiry: req.body.passportExpiry,
            dateOfBirth: req.body.dateOfBirth,
            additionalInfo: req.body.additionalInfo,
            status: 'pending',
            submittedAt: new Date()
        };

        // Add file paths if uploaded
        if (req.files) {
            if (req.files.passport && req.files.passport[0]) {
                bookingData.passportFile = req.files.passport[0].filename;
            }
            if (req.files.photo && req.files.photo[0]) {
                bookingData.photoFile = req.files.photo[0].filename;
            }
            if (req.files.documents && req.files.documents.length > 0) {
                bookingData.documentFiles = req.files.documents.map(file => file.filename);
            }
        }

        const booking = new Booking(bookingData);
        await booking.save();

        // Send confirmation email to customer
        try {
            await sendEmail({
                to: req.body.email,
                subject: 'Visa Application Received - Njeyali Travel',
                template: 'visa-confirmation',
                data: {
                    name: req.body.name,
                    destination: req.body.destination,
                    bookingId: booking._id,
                    travelDate: req.body.travelDate
                }
            });
        } catch (emailError) {
            console.error('Email sending failed:', emailError);
            // Continue even if email fails
        }

        res.json({ 
            success: true, 
            message: 'Visa application submitted successfully',
            bookingId: booking._id
        });
    } catch (error) {
        console.error('Visa application error:', error);
        res.status(500).json({ 
            success: false,
            message: error.message || 'Failed to submit visa application'
        });
    }
});

/**
 * POST /api/services/flight-booking
 * Submit flight booking request
 */
router.post('/flight-booking', async (req, res) => {
    try {
        const booking = new Booking({
            serviceType: 'flight-booking',
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone,
            departure: req.body.departure,
            destination: req.body.destination,
            departureDate: req.body.departureDate,
            returnDate: req.body.returnDate,
            passengers: parseInt(req.body.passengers) || 1,
            class: req.body.class || 'economy',
            preferences: req.body.preferences,
            status: 'pending',
            submittedAt: new Date()
        });

        await booking.save();

        // Send confirmation email
        try {
            await sendEmail({
                to: req.body.email,
                subject: 'Flight Booking Request Received - Njeyali Travel',
                template: 'flight-confirmation',
                data: {
                    name: req.body.name,
                    bookingId: booking._id,
                    departure: req.body.departure,
                    destination: req.body.destination,
                    departureDate: req.body.departureDate
                }
            });
        } catch (emailError) {
            console.error('Email sending failed:', emailError);
        }

        res.json({ 
            success: true, 
            message: 'Flight booking request submitted successfully',
            bookingId: booking._id
        });
    } catch (error) {
        console.error('Flight booking error:', error);
        res.status(500).json({ 
            success: false,
            message: error.message || 'Failed to submit flight booking request'
        });
    }
});

/**
 * POST /api/services/hotel-booking
 * Submit hotel booking request
 */
router.post('/hotel-booking', async (req, res) => {
    try {
        const booking = new Booking({
            serviceType: 'hotel-booking',
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone,
            destination: req.body.destination,
            checkIn: req.body.checkIn,
            checkOut: req.body.checkOut,
            guests: parseInt(req.body.guests) || 1,
            rooms: parseInt(req.body.rooms) || 1,
            hotelPreference: req.body.hotelPreference,
            preferences: req.body.preferences,
            status: 'pending',
            submittedAt: new Date()
        });

        await booking.save();

        // Send confirmation email
        try {
            await sendEmail({
                to: req.body.email,
                subject: 'Hotel Booking Request Received - Njeyali Travel',
                template: 'hotel-confirmation',
                data: {
                    name: req.body.name,
                    bookingId: booking._id,
                    destination: req.body.destination,
                    checkIn: req.body.checkIn,
                    checkOut: req.body.checkOut
                }
            });
        } catch (emailError) {
            console.error('Email sending failed:', emailError);
        }

        res.json({ 
            success: true, 
            message: 'Hotel booking request submitted successfully',
            bookingId: booking._id
        });
    } catch (error) {
        console.error('Hotel booking error:', error);
        res.status(500).json({ 
            success: false,
            message: error.message || 'Failed to submit hotel booking request'
        });
    }
});

/**
 * POST /api/services/concierge
 * Submit travel concierge request
 */
router.post('/concierge', async (req, res) => {
    try {
        const booking = new Booking({
            serviceType: 'concierge',
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone,
            destination: req.body.destination,
            startDate: req.body.startDate,
            endDate: req.body.endDate,
            travelers: parseInt(req.body.travelers) || 1,
            interests: req.body.interests,
            budget: req.body.budget,
            specialRequests: req.body.specialRequests,
            status: 'pending',
            submittedAt: new Date()
        });

        await booking.save();

        // Send confirmation email
        try {
            await sendEmail({
                to: req.body.email,
                subject: 'Travel Concierge Request Received - Njeyali Travel',
                template: 'concierge-confirmation',
                data: {
                    name: req.body.name,
                    bookingId: booking._id,
                    destination: req.body.destination
                }
            });
        } catch (emailError) {
            console.error('Email sending failed:', emailError);
        }

        res.json({ 
            success: true, 
            message: 'Concierge request submitted successfully',
            bookingId: booking._id
        });
    } catch (error) {
        console.error('Concierge request error:', error);
        res.status(500).json({ 
            success: false,
            message: error.message || 'Failed to submit concierge request'
        });
    }
});

/**
 * POST /api/services/corporate-travel
 * Submit corporate/group travel request
 */
router.post('/corporate-travel', async (req, res) => {
    try {
        const booking = new Booking({
            serviceType: 'corporate-travel',
            companyName: req.body.companyName,
            contactName: req.body.contactName,
            email: req.body.email,
            phone: req.body.phone,
            destination: req.body.destination,
            startDate: req.body.startDate,
            endDate: req.body.endDate,
            numberOfTravelers: parseInt(req.body.numberOfTravelers) || 1,
            budget: req.body.budget,
            requirements: req.body.requirements,
            status: 'pending',
            submittedAt: new Date()
        });

        await booking.save();

        // Send confirmation email
        try {
            await sendEmail({
                to: req.body.email,
                subject: 'Corporate Travel Request Received - Njeyali Travel',
                template: 'corporate-confirmation',
                data: {
                    companyName: req.body.companyName,
                    contactName: req.body.contactName,
                    bookingId: booking._id
                }
            });
        } catch (emailError) {
            console.error('Email sending failed:', emailError);
        }

        res.json({ 
            success: true, 
            message: 'Corporate travel request submitted successfully',
            bookingId: booking._id
        });
    } catch (error) {
        console.error('Corporate travel error:', error);
        res.status(500).json({ 
            success: false,
            message: error.message || 'Failed to submit corporate travel request'
        });
    }
});

/**
 * POST /api/services/consultation
 * Submit consultation booking
 */
router.post('/consultation', async (req, res) => {
    try {
        const booking = new Booking({
            serviceType: 'consultation',
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone,
            preferredDate: req.body.preferredDate,
            preferredTime: req.body.preferredTime,
            topic: req.body.topic,
            details: req.body.details,
            status: 'pending',
            submittedAt: new Date()
        });

        await booking.save();

        // Send confirmation email
        try {
            await sendEmail({
                to: req.body.email,
                subject: 'Consultation Booking Confirmed - Njeyali Travel',
                template: 'consultation-confirmation',
                data: {
                    name: req.body.name,
                    date: req.body.preferredDate,
                    time: req.body.preferredTime,
                    bookingId: booking._id
                }
            });
        } catch (emailError) {
            console.error('Email sending failed:', emailError);
        }

        res.json({ 
            success: true, 
            message: 'Consultation booked successfully',
            bookingId: booking._id
        });
    } catch (error) {
        console.error('Consultation booking error:', error);
        res.status(500).json({ 
            success: false,
            message: error.message || 'Failed to book consultation'
        });
    }
});

/**
 * POST /api/services/package-request
 * Submit package request
 */
router.post('/package-request', async (req, res) => {
    try {
        const booking = new Booking({
            serviceType: 'package-request',
            packageId: req.body.packageId,
            packageName: req.body.packageName,
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone,
            travelers: parseInt(req.body.travelers) || 1,
            preferredDate: req.body.preferredDate,
            specialRequests: req.body.specialRequests,
            status: 'pending',
            submittedAt: new Date()
        });

        await booking.save();

        // Send confirmation email
        try {
            await sendEmail({
                to: req.body.email,
                subject: 'Package Request Received - Njeyali Travel',
                template: 'package-confirmation',
                data: {
                    name: req.body.name,
                    packageName: req.body.packageName,
                    bookingId: booking._id
                }
            });
        } catch (emailError) {
            console.error('Email sending failed:', emailError);
        }

        res.json({ 
            success: true, 
            message: 'Package request submitted successfully',
            bookingId: booking._id
        });
    } catch (error) {
        console.error('Package request error:', error);
        res.status(500).json({ 
            success: false,
            message: error.message || 'Failed to submit package request'
        });
    }
});

/**
 * GET /api/services/booking/:id
 * Get booking details by ID
 */
router.get('/booking/:id', async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        res.json({
            success: true,
            booking: booking
        });
    } catch (error) {
        console.error('Error fetching booking:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch booking details'
        });
    }
});

module.exports = router;
