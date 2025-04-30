import { supabase } from './supabase';

/**
 * This script adds a password column to the users table in Supabase.
 * 
 * You should run this script once to add the password column,
 * then you can use the /api/admin/create endpoint to create admin users.
 */
async function addPasswordColumnToUsersTable() {
  try {
    console.log("Adding password column to users table...");
    
    // First check if the column already exists
    const { data: columns, error: checkError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (checkError) {
      console.error("Error checking users table:", checkError);
      return;
    }
    
    // If the first row has a password property, the column already exists
    if (columns && columns.length > 0 && 'password' in columns[0]) {
      console.log("Password column already exists in users table.");
      return;
    }
    
    // To add a column to an existing table in Supabase, you need to use SQL
    // with the service role key (admin)
    const { error } = await supabase.rpc('add_password_column_to_users', {});
    
    if (error) {
      console.error("Error adding password column:", error);
      console.log("\nYou might need to create the RPC function in Supabase SQL Editor. Run this SQL:");
      console.log(`
CREATE OR REPLACE FUNCTION add_password_column_to_users()
RETURNS void AS $$
BEGIN
  ALTER TABLE public.users ADD COLUMN IF NOT EXISTS password TEXT;
END;
$$ LANGUAGE plpgsql;
      `);
      return;
    }
    
    console.log("Successfully added password column to users table!");
    
    // Create an admin user if no users exist
    const { data: existingUsers, error: countError } = await supabase
      .from('users')
      .select('id')
      .limit(1);
    
    if (countError) {
      console.error("Error checking existing users:", countError);
      return;
    }
    
    if (!existingUsers || existingUsers.length === 0) {
      console.log("No users found. Creating default admin user...");
      
      const defaultEmail = "admin@novopetsph.com";
      const defaultUsername = "admin";
      const defaultPassword = "admin123"; // Change this in production!
      
      const { error: createError } = await supabase
        .from('users')
        .insert({
          email: defaultEmail,
          username: defaultUsername,
          password: defaultPassword,
          role: 'admin',
          created_at: new Date().toISOString()
        });
      
      if (createError) {
        console.error("Error creating default admin user:", createError);
        return;
      }
      
      console.log(`
Default admin user created successfully!
Email: ${defaultEmail}
Username: ${defaultUsername}
Password: ${defaultPassword}

IMPORTANT: Change this password immediately after logging in!
      `);
    }
  } catch (error) {
    console.error("Unexpected error:", error);
  }
}

// Run the script
addPasswordColumnToUsersTable()
  .then(() => {
    console.log("Script completed.");
    process.exit(0);
  })
  .catch(error => {
    console.error("Script failed:", error);
    process.exit(1);
  }); 