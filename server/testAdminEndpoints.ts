import fetch from 'node-fetch';

/**
 * This script tests admin endpoints without requiring database access
 * Run it with: npx tsx server/testAdminEndpoints.ts
 */
async function testAdminEndpoints() {
  const BASE_URL = 'http://localhost:3000';
  
  console.log('📝 Testing admin endpoints...');
  
  try {
    // Step 1: Test admin login
    console.log('\n🔑 Testing admin login...');
    const loginResponse = await fetch(`${BASE_URL}/api/admin/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'manager@novopets.com',
        password: 'manager123'
      })
    });
    
    const loginData = await loginResponse.json();
    console.log(`Login status: ${loginResponse.status} ${loginResponse.statusText}`);
    console.log('Response:', JSON.stringify(loginData, null, 2));
    
    if (!loginResponse.ok) {
      console.error('❌ Admin login failed. Please check credentials.');
      return;
    }
    
    console.log('✅ Admin login successful!');
    const adminEmail = loginData.user?.email;
    
    if (!adminEmail) {
      console.error('❌ No admin email in response!');
      return;
    }
    
    // Step 2: Test fetching bookings with admin credentials
    console.log('\n📋 Testing bookings endpoint with admin credentials...');
    const bookingsWithAuthResponse = await fetch(`${BASE_URL}/api/bookings`, {
      headers: {
        'admin-email': adminEmail
      }
    });
    
    console.log(`Bookings endpoint status (with auth): ${bookingsWithAuthResponse.status} ${bookingsWithAuthResponse.statusText}`);
    
    if (!bookingsWithAuthResponse.ok) {
      console.error('❌ Failed to fetch bookings with admin credentials');
    } else {
      const bookingsWithAuth = await bookingsWithAuthResponse.json();
      console.log(`✅ Retrieved ${bookingsWithAuth.length} bookings with admin credentials`);
    }
    
    // Step 3: Test fetching bookings without admin credentials
    console.log('\n📋 Testing bookings endpoint without admin credentials...');
    const bookingsWithoutAuthResponse = await fetch(`${BASE_URL}/api/bookings`);
    
    console.log(`Bookings endpoint status (without auth): ${bookingsWithoutAuthResponse.status} ${bookingsWithoutAuthResponse.statusText}`);
    
    if (!bookingsWithoutAuthResponse.ok) {
      console.error('❌ Failed to fetch bookings without admin credentials');
    } else {
      const bookingsWithoutAuth = await bookingsWithoutAuthResponse.json();
      console.log(`✅ Retrieved ${bookingsWithoutAuth.length} bookings without admin credentials`);
    }
    
  } catch (error) {
    console.error('❌ Error during testing:', error);
  }
}

function printDebuggingTips() {
  console.log('\n========== Debugging Tips ==========');
  console.log('1. Ensure your server is running: npm run dev');
  console.log('2. Check if you\'re using the correct admin email and password');
  console.log('3. Verify the server is running on http://localhost:3000');
  console.log('4. Check server logs for any CORS or other errors');
  console.log('5. If using JWT tokens, ensure JWT_SECRET is properly set');
  console.log('6. For "admin-email" header authentication, ensure the routes.ts file is properly updated');
}

// Run the tests
testAdminEndpoints()
  .then(() => {
    console.log('\nAdmin endpoint tests completed.');
    printDebuggingTips();
    process.exit(0);
  })
  .catch(error => {
    console.error('\nUnexpected error:', error);
    printDebuggingTips();
    process.exit(1);
  }); 