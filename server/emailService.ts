import nodemailer from 'nodemailer';
import { format } from 'date-fns';

// Email configuration
const getEmailConfig = () => {
  // Remove spaces from EMAIL_PASSWORD (Gmail App Passwords are displayed with spaces but should be used without)
  const emailPassword = process.env.EMAIL_PASSWORD?.replace(/\s+/g, '') || '';
  
  if (!emailPassword) {
    console.warn('⚠️ EMAIL_PASSWORD environment variable is not set');
  }
  
  return {
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: 'novopetsph@gmail.com',
      pass: emailPassword,
    },
    // Add connection timeout
    connectionTimeout: 10000, // 10 seconds
    greetingTimeout: 10000,
    socketTimeout: 10000,
  };
};

// Create transporter function
const createTransporter = () => {
  return nodemailer.createTransport(getEmailConfig());
};

// Email templates
const createBookingConfirmationEmail = (bookingData: any) => {
  const {
    customerName,
    customerEmail,
    petName,
    petBreed,
    serviceType,
    appointmentDate,
    appointmentTime,
    groomingService,
    accommodationType,
    durationHours,
    durationDays,
    addOnServices,
    specialRequests,
    needsTransport,
    transportType,
    pickupAddress,
    includeTreats,
    treatType,
    paymentMethod,
    groomer,
  } = bookingData;

  // Format the appointment date
  const formattedDate = format(new Date(appointmentDate), 'EEEE, MMMM do, yyyy');
  
  // Format the appointment time
  const formattedTime = appointmentTime || 'To be determined';

  // Determine service details
  let serviceDetails = '';
  if (serviceType === 'GROOMING') {
    serviceDetails = `Grooming Service: ${groomingService || 'Standard Grooming'}`;
    if (groomer) {
      serviceDetails += `\nAssigned Groomer: ${groomer}`;
    }
  } else if (serviceType === 'HOTEL') {
    serviceDetails = `Hotel Accommodation: ${accommodationType || 'Standard Room'}`;
    if (durationDays) {
      serviceDetails += `\nDuration: ${durationDays} day(s)`;
    } else if (durationHours) {
      serviceDetails += `\nDuration: ${durationHours} hour(s)`;
    }
  }

  // Format add-on services
  const addOnsList = addOnServices 
    ? (Array.isArray(addOnServices) ? addOnServices : addOnServices.split(','))
        .filter((service: string) => service.trim())
        .map((service: string) => `• ${service.trim()}`)
        .join('\n')
    : '';

  // Format special requests
  const specialRequestsText = specialRequests ? `\nSpecial Requests: ${specialRequests}` : '';

  // Format transport details
  const transportDetails = needsTransport 
    ? `\nTransport Required: Yes\nTransport Type: ${transportType}\nPickup Address: ${pickupAddress}`
    : '\nTransport Required: No';

  // Format treats
  const treatsDetails = includeTreats 
    ? `\nTreats Included: Yes\nTreat Type: ${treatType}`
    : '\nTreats Included: No';

  const emailContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Booking Confirmation - Novo Pets</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.5;
            color: #1a1a1a;
            background-color: #f5f5f5;
            padding: 20px;
        }
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .header {
            background: linear-gradient(135deg, #9a7d62 0%, #8C636A 100%);
            padding: 24px 20px;
            text-align: center;
            color: white;
        }
        .header h1 {
            font-size: 24px;
            font-weight: 600;
            margin: 8px 0 4px 0;
        }
        .header p {
            font-size: 14px;
            opacity: 0.95;
        }
        .content {
            padding: 24px 20px;
        }
        .success-badge {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: #e8f5e9;
            color: #2e7d32;
            padding: 8px 12px;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 500;
            margin-bottom: 20px;
        }
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-bottom: 20px;
        }
        .info-item {
            background: #f8f9fa;
            padding: 12px;
            border-radius: 6px;
            border-left: 3px solid #9a7d62;
        }
        .info-label {
            font-size: 11px;
            text-transform: uppercase;
            color: #666;
            font-weight: 600;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
        }
        .info-value {
            font-size: 15px;
            color: #1a1a1a;
            font-weight: 500;
        }
        .section {
            margin-bottom: 16px;
        }
        .section-title {
            font-size: 13px;
            text-transform: uppercase;
            color: #666;
            font-weight: 600;
            letter-spacing: 0.5px;
            margin-bottom: 8px;
        }
        .section-content {
            font-size: 14px;
            color: #333;
            line-height: 1.6;
        }
        .divider {
            height: 1px;
            background: #e0e0e0;
            margin: 20px 0;
        }
        .footer {
            background: #f8f9fa;
            padding: 16px 20px;
            text-align: center;
            font-size: 12px;
            color: #666;
        }
        .footer a {
            color: #9a7d62;
            text-decoration: none;
        }
        .reminder {
            background: #fff9e6;
            border-left: 3px solid #ffc107;
            padding: 12px;
            border-radius: 6px;
            margin-top: 16px;
            font-size: 13px;
            color: #856404;
        }
        .reminder-title {
            font-weight: 600;
            margin-bottom: 6px;
        }
        @media only screen and (max-width: 600px) {
            .info-grid {
                grid-template-columns: 1fr;
            }
            body {
                padding: 10px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>✓ Booking Confirmed</h1>
            <p>Your appointment has been scheduled</p>
        </div>
        
        <div class="content">
            <div class="success-badge">
                <span>✓</span>
                <span>Thank you for choosing Novo Pets!</span>
            </div>

            <div class="info-grid">
                <div class="info-item">
                    <div class="info-label">Date</div>
                    <div class="info-value">${formattedDate}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Time</div>
                    <div class="info-value">${formattedTime}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Service</div>
                    <div class="info-value">${serviceType === 'GROOMING' || serviceType === 'grooming' ? 'Grooming' : 'Hotel Stay'}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Pet</div>
                    <div class="info-value">${petName}</div>
                </div>
            </div>

            <div class="section">
                <div class="section-title">Service Details</div>
                <div class="section-content">
                    <strong>${serviceDetails}</strong>
                    ${addOnsList ? `<div style="margin-top: 8px;">${addOnsList.split('\n').map((item: string) => `<div style="margin: 4px 0;">• ${item.replace('• ', '')}</div>`).join('')}</div>` : ''}
                </div>
            </div>

            ${specialRequests ? `
            <div class="section">
                <div class="section-title">Special Requests</div>
                <div class="section-content">${specialRequests}</div>
            </div>
            ` : ''}

            ${needsTransport ? `
            <div class="section">
                <div class="section-title">Transport</div>
                <div class="section-content">${transportType} - ${pickupAddress}</div>
            </div>
            ` : ''}

            ${includeTreats ? `
            <div class="section">
                <div class="section-title">Treats</div>
                <div class="section-content">${treatType}</div>
            </div>
            ` : ''}

            <div class="divider"></div>

            <div class="reminder">
                <div class="reminder-title">📋 Reminders</div>
                <div>• Arrive 10 minutes early</div>
                <div>• Bring vaccination records (first visit)</div>
                <div>• Contact us 24h in advance to reschedule</div>
            </div>
        </div>

        <div class="footer">
            <div style="margin-bottom: 8px;"><strong>Novo Pets Premium Pet Spa & Wellness</strong></div>
            <div>📧 novopetsph@gmail.com | 🌐 <a href="https://novopets.com">novopets.com</a></div>
        </div>
    </div>
</body>
</html>
  `;

  return {
    subject: `Booking Confirmation - ${petName} at Novo Pets`,
    html: emailContent,
  };
};

// Send booking confirmation email
export const sendBookingConfirmationEmail = async (bookingData: any) => {
  try {
    console.log('📧 [Email] Starting to send booking confirmation email...');
    console.log('📧 [Email] Customer email:', bookingData.customerEmail);
    console.log('📧 [Email] Customer name:', bookingData.customerName);
    
    // Check if email password is configured
    const emailPassword = process.env.EMAIL_PASSWORD?.replace(/\s+/g, '') || '';
    if (!emailPassword) {
      console.warn('⚠️ EMAIL_PASSWORD not configured. Skipping email sending.');
      console.warn('⚠️ [Email] Make sure EMAIL_PASSWORD is set in Vercel environment variables');
      return { success: false, message: 'Email not configured - EMAIL_PASSWORD missing' };
    }

    console.log('📧 [Email] Email password configured (length:', emailPassword.length, 'chars)');
    console.log('📧 [Email] Creating email template...');
    const { subject, html } = createBookingConfirmationEmail(bookingData);
    console.log('📧 [Email] Email subject:', subject);

    const mailOptions = {
      from: '"Novo Pets" <novopetsph@gmail.com>',
      to: bookingData.customerEmail,
      subject: subject,
      html: html,
    };

    console.log('📧 [Email] Creating transporter...');
    const transporter = createTransporter();
    
    // Verify connection before sending
    console.log('📧 [Email] Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ [Email] SMTP connection verified');
    
    console.log('📧 [Email] Sending email...');
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ [Email] Booking confirmation email sent successfully');
    console.log('✅ [Email] Message ID:', info.messageId);
    console.log('✅ [Email] Response:', info.response);
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ [Email] Error sending booking confirmation email:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorCode = (error as any)?.code;
    const errorCommand = (error as any)?.command;
    
    console.error('❌ [Email] Error details:', {
      message: errorMessage,
      code: errorCode,
      command: errorCommand,
      stack: error instanceof Error ? error.stack : undefined
    });
    
    // Provide helpful error messages
    if (errorMessage.includes('Invalid login') || errorMessage.includes('authentication failed')) {
      return { 
        success: false, 
        error: 'Email authentication failed. Please check your EMAIL_PASSWORD (Gmail App Password) in Vercel environment variables.' 
      };
    }
    
    if (errorMessage.includes('timeout') || errorMessage.includes('ETIMEDOUT')) {
      return { 
        success: false, 
        error: 'Email connection timeout. Please check your network connection and try again.' 
      };
    }
    
    return { success: false, error: errorMessage };
  }
};

// Send admin notification email
export const sendAdminNotificationEmail = async (bookingData: any) => {
  try {
    console.log('📧 [Email] Starting to send admin notification email...');
    console.log('📧 [Email] Pet name:', bookingData.petName);
    console.log('📧 [Email] Service type:', bookingData.serviceType);
    
    // Check if email password is configured
    const emailPassword = process.env.EMAIL_PASSWORD?.replace(/\s+/g, '') || '';
    if (!emailPassword) {
      console.warn('⚠️ EMAIL_PASSWORD not configured. Skipping admin email.');
      console.warn('⚠️ [Email] Make sure EMAIL_PASSWORD is set in Vercel environment variables');
      return { success: false, message: 'Email not configured - EMAIL_PASSWORD missing' };
    }

    const adminEmailContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Booking - Novo Pets</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .header { background: #9a7d62; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .booking-info { background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 10px 0; }
        .highlight { background: #fff3cd; padding: 10px; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>New Booking Received</h1>
        <p>Novo Pets Booking System</p>
    </div>
    
    <div class="content">
        <div class="highlight">
            <h2>New booking for ${bookingData.petName}</h2>
            <p><strong>Customer:</strong> ${bookingData.customerName}</p>
            <p><strong>Email:</strong> ${bookingData.customerEmail}</p>
            <p><strong>Phone:</strong> ${bookingData.customerPhone}</p>
        </div>
        
        <div class="booking-info">
            <h3>Booking Details:</h3>
            <p><strong>Service:</strong> ${bookingData.serviceType}</p>
            <p><strong>Date:</strong> ${format(new Date(bookingData.appointmentDate), 'EEEE, MMMM do, yyyy')}</p>
            <p><strong>Time:</strong> ${bookingData.appointmentTime || 'To be determined'}</p>
            ${bookingData.groomer ? `<p><strong>Groomer:</strong> ${bookingData.groomer}</p>` : ''}
        </div>
        
        <p>Please review and prepare for this appointment.</p>
    </div>
</body>
</html>
    `;

    const mailOptions = {
      from: '"Novo Pets Booking System" <novopetsph@gmail.com>',
      to: 'novopetsph@gmail.com',
      subject: `New Booking - ${bookingData.petName} (${bookingData.serviceType})`,
      html: adminEmailContent,
    };

    console.log('📧 [Email] Creating admin email template...');
    const transporter = createTransporter();
    
    // Verify connection before sending
    console.log('📧 [Email] Verifying SMTP connection for admin email...');
    await transporter.verify();
    console.log('✅ [Email] SMTP connection verified');
    
    console.log('📧 [Email] Sending admin email...');
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ [Email] Admin notification email sent successfully');
    console.log('✅ [Email] Message ID:', info.messageId);
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ [Email] Error sending admin notification email:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    if (errorMessage.includes('Invalid login') || errorMessage.includes('authentication failed')) {
      return { 
        success: false, 
        error: 'Email authentication failed. Please check your EMAIL_PASSWORD (Gmail App Password) in Vercel environment variables.' 
      };
    }
    
    return { success: false, error: errorMessage };
  }
};

