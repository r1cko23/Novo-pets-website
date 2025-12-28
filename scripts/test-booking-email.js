/**
 * Test script to create a booking and test email functionality
 * This simulates a real booking request to test the email system
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

// Get the base URL - try multiple sources
let BASE_URL = process.env.API_URL || process.env.VERCEL_URL;

if (BASE_URL && !BASE_URL.startsWith('http')) {
  BASE_URL = `https://${BASE_URL}`;
}

// If no URL found, try common Vercel patterns or use localhost
if (!BASE_URL) {
  // Try to get from command line argument
  const args = process.argv.slice(2);
  if (args[0] && args[0].startsWith('http')) {
    BASE_URL = args[0];
  } else {
    // Default to localhost for local testing
    BASE_URL = 'http://localhost:3000';
    console.log('⚠️ No URL provided. Using localhost. Provide URL as argument: node scripts/test-booking-email.js https://your-domain.vercel.app');
  }
}

const TEST_EMAIL = 'jericko.rzl@gmail.com';

async function testBooking() {
  console.log('🧪 Testing booking with email:', TEST_EMAIL);
  console.log('🌐 Using API URL:', BASE_URL);
  console.log('');

  // Get tomorrow's date in YYYY-MM-DD format
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const appointmentDate = tomorrow.toISOString().split('T')[0];
  
  // Test booking data
  const bookingData = {
    serviceType: 'grooming',
    groomingService: 'Basic Groom',
    appointmentDate: appointmentDate,
    appointmentTime: '10:00',
    petName: 'Test Pet',
    petBreed: 'Golden Retriever',
    petSize: 'large',
    addOnServices: [],
    specialRequests: 'This is a test booking to verify email functionality',
    needsTransport: false,
    includeTreats: false,
    customerName: 'Jericko Test',
    customerPhone: '+639123456789',
    customerEmail: TEST_EMAIL,
    paymentMethod: 'cash',
    groomer: 'Groomer 1',
    status: 'pending'
  };

  try {
    console.log('📝 Creating test booking...');
    console.log('📅 Appointment Date:', appointmentDate);
    console.log('⏰ Appointment Time: 10:00 AM');
    console.log('🐾 Pet: Test Pet (Golden Retriever - Large)');
    console.log('');

    const response = await fetch(`${BASE_URL}/api/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bookingData),
    });

    const result = await response.json();

    console.log('📊 Response Status:', response.status);
    console.log('');

    if (response.ok && result.success) {
      console.log('✅ Booking created successfully!');
      console.log('📧 Email Status:', result.emailSent ? '✅ Sent' : '❌ Failed');
      console.log('');
      
      if (result.data) {
        console.log('📋 Booking Details:');
        console.log('   ID:', result.data.id);
        console.log('   Status:', result.data.status);
        console.log('   Date:', result.data.appointmentDate);
        console.log('   Time:', result.data.appointmentTime);
        console.log('');
      }

      if (result.emailSent) {
        console.log('✅ SUCCESS! Check your email inbox at:', TEST_EMAIL);
        console.log('   (Also check spam/junk folder if not in inbox)');
      } else {
        console.log('⚠️ Booking created but email failed to send');
        console.log('   Check server logs for email error details');
      }
    } else {
      console.log('❌ Booking failed!');
      console.log('Error:', result.message || 'Unknown error');
      if (result.errors) {
        console.log('Validation errors:', JSON.stringify(result.errors, null, 2));
      }
    }
  } catch (error) {
    console.error('❌ Error making booking request:', error.message);
    console.error('');
    console.error('💡 Troubleshooting:');
    console.error('   1. Make sure the server is running');
    console.error('   2. Check that BASE_URL is correct:', BASE_URL);
    console.error('   3. Verify EMAIL_PASSWORD is set in environment variables');
    console.error('   4. Check network connectivity');
  }
}

// Run the test
testBooking().catch(console.error);

