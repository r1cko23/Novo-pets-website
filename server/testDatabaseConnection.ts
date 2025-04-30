import { supabase, checkDatabaseConnection } from './supabase';
import { supabaseConfig } from './config';

/**
 * This script tests the database connection to Supabase.
 * Run it with: npx tsx server/testDatabaseConnection.ts
 */
async function testConnection() {
  console.log('Testing database connection to Supabase...');
  console.log('URL:', supabaseConfig.url);
  
  // Check if key is available (without showing the full key)
  const keyStatus = supabaseConfig.key 
    ? `✓ Available (starts with ${supabaseConfig.key.substring(0, 5)}...)` 
    : '✗ Missing';
  console.log('ANON Key:', keyStatus);
  
  // Check if database URL is configured
  const dbUrlStatus = supabaseConfig.dbUrl
    ? `✓ Available (${supabaseConfig.dbUrl.split('@')[1] || 'configured'})`
    : '✗ Missing';
  console.log('Database URL:', dbUrlStatus);
  
  try {
    // Try a simple query to check connection
    console.log('\nTesting connection...');
    const connected = await checkDatabaseConnection();
    
    if (connected) {
      console.log('✅ Connected to Supabase successfully!');
      
      // Test each table
      console.log('\nTesting tables:');
      
      // Test users table
      try {
        const { data: users, error: usersError } = await supabase
          .from('users')
          .select('id')
          .limit(10);
        
        if (usersError) {
          console.error('❌ Users table error:', usersError.message);
        } else {
          console.log('✅ Users table accessible');
          console.log(`   Count: ${users?.length || 0} records found`);
        }
      } catch (err) {
        console.error('❌ Users table error:', err);
      }
      
      // Test grooming_appointments table
      try {
        const { data: groomingAppointments, error: groomingError } = await supabase
          .from('grooming_appointments')
          .select('id')
          .limit(10);
        
        if (groomingError) {
          console.error('❌ Grooming appointments table error:', groomingError.message);
        } else {
          console.log('✅ Grooming appointments table accessible');
          console.log(`   Count: ${groomingAppointments?.length || 0} records found`);
        }
      } catch (err) {
        console.error('❌ Grooming appointments table error:', err);
      }
      
      // Test hotel_bookings table
      try {
        const { data: hotelBookings, error: hotelError } = await supabase
          .from('hotel_bookings')
          .select('id')
          .limit(10);
        
        if (hotelError) {
          console.error('❌ Hotel bookings table error:', hotelError.message);
        } else {
          console.log('✅ Hotel bookings table accessible');
          console.log(`   Count: ${hotelBookings?.length || 0} records found`);
        }
      } catch (err) {
        console.error('❌ Hotel bookings table error:', err);
      }
      
      // Test contacts table
      try {
        const { data: contacts, error: contactsError } = await supabase
          .from('contacts')
          .select('id')
          .limit(10);
        
        if (contactsError) {
          console.error('❌ Contacts table error:', contactsError.message);
        } else {
          console.log('✅ Contacts table accessible');
          console.log(`   Count: ${contacts?.length || 0} records found`);
        }
      } catch (err) {
        console.error('❌ Contacts table error:', err);
      }
      
    } else {
      console.error('❌ Failed to connect to Supabase');
    }
  } catch (error) {
    console.error('❌ Connection test error:', error);
  }
}

// Run the test
testConnection()
  .then(() => {
    console.log('\nTest completed.');
    process.exit(0);
  })
  .catch(error => {
    console.error('\nUnexpected error:', error);
    process.exit(1);
  }); 