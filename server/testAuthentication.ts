import fetch from 'node-fetch';
import { supabase } from './supabase';

/**
 * This script tests the simplified authentication flow in the admin dashboard
 * Run it with: npx tsx server/testAuthentication.ts
 */
async function testAuthentication() {
  console.log('Testing admin authentication...');
  
  try {
    // 1. First check if we can access users table
    console.log('\n1. Testing access to users table...');
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'admin')
      .limit(10);
    
    if (userError) {
      console.error('❌ Error accessing users table:', userError);
      return;
    }
    
    console.log(`✅ Found ${users.length} admin users in the database`);
    if (users.length === 0) {
      console.log('⚠️ No admin users found. You should create one using the admin:create script.');
      return;
    }
    
    // 2. Test login endpoint with an admin user
    const adminUser = users[0];
    console.log(`\n2. Testing login with admin user: ${adminUser.email}`);
    console.log('- Admin user password is required for this step');
    console.log('- If you do not know the password, use the SQL script to update it');
    
    // Use a sample password for testing (should be replaced with actual in production)
    const samplePassword = 'admin123';
    
    // Test login endpoint
    const loginResponse = await fetch('http://localhost:3000/api/admin/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: adminUser.email,
        password: samplePassword
      })
    });
    
    const loginData = await loginResponse.json() as { message?: string; user?: any };
    
    if (!loginResponse.ok) {
      console.error('❌ Login failed:', loginData.message);
      console.error('Check your database to ensure the password is correct.');
      return;
    }
    
    console.log('✅ Login successful!');
    console.log(`Admin user data:`, loginData.user);
    
    // 3. Test protected endpoint with the admin email header
    console.log('\n3. Testing protected endpoint with admin email...');
    await testProtectedEndpoint(adminUser.email);
    
  } catch (error) {
    console.error('❌ Unexpected error during authentication test:', error);
  }
}

async function testProtectedEndpoint(adminEmail: string) {
  try {
    // Test booking endpoint
    const bookingsResponse = await fetch('http://localhost:3000/api/bookings', {
      method: 'GET',
      headers: {
        'admin-email': adminEmail
      }
    });
    
    if (!bookingsResponse.ok) {
      const errorData = await bookingsResponse.json().catch(() => ({ message: 'Failed to parse error response' })) as { message: string };
      console.error('❌ Failed to access protected endpoint:', errorData.message);
      console.error('Status:', bookingsResponse.status);
      return;
    }
    
    const bookings = await bookingsResponse.json() as any[];
    console.log(`✅ Successfully accessed bookings API with ${bookings.length} bookings returned`);
    
    // Test updating a booking status if there are any bookings
    if (bookings.length > 0) {
      console.log('\n4. Testing updating a booking status...');
      
      const bookingId = bookings[0].id;
      const updateResponse = await fetch(`http://localhost:3000/api/bookings/${bookingId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'admin-email': adminEmail
        },
        body: JSON.stringify({ status: 'confirmed' })
      });
      
      if (!updateResponse.ok) {
        const errorData = await updateResponse.json().catch(() => ({ message: 'Failed to parse error response' })) as { message: string };
        console.error('❌ Failed to update booking status:', errorData.message);
        return;
      }
      
      const updateData = await updateResponse.json() as { message: string };
      console.log('✅ Successfully updated booking status:', updateData.message);
    }
    
  } catch (error) {
    console.error('❌ Error testing protected endpoint:', error);
  }
}

// Run the test
testAuthentication()
  .then(() => {
    console.log('\nAuthentication test completed.');
    process.exit(0);
  })
  .catch(error => {
    console.error('\nUnexpected error:', error);
    process.exit(1);
  }); 