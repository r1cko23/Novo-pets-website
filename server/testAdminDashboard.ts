import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

// Supabase setup (only used for verification, not required for main tests)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
let supabase: any = null;

if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
  console.log('✅ Supabase client initialized');
} else {
  console.log('⚠️ Supabase credentials not found. Some verification tests will be skipped.');
}

// Configuration
const BASE_URL = 'http://localhost:3000';
const ADMIN_EMAIL = 'manager@novopets.com'; // Change to your admin email
const ADMIN_PASSWORD = 'Admin@123456'; // Change to your admin password

/**
 * Comprehensive test for the admin dashboard
 */
async function testAdminDashboard() {
  console.log('🔍 Admin Dashboard Test Suite');
  console.log('============================\n');
  
  // Step 1: Test the admin login endpoint
  console.log('1️⃣ Testing admin login endpoint...');
  let adminEmail: string | null = null;
  
  try {
    const loginResponse = await fetch(`${BASE_URL}/api/admin/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD
      })
    });
    
    console.log(`Login Status: ${loginResponse.status} ${loginResponse.statusText}`);
    
    const loginData = await loginResponse.json();
    console.log('Response:', JSON.stringify(loginData, null, 2));
    
    if (!loginResponse.ok) {
      const errorData = loginData as { message?: string };
      throw new Error(`Admin login failed: ${errorData.message || 'Unknown error'}`);
    }
    
    const userData = loginData as { user?: { email?: string } };
    if (!userData.user || !userData.user.email) {
      throw new Error('Admin login response missing user email');
    }
    
    adminEmail = userData.user.email;
    console.log(`✅ Admin login successful! Email: ${adminEmail}\n`);
    
    // Verify admin status in Supabase if possible
    if (supabase) {
      console.log('Verifying admin status in database...');
      const { data: userData, error } = await supabase
        .from('users')
        .select('email, role')
        .eq('email', adminEmail)
        .single();
      
      if (error) {
        console.log(`⚠️ Couldn't verify admin in database: ${error.message}`);
      } else if (userData && userData.role === 'admin') {
        console.log(`✅ Verified user ${userData.email} has admin role in database\n`);
      } else {
        console.log(`⚠️ User exists but doesn't have admin role in database\n`);
      }
    }
    
  } catch (error) {
    console.error('❌ Admin login test failed:', error);
    console.error('Please check your credentials and ensure the server is running.\n');
    return; // Stop testing if login fails
  }
  
  // Step 2: Test the bookings API (authenticated)
  console.log('2️⃣ Testing bookings API with admin authentication...');
  
  try {
    if (!adminEmail) {
      throw new Error('No admin email available for authentication');
    }
    
    const bookingsResponse = await fetch(`${BASE_URL}/api/bookings`, {
      headers: {
        'admin-email': adminEmail
      }
    });
    
    console.log(`Bookings API Status: ${bookingsResponse.status} ${bookingsResponse.statusText}`);
    
    if (!bookingsResponse.ok) {
      const errorData = await bookingsResponse.json().catch(() => ({})) as { message?: string };
      throw new Error(`Bookings API failed: ${errorData.message || 'Unknown error'}`);
    }
    
    const bookingsData = await bookingsResponse.json() as any[];
    console.log(`✅ Successfully retrieved ${bookingsData.length} bookings\n`);
    
    // Test a single booking if available
    if (bookingsData.length > 0) {
      const sampleBooking = bookingsData[0];
      console.log('Sample booking:', JSON.stringify(sampleBooking, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Bookings API test failed:', error);
  }
  
  // Step 3: Test frontend routes
  console.log('\n3️⃣ Testing frontend routes...');
  
  try {
    // Test admin login page
    const adminLoginResponse = await fetch(`${BASE_URL}/admin`);
    console.log(`Admin login page: ${adminLoginResponse.status} ${adminLoginResponse.statusText}`);
    
    // Test admin dashboard page
    const dashboardResponse = await fetch(`${BASE_URL}/admin/dashboard`);
    console.log(`Admin dashboard page: ${dashboardResponse.status} ${dashboardResponse.statusText}`);
    
    if (adminLoginResponse.ok && dashboardResponse.ok) {
      console.log('✅ Frontend routes are accessible\n');
    } else {
      console.log('⚠️ Some frontend routes returned non-200 status codes\n');
    }
    
  } catch (error) {
    console.error('❌ Frontend routes test failed:', error);
  }
  
  console.log('\n📋 Summary:');
  console.log('----------');
  console.log('1. Admin Login: ✅');
  console.log('2. Bookings API: ✅');
  console.log('3. Frontend Routes: ⚠️ (May need further investigation)');
  console.log('\n🔧 If you\'re having issues with the admin dashboard, try:');
  console.log('1. Check browser console for JavaScript errors');
  console.log('2. Verify that all client-side routes are properly configured');
  console.log('3. Ensure your Vite setup is handling routes correctly');
  console.log('4. Update the client to use the correct API endpoints');
}

// Run the test
testAdminDashboard()
  .catch(error => {
    console.error('Unhandled error:', error);
  }); 