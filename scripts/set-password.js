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

async function setPassword() {
  const email = process.argv[2] || 'admin@novopets.com';
  const password = process.argv[3] || 'Admin@123456'; // Default password
  
  try {
    console.log(`Setting password for user: ${email}`);
    
    // First check if user exists in Auth
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) {
      throw new Error(`Authentication error: ${userError.message}`);
    }
    
    const user = userData.users.find(u => u.email === email);
    
    if (!user) {
      throw new Error(`User with email ${email} not found. Create the user first.`);
    }
    
    // Update the user's password
    const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { password: password }
    );
    
    if (updateError) {
      throw new Error(`Failed to update password: ${updateError.message}`);
    }
    
    console.log(`\nPassword successfully set for ${email}`);
    console.log(`New password: ${password}`);
    console.log('\nYou can now login at http://localhost:3000/admin with these credentials.');
    console.log('IMPORTANT: Change this password after first login!');
    
  } catch (error) {
    console.error('Error setting password:', error.message);
  }
}

setPassword(); 