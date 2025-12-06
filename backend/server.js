/**
 * Njeyali Travel - Main Server
 * Complete backend setup with all routes and middleware
 */

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import routes
const visaRoutes = require('./routes/visa');
const servicesRoutes = require('./routes/services');
const packagesRoutes = require('./routes/packages');
const contactRoutes = require('./routes/contact');
const testimonialsRoutes = require('./routes/testimonials');
const newsletterRoutes = require('./routes/newsletter');

// Initialize Express app
const app = express();

// ============================================================================
// MIDDLEWARE CONFIGURATION
// ============================================================================

// CORS configuration
app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// ============================================================================
// DATABASE CONNECTION
// ============================================================================

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/njeyali-travel';

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => {
    console.log('✅ Connected to MongoDB successfully');
    console.log(`📊 Database: ${mongoose.connection.name}`);
})
.catch((error) => {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
});

// MongoDB connection event handlers
mongoose.connection.on('error', (err) => {
    console.error('❌ MongoDB error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('⚠️  MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
    console.log('✅ MongoDB reconnected');
});

// ============================================================================
// API ROUTES
// ============================================================================

app.use('/api/visa', visaRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/packages', packagesRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/testimonials', testimonialsRoutes);
app.use('/api/newsletter', newsletterRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        uptime: process.uptime()
    });
});

// API info endpoint
app.get('/api', (req, res) => {
    res.json({
        name: 'Njeyali Travel API',
        version: '1.0.0',
        endpoints: {
            visa: '/api/visa',
            services: '/api/services',
            packages: '/api/packages',
            contact: '/api/contact',
            testimonials: '/api/testimonials',
            newsletter: '/api/newsletter',
            health: '/api/health'
        }
    });
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

// 404 handler for API routes
app.use('/api/*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'API endpoint not found',
        path: req.path
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('❌ Error:', err);

    // Multer file upload errors
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
            success: false,
            message: 'File size too large. Maximum size is 10MB.'
        });
    }

    if (err.message === 'Invalid file type') {
        return res.status(400).json({
            success: false,
            message: 'Invalid file type. Only JPG, PNG, and PDF files are allowed.'
        });
    }

    // MongoDB errors
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            message: 'Validation error',
            errors: Object.values(err.errors).map(e => e.message)
        });
    }

    if (err.name === 'CastError') {
        return res.status(400).json({
            success: false,
            message: 'Invalid ID format'
        });
    }

    // Default error response
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// ============================================================================
// SERVER STARTUP
// ============================================================================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log('');
    console.log('='.repeat(60));
    console.log('🚀 Njeyali Travel Server');
    console.log('='.repeat(60));
    console.log(`📍 Server running on: http://localhost:${PORT}`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📊 Database: ${mongoose.connection.name}`);
    console.log(`📁 Static files: ./public`);
    console.log(`📤 Uploads: ./uploads`);
    console.log('='.repeat(60));
    console.log('');
    console.log('Available endpoints:');
    console.log('  GET  /api/health');
    console.log('  GET  /api/visa/countries');
    console.log('  POST /api/visa/check');
    console.log('  POST /api/services/*');
    console.log('  GET  /api/packages');
    console.log('  POST /api/contact');
    console.log('');
    console.log('Press Ctrl+C to stop the server');
    console.log('='.repeat(60));
});

// Graceful shutdown
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

function gracefulShutdown() {
    console.log('\n⏳ Received shutdown signal. Closing server gracefully...');
    
    mongoose.connection.close(false, () => {
        console.log('✅ MongoDB connection closed');
        process.exit(0);
    });
}

module.exports = app;
