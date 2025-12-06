/**
 * Email Utility
 * Handles email sending with templates
 */

const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
    if (process.env.SMTP_HOST) {
        // Production SMTP
        return nodemailer.createTransporter({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT) || 465,
            secure: true,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });
    } else {
        // Development - use ethereal email for testing
        console.log('⚠️  No SMTP configured. Emails will not be sent in production mode.');
        console.log('   Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS in .env file');
        return null;
    }
};

// Email templates
const templates = {
    'visa-confirmation': (data) => ({
        subject: 'Visa Application Received - Njeyali Travel',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #1A374D; color: white; padding: 20px; text-align: center; }
                    .content { background: #f9f9f9; padding: 30px; }
                    .footer { background: #333; color: white; padding: 20px; text-align: center; font-size: 12px; }
                    .button { display: inline-block; padding: 12px 30px; background: #1A374D; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                    .info-box { background: white; padding: 15px; border-left: 4px solid #1A374D; margin: 20px 0; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Njeyali Travel</h1>
                    </div>
                    <div class="content">
                        <h2>Visa Application Received</h2>
                        <p>Dear ${data.name},</p>
                        <p>Thank you for choosing Njeyali Travel for your visa application. We have received your application and our team is now reviewing it.</p>
                        
                        <div class="info-box">
                            <strong>Application Details:</strong><br>
                            Destination: ${data.destination}<br>
                            Travel Date: ${data.travelDate || 'To be confirmed'}<br>
                            Reference ID: ${data.bookingId}
                        </div>
                        
                        <p><strong>What happens next?</strong></p>
                        <ul>
                            <li>Our visa specialists will review your documents within 24-48 hours</li>
                            <li>We will contact you if any additional documents are needed</li>
                            <li>You will receive regular updates on your application status</li>
                            <li>We will guide you through every step of the process</li>
                        </ul>
                        
                        <p>If you have any questions, please don't hesitate to contact us.</p>
                        
                        <p>Best regards,<br>
                        <strong>The Njeyali Travel Team</strong></p>
                    </div>
                    <div class="footer">
                        <p>© ${new Date().getFullYear()} Njeyali Travel. All rights reserved.</p>
                        <p>Email: info@njeyalitravel.com | Phone: +234 XXX XXX XXXX</p>
                    </div>
                </div>
            </body>
            </html>
        `
    }),
    
    'flight-confirmation': (data) => ({
        subject: 'Flight Booking Request Received - Njeyali Travel',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #1A374D; color: white; padding: 20px; text-align: center; }
                    .content { background: #f9f9f9; padding: 30px; }
                    .footer { background: #333; color: white; padding: 20px; text-align: center; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Njeyali Travel</h1>
                    </div>
                    <div class="content">
                        <h2>Flight Booking Request Received</h2>
                        <p>Dear ${data.name},</p>
                        <p>We have received your flight booking request and are now searching for the best options for you.</p>
                        <p><strong>Route:</strong> ${data.departure || 'N/A'} → ${data.destination || 'N/A'}<br>
                        <strong>Date:</strong> ${data.departureDate || 'To be confirmed'}<br>
                        <strong>Reference ID:</strong> ${data.bookingId}</p>
                        <p>We will send you flight options within 24 hours.</p>
                        <p>Best regards,<br><strong>The Njeyali Travel Team</strong></p>
                    </div>
                    <div class="footer">
                        <p>© ${new Date().getFullYear()} Njeyali Travel. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `
    }),
    
    'hotel-confirmation': (data) => ({
        subject: 'Hotel Booking Request Received - Njeyali Travel',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #1A374D; color: white; padding: 20px; text-align: center; }
                    .content { background: #f9f9f9; padding: 30px; }
                    .footer { background: #333; color: white; padding: 20px; text-align: center; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Njeyali Travel</h1>
                    </div>
                    <div class="content">
                        <h2>Hotel Booking Request Received</h2>
                        <p>Dear ${data.name},</p>
                        <p>We have received your hotel booking request and are searching for the best accommodations for you.</p>
                        <p><strong>Destination:</strong> ${data.destination || 'N/A'}<br>
                        <strong>Check-in:</strong> ${data.checkIn || 'To be confirmed'}<br>
                        <strong>Check-out:</strong> ${data.checkOut || 'To be confirmed'}<br>
                        <strong>Reference ID:</strong> ${data.bookingId}</p>
                        <p>We will send you hotel options within 24 hours.</p>
                        <p>Best regards,<br><strong>The Njeyali Travel Team</strong></p>
                    </div>
                    <div class="footer">
                        <p>© ${new Date().getFullYear()} Njeyali Travel. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `
    }),
    
    'concierge-confirmation': (data) => ({
        subject: 'Travel Concierge Request Received - Njeyali Travel',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #1A374D; color: white; padding: 20px; text-align: center; }
                    .content { background: #f9f9f9; padding: 30px; }
                    .footer { background: #333; color: white; padding: 20px; text-align: center; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Njeyali Travel</h1>
                    </div>
                    <div class="content">
                        <h2>Travel Concierge Request Received</h2>
                        <p>Dear ${data.name},</p>
                        <p>Thank you for choosing our Travel Concierge service! Our team of travel experts is excited to create your perfect itinerary.</p>
                        <p><strong>Destination:</strong> ${data.destination || 'Multiple destinations'}<br>
                        <strong>Reference ID:</strong> ${data.bookingId}</p>
                        <p>We will create a personalized travel plan and send it to you within 48-72 hours.</p>
                        <p>Best regards,<br><strong>The Njeyali Travel Team</strong></p>
                    </div>
                    <div class="footer">
                        <p>© ${new Date().getFullYear()} Njeyali Travel. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `
    }),
    
    'corporate-confirmation': (data) => ({
        subject: 'Corporate Travel Request Received - Njeyali Travel',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #1A374D; color: white; padding: 20px; text-align: center; }
                    .content { background: #f9f9f9; padding: 30px; }
                    .footer { background: #333; color: white; padding: 20px; text-align: center; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Njeyali Travel</h1>
                    </div>
                    <div class="content">
                        <h2>Corporate Travel Request Received</h2>
                        <p>Dear ${data.contactName},</p>
                        <p>Thank you for considering Njeyali Travel for ${data.companyName}'s corporate travel needs.</p>
                        <p><strong>Reference ID:</strong> ${data.bookingId}</p>
                        <p>Our corporate travel specialists will prepare a detailed proposal and contact you within 48 hours.</p>
                        <p>Best regards,<br><strong>The Njeyali Travel Team</strong></p>
                    </div>
                    <div class="footer">
                        <p>© ${new Date().getFullYear()} Njeyali Travel. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `
    }),
    
    'consultation-confirmation': (data) => ({
        subject: 'Consultation Booking Confirmed - Njeyali Travel',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #1A374D; color: white; padding: 20px; text-align: center; }
                    .content { background: #f9f9f9; padding: 30px; }
                    .footer { background: #333; color: white; padding: 20px; text-align: center; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Njeyali Travel</h1>
                    </div>
                    <div class="content">
                        <h2>Consultation Booking Confirmed</h2>
                        <p>Dear ${data.name},</p>
                        <p>Your consultation has been booked!</p>
                        <p><strong>Date:</strong> ${data.date || 'To be confirmed'}<br>
                        <strong>Time:</strong> ${data.time || 'To be confirmed'}<br>
                        <strong>Reference ID:</strong> ${data.bookingId}</p>
                        <p>We will send you a calendar invite and meeting link shortly.</p>
                        <p>Best regards,<br><strong>The Njeyali Travel Team</strong></p>
                    </div>
                    <div class="footer">
                        <p>© ${new Date().getFullYear()} Njeyali Travel. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `
    }),
    
    'package-confirmation': (data) => ({
        subject: 'Package Request Received - Njeyali Travel',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #1A374D; color: white; padding: 20px; text-align: center; }
                    .content { background: #f9f9f9; padding: 30px; }
                    .footer { background: #333; color: white; padding: 20px; text-align: center; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Njeyali Travel</h1>
                    </div>
                    <div class="content">
                        <h2>Package Request Received</h2>
                        <p>Dear ${data.name},</p>
                        <p>Thank you for your interest in our "${data.packageName}" package!</p>
                        <p><strong>Reference ID:</strong> ${data.bookingId}</p>
                        <p>We will send you detailed information about availability, pricing, and booking options within 24 hours.</p>
                        <p>Best regards,<br><strong>The Njeyali Travel Team</strong></p>
                    </div>
                    <div class="footer">
                        <p>© ${new Date().getFullYear()} Njeyali Travel. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `
    }),
    
    'contact-confirmation': (data) => ({
        subject: 'Message Received - Njeyali Travel',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #1A374D; color: white; padding: 20px; text-align: center; }
                    .content { background: #f9f9f9; padding: 30px; }
                    .footer { background: #333; color: white; padding: 20px; text-align: center; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Njeyali Travel</h1>
                    </div>
                    <div class="content">
                        <h2>Message Received</h2>
                        <p>Dear ${data.name},</p>
                        <p>Thank you for contacting Njeyali Travel. We have received your message and will respond as soon as possible.</p>
                        <p><strong>Reference ID:</strong> ${data.contactId}</p>
                        <p>Our typical response time is within 24 hours during business days.</p>
                        <p>Best regards,<br><strong>The Njeyali Travel Team</strong></p>
                    </div>
                    <div class="footer">
                        <p>© ${new Date().getFullYear()} Njeyali Travel. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `
    }),
    
    'contact-admin-notification': (data) => ({
        subject: `New Contact: ${data.subject}`,
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .content { background: #f9f9f9; padding: 30px; }
                    .info-box { background: white; padding: 15px; border-left: 4px solid #1A374D; margin: 15px 0; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="content">
                        <h2>New Contact Form Submission</h2>
                        <div class="info-box">
                            <strong>From:</strong> ${data.name}<br>
                            <strong>Email:</strong> ${data.email}<br>
                            <strong>Phone:</strong> ${data.phone || 'Not provided'}<br>
                            <strong>Subject:</strong> ${data.subject}
                        </div>
                        <div class="info-box">
                            <strong>Message:</strong><br>
                            ${data.message}
                        </div>
                        <p><strong>Reference ID:</strong> ${data.contactId}</p>
                    </div>
                </div>
            </body>
            </html>
        `
    }),
    
    'newsletter-welcome': (data) => ({
        subject: 'Welcome to Njeyali Travel Newsletter',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #1A374D; color: white; padding: 20px; text-align: center; }
                    .content { background: #f9f9f9; padding: 30px; }
                    .footer { background: #333; color: white; padding: 20px; text-align: center; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Welcome to Njeyali Travel!</h1>
                    </div>
                    <div class="content">
                        <h2>Thank You for Subscribing</h2>
                        <p>Dear ${data.name},</p>
                        <p>Welcome to the Njeyali Travel community! You're now subscribed to receive exclusive travel deals, destination guides, and travel tips.</p>
                        <p>Here's what you can expect:</p>
                        <ul>
                            <li>Exclusive travel package deals</li>
                            <li>Destination guides and travel tips</li>
                            <li>Visa updates and travel news</li>
                            <li>Special offers for subscribers</li>
                        </ul>
                        <p>Get ready for amazing travel experiences!</p>
                        <p>Best regards,<br><strong>The Njeyali Travel Team</strong></p>
                    </div>
                    <div class="footer">
                        <p>© ${new Date().getFullYear()} Njeyali Travel. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `
    })
};

/**
 * Send email function
 */
async function sendEmail({ to, subject, template, data }) {
    try {
        const transporter = createTransporter();
        
        if (!transporter) {
            console.log(`📧 [DEV MODE] Email would be sent to: ${to}`);
            console.log(`   Subject: ${subject || template}`);
            return { success: true, message: 'Email skipped in development mode' };
        }

        let emailContent;
        
        if (template && templates[template]) {
            emailContent = templates[template](data);
            subject = emailContent.subject;
        } else {
            emailContent = {
                html: data.html || `<p>${data.message || 'Message from Njeyali Travel'}</p>`
            };
        }

        const mailOptions = {
            from: process.env.SMTP_FROM || '"Njeyali Travel" <noreply@njeyalitravel.com>',
            to: to,
            subject: subject,
            html: emailContent.html
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Email sent:', info.messageId);
        
        return { 
            success: true, 
            messageId: info.messageId 
        };
    } catch (error) {
        console.error('❌ Email error:', error);
        return { 
            success: false, 
            error: error.message 
        };
    }
}

module.exports = { sendEmail };
