/**
 * Newsletter Routes
 * Handles newsletter subscriptions
 */

const express = require('express');
const router = express.Router();
const Newsletter = require('../models/Newsletter');
const { sendEmail } = require('../utils/email');

/**
 * POST /api/newsletter/subscribe
 * Subscribe to newsletter
 */
router.post('/subscribe', async (req, res) => {
    try {
        const { email, name } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
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

        // Check if already subscribed
        const existing = await Newsletter.findOne({ email: email.toLowerCase() });
        
        if (existing) {
            if (existing.active) {
                return res.status(400).json({
                    success: false,
                    message: 'This email is already subscribed to our newsletter'
                });
            } else {
                // Reactivate subscription
                existing.active = true;
                existing.subscribedAt = new Date();
                await existing.save();

                return res.json({
                    success: true,
                    message: 'Your subscription has been reactivated!'
                });
            }
        }

        // Create new subscription
        const newsletter = new Newsletter({
            email: email.toLowerCase(),
            name: name || '',
            active: true,
            subscribedAt: new Date()
        });

        await newsletter.save();

        // Send welcome email
        try {
            await sendEmail({
                to: email,
                subject: 'Welcome to Njeyali Travel Newsletter',
                template: 'newsletter-welcome',
                data: {
                    name: name || 'Traveler'
                }
            });
        } catch (emailError) {
            console.error('Welcome email failed:', emailError);
        }

        res.json({ 
            success: true, 
            message: 'Successfully subscribed to our newsletter!',
            subscriptionId: newsletter._id
        });
    } catch (error) {
        console.error('Newsletter subscription error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Subscription failed. Please try again.',
            error: error.message
        });
    }
});

/**
 * POST /api/newsletter/unsubscribe
 * Unsubscribe from newsletter
 */
router.post('/unsubscribe', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }

        const subscription = await Newsletter.findOne({ email: email.toLowerCase() });

        if (!subscription) {
            return res.status(404).json({
                success: false,
                message: 'Email not found in our subscriber list'
            });
        }

        subscription.active = false;
        subscription.unsubscribedAt = new Date();
        await subscription.save();

        res.json({ 
            success: true, 
            message: 'You have been unsubscribed from our newsletter'
        });
    } catch (error) {
        console.error('Newsletter unsubscribe error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Unsubscribe failed. Please try again.'
        });
    }
});

module.exports = router;
