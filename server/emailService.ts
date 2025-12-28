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

  // Format the appointment date (Philippine timezone)
  let formattedDate = 'To be determined';
  try {
    if (appointmentDate) {
      // Create date in Philippine timezone (UTC+8)
      const dateStr = appointmentDate.includes('T') ? appointmentDate.split('T')[0] : appointmentDate;
      const [year, month, day] = dateStr.split('-').map(Number);
      const phDate = new Date(Date.UTC(year, month - 1, day, 8, 0, 0)); // 8 AM UTC = 4 PM PHT (adjust as needed)
      formattedDate = format(phDate, 'EEEE, MMMM do, yyyy');
    }
  } catch (error) {
    console.error('Error formatting date:', error);
    formattedDate = appointmentDate || 'To be determined';
  }
  
  // Format the appointment time to 12-hour format
  const formatTimeTo12Hour = (timeStr: string): string => {
    if (!timeStr) return 'To be determined';
    
    // Remove seconds if present (e.g., "16:00:00" -> "16:00")
    const timeOnly = timeStr.split(':').slice(0, 2).join(':');
    
    // Parse 24-hour format
    const [hours, minutes] = timeOnly.split(':').map(Number);
    
    if (isNaN(hours) || isNaN(minutes)) return timeStr;
    
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    const displayMinutes = minutes.toString().padStart(2, '0');
    
    return `${displayHours}:${displayMinutes} ${period}`;
  };
  
  const formattedTime = formatTimeTo12Hour(appointmentTime);

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
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Booking Confirmation - Novo Pets</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #1a1a1a;
            background-color: #f5f7fa;
            padding: 0;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
        }
        .email-wrapper {
            background-color: #f5f7fa;
            padding: 40px 20px;
        }
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 4px 24px rgba(0,0,0,0.08);
        }
        .header {
            background: linear-gradient(135deg, #9a7d62 0%, #8C636A 100%);
            padding: 32px 24px;
            text-align: center;
            color: white;
            position: relative;
        }
        .header::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 1px;
            background: rgba(255,255,255,0.2);
        }
        .logo {
            width: 64px;
            height: 64px;
            margin: 0 auto 16px auto;
            display: block;
            border-radius: 12px;
            background: rgba(255,255,255,0.1);
            padding: 8px;
        }
        .header h1 {
            font-size: 26px;
            font-weight: 700;
            margin: 0 0 6px 0;
            letter-spacing: -0.5px;
        }
        .header p {
            font-size: 15px;
            opacity: 0.95;
            font-weight: 400;
        }
        .content {
            padding: 32px 24px;
        }
        .success-badge {
            display: inline-flex;
            align-items: center;
            gap: 10px;
            background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
            color: #1b5e20;
            padding: 12px 16px;
            border-radius: 10px;
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 24px;
            border: 1px solid rgba(46, 125, 50, 0.1);
        }
        .info-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
            margin-bottom: 24px;
        }
        .info-item {
            background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
            padding: 16px;
            border-radius: 12px;
            border: 1px solid #e9ecef;
            transition: all 0.2s ease;
            position: relative;
            overflow: hidden;
        }
        .info-item::before {
            content: '';
            position: absolute;
            left: 0;
            top: 0;
            bottom: 0;
            width: 4px;
            background: linear-gradient(180deg, #9a7d62 0%, #8C636A 100%);
        }
        .info-label {
            font-size: 11px;
            text-transform: uppercase;
            color: #6c757d;
            font-weight: 700;
            letter-spacing: 0.8px;
            margin-bottom: 6px;
        }
        .info-value {
            font-size: 16px;
            color: #1a1a1a;
            font-weight: 600;
            letter-spacing: -0.2px;
        }
        .section {
            margin-bottom: 20px;
        }
        .section-title {
            font-size: 12px;
            text-transform: uppercase;
            color: #6c757d;
            font-weight: 700;
            letter-spacing: 1px;
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .section-title::before {
            content: '';
            width: 3px;
            height: 16px;
            background: linear-gradient(180deg, #9a7d62 0%, #8C636A 100%);
            border-radius: 2px;
        }
        .section-content {
            font-size: 15px;
            color: #2d3748;
            line-height: 1.7;
            background: #f8f9fa;
            padding: 16px;
            border-radius: 10px;
            border: 1px solid #e9ecef;
        }
        .section-content strong {
            color: #1a1a1a;
            font-weight: 600;
        }
        .divider {
            height: 1px;
            background: linear-gradient(90deg, transparent 0%, #e0e0e0 50%, transparent 100%);
            margin: 28px 0;
        }
        .reminders-section {
            background: linear-gradient(135deg, #fff9e6 0%, #fff3cd 100%);
            border-radius: 12px;
            padding: 20px;
            border: 1px solid rgba(255, 193, 7, 0.3);
            margin-top: 24px;
        }
        .reminders-title {
            font-size: 14px;
            font-weight: 700;
            color: #856404;
            margin-bottom: 14px;
            display: flex;
            align-items: center;
            gap: 8px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .reminder-item {
            display: flex;
            align-items: flex-start;
            gap: 12px;
            padding: 10px 0;
            font-size: 14px;
            color: #856404;
            line-height: 1.6;
        }
        .reminder-item:not(:last-child) {
            border-bottom: 1px solid rgba(255, 193, 7, 0.2);
        }
        .reminder-icon {
            font-size: 18px;
            flex-shrink: 0;
            margin-top: 2px;
            display: inline-block;
            vertical-align: middle;
            width: 24px;
            text-align: center;
        }
        .footer {
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            padding: 24px;
            text-align: center;
            font-size: 13px;
            color: #6c757d;
            border-top: 1px solid #e9ecef;
        }
        .footer-brand {
            font-size: 15px;
            font-weight: 700;
            color: #1a1a1a;
            margin-bottom: 10px;
            letter-spacing: -0.3px;
        }
        .footer-tagline {
            font-size: 12px;
            color: #868e96;
            margin-bottom: 14px;
            font-style: italic;
        }
        .footer-info {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
            margin-top: 20px;
            text-align: left;
        }
        .footer-info-item {
            display: flex;
            align-items: flex-start;
            gap: 10px;
        }
        .footer-icon {
            font-size: 18px;
            flex-shrink: 0;
            margin-top: 2px;
            display: inline-block;
            vertical-align: middle;
            width: 24px;
            text-align: center;
        }
        .footer-info-label {
            font-size: 11px;
            text-transform: uppercase;
            color: #868e96;
            font-weight: 700;
            letter-spacing: 0.8px;
            margin-bottom: 4px;
        }
        .footer-info-value {
            font-size: 13px;
            color: #1a1a1a;
            font-weight: 500;
            line-height: 1.5;
        }
        .footer-info-value a {
            color: #9a7d62;
            text-decoration: none;
            font-weight: 600;
        }
        .footer-info-value a:hover {
            color: #8C636A;
            text-decoration: underline;
        }
        .addon-item {
            display: flex;
            align-items: center;
            gap: 8px;
            margin: 6px 0;
            padding: 4px 0;
        }
        .addon-item::before {
            content: '✓';
            color: #2e7d32;
            font-weight: 700;
            font-size: 14px;
        }
        @media only screen and (max-width: 600px) {
            .email-wrapper {
                padding: 20px 12px;
            }
            .info-grid {
                grid-template-columns: 1fr;
            }
            .content {
                padding: 24px 16px;
            }
            .header {
                padding: 24px 16px;
            }
            .footer-info {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="email-wrapper">
        <div class="email-container">
            <div class="header">
                <img src="https://novopets.com/logo_final.png" alt="Novo Pets" class="logo">
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
                        <div class="info-label">Pet Size</div>
                        <div class="info-value">${petSize.charAt(0).toUpperCase() + petSize.slice(1)}</div>
                    </div>
                </div>

                <div class="section">
                    <div class="section-title">Pet Information</div>
                    <div class="section-content">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                            <div>
                                <div style="font-size: 11px; text-transform: uppercase; color: #6c757d; font-weight: 700; letter-spacing: 0.8px; margin-bottom: 4px;">Pet Name</div>
                                <div style="font-size: 15px; color: #1a1a1a; font-weight: 600;">${petName}</div>
                            </div>
                            <div>
                                <div style="font-size: 11px; text-transform: uppercase; color: #6c757d; font-weight: 700; letter-spacing: 0.8px; margin-bottom: 4px;">Breed</div>
                                <div style="font-size: 15px; color: #1a1a1a; font-weight: 600;">${petBreed}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="section">
                    <div class="section-title">Service Details</div>
                    <div class="section-content">
                        <strong>${serviceDetails}</strong>
                        ${addOnsList ? `<div style="margin-top: 12px;">${addOnsList.split('\n').map((item: string) => `<div class="addon-item">${item.replace('• ', '')}</div>`).join('')}</div>` : ''}
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

                <div class="reminders-section">
                    <div class="reminders-title">
                        <span style="font-size: 16px; line-height: 1;">📋</span>
                        <span>Important Reminders</span>
                    </div>
                    <div class="reminder-item">
                        <span class="reminder-icon" style="font-size: 16px; line-height: 1.2;">⏰</span>
                        <span>Please arrive 10 minutes before your scheduled appointment</span>
                    </div>
                    <div class="reminder-item">
                        <span class="reminder-icon" style="font-size: 16px; line-height: 1.2;">📄</span>
                        <span>Bring your pet's vaccination records if this is their first visit</span>
                    </div>
                    <div class="reminder-item">
                        <span class="reminder-icon" style="font-size: 16px; line-height: 1.2;">🔄</span>
                        <span>If you need to reschedule, please contact us at least 24 hours in advance</span>
                    </div>
                    <div class="reminder-item">
                        <span class="reminder-icon" style="font-size: 16px; line-height: 1.2;">🏨</span>
                        <span>For hotel stays, please bring your pet's food and any medications</span>
                    </div>
                </div>
            </div>

            <div class="footer">
                <div class="footer-brand">Novo Pets Premium Pet Spa & Wellness</div>
                <div class="footer-tagline">Where Pets Feel at Home</div>
                <div class="footer-info">
                    <div class="footer-info-item">
                        <span class="footer-icon" style="font-size: 18px; line-height: 1.2;">📍</span>
                        <div>
                            <div class="footer-info-label">Location</div>
                            <div class="footer-info-value">White Plains, Katipunan Avenue<br>Quezon City, Philippines</div>
                        </div>
                    </div>
                    <div class="footer-info-item">
                        <span class="footer-icon" style="font-size: 18px; line-height: 1.2;">📱</span>
                        <div>
                            <div class="footer-info-label">Phone</div>
                            <div class="footer-info-value"><a href="tel:+639177917671">(0917) 791 7671</a></div>
                        </div>
                    </div>
                    <div class="footer-info-item">
                        <span class="footer-icon" style="font-size: 18px; line-height: 1.2;">📧</span>
                        <div>
                            <div class="footer-info-label">Email</div>
                            <div class="footer-info-value"><a href="mailto:novopetsph@gmail.com">novopetsph@gmail.com</a></div>
                        </div>
                    </div>
                    <div class="footer-info-item">
                        <span class="footer-icon" style="font-size: 18px; line-height: 1.2;">🌐</span>
                        <div>
                            <div class="footer-info-label">Website</div>
                            <div class="footer-info-value"><a href="https://novopets.com">novopets.com</a></div>
                        </div>
                    </div>
                </div>
            </div>
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

    // Extract fields, handling both camelCase and snake_case
    const customerName = bookingData.customerName || bookingData.customer_name;
    const customerEmail = bookingData.customerEmail || bookingData.customer_email;
    const customerPhone = bookingData.customerPhone || bookingData.customer_phone;
    const petName = bookingData.petName || bookingData.pet_name;
    const petBreed = bookingData.petBreed || bookingData.pet_breed;
    const petSize = bookingData.petSize || bookingData.pet_size;
    const serviceType = bookingData.serviceType || bookingData.service_type;
    const appointmentDate = bookingData.appointmentDate || bookingData.appointment_date;
    const appointmentTime = bookingData.appointmentTime || bookingData.appointment_time;
    const groomingService = bookingData.groomingService || bookingData.grooming_service;
    const accommodationType = bookingData.accommodationType || bookingData.accommodation_type;
    const durationDays = bookingData.durationDays || bookingData.duration_days;
    const addOnServices = bookingData.addOnServices || bookingData.add_on_services;
    const specialRequests = bookingData.specialRequests || bookingData.special_requests;
    const needsTransport = bookingData.needsTransport || bookingData.needs_transport || false;
    const transportType = bookingData.transportType || bookingData.transport_type;
    const pickupAddress = bookingData.pickupAddress || bookingData.pickup_address;
    const includeTreats = bookingData.includeTreats || bookingData.include_treats || false;
    const treatType = bookingData.treatType || bookingData.treat_type;
    const groomer = bookingData.groomer;
    const reference = bookingData.reference || bookingData.reference_number;

    // Format date (Philippine timezone)
    let formattedDate = 'To be determined';
    try {
      if (appointmentDate) {
        const dateStr = appointmentDate.includes('T') ? appointmentDate.split('T')[0] : appointmentDate;
        const [year, month, day] = dateStr.split('-').map(Number);
        const phDate = new Date(Date.UTC(year, month - 1, day, 8, 0, 0));
        formattedDate = format(phDate, 'EEEE, MMMM do, yyyy');
      }
    } catch (error) {
      formattedDate = appointmentDate || 'To be determined';
    }

    // Format time to 12-hour format
    const formatTimeTo12Hour = (timeStr: string): string => {
      if (!timeStr) return 'To be determined';
      const timeOnly = timeStr.split(':').slice(0, 2).join(':');
      const [hours, minutes] = timeOnly.split(':').map(Number);
      if (isNaN(hours) || isNaN(minutes)) return timeStr;
      const period = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
      const displayMinutes = minutes.toString().padStart(2, '0');
      return `${displayHours}:${displayMinutes} ${period}`;
    };
    const formattedTime = formatTimeTo12Hour(appointmentTime);

    // Determine service details
    let serviceDetails = '';
    if (serviceType === 'grooming' || serviceType === 'GROOMING') {
      serviceDetails = groomingService || 'Standard Grooming';
    } else if (serviceType === 'hotel' || serviceType === 'HOTEL') {
      serviceDetails = `${accommodationType || 'Standard Room'}${durationDays ? ` (${durationDays} day${durationDays > 1 ? 's' : ''})` : ''}`;
    }

    // Format add-ons
    let addOnsList = '';
    if (addOnServices) {
      if (Array.isArray(addOnServices)) {
        addOnsList = addOnServices.join(', ');
      } else if (typeof addOnServices === 'string') {
        addOnsList = addOnServices;
      }
    }

    const adminEmailContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>New Booking - Novo Pets</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #1a1a1a;
            background-color: #f5f7fa;
            padding: 0;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
        }
        .email-wrapper {
            background-color: #f5f7fa;
            padding: 40px 20px;
        }
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 4px 24px rgba(0,0,0,0.08);
        }
        .header {
            background: linear-gradient(135deg, #9a7d62 0%, #8C636A 100%);
            padding: 32px 24px;
            text-align: center;
            color: white;
            position: relative;
        }
        .header::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 1px;
            background: rgba(255,255,255,0.2);
        }
        .logo {
            width: 64px;
            height: 64px;
            margin: 0 auto 16px auto;
            display: block;
            border-radius: 12px;
            background: rgba(255,255,255,0.1);
            padding: 8px;
        }
        .header h1 {
            font-size: 26px;
            font-weight: 700;
            margin: 0 0 6px 0;
            letter-spacing: -0.5px;
        }
        .header p {
            font-size: 15px;
            opacity: 0.95;
            font-weight: 400;
        }
        .content {
            padding: 32px 24px;
        }
        .alert-badge {
            display: inline-flex;
            align-items: center;
            gap: 10px;
            background: linear-gradient(135deg, #fff3cd 0%, #ffe69c 100%);
            color: #856404;
            padding: 12px 16px;
            border-radius: 10px;
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 24px;
            border: 1px solid rgba(255, 193, 7, 0.3);
        }
        .info-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
            margin-bottom: 24px;
        }
        .info-item {
            background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
            padding: 16px;
            border-radius: 12px;
            border: 1px solid #e9ecef;
            position: relative;
            overflow: hidden;
        }
        .info-item::before {
            content: '';
            position: absolute;
            left: 0;
            top: 0;
            bottom: 0;
            width: 4px;
            background: linear-gradient(180deg, #9a7d62 0%, #8C636A 100%);
        }
        .info-label {
            font-size: 11px;
            text-transform: uppercase;
            color: #6c757d;
            font-weight: 700;
            letter-spacing: 0.8px;
            margin-bottom: 6px;
        }
        .info-value {
            font-size: 16px;
            color: #1a1a1a;
            font-weight: 600;
            letter-spacing: -0.2px;
        }
        .section {
            margin-bottom: 20px;
        }
        .section-title {
            font-size: 12px;
            text-transform: uppercase;
            color: #6c757d;
            font-weight: 700;
            letter-spacing: 1px;
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .section-title::before {
            content: '';
            width: 3px;
            height: 16px;
            background: linear-gradient(180deg, #9a7d62 0%, #8C636A 100%);
            border-radius: 2px;
        }
        .section-content {
            font-size: 15px;
            color: #2d3748;
            line-height: 1.7;
            background: #f8f9fa;
            padding: 16px;
            border-radius: 10px;
            border: 1px solid #e9ecef;
        }
        .section-content strong {
            color: #1a1a1a;
            font-weight: 600;
        }
        .divider {
            height: 1px;
            background: linear-gradient(90deg, transparent 0%, #e0e0e0 50%, transparent 100%);
            margin: 28px 0;
        }
        .footer {
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            padding: 24px;
            text-align: center;
            font-size: 13px;
            color: #6c757d;
            border-top: 1px solid #e9ecef;
        }
        .footer-brand {
            font-size: 15px;
            font-weight: 700;
            color: #1a1a1a;
            margin-bottom: 10px;
            letter-spacing: -0.3px;
        }
        .addon-item {
            display: flex;
            align-items: center;
            gap: 8px;
            margin: 6px 0;
            padding: 4px 0;
        }
        .addon-item::before {
            content: '✓';
            color: #2e7d32;
            font-weight: 700;
            font-size: 14px;
        }
        @media only screen and (max-width: 600px) {
            .email-wrapper {
                padding: 20px 12px;
            }
            .info-grid {
                grid-template-columns: 1fr;
            }
            .content {
                padding: 24px 16px;
            }
            .header {
                padding: 24px 16px;
            }
        }
    </style>
</head>
<body>
    <div class="email-wrapper">
        <div class="email-container">
            <div class="header">
                <img src="https://novopets.com/logo_final.png" alt="Novo Pets" class="logo">
                <h1>🔔 New Booking Received</h1>
                <p>Novo Pets Booking System</p>
            </div>
            
            <div class="content">
                <div class="alert-badge">
                    <span>⚠️</span>
                    <span>Action Required: New booking needs attention</span>
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
                        <div class="info-value">${serviceType === 'grooming' || serviceType === 'GROOMING' ? 'Grooming' : 'Hotel Stay'}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Pet Size</div>
                        <div class="info-value">${petSize ? petSize.charAt(0).toUpperCase() + petSize.slice(1) : 'N/A'}</div>
                    </div>
                </div>

                <div class="section">
                    <div class="section-title">Customer Information</div>
                    <div class="section-content">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                            <div>
                                <div style="font-size: 11px; text-transform: uppercase; color: #6c757d; font-weight: 700; letter-spacing: 0.8px; margin-bottom: 4px;">Name</div>
                                <div style="font-size: 15px; color: #1a1a1a; font-weight: 600;">${customerName || 'N/A'}</div>
                            </div>
                            <div>
                                <div style="font-size: 11px; text-transform: uppercase; color: #6c757d; font-weight: 700; letter-spacing: 0.8px; margin-bottom: 4px;">Phone</div>
                                <div style="font-size: 15px; color: #1a1a1a; font-weight: 600;"><a href="tel:${customerPhone || ''}" style="color: #9a7d62; text-decoration: none;">${customerPhone || 'N/A'}</a></div>
                            </div>
                            <div style="grid-column: 1 / -1;">
                                <div style="font-size: 11px; text-transform: uppercase; color: #6c757d; font-weight: 700; letter-spacing: 0.8px; margin-bottom: 4px;">Email</div>
                                <div style="font-size: 15px; color: #1a1a1a; font-weight: 600;"><a href="mailto:${customerEmail || ''}" style="color: #9a7d62; text-decoration: none;">${customerEmail || 'N/A'}</a></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="section">
                    <div class="section-title">Pet Information</div>
                    <div class="section-content">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                            <div>
                                <div style="font-size: 11px; text-transform: uppercase; color: #6c757d; font-weight: 700; letter-spacing: 0.8px; margin-bottom: 4px;">Pet Name</div>
                                <div style="font-size: 15px; color: #1a1a1a; font-weight: 600;">${petName || 'N/A'}</div>
                            </div>
                            <div>
                                <div style="font-size: 11px; text-transform: uppercase; color: #6c757d; font-weight: 700; letter-spacing: 0.8px; margin-bottom: 4px;">Breed</div>
                                <div style="font-size: 15px; color: #1a1a1a; font-weight: 600;">${petBreed || 'N/A'}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="section">
                    <div class="section-title">Service Details</div>
                    <div class="section-content">
                        <strong>${serviceDetails}</strong>
                        ${groomer ? `<div style="margin-top: 12px;"><strong>Assigned Groomer:</strong> ${groomer}</div>` : ''}
                        ${addOnsList ? `<div style="margin-top: 12px;"><strong>Add-ons:</strong><br>${addOnsList.split(',').map((item: string) => `<div class="addon-item">${item.trim()}</div>`).join('')}</div>` : ''}
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
                    <div class="section-content">${transportType || 'Transport requested'}${pickupAddress ? `<br><strong>Pickup Address:</strong> ${pickupAddress}` : ''}</div>
                </div>
                ` : ''}

                ${includeTreats ? `
                <div class="section">
                    <div class="section-title">Treats</div>
                    <div class="section-content">${treatType || 'Treats requested'}</div>
                </div>
                ` : ''}

                ${reference ? `
                <div class="section">
                    <div class="section-title">Reference Number</div>
                    <div class="section-content"><strong style="font-size: 18px; color: #9a7d62;">${reference}</strong></div>
                </div>
                ` : ''}

                <div class="divider"></div>

                <div style="background: #e3f2fd; border-left: 4px solid #2196f3; padding: 16px; border-radius: 8px; margin-top: 24px;">
                    <p style="margin: 0; font-size: 14px; color: #1565c0; font-weight: 600;">📋 Please review and prepare for this appointment.</p>
                </div>
            </div>

            <div class="footer">
                <div class="footer-brand">Novo Pets Premium Pet Spa & Wellness</div>
                <div style="font-size: 12px; color: #868e96; margin-top: 8px;">Booking Management System</div>
            </div>
        </div>
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