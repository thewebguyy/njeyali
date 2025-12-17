/**
 * Payment Integration Routes
 * Supports Stripe and Paystack payment gateways
 */

const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking-Enhanced');

// ============================================================================
// STRIPE INTEGRATION
// ============================================================================

const stripe = process.env.STRIPE_SECRET_KEY 
    ? require('stripe')(process.env.STRIPE_SECRET_KEY)
    : null;

/**
 * POST /api/payments/create-intent
 * Create Stripe payment intent
 */
router.post('/create-intent', async (req, res) => {
    try {
        if (!stripe) {
            return res.status(503).json({
                success: false,
                message: 'Stripe is not configured'
            });
        }
        
        const { bookingId, amount, currency = 'usd' } = req.body;
        
        // Validate booking exists
        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }
        
        // Create payment intent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100), // Convert to cents
            currency: currency.toLowerCase(),
            metadata: {
                bookingId: booking._id.toString(),
                referenceNumber: booking.referenceNumber,
                customerEmail: booking.customer.email
            },
            description: `Payment for booking ${booking.referenceNumber}`,
            receipt_email: booking.customer.email
        });
        
        res.json({
            success: true,
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id
        });
    } catch (error) {
        console.error('Stripe payment intent error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create payment intent',
            error: error.message
        });
    }
});

/**
 * POST /api/payments/stripe/webhook
 * Handle Stripe webhooks
 */
router.post('/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    if (!stripe) {
        return res.status(503).send('Stripe not configured');
    }
    
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    let event;
    
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
        console.error('Webhook signature verification failed:', err);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    
    // Handle the event
    switch (event.type) {
        case 'payment_intent.succeeded':
            const paymentIntent = event.data.object;
            
            // Update booking with payment
            try {
                const bookingId = paymentIntent.metadata.bookingId;
                const booking = await Booking.findById(bookingId);
                
                if (booking) {
                    await booking.addPayment({
                        transactionId: paymentIntent.id,
                        amount: paymentIntent.amount / 100,
                        currency: paymentIntent.currency.toUpperCase(),
                        method: 'stripe',
                        status: 'completed',
                        date: new Date(),
                        notes: 'Stripe payment succeeded'
                    });
                    
                    console.log(`Payment recorded for booking ${booking.referenceNumber}`);
                    
                    // Send payment confirmation email
                    const emailUtil = require('../utils/email');
                    await emailUtil.sendPaymentConfirmation(booking.customer.email, {
                        name: booking.customer.name,
                        referenceNumber: booking.referenceNumber,
                        amount: paymentIntent.amount / 100,
                        currency: paymentIntent.currency.toUpperCase(),
                        transactionId: paymentIntent.id
                    });
                }
            } catch (error) {
                console.error('Error processing payment webhook:', error);
            }
            break;
            
        case 'payment_intent.payment_failed':
            const failedPayment = event.data.object;
            console.error('Payment failed:', failedPayment.id, failedPayment.last_payment_error);
            break;
            
        default:
            console.log(`Unhandled event type ${event.type}`);
    }
    
    res.json({ received: true });
});

// ============================================================================
// PAYSTACK INTEGRATION (Popular in Africa)
// ============================================================================

const axios = require('axios');
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_BASE_URL = 'https://api.paystack.co';

/**
 * POST /api/payments/paystack/initialize
 * Initialize Paystack transaction
 */
