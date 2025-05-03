import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

// Initialize environment variables
dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixDuplicateBookings() {
  try {
    console.log('Searching for duplicate bookings...');
    
    // Find duplicates
    const { data: duplicates, error: findError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          appointment_date,
          appointment_time,
          groomer,
          COUNT(*) as booking_count,
          ARRAY_AGG(id ORDER BY created_at) as booking_ids
        FROM 
          grooming_appointments
        WHERE 
          status != 'cancelled'
        GROUP BY 
          appointment_date, appointment_time, groomer
        HAVING 
          COUNT(*) > 1
      `
    });
    
    if (findError) {
      console.error('Error finding duplicates:', findError);
      return;
    }
    
    if (!duplicates || !duplicates.length) {
      console.log('No duplicate bookings found!');
      return;
    }
    
    console.log(`Found ${duplicates.length} sets of duplicate bookings.`);
    
    // Process each duplicate set
    for (const dup of duplicates) {
      console.log(`Processing duplicates for ${dup.appointment_date} at ${dup.appointment_time} with ${dup.groomer}`);
      console.log(`Found ${dup.booking_count} bookings, IDs: ${dup.booking_ids.join(', ')}`);
      
      // Keep the oldest booking (first ID in the array), cancel the others
      const [keepId, ...cancelIds] = dup.booking_ids;
      console.log(`Keeping booking ID ${keepId}, cancelling ${cancelIds.length} others`);
      
      // Update the status to 'cancelled' for the duplicate bookings
      const { error: updateError } = await supabase
        .from('grooming_appointments')
        .update({ status: 'cancelled' })
        .in('id', cancelIds);
      
      if (updateError) {
        console.error('Error cancelling duplicates:', updateError);
      } else {
        console.log(`Successfully cancelled ${cancelIds.length} duplicate bookings`);
      }
    }
    
    console.log('Duplicate booking cleanup completed');
  } catch (error) {
    console.error('Error fixing duplicate bookings:', error);
  }
}

// Run the fix
fixDuplicateBookings(); 