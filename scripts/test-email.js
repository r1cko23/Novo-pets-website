import dotenv from 'dotenv';
import { testEmailConfiguration, sendBookingConfirmationEmail, sendAdminNotificationEmail } from '../server/emailService.js';

// Load environment variables
dotenv.config();

async function testEmailSystem() {
  console.log('🧪 Testing Email Configuration...\n');

  // Test 1: Check email configuration
  console.log('1. Testing email configuration...');
  const configValid = await testEmailConfiguration();
  
  if (!configValid) {
    console.log('❌ Email configuration is invalid. Please check:');
    console.log('   - EMAIL_PASSWORD is set in your .env file');
    console.log('   - Gmail account has "Less secure app access" enabled or uses App Password');
    console.log('   - SMTP settings are correct');
    return;
  }

  console.log('✅ Email configuration is valid!\n');

  // Test 2: Send test booking confirmation email
  console.log('2. Sending test booking confirmation email...');
  
  const testBookingData = {
    customerName: 'John Doe',
    customerEmail: 'test@example.com', // Change this to your email for testing
    customerPhone: '+63 912 345 6789',
    petName: 'Buddy',
    petBreed: 'Golden Retriever',
    petSize: 'LARGE',
    serviceType: 'GROOMING',
    groomingService: 'Premium Grooming Package',
    appointmentDate: '2024-12-25',
    appointmentTime: '10:00 AM',
    groomer: 'Groomer 1',
    addOnServices: ['Nail trimming', 'Ear cleaning', 'Teeth brushing'],
    specialRequests: 'Please be gentle with Buddy, he gets nervous during grooming.',
    needsTransport: true,
    transportType: 'Pickup and Drop-off',
    pickupAddress: '123 Main Street, Manila, Philippines',
    includeTreats: true,
    treatType: 'Premium dog treats',
    paymentMethod: 'CASH'
  };

  try {
    const result = await sendBookingConfirmationEmail(testBookingData);
    if (result.success) {
      console.log('✅ Test booking confirmation email sent successfully!');
      console.log(`   Message ID: ${result.messageId}`);
    } else {
      console.log('❌ Failed to send test booking confirmation email:');
      console.log(`   Error: ${result.error || result.message}`);
    }
  } catch (error) {
    console.log('❌ Error sending test booking confirmation email:', error.message);
  }

  console.log('\n3. Sending test admin notification email...');
  
  try {
    const adminResult = await sendAdminNotificationEmail(testBookingData);
    if (adminResult.success) {
      console.log('✅ Test admin notification email sent successfully!');
      console.log(`   Message ID: ${adminResult.messageId}`);
    } else {
      console.log('❌ Failed to send test admin notification email:');
      console.log(`   Error: ${adminResult.error || adminResult.message}`);
    }
  } catch (error) {
    console.log('❌ Error sending test admin notification email:', error.message);
  }

  console.log('\n🎉 Email testing completed!');
  console.log('\n📝 Next steps:');
  console.log('1. Check your email inbox for the test emails');
  console.log('2. If emails are not received, check spam folder');
  console.log('3. Verify that novopetsph@gmail.com received the admin notification');
  console.log('4. Update the customerEmail in this script to test with your actual email');
}

// Run the test
testEmailSystem().catch(console.error); 