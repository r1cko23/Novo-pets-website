import { supabase } from './supabase';

async function checkSupabaseConnection() {
  console.log('Checking Supabase connection...');
  
  try {
    // Check if we can connect to Supabase
    const { data, error } = await supabase.from('grooming_appointments').select('count');
    
    if (error) {
      console.error('Error connecting to Supabase:', error);
      return false;
    }
    
    console.log('Successfully connected to Supabase');
    return true;
  } catch (error) {
    console.error('Error checking Supabase connection:', error);
    return false;
  }
}

async function checkTables() {
  try {
    console.log('Checking if required tables exist...');
    
    // Check grooming_appointments table
    const { data: groomingData, error: groomingError } = await supabase
      .from('grooming_appointments')
      .select('*')
      .limit(1);
      
    if (groomingError) {
      console.error('Error accessing grooming_appointments table:', groomingError);
    } else {
      console.log('grooming_appointments table exists');
    }
    
    // Check hotel_bookings table
    const { data: hotelData, error: hotelError } = await supabase
      .from('hotel_bookings')
      .select('*')
      .limit(1);
      
    if (hotelError) {
      console.error('Error accessing hotel_bookings table:', hotelError);
    } else {
      console.log('hotel_bookings table exists');
    }
    
    // Check contacts table
    const { data: contactsData, error: contactsError } = await supabase
      .from('contacts')
      .select('*')
      .limit(1);
      
    if (contactsError) {
      console.error('Error accessing contacts table:', contactsError);
    } else {
      console.log('contacts table exists');
    }
  } catch (error) {
    console.error('Error checking tables:', error);
  }
}

async function main() {
  const connected = await checkSupabaseConnection();
  
  if (connected) {
    await checkTables();
  }
}

main().catch(console.error); 