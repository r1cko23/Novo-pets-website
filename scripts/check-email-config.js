import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

// Load environment variables
dotenv.config();

async function checkEmailConfig() {
  console.log('🔍 Checking Email Configuration...\n');

  // Check 1: Environment variable
  console.log('1. Checking EMAIL_PASSWORD environment variable...');
  if (!process.env.EMAIL_PASSWORD) {
    console.log('❌ EMAIL_PASSWORD is not set in your .env file');
    console.log('   Please add: EMAIL_PASSWORD=your_app_password_here');
    return false;
  } else {
    console.log('✅ EMAIL_PASSWORD is configured');
  }

  // Check 2: Email configuration
  console.log('\n2. Checking email configuration...');
  const EMAIL_CONFIG = {
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: 'novopetsph@gmail.com',
      pass: process.env.EMAIL_PASSWORD,
    },
  };

  console.log('   Host:', EMAIL_CONFIG.host);
  console.log('   Port:', EMAIL_CONFIG.port);
  console.log('   User:', EMAIL_CONFIG.auth.user);
  console.log('   Password:', EMAIL_CONFIG.auth.pass ? '✅ Set' : '❌ Not set');

  // Check 3: Test connection
  console.log('\n3. Testing SMTP connection...');
  try {
    const transporter = nodemailer.createTransporter(EMAIL_CONFIG);
    await transporter.verify();
    console.log('✅ SMTP connection successful!');
    return true;
  } catch (error) {
    console.log('❌ SMTP connection failed:');
    console.log('   Error:', error.message);
    
    if (error.message.includes('Invalid login')) {
      console.log('\n💡 This usually means:');
      console.log('   - Your EMAIL_PASSWORD is incorrect');
      console.log('   - You need to use an App Password instead of your regular password');
      console.log('   - 2-Factor Authentication is enabled but App Password is not set');
    } else if (error.message.includes('timeout')) {
      console.log('\n💡 This usually means:');
      console.log('   - Network connectivity issues');
      console.log('   - Firewall blocking the connection');
      console.log('   - Gmail SMTP settings have changed');
    }
    
    return false;
  }
}

// Run the check
checkEmailConfig().then((success) => {
  if (success) {
    console.log('\n🎉 Email configuration is ready!');
    console.log('   You can now run: npm run test:email');
  } else {
    console.log('\n⚠️  Email configuration needs attention');
    console.log('   Please check the issues above and try again');
  }
}).catch(console.error); 