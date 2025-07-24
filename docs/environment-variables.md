# Environment Variables for Novo Pets

This document lists all the environment variables needed for the Novo Pets application.

## 📋 Required Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Database Configuration
DATABASE_URL=your_database_url_here

# Supabase Configuration
SUPABASE_URL=your_supabase_url_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Email Configuration
EMAIL_PASSWORD=your_gmail_app_password_here

# Google Sheets Configuration (if using)
GOOGLE_SHEETS_PRIVATE_KEY=your_google_sheets_private_key_here
GOOGLE_SHEETS_CLIENT_EMAIL=your_google_sheets_client_email_here
GOOGLE_SHEETS_SPREADSHEET_ID=your_google_sheets_spreadsheet_id_here

# JWT Secret
JWT_SECRET=your_jwt_secret_here

# Server Configuration
PORT=3000
NODE_ENV=development
```

## 🔧 Email Configuration Setup

### EMAIL_PASSWORD

This is the most important new variable for email functionality:

1. **For Gmail with 2-Factor Authentication (Recommended):**
   - Go to your Google Account settings
   - Enable 2-Factor Authentication
   - Go to Security → App passwords
   - Generate a new app password for "Mail"
   - Use this 16-character password

2. **For Gmail without 2-Factor Authentication:**
   - Go to your Google Account settings
   - Go to Security → Less secure app access
   - Turn on "Allow less secure apps"
   - Use your regular Gmail password

### Example:
```env
EMAIL_PASSWORD=abcd efgh ijkl mnop
```

## 🧪 Testing Email Configuration

### Quick Check
```bash
npm run check:email
```

### Full Test (sends actual emails)
```bash
npm run test:email
```

## 🔒 Security Notes

- **Never commit your `.env` file to version control**
- The `.env` file is already in `.gitignore`
- Use strong, unique passwords for each service
- Rotate passwords regularly
- Use App Passwords instead of regular passwords when possible

## 🚀 Production Deployment

For production, set these environment variables in your hosting platform:

- **Vercel**: Use the Environment Variables section in your project settings
- **Netlify**: Use the Environment Variables section in your site settings
- **Heroku**: Use `heroku config:set VARIABLE_NAME=value`
- **Railway**: Use the Variables section in your project settings

## 📧 Email Service Configuration

The application uses Gmail SMTP by default. For production, consider using:

- **SendGrid**: More reliable for high-volume sending
- **Mailgun**: Good for transactional emails
- **Amazon SES**: Cost-effective for high volume
- **Resend**: Modern email API

To switch email providers, update the configuration in `server/emailService.ts`.

## 🔍 Troubleshooting

### Common Issues:

1. **"EMAIL_PASSWORD not configured"**
   - Check that EMAIL_PASSWORD is set in your .env file
   - Restart your development server after adding the variable

2. **"Invalid login" error**
   - Verify your Gmail password is correct
   - Use App Password if 2FA is enabled
   - Check Gmail account settings

3. **"Connection timeout"**
   - Check internet connection
   - Verify firewall settings
   - Try different SMTP ports (587 or 465)

### Testing Commands:

```bash
# Check email configuration
npm run check:email

# Test email sending
npm run test:email

# Test database connection
npm run test:db
``` 