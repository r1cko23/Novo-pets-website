import nodemailer from 'nodemailer';
import { format } from 'date-fns';

// Email configuration
const EMAIL_CONFIG = {
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: 'novopetsph@gmail.com',
    pass: process.env.EMAIL_PASSWORD || '', // Set this in your .env file
  },
};

// Create transporter
const transporter = nodemailer.createTransporter(EMAIL_CONFIG);

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
        .filter(service => service.trim())
        .map(service => `• ${service.trim()}`)
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
        body {
            font-family: 'Inter', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #faf7ee;
        }
        .header {
            text-align: center;
            padding: 30px 0;
            background: linear-gradient(135deg, #9a7d62, #8C636A);
            color: white;
            border-radius: 15px 15px 0 0;
            margin-bottom: 30px;
        }
        .logo {
            width: 80px;
            height: 80px;
            margin-bottom: 15px;
        }
        .title {
            font-size: 28px;
            font-weight: bold;
            margin: 0;
        }
        .subtitle {
            font-size: 16px;
            opacity: 0.9;
            margin: 10px 0 0 0;
        }
        .content {
            background: white;
            padding: 30px;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }
        .booking-details {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
            border-left: 4px solid #9a7d62;
        }
        .detail-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            padding: 8px 0;
            border-bottom: 1px solid #eee;
        }
        .detail-row:last-child {
            border-bottom: none;
        }
        .detail-label {
            font-weight: 600;
            color: #9a7d62;
        }
        .detail-value {
            text-align: right;
            color: #333;
        }
        .pet-info {
            background: #e8f5e8;
            padding: 15px;
            border-radius: 8px;
            margin: 15px 0;
        }
        .service-info {
            background: #fff3cd;
            padding: 15px;
            border-radius: 8px;
            margin: 15px 0;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 10px;
        }
        .contact-info {
            margin-top: 15px;
            font-size: 14px;
            color: #666;
        }
        .highlight {
            background: linear-gradient(135deg, #9a7d62, #8C636A);
            color: white;
            padding: 15px;
            border-radius: 8px;
            text-align: center;
            margin: 20px 0;
        }
        .addons-list {
            margin: 10px 0;
            padding-left: 20px;
        }
        .addons-list li {
            margin-bottom: 5px;
        }
    </style>
</head>
<body>
    <div class="header">
        <img src="https://novopets.com/logo_final.png" alt="Novo Pets" class="logo">
        <h1 class="title">Booking Confirmation</h1>
        <p class="subtitle">Your appointment has been successfully scheduled!</p>
    </div>
    
    <div class="content">
        <div class="highlight">
            <h2>🎉 Thank you for choosing Novo Pets!</h2>
            <p>We're excited to pamper your beloved pet!</p>
        </div>

        <div class="booking-details">
            <h3>📅 Appointment Details</h3>
            <div class="detail-row">
                <span class="detail-label">Date:</span>
                <span class="detail-value">${formattedDate}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Time:</span>
                <span class="detail-value">${formattedTime}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Service Type:</span>
                <span class="detail-value">${serviceType === 'GROOMING' ? 'Grooming' : 'Hotel Stay'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Payment Method:</span>
                <span class="detail-value">${paymentMethod}</span>
            </div>
        </div>

        <div class="pet-info">
            <h3>🐾 Pet Information</h3>
            <div class="detail-row">
                <span class="detail-label">Pet Name:</span>
                <span class="detail-value">${petName}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Breed:</span>
                <span class="detail-value">${petBreed}</span>
            </div>
        </div>

        <div class="service-info">
            <h3>🛠️ Service Details</h3>
            <p><strong>${serviceDetails}</strong></p>
            ${addOnsList ? `<h4>Add-on Services:</h4><ul class="addons-list">${addOnsList.split('\n').map(item => `<li>${item}</li>`).join('')}</ul>` : ''}
            ${specialRequestsText}
            ${transportDetails}
            ${treatsDetails}
        </div>

        <div class="footer">
            <h3>📍 Location & Contact</h3>
            <p><strong>Novo Pets Premium Pet Spa & Wellness</strong></p>
            <p>Where Pets Feel at Home</p>
            <div class="contact-info">
                <p>📧 Email: novopetsph@gmail.com</p>
                <p>📱 Phone: +63 XXX XXX XXXX</p>
                <p>🌐 Website: <a href="https://novopets.com">novopets.com</a></p>
            </div>
        </div>

        <div style="margin-top: 30px; padding: 20px; background: #f8f9fa; border-radius: 10px; text-align: center;">
            <h3>📋 Important Reminders</h3>
            <ul style="text-align: left; display: inline-block;">
                <li>Please arrive 10 minutes before your scheduled appointment</li>
                <li>Bring your pet's vaccination records if this is their first visit</li>
                <li>If you need to reschedule, please contact us at least 24 hours in advance</li>
                <li>For hotel stays, please bring your pet's food and any medications</li>
            </ul>
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
    // Check if email password is configured
    if (!process.env.EMAIL_PASSWORD) {
      console.warn('EMAIL_PASSWORD not configured. Skipping email sending.');
      return { success: false, message: 'Email not configured' };
    }

    const { subject, html } = createBookingConfirmationEmail(bookingData);

    const mailOptions = {
      from: '"Novo Pets" <novopetsph@gmail.com>',
      to: bookingData.customerEmail,
      subject: subject,
      html: html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Booking confirmation email sent:', info.messageId);
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending booking confirmation email:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// Send admin notification email
export const sendAdminNotificationEmail = async (bookingData: any) => {
  try {
    // Check if email password is configured
    if (!process.env.EMAIL_PASSWORD) {
      console.warn('EMAIL_PASSWORD not configured. Skipping admin email.');
      return { success: false, message: 'Email not configured' };
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

    const info = await transporter.sendMail(mailOptions);
    console.log('Admin notification email sent:', info.messageId);
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending admin notification email:', error);
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

    await transporter.verify();
    console.log('✅ Email configuration is valid');
    return true;
  } catch (error) {
    console.error('❌ Email configuration error:', error);
    return false;
  }
}; 