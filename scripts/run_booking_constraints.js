import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Initialize environment variables
dotenv.config();

// Get current script directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  try {
    console.log('Reading SQL migration file...');
    const sqlFilePath = path.join(__dirname, 'add_booking_constraints.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Split the SQL into individual statements
    const statements = sqlContent.split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    console.log(`Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      console.log(`Executing statement ${i + 1}/${statements.length}...`);
      
      const { error } = await supabase.rpc('exec_sql', { sql: stmt });
      
      if (error) {
        if (error.message.includes('function "exec_sql" does not exist')) {
          console.log('exec_sql function does not exist yet, executing raw SQL...');
          // For the first statement (creating exec_sql), we need to use raw SQL
          // Extract the function definition
          const functionRegex = /CREATE OR REPLACE FUNCTION exec_sql[\s\S]*?\$\$/;
          const match = sqlContent.match(functionRegex);
          
          if (match) {
            const functionDef = match[0];
            // Execute directly using raw SQL (only works if you have direct PostgreSQL access)
            console.log('Please execute this SQL manually in the Supabase SQL editor:');
            console.log(functionDef);
          }
        } else {
          console.error(`Error executing statement ${i + 1}:`, error);
        }
      } else {
        console.log(`Statement ${i + 1} executed successfully`);
      }
    }
    
    console.log('Migration completed.');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

// Run the migration
runMigration(); 