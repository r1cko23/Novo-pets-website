# Email Setup for Vercel Deployment

This guide will help you set up booking confirmation emails to work in your Vercel deployment.

## ✅ Prerequisites

1. Gmail account: `novopetsph@gmail.com`
2. Access to Vercel dashboard
3. Gmail App Password (see steps below)

## 🔐 Step 1: Create Gmail App Password

Since Gmail no longer supports "Less Secure Apps", you need to use an App Password:

1. **Enable 2-Factor Authentication** (if not already enabled):
   - Go to [Google Account Security](https://myaccount.google.com/security)
   - Click "2-Step Verification" and follow the setup

2. **Generate App Password**:
   - Go to [Google Account App Passwords](https://myaccount.google.com/apppasswords)
   - Select "Mail" as the app
   - Select "Other (Custom name)" as the device
   - Enter "Novo Pets Vercel" as the name
   - Click "Generate"
   - **Copy the 16-character password** (it will look like: `abcd efgh ijkl mnop`)

## 📝 Step 2: Add Environment Variable in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Click **Add New**
4. Set:
   - **Name**: `EMAIL_PASSWORD`
   - **Value**: Paste your Gmail App Password (you can include or remove spaces - the code handles both)
   - **Environment**: Select all environments (Production, Preview, Development)
5. Click **Save**

## 🧪 Step 3: Test Email Configuration

After deploying, test the email configuration:

### Option 1: Test via API Endpoint

Visit this URL (replace with your domain):
```
https://your-domain.vercel.app/api/test-email?email=your-email@example.com
```

Or use curl:
```bash
curl "https://your-domain.vercel.app/api/test-email?email=your-email@example.com"
```

### Option 2: Test via Booking

Create a test booking through your website. The email should be sent automatically.

## 🔍 Troubleshooting

### Issue: "EMAIL_PASSWORD not configured"

**Solution**: 
- Verify `EMAIL_PASSWORD` is set in Vercel environment variables
- Make sure you've redeployed after adding the variable
- Check that the variable is available in all environments (Production, Preview, Development)

### Issue: "Invalid login" or "Authentication failed"

**Possible causes**:
1. **Wrong App Password**: Make sure you're using the App Password, not your regular Gmail password
2. **Spaces in password**: The code automatically removes spaces, but double-check
3. **2FA not enabled**: App Passwords require 2-Factor Authentication

**Solution**:
1. Generate a new App Password
2. Update `EMAIL_PASSWORD` in Vercel
3. Redeploy your application

### Issue: "Connection timeout"

**Possible causes**:
- Network issues
- Gmail rate limiting
- Vercel function timeout

**Solution**:
- Check Vercel function logs for detailed error messages
- Verify your Gmail account isn't locked
- Try again after a few minutes

### Issue: Emails not received

**Check**:
1. **Spam folder**: Check your spam/junk folder
2. **Email address**: Verify the recipient email is correct
3. **Gmail limits**: Free Gmail accounts have a 500 emails/day limit
4. **Vercel logs**: Check function logs in Vercel dashboard

## 📊 Monitoring Email Sends

### Check Vercel Logs

1. Go to Vercel Dashboard → Your Project → **Deployments**
2. Click on a deployment
3. Click **Functions** tab
4. Look for logs starting with `📧 [Email]`

### Expected Log Output

When emails work correctly, you should see:
```
📧 [Email] Starting to send booking confirmation email...
📧 [Email] Customer email: customer@example.com
📧 [Email] Email password configured (length: 16 chars)
📧 [Email] Creating email template...
📧 [Email] Verifying SMTP connection...
✅ [Email] SMTP connection verified
📧 [Email] Sending email...
✅ [Email] Booking confirmation email sent successfully
✅ [Email] Message ID: <message-id>
```

## 🔒 Security Best Practices

1. **Never commit** `EMAIL_PASSWORD` to git
2. **Use App Passwords** instead of regular passwords
3. **Rotate passwords** periodically
4. **Monitor** email sending in Vercel logs
5. **Set up alerts** for failed email sends

## 🚀 Production Recommendations

For production, consider:

1. **Dedicated Email Service**:
   - [Resend](https://resend.com) - Modern email API
   - [SendGrid](https://sendgrid.com) - Enterprise email
   - [Mailgun](https://mailgun.com) - Developer-friendly
   - [Amazon SES](https://aws.amazon.com/ses/) - AWS integration

2. **Email Templates**: Use a service with template management

3. **Delivery Tracking**: Monitor bounce rates and delivery

4. **Rate Limiting**: Implement rate limiting for email sends

## 📧 Email Templates

The booking confirmation emails include:
- ✅ Appointment date and time
- ✅ Service details
- ✅ Pet information
- ✅ Customer contact info
- ✅ Add-on services
- ✅ Special requests
- ✅ Payment method
- ✅ Important reminders

## ✅ Verification Checklist

- [ ] Gmail 2-Factor Authentication enabled
- [ ] Gmail App Password generated
- [ ] `EMAIL_PASSWORD` added to Vercel environment variables
- [ ] Environment variable available in all environments
- [ ] Application redeployed after adding variable
- [ ] Test email sent successfully
- [ ] Booking confirmation emails working
- [ ] Admin notification emails working

## 🆘 Need Help?

If you're still having issues:

1. Check Vercel function logs for detailed error messages
2. Verify `EMAIL_PASSWORD` is correctly set (no extra spaces/characters)
3. Test with the `/api/test-email` endpoint
4. Generate a fresh App Password and update Vercel
5. Check Gmail account security settings

