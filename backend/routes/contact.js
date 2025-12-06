/**
 * Contact Routes
 * Handles contact form submissions
 */

const express = require('express');
const router = express.Router();
const Contact = require('../models/Contact');
const { sendEmail } = require('../utils/email');

/**
 * POST /api/contact
 * Submit contact form
 */
router.post('/', async (req, res) => {
    try {
        const { name, email, phone, subject, message } = req.body;

        // Validate required fields
        if (!name || !email || !message) {
            return res.status(400).json({
                success: false,
                message: 'Name, email, and message are required'
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format'
            });
        }

        // Save to database
        const contact = new Contact({
            name,
            email,
            phone,
            subject: subject || 'General Inquiry',
            message,
            status: 'new',
            submittedAt: new Date()
        });

        await contact.save();

        // Send confirmation email to customer
        try {
            await sendEmail({
                to: email,
                subject: 'Message Received - Njeyali Travel',
                template: 'contact-confirmation',
                data: {
                    name: name,
                    message: message,
                    contactId: contact._id
                }
            });
        } catch (emailError) {
            console.error('Customer email failed:', emailError);
        }

        // Send notification to admin
        try {
            await sendEmail({
                to: process.env.ADMIN_EMAIL || 'info@njeyalitravel.com',
                subject: `New Contact: ${subject || 'General Inquiry'}`,
                template: 'contact-admin-notification',
                data: {
                    name,
                    email,
                    phone,
                    subject,
                    message,
                    contactId: contact._id
                }
            });
        } catch (emailError) {
            console.error('Admin email failed:', emailError);
        }

        res.json({ 
            success: true, 
            message: 'Message sent successfully. We will get back to you soon!',
            contactId: contact._id
        });
    } catch (error) {
        console.error('Contact form error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to send message. Please try again.',
            error: error.message
        });
    }
});

/**
 * GET /api/contact/:id
 * Get contact message by ID
 */
router.get('/:id', async (req, res) => {
    try {
        const contact = await Contact.findById(req.params.id);

        if (!contact) {
            return res.status(404).json({
                success: false,
                message: 'Contact message not found'
            });
        }

        res.json({
            success: true,
            contact: contact
        });
    } catch (error) {
        console.error('Error fetching contact:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch contact message'
        });
    }
});

module.exports = router;
