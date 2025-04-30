import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: resolve(__dirname, '..', '.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required');
  process.exit(1);
}

// Create Supabase client with admin privileges
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkAdminUsers() {
  try {
    console.log('Checking for admin users in the database...');
    
    // Query the users table to find admin users
    const { data: adminUsers, error } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'admin');
    
    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
    
    console.log('\n=== Admin Users ===');
    
    if (adminUsers && adminUsers.length > 0) {
      console.log(`Found ${adminUsers.length} admin user(s):`);
      adminUsers.forEach((user, index) => {
        console.log(`\n${index + 1}. User: ${user.email}`);
        console.log(`   Created: ${new Date(user.created_at).toLocaleString()}`);
      });
      
      console.log('\nLogin Instructions:');
      console.log('1. Go to: http://localhost:3000/admin');
      console.log('2. Enter your admin email address');
      console.log('3. Enter your password');
      console.log('\nNote: If you forgot your password, you can reset it via Supabase dashboard.');
    } else {
      console.log('No admin users found in the database.');
      console.log('\nTo create an admin user, run:');
      console.log('npm run admin:create -- admin@example.com password123');
    }
    
    // Check the 'users' table structure
    console.log('\n=== Database Information ===');
    const { data: tableInfo, error: tableError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (tableError) {
      if (tableError.message.includes('does not exist')) {
        console.log("'users' table doesn't exist. Make sure to create it with the following columns:");
        console.log("- id (auto-increment)");
        console.log("- email (string)");
        console.log("- role (string)");
        console.log("- user_id (string, links to Supabase Auth)");
        console.log("- created_at (timestamp)");
      } else {
        console.error('Error querying table info:', tableError.message);
      }
    } else {
      console.log("'users' table exists.");
    }
    
  } catch (error) {
    console.error('Error checking admin users:', error.message);
  }
}

checkAdminUsers(); 