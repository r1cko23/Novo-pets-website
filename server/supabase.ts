import { createClient } from '@supabase/supabase-js';
import { supabaseConfig } from './config';

// Define database types
export type Database = {
  public: {
    Tables: {
      bookings: {
        Row: {
          id: number;
          service_type: string;
          grooming_service: string | null;
          accommodation_type: string | null;
          duration_hours: number | null;
          duration_days: number | null;
          appointment_date: string;
          appointment_time: string;
          pet_name: string;
          pet_breed: string;
          pet_size: string;
          add_on_services: string | null;
          special_requests: string | null;
          needs_transport: boolean;
          transport_type: string | null;
          pickup_address: string | null;
          include_treats: boolean;
          treat_type: string | null;
          customer_name: string;
          customer_phone: string;
          customer_email: string;
          payment_method: string;
          groomer: string | null;
          status: string;
          total_price: number | null;
          reference: string | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          service_type: string;
          grooming_service?: string | null;
          accommodation_type?: string | null;
          duration_hours?: number | null;
          duration_days?: number | null;
          appointment_date: string;
          appointment_time: string;
          pet_name: string;
          pet_breed: string;
          pet_size: string;
          add_on_services?: string | null;
          special_requests?: string | null;
          needs_transport?: boolean;
          transport_type?: string | null;
          pickup_address?: string | null;
          include_treats?: boolean;
          treat_type?: string | null;
          customer_name: string;
          customer_phone: string;
          customer_email: string;
          payment_method: string;
          groomer?: string | null;
          status?: string;
          total_price?: number | null;
          reference?: string | null;
          created_at?: string;
        };
        Update: {
          id?: number;
          service_type?: string;
          grooming_service?: string | null;
          accommodation_type?: string | null;
          duration_hours?: number | null;
          duration_days?: number | null;
          appointment_date?: string;
          appointment_time?: string;
          pet_name?: string;
          pet_breed?: string;
          pet_size?: string;
          add_on_services?: string | null;
          special_requests?: string | null;
          needs_transport?: boolean;
          transport_type?: string | null;
          pickup_address?: string | null;
          include_treats?: boolean;
          treat_type?: string | null;
          customer_name?: string;
          customer_phone?: string;
          customer_email?: string;
          payment_method?: string;
          groomer?: string | null;
          status?: string;
          total_price?: number | null;
          reference?: string | null;
          created_at?: string;
        };
      };
      contacts: {
        Row: {
          id: number;
          name: string;
          email: string;
          subject: string;
          message: string;
          created_at: string;
        };
        Insert: {
          id?: number;
          name: string;
          email: string;
          subject: string;
          message: string;
          created_at?: string;
        };
        Update: {
          id?: number;
          name?: string;
          email?: string;
          subject?: string;
          message?: string;
          created_at?: string;
        };
      };
      users: {
        Row: {
          id: number;
          email: string;
          username: string;
          created_at: string;
          role: string;
          password?: string;
        };
        Insert: {
          id?: number;
          email: string;
          username: string;
          created_at?: string;
          role?: string;
          password?: string;
        };
        Update: {
          id?: number;
          email?: string;
          username?: string;
          created_at?: string;
          role?: string;
          password?: string;
        };
      };
    };
  };
};

// Check Supabase credentials
if (!supabaseConfig.url || !supabaseConfig.key) {
  console.error('⚠️ Supabase credentials missing. Please check your environment variables:');
  console.error('- SUPABASE_URL:', supabaseConfig.url ? '✓ Found' : '✗ Missing');
  console.error('- SUPABASE_ANON_KEY:', supabaseConfig.key ? '✓ Found' : '✗ Missing');
  console.error('- SUPABASE_SERVICE_ROLE_KEY:', supabaseConfig.serviceKey ? '✓ Found' : '✗ Missing');
  
  if (supabaseConfig.dbUrl) {
    console.log('- DATABASE_URL: ✓ Found');
  } else {
    console.error('- DATABASE_URL: ✗ Missing (recommended for Vercel deployment)');
  }
}

// Create a client with the anonymous key (for client-side operations)
export const supabase = createClient<Database>(
  supabaseConfig.url,
  supabaseConfig.key,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    db: {
      schema: 'public',
    },
    global: {
      fetch: (...args) => {
        // Add retry logic for fetch operations
        return fetch(...args).catch(error => {
          console.error('Supabase fetch error:', error);
          throw error;
        });
      }
    }
  }
);

// Create a client with the service role key (for admin operations)
export const supabaseAdmin = createClient<Database>(
  supabaseConfig.url,
  supabaseConfig.serviceKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    db: {
      schema: 'public',
    },
    global: {
      fetch: (...args) => {
        // Add retry logic for fetch operations
        return fetch(...args).catch(error => {
          console.error('Supabase admin fetch error:', error);
          throw error;
        });
      }
    }
  }
);

// Helper function to check the database connection
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('Database connection error:', error);
      return false;
    }
    
    console.log('Database connection successful');
    return true;
  } catch (error) {
    console.error('Unexpected database connection error:', error);
    return false;
  }
}

export default supabase; 