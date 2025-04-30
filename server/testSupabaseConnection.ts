import { supabase } from './supabase';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testConnection() {
  try {
    console.log('Testing Supabase connection...');
    console.log(`URL: ${process.env.SUPABASE_URL?.substring(0, 15)}...`);
    console.log(`Key exists: ${!!process.env.SUPABASE_ANON_KEY}`);
    
    // Try a simple query
    const { data, error } = await supabase
      .from('grooming_appointments')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Connection error:', error);
      return;
    }
    
    console.log('✅ Successfully connected to Supabase!');
    console.log('Data sample:', data);
    
    // Check all tables
    const tables = ['grooming_appointments', 'hotel_bookings', 'contacts', 'users'];
    for (const table of tables) {
      const { count, error: countError } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (countError) {
        console.error(`❌ Error counting records in ${table}:`, countError);
      } else {
        console.log(`Table ${table}: ${count} records`);
      }
    }
  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

// Run the test
testConnection()
  .then(() => console.log('Test completed'))
  .catch(err => console.error('Test failed:', err)); 