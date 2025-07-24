# Email Setup for Novo Pets Booking System

This document explains how to set up email functionality for booking confirmations.

## 📧 Email Configuration

The booking system sends two types of emails:
1. **Customer Confirmation Email** - Sent to the customer when they book an appointment
2. **Admin Notification Email** - Sent to novopetsph@gmail.com when a new booking is made

## 🔧 Setup Instructions

### 1. Gmail Account Setup

Since we're using Gmail SMTP, you need to set up the Gmail account properly:

#### Option A: App Password (Recommended)
1. Go to your Google Account settings
2. Enable 2-Factor Authentication if not already enabled
3. Go to Security → App passwords
4. Generate a new app password for "Mail"
5. Use this app password in your `.env` file

#### Option B: Less Secure App Access (Not Recommended)
1. Go to your Google Account settings
2. Go to Security → Less secure app access
3. Turn on "Allow less secure apps"
4. Use your regular Gmail password in the `.env` file

### 2. Environment Variables

Add the following to your `.env` file:

```env
# Email Configuration
EMAIL_PASSWORD=your_app_password_here
```

**Important**: Never commit your email password to version control!

### 3. Test the Email Configuration

Run the test script to verify everything is working:

```bash
npm run test:email
```

This will:
- Test the email configuration
- Send a test booking confirmation email
- Send a test admin notification email

## 📧 Email Templates

### Customer Confirmation Email

The customer receives a beautifully formatted HTML email containing:
- Booking details (date, time, service type)
- Pet information
- Service details and add-ons
- Transport and special requests
- Contact information
- Important reminders

### Admin Notification Email

The admin (novopetsph@gmail.com) receives a notification email containing:
- Customer information
- Pet details
- Booking summary
- Service type and timing

## 🎨 Email Styling

The emails use the Novo Pets brand colors:
- Primary: #9a7d62 (Warm brown)
- Secondary: #8C636A (Mauve)
- Background: #faf7ee (Cream)

## 🔍 Troubleshooting

### Common Issues

1. **"Invalid login" error**
   - Check that your EMAIL_PASSWORD is correct
   - Ensure you're using an App Password if 2FA is enabled
   - Verify the Gmail account settings

2. **"Connection timeout" error**
   - Check your internet connection
   - Verify SMTP settings (smtp.gmail.com:587)
   - Try using port 465 with secure: true

3. **Emails not received**
   - Check spam/junk folder
   - Verify the recipient email address is correct
   - Check Gmail's sending limits (500/day for regular accounts)

### Testing

To test with your own email:
1. Edit `scripts/test-email.js`
2. Change `customerEmail: 'test@example.com'` to your email
3. Run `npm run test:email`

## 📋 Email Content

### Customer Email Includes:
- ✅ Appointment date and time
- ✅ Service type and details
- ✅ Pet information
- ✅ Add-on services
- ✅ Special requests
- ✅ Transport details
- ✅ Payment method
- ✅ Contact information
- ✅ Important reminders

### Admin Email Includes:
- ✅ Customer name and contact info
- ✅ Pet name and service type
- ✅ Appointment date and time
- ✅ Groomer assignment (if applicable)

## 🚀 Production Deployment

For production deployment:

1. **Use a dedicated email service** (recommended):
   - SendGrid
   - Mailgun
   - Amazon SES
   - Resend

2. **Update the email configuration** in `server/emailService.ts`:
   ```typescript
   const EMAIL_CONFIG = {
     host: 'your-smtp-host.com',
     port: 587,
     secure: false,
     auth: {
       user: 'your-email@domain.com',
       pass: process.env.EMAIL_PASSWORD,
     },
   };
   ```

3. **Set up proper environment variables** in your hosting platform

4. **Test thoroughly** before going live

## 📞 Support

If you encounter issues:
1. Check the server logs for error messages
2. Verify your email configuration
3. Test with the provided test script
4. Check Gmail's sending limits and settings

## 🔒 Security Notes

- Never commit email passwords to version control
- Use environment variables for sensitive data
- Consider using OAuth2 for Gmail in production
- Monitor email sending limits
- Implement rate limiting for email sending 