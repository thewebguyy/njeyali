const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

// Send service confirmation to client
exports.sendServiceConfirmation = async (serviceRequest) => {
    const clientMailOptions = {
        from: process.env.EMAIL_FROM,
        to: serviceRequest.email,
        subject: `Service Request Confirmation - ${serviceRequest.referenceNumber}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: #1A374D; color: white; padding: 20px; text-align: center;">
                    <h1>Njeyali Travel</h1>
                </div>
                
                <div style="padding: 30px; background: #f9f9f9;">
                    <h2 style="color: #1A374D;">Thank You for Your Request!</h2>
                    
                    <p>Dear ${serviceRequest.fullName},</p>
                    
                    <p>We have received your ${serviceRequest.serviceType} service request. Our team will review it and get back to you within 24 hours.</p>
                    
                    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="color: #1A374D; margin-top: 0;">Request Details</h3>
                        <p><strong>Reference Number:</strong> ${serviceRequest.referenceNumber}</p>
                        <p><strong>Service Type:</strong> ${serviceRequest.serviceType}</p>
                        <p><strong>Status:</strong> Pending Review</p>
                        <p><strong>Submitted:</strong> ${new Date(serviceRequest.createdAt).toLocaleString()}</p>
                    </div>
                    
                    <p style="color: #666; font-size: 14px;">
                        Please save your reference number for future correspondence.
                    </p>
                    
                    <div style="text-align: center; margin-top: 30px;">
                        <p>Need immediate assistance?</p>
                        <p>
                            <strong>WhatsApp:</strong> ${process.env.WHATSAPP_NUMBER || '+234-XXX-XXXX-XXX'}<br>
                            <strong>Email:</strong> ${process.env.ADMIN_EMAIL}
                        </p>
                    </div>
                </div>
                
                <div style="background: #1A374D; color: white; padding: 15px; text-align: center; font-size: 12px;">
                    <p>&copy; 2024 Njeyali Travel. All rights reserved.</p>
                </div>
            </div>
        `
    };

    // Admin notification
    const adminMailOptions = {
        from: process.env.EMAIL_FROM,
        to: process.env.ADMIN_EMAIL,
        subject: `New Service Request - ${serviceRequest.serviceType.toUpperCase()} - ${serviceRequest.referenceNumber}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #1A374D;">New Service Request Received</h2>
                
                <div style="background: #f9f9f9; padding: 20px; border-radius: 8px;">
                    <h3>Client Information</h3>
                    <p><strong>Name:</strong> ${serviceRequest.fullName}</p>
                    <p><strong>Email:</strong> ${serviceRequest.email}</p>
                    <p><strong>Phone:</strong> ${serviceRequest.phone}</p>
                    <p><strong>Nationality:</strong> ${serviceRequest.nationality || 'Not provided'}</p>
                    
                    <h3>Request Details</h3>
                    <p><strong>Reference:</strong> ${serviceRequest.referenceNumber}</p>
                    <p><strong>Service Type:</strong> ${serviceRequest.serviceType}</p>
                    <p><strong>Submitted:</strong> ${new Date(serviceRequest.createdAt).toLocaleString()}</p>
                    
                    <h3>Service Data</h3>
                    <pre style="background: white; padding: 15px; border-radius: 5px; overflow-x: auto;">
${JSON.stringify(serviceRequest.serviceData, null, 2)}
                    </pre>
                    
                    ${serviceRequest.additionalComments ? `
                        <h3>Additional Comments</h3>
                        <p>${serviceRequest.additionalComments}</p>
                    ` : ''}
                    
                    ${serviceRequest.files && serviceRequest.files.length > 0 ? `
                        <h3>Uploaded Files</h3>
                        <ul>
                            ${serviceRequest.files.map(file => `<li>${file.originalName} (${(file.size / 1024).toFixed(2)} KB)</li>`).join('')}
                        </ul>
                    ` : ''}
                </div>
            </div>
        `
    };

    // Send both emails
    await transporter.sendMail(clientMailOptions);
    await transporter.sendMail(adminMailOptions);
};

// Test email configuration
exports.testEmail = async () => {
    try {
        await transporter.verify();
        console.log('✅ Email configuration is working');
        return true;
    } catch (error) {
        console.error('❌ Email configuration error:', error);
        return false;
    }
};

module.exports = exports;