// Send booking status change notification (when admin confirms booking)
export const sendBookingStatusChangeEmail = async (bookingData: any, newStatus: string) => {
  try {
    console.log('📧 [Email] Starting to send status change email...');
    console.log('📧 [Email] Customer email:', bookingData.customerEmail);
    console.log('📧 [Email] New status:', newStatus);
    
    // Check if email password is configured
    if (!process.env.EMAIL_PASSWORD) {
      console.warn('⚠️ EMAIL_PASSWORD not configured. Skipping email sending.');
      return { success: false, message: 'Email not configured' };
    }

    // Only send email for "confirmed" status
    if (newStatus !== 'confirmed') {
      console.log('📧 [Email] Status is not "confirmed", skipping email');
      return { success: false, message: 'Email only sent for confirmed status' };
    }

    const { subject, html } = createBookingConfirmationEmail(bookingData);

    const mailOptions = {
      from: '"Novo Pets" <novopetsph@gmail.com>',
      to: bookingData.customerEmail,
      subject: `Booking Confirmed - ${bookingData.petName} at Novo Pets`,
      html: html,
    };

    console.log('📧 [Email] Creating transporter...');
    const transporter = createTransporter();
    console.log('📧 [Email] Sending confirmation email...');
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ [Email] Status change confirmation email sent successfully:', info.messageId);
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ [Email] Error sending status change email:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// Test email configuration
export const testEmailConfiguration = async () => {
  try {
    if (!process.env.EMAIL_PASSWORD) {
      console.log('❌ EMAIL_PASSWORD not configured');
      return false;
    }

    const transporter = createTransporter();
    await transporter.verify();
    console.log('✅ Email configuration is valid');
    return true;
  } catch (error) {
    console.error('❌ Email configuration error:', error);
    return false;
  }
}; 