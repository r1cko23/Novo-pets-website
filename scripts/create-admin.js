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

async function createAdminUser() {
  const email = process.argv[2] || 'admin@novopets.com';
  const password = process.argv[3] || 'Admin@123456'; // Default password - change this immediately after login!
  const username = email.split('@')[0]; // Use part before @ as username
  
  try {
    console.log(`Creating admin user with email: ${email}`);
    
    // 1. Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true // Skip email confirmation
    });
    
    if (authError) {
      throw new Error(`Authentication error: ${authError.message}`);
    }
    
    console.log('User created in Auth:', authData);
    
    // 2. Add user to users table with admin role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert([
        { 
          email: email,
          username: username, 
          role: 'admin',
          created_at: new Date().toISOString()
        }
      ])
      .select();
    
    if (userError) {
      throw new Error(`Database error: ${userError.message}`);
    }
    
    console.log('User added to database with admin role:', userData);
    console.log('\nAdmin user created successfully!');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log('\nIMPORTANT: Please change this password immediately after first login!');
    
  } catch (error) {
    console.error('Error creating admin user:', error.message);
    
    // Check if it's because the user already exists
    if (error.message.includes('already exists')) {
      console.log('\nThe user may already exist. Try updating the role instead:');
      
      try {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .upsert([
            { 
              email: email,
              username: username,
              role: 'admin' 
            }
          ])
          .select();
        
        if (userError) {
          throw new Error(`Database error when updating role: ${userError.message}`);
        }
        
        console.log('User role updated to admin:', userData);
        console.log('\nNow you can login with these credentials:');
        console.log(`Email: ${email}`);
        console.log('Use the password you set previously or try resetting it.');
        
      } catch (updateError) {
        console.error('Error updating user role:', updateError.message);
      }
    }
  }
}

createAdminUser(); 