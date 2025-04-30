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

async function setAdminRole() {
  const email = process.argv[2] || 'admin@novopets.com';
  const username = email.split('@')[0]; // Use part before @ as username
  
  try {
    console.log(`Checking if user exists: ${email}`);
    
    // Check if user exists in Auth
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      throw new Error(`Authentication error: ${authError.message}`);
    }
    
    const user = authData.users.find(u => u.email === email);
    
    if (!user) {
      console.log(`User with email ${email} not found in Auth. Please create the user first.`);
      return;
    }
    
    console.log(`User found in Auth: ${user.email}`);
    
    // Check if user exists in 'users' table
    const { data: existingUser, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();
    
    if (userError && !userError.message.includes('not found')) {
      throw new Error(`Database error: ${userError.message}`);
    }
    
    if (!existingUser) {
      console.log(`User not found in 'users' table. Creating new user with admin role.`);
      
      // Insert new user with admin role
      const { data: newUser, error: insertError } = await supabase
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
      
      if (insertError) {
        throw new Error(`Database error: ${insertError.message}`);
      }
      
      console.log('New user added to database with admin role:', newUser);
    } else {
      console.log(`User found in 'users' table. Updating role to admin.`);
      
      // Update existing user to have admin role
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({ role: 'admin' })
        .eq('email', email)
        .select();
      
      if (updateError) {
        throw new Error(`Database error: ${updateError.message}`);
      }
      
      console.log('User role updated to admin:', updatedUser);
    }
    
    console.log('\nAdmin role set successfully!');
    console.log(`Email: ${email}`);
    console.log('\nYou can now login at http://localhost:3000/admin');
    
  } catch (error) {
    console.error('Error setting admin role:', error.message);
  }
}

setAdminRole(); 