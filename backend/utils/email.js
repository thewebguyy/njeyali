/**
 * Enhanced Email Utility
 * Handles email sending with templates, queuing, and retry logic
 */

const nodemailer = require('nodemailer');
const handlebars = require('handlebars');
const fs = require('fs').promises;
const path = require('path');
const winston = require('winston');

// Logger
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.File({ filename: 'logs/email.log' }),
        new winston.transports.Console()
    ]
});

// Email configuration
const emailConfig = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
};

// Create transporter
let transporter;

const createTransporter = () => {
    try {
        transporter = nodemailer.createTransporter(emailConfig);
        logger.info('Email transporter created successfully');
    } catch (error) {
        logger.error('Failed to create email transporter:', error);
    }
};

createTransporter();

// Email templates cache
const templateCache = new Map();

/**
 * Load and compile email template
 */
async function loadTemplate(templateName) {
    // Check cache first
    if (templateCache.has(templateName)) {
        return templateCache.get(templateName);
    }
    
    try {
        const templatePath = path.join(__dirname, '../templates/emails', `${templateName}.html`);
        const templateContent = await fs.readFile(templatePath, 'utf-8');
        const compiledTemplate = handlebars.compile(templateContent);
        
        // Cache the compiled template
        templateCache.set(templateName, compiledTemplate);
        
        return compiledTemplate;
    } catch (error) {
        logger.error(`Failed to load template ${templateName}:`, error);
        return null;
    }
}

/**
 * Send email with template
 */
async function sendEmail(options, retries = 3) {
    const {
        to,
        subject,
        template,
        data = {},
        attachments = [],
        cc,
        bcc,
        replyTo
    } = options;
    
    try {
        // Validate required fields
        if (!to || !subject) {
            throw new Error('Email recipient and subject are required');
        }
        
        // Load and compile template
        let html = '';
        
        if (template) {
            const compiledTemplate = await loadTemplate(template);
            if (compiledTemplate) {
                html = compiledTemplate({
                    ...data,
                    year: new Date().getFullYear(),
                    companyName: 'Njeyali Travel',
                    companyEmail: process.env.COMPANY_EMAIL || 'info@njeyalitravel.com',
                    companyPhone: process.env.COMPANY_PHONE || '+234 XXX XXX XXXX',
                    websiteUrl: process.env.WEBSITE_URL || 'https://njeyalitravel.com'
                });
            }
        } else if (options.html) {
            html = options.html;
        } else if (options.text) {
            html = `<p>${options.text}</p>`;
        }
        
        // Email configuration
        const mailOptions = {
            from: {
                name: process.env.SMTP_FROM_NAME || 'Njeyali Travel',
                address: process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER
            },
            to,
            subject,
            html,
            attachments,
            cc,
            bcc,
            replyTo: replyTo || process.env.SMTP_FROM_EMAIL
        };
        
        // Send email
        const info = await transporter.sendMail(mailOptions);
        
        logger.info('Email sent successfully', {
            messageId: info.messageId,
            to,
            subject
        });
        
        return {
            success: true,
            messageId: info.messageId
        };
        
    } catch (error) {
        logger.error('Email sending failed:', {
            error: error.message,
            to,
            subject,
            retries
        });
        
        // Retry logic
        if (retries > 0) {
            logger.info(`Retrying email send... (${retries} attempts left)`);
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
            return sendEmail(options, retries - 1);
        }
        
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Send bulk emails (with rate limiting)
 */
async function sendBulkEmails(emails, delayMs = 1000) {
    const results = [];
    
    for (const email of emails) {
        const result = await sendEmail(email);
        results.push({
            to: email.to,
            ...result
        });
        
        // Delay between emails to avoid rate limiting
        if (emails.indexOf(email) < emails.length - 1) {
            await new Promise(resolve => setTimeout(resolve, delayMs));
        }
    }
    
    return results;
}

/**
 * Verify SMTP connection
 */
async function verifyConnection() {
    try {
        await transporter.verify();
        logger.info('SMTP connection verified successfully');
        return true;
    } catch (error) {
        logger.error('SMTP connection verification failed:', error);
        return false;
    }
}

/**
 * Pre-defined email templates
 */

// Visa application confirmation
async function sendVisaConfirmation(to, data) {
    return sendEmail({
        to,
        subject: 'Visa Application Received - Njeyali Travel',
        template: 'visa-confirmation',
        data
    });
}

// Flight booking confirmation
async function sendFlightConfirmation(to, data) {
    return sendEmail({
        to,
        subject: 'Flight Booking Request Received - Njeyali Travel',
        template: 'flight-confirmation',
        data
    });
}

// Hotel booking confirmation
async function sendHotelConfirmation(to, data) {
    return sendEmail({
        to,
        subject: 'Hotel Booking Request Received - Njeyali Travel',
        template: 'hotel-confirmation',
        data
    });
}

// Contact form acknowledgment
async function sendContactConfirmation(to, data) {
    return sendEmail({
        to,
        subject: 'Message Received - Njeyali Travel',
        template: 'contact-confirmation',
        data
    });
}

// Newsletter welcome
async function sendNewsletterWelcome(to, data) {
    return sendEmail({
        to,
        subject: 'Welcome to Njeyali Travel Newsletter!',
        template: 'newsletter-welcome',
        data
    });
}

// Admin notification
async function sendAdminNotification(subject, data) {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@njeyalitravel.com';
    
    return sendEmail({
        to: adminEmail,
        subject: `[Admin] ${subject}`,
        template: 'admin-notification',
        data
    });
}

// Booking reminder
async function sendBookingReminder(to, data) {
    return sendEmail({
        to,
        subject: 'Upcoming Trip Reminder - Njeyali Travel',
        template: 'booking-reminder',
        data
    });
}

// Payment confirmation
async function sendPaymentConfirmation(to, data) {
    return sendEmail({
        to,
        subject: 'Payment Received - Njeyali Travel',
        template: 'payment-confirmation',
        data
    });
}

module.exports = {
    sendEmail,
    sendBulkEmails,
    verifyConnection,
    
    // Pre-defined templates
    sendVisaConfirmation,
    sendFlightConfirmation,
    sendHotelConfirmation,
    sendContactConfirmation,
    sendNewsletterWelcome,
    sendAdminNotification,
    sendBookingReminder,
    sendPaymentConfirmation
};