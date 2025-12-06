/**
 * Packages Routes
 * Handles travel package listings and details
 */

const express = require('express');
const router = express.Router();
const Package = require('../models/Package');

/**
 * GET /api/packages
 * Get all active packages
 */
router.get('/', async (req, res) => {
    try {
        const packages = await Package.find({ active: true })
            .sort({ featured: -1, createdAt: -1 });

        res.json({ 
            success: true,
            packages: packages,
            count: packages.length
        });
    } catch (error) {
        console.error('Error fetching packages:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to load packages',
            error: error.message
        });
    }
});

/**
 * GET /api/packages/featured
 * Get featured packages for homepage
 */
router.get('/featured', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 6;

        const packages = await Package.find({ 
            active: true, 
            featured: true 
        })
        .limit(limit)
        .sort({ priority: -1, createdAt: -1 });

        res.json({ 
            success: true,
            packages: packages,
            count: packages.length
        });
    } catch (error) {
        console.error('Error fetching featured packages:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to load featured packages',
            error: error.message
        });
    }
});

/**
 * GET /api/packages/:id
 * Get package by ID
 */
router.get('/:id', async (req, res) => {
    try {
        const package = await Package.findById(req.params.id);

        if (!package) {
            return res.status(404).json({
                success: false,
                message: 'Package not found'
            });
        }

        // Increment view count
        package.views = (package.views || 0) + 1;
        await package.save();

        res.json({ 
            success: true,
            package: package 
        });
    } catch (error) {
        console.error('Error fetching package:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to load package details',
            error: error.message
        });
    }
});

/**
 * GET /api/packages/search
 * Search packages by keyword
 */
router.get('/search', async (req, res) => {
    try {
        const query = req.query.q;

        if (!query) {
            return res.status(400).json({
                success: false,
                message: 'Search query is required'
            });
        }

        const packages = await Package.find({
            active: true,
            $or: [
                { name: { $regex: query, $options: 'i' } },
                { destination: { $regex: query, $options: 'i' } },
                { description: { $regex: query, $options: 'i' } },
                { highlights: { $regex: query, $options: 'i' } }
            ]
        }).sort({ featured: -1, createdAt: -1 });

        res.json({ 
            success: true,
            packages: packages,
            count: packages.length,
            query: query
        });
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Search failed',
            error: error.message
        });
    }
});

/**
 * GET /api/packages/destination/:destination
 * Get packages by destination
 */
router.get('/destination/:destination', async (req, res) => {
    try {
        const destination = req.params.destination;

        const packages = await Package.find({
            active: true,
            destination: { $regex: destination, $options: 'i' }
        }).sort({ featured: -1, createdAt: -1 });

        res.json({ 
            success: true,
            packages: packages,
            count: packages.length,
            destination: destination
        });
    } catch (error) {
        console.error('Error fetching packages by destination:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to load packages',
            error: error.message
        });
    }
});

/**
 * GET /api/packages/price-range
 * Get packages within a price range
 */
router.get('/price-range', async (req, res) => {
    try {
        const min = parseInt(req.query.min) || 0;
        const max = parseInt(req.query.max) || 999999;

        const packages = await Package.find({
            active: true,
            price: { $gte: min, $lte: max }
        }).sort({ price: 1 });

        res.json({ 
            success: true,
            packages: packages,
            count: packages.length,
            priceRange: { min, max }
        });
    } catch (error) {
        console.error('Error fetching packages by price:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to load packages',
            error: error.message
        });
    }
});

module.exports = router;
