import { createClient } from '@supabase/supabase-js';
import * as readline from 'readline';
import 'dotenv/config';

// Supabase setup
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in environment variables.');
  console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_KEY in your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Create a readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * This script creates an admin user for testing purposes
 * Run it with: npx tsx server/createAdminUser.ts
 */
async function createAdminUser() {
  console.log('🔑 Create Admin User Tool\n');
  
  // Get email from command line arguments or prompt user
  let email = process.argv[2];
  let password = process.argv[3];
  let username = 'Admin';
  
  if (!email) {
    email = await new Promise(resolve => {
      rl.question('Enter admin email: ', resolve);
    });
  }
  
  if (!password) {
    password = await new Promise(resolve => {
      rl.question('Enter admin password: ', resolve);
    });
  }
  
  if (!username) {
    username = await new Promise(resolve => {
      rl.question('Enter admin username (default: Admin): ', answer => {
        resolve(answer || 'Admin');
      });
    });
  }
  
  console.log(`\nCreating admin user with email: ${email}`);
  
  try {
    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('email')
      .eq('email', email)
      .maybeSingle();
    
    if (existingUser) {
      console.log('⚠️ User with this email already exists. Updating role to admin...');
      
      // Update existing user to admin role
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          role: 'admin',
          password: password // In a real application, this should be hashed
        })
        .eq('email', email);
      
      if (updateError) {
        throw new Error(`Failed to update user: ${updateError.message}`);
      }
      
      console.log('✅ Successfully updated user to admin role!');
    } else {
      // Create new admin user
      const { error: createError } = await supabase
        .from('users')
        .insert({
          email,
          username,
          password, // In a real application, this should be hashed
          role: 'admin',
          created_at: new Date().toISOString()
        });
      
      if (createError) {
        throw new Error(`Failed to create user: ${createError.message}`);
      }
      
      console.log('✅ Successfully created new admin user!');
    }
    
    console.log('\n🔐 Admin Credentials:');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log('\nUse these credentials to log in to the admin dashboard.');
    
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : 'Unknown error');
  } finally {
    rl.close();
  }
}

// Run the script
createAdminUser().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
}); 