/**
 * Testimonials Routes
 * Handles testimonial submissions and retrieval
 */

const express = require('express');
const router = express.Router();
const Testimonial = require('../models/Testimonial');

/**
 * GET /api/testimonials
 * Get all approved testimonials
 */
router.get('/', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        
        const testimonials = await Testimonial.find({ approved: true })
            .sort({ featured: -1, createdAt: -1 })
            .limit(limit);

        res.json({ 
            success: true,
            testimonials: testimonials,
            count: testimonials.length
        });
    } catch (error) {
        console.error('Error fetching testimonials:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to load testimonials',
            error: error.message
        });
    }
});

/**
 * POST /api/testimonials
 * Submit new testimonial
 */
router.post('/', async (req, res) => {
    try {
        const { name, email, rating, message, serviceType } = req.body;

        if (!name || !message || !rating) {
            return res.status(400).json({
                success: false,
                message: 'Name, rating, and message are required'
            });
        }

        const testimonial = new Testimonial({
            name,
            email,
            rating: parseInt(rating),
            message,
            serviceType,
            approved: false, // Requires admin approval
            submittedAt: new Date()
        });

        await testimonial.save();

        res.json({ 
            success: true, 
            message: 'Thank you for your feedback! It will be reviewed and published soon.',
            testimonialId: testimonial._id
        });
    } catch (error) {
        console.error('Testimonial submission error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to submit testimonial',
            error: error.message
        });
    }
});

/**
 * GET /api/testimonials/featured
 * Get featured testimonials
 */
router.get('/featured', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 3;
        
        const testimonials = await Testimonial.find({ 
            approved: true,
            featured: true 
        })
            .sort({ createdAt: -1 })
            .limit(limit);

        res.json({ 
            success: true,
            testimonials: testimonials
        });
    } catch (error) {
        console.error('Error fetching featured testimonials:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to load featured testimonials'
        });
    }
});

module.exports = router;