router.post('/paystack/initialize', async (req, res) => {
    try {
        if (!PAYSTACK_SECRET_KEY) {
            return res.status(503).json({
                success: false,
                message: 'Paystack is not configured'
            });
        }
        
        const { bookingId, amount, email, currency = 'NGN' } = req.body;
        
        // Validate booking
        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }
        
        // Initialize transaction
        const response = await axios.post(
            `${PAYSTACK_BASE_URL}/transaction/initialize`,
            {
                email: email || booking.customer.email,
                amount: Math.round(amount * 100), // Convert to kobo/cents
                currency,
                reference: `NJ-${booking.referenceNumber}-${Date.now()}`,
                metadata: {
                    bookingId: booking._id.toString(),
                    referenceNumber: booking.referenceNumber,
                    custom_fields: [
                        {
                            display_name: 'Booking Reference',
                            variable_name: 'booking_reference',
                            value: booking.referenceNumber
                        }
                    ]
                },
                callback_url: `${process.env.FRONTEND_URL}/payment/callback`
            },
            {
                headers: {
                    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        res.json({
            success: true,
            data: response.data.data
        });
    } catch (error) {
        console.error('Paystack initialization error:', error.response?.data || error);
        res.status(500).json({
            success: false,
            message: 'Failed to initialize payment',
            error: error.response?.data?.message || error.message
        });
    }
});

/**
 * GET /api/payments/paystack/verify/:reference
 * Verify Paystack transaction
 */
router.get('/paystack/verify/:reference', async (req, res) => {
    try {
        if (!PAYSTACK_SECRET_KEY) {
            return res.status(503).json({
                success: false,
                message: 'Paystack is not configured'
            });
        }
        
        const { reference } = req.params;
        
        // Verify transaction
        const response = await axios.get(
            `${PAYSTACK_BASE_URL}/transaction/verify/${reference}`,
            {
                headers: {
                    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`
                }
            }
        );
        
        const transaction = response.data.data;
        
        if (transaction.status === 'success') {
            // Update booking with payment
            const bookingId = transaction.metadata.bookingId;
            const booking = await Booking.findById(bookingId);
            
            if (booking) {
                await booking.addPayment({
                    transactionId: transaction.reference,
                    amount: transaction.amount / 100,
                    currency: transaction.currency,
                    method: 'paystack',
                    status: 'completed',
                    date: new Date(transaction.paid_at),
                    notes: 'Paystack payment verified'
                });
                
                // Send confirmation email
                const emailUtil = require('../utils/email');
                await emailUtil.sendPaymentConfirmation(booking.customer.email, {
                    name: booking.customer.name,
                    referenceNumber: booking.referenceNumber,
                    amount: transaction.amount / 100,
                    currency: transaction.currency,
                    transactionId: transaction.reference
                });
            }
        }
        
        res.json({
            success: true,
            data: transaction
        });
    } catch (error) {
        console.error('Paystack verification error:', error.response?.data || error);
        res.status(500).json({
            success: false,
            message: 'Failed to verify payment',
            error: error.response?.data?.message || error.message
        });
    }
});

/**
 * POST /api/payments/paystack/webhook
 * Handle Paystack webhooks
 */
router.post('/paystack/webhook', async (req, res) => {
    try {
        const hash = require('crypto')
            .createHmac('sha512', PAYSTACK_SECRET_KEY)
            .update(JSON.stringify(req.body))
            .digest('hex');
        
        if (hash !== req.headers['x-paystack-signature']) {
            return res.status(401).send('Invalid signature');
        }
        
        const event = req.body;
        
        // Handle different event types
        switch (event.event) {
            case 'charge.success':
                const data = event.data;
                
                // Update booking
                const bookingId = data.metadata.bookingId;
                const booking = await Booking.findById(bookingId);
                
                if (booking) {
                    await booking.addPayment({
                        transactionId: data.reference,
                        amount: data.amount / 100,
                        currency: data.currency,
                        method: 'paystack',
                        status: 'completed',
                        date: new Date(),
                        notes: 'Paystack webhook - charge success'
                    });
                }
                break;
                
            default:
                console.log(`Unhandled Paystack event: ${event.event}`);
        }
        
        res.sendStatus(200);
    } catch (error) {
        console.error('Paystack webhook error:', error);
        res.sendStatus(500);
    }
});

// ============================================================================
// GENERAL PAYMENT ROUTES
// ============================================================================

/**
 * GET /api/payments/methods
 * Get available payment methods
 */
router.get('/methods', (req, res) => {
    const methods = [];
    
    if (stripe) {
        methods.push({
            id: 'stripe',
            name: 'Credit/Debit Card',
            description: 'Pay with Visa, Mastercard, or American Express',
            logo: '/images/stripe-logo.png',
            currencies: ['USD', 'EUR', 'GBP']
        });
    }
    
    if (PAYSTACK_SECRET_KEY) {
        methods.push({
            id: 'paystack',
            name: 'Card Payment (Paystack)',
            description: 'Pay with local and international cards',
            logo: '/images/paystack-logo.png',
            currencies: ['NGN', 'USD', 'GHS', 'ZAR']
        });
    }
    
    // Always available
    methods.push({
        id: 'bank-transfer',
        name: 'Bank Transfer',
        description: 'Transfer directly to our bank account',
        logo: '/images/bank-icon.png',
        currencies: ['NGN', 'USD']
    });
    
    res.json({
        success: true,
        methods
    });
});

/**
 * POST /api/payments/manual
 * Record manual payment (bank transfer, cash, etc.)
 */
router.post('/manual', async (req, res) => {
    try {
        const { bookingId, amount, currency, method, reference, notes } = req.body;
        
        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }
        
        await booking.addPayment({
            transactionId: reference || `MANUAL-${Date.now()}`,
            amount,
            currency,
            method,
            status: 'pending', // Manual payments need verification
            date: new Date(),
            notes: notes || 'Manual payment entry'
        });
        
        res.json({
            success: true,
            message: 'Payment recorded. Awaiting verification.',
            data: booking
        });
    } catch (error) {
        console.error('Manual payment error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to record payment',
            error: error.message
        });
    }
});

/**
 * GET /api/payments/history/:bookingId
 * Get payment history for a booking
 */
router.get('/history/:bookingId', async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.bookingId);
        
        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }
        
        res.json({
            success: true,
            data: {
                totalAmount: booking.payment.totalAmount,
                paidAmount: booking.payment.paidAmount,
                balance: booking.paymentBalance,
                status: booking.payment.status,
                transactions: booking.payment.transactions
            }
        });
    } catch (error) {
        console.error('Payment history error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve payment history',
            error: error.message
        });
    }
});

module.exports = router;