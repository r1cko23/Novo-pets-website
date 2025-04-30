// This is a special entry point for Vercel API functions
// It sets up a basic Express app with all your routes
import express from 'express';
import 'dotenv/config';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Set up Supabase with detailed logging
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log(`Supabase URL exists: ${!!supabaseUrl}`);
console.log(`Supabase key exists: ${!!supabaseKey}`);
console.log(`Supabase service key exists: ${!!supabaseServiceKey}`);

if (!supabaseUrl || !supabaseKey) {
  console.error("WARNING: Missing Supabase credentials!");
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false
  }
});

// For admin functions, use the service role key
const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    })
  : supabase;

// Log all incoming requests for debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Admin authentication endpoints
app.post('/api/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required"
      });
    }
    
    console.log(`Attempting to authenticate admin: ${email}`);
    
    // Authenticate with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      console.error('Authentication error:', error);
      return res.status(401).json({
        success: false,
        message: error.message || "Invalid credentials"
      });
    }
    
    if (!data || !data.user) {
      return res.status(401).json({
        success: false,
        message: "User not found"
      });
    }
    
    // Check if user has admin role in the users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('role', 'admin')
      .single();
      
    if (userError || !userData) {
      console.error('User lookup error:', userError);
      return res.status(403).json({
        success: false,
        message: "Not authorized as admin"
      });
    }
    
    console.log(`Admin login successful: ${email}`);
    
    // Return the session and user data
    return res.status(200).json({
      success: true,
      session: data.session,
      user: {
        id: data.user.id,
        email: data.user.email,
        role: userData.role,
        name: userData.name || data.user.email
      }
    });
  } catch (error) {
    console.error('Error in admin login:', error);
    res.status(500).json({
      success: false,
      message: error.message || "Login failed"
    });
  }
});

app.post('/api/admin/logout', async (req, res) => {
  try {
    const { session } = req.body;
    
    if (session?.access_token) {
      await supabase.auth.signOut({ 
        accessToken: session.access_token 
      });
    }
    
    return res.status(200).json({
      success: true,
      message: "Logged out successfully"
    });
  } catch (error) {
    console.error('Error in admin logout:', error);
    res.status(500).json({
      success: false,
      message: error.message || "Logout failed"
    });
  }
});

// Verify admin session
app.get('/api/admin/verify', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: "No token provided"
      });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verify the token with Supabase
    const { data, error } = await supabase.auth.getUser(token);
    
    if (error || !data.user) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token"
      });
    }
    
    // Check if user has admin role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', data.user.email)
      .eq('role', 'admin')
      .single();
      
    if (userError || !userData) {
      return res.status(403).json({
        success: false,
        message: "Not authorized as admin"
      });
    }
    
    return res.status(200).json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
        role: userData.role,
        name: userData.name || data.user.email
      }
    });
  } catch (error) {
    console.error('Error in session verification:', error);
    res.status(500).json({
      success: false,
      message: error.message || "Verification failed"
    });
  }
});

// Admin API to get all bookings with additional filtering capabilities
app.get('/api/admin/bookings', async (req, res) => {
  try {
    // Verify admin authentication
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      });
    }
    
    const token = authHeader.split(' ')[1];
    const { data: userData, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !userData.user) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token"
      });
    }
    
    // Extract query parameters for filtering
    const { status, date, search } = req.query;
    
    // Start building the query
    let query = supabase.from('grooming_appointments').select('*');
    
    // Add filters if provided
    if (status) {
      query = query.eq('status', status);
    }
    
    if (date) {
      query = query.eq('appointment_date', date);
    }
    
    if (search) {
      query = query.or(`customer_name.ilike.%${search}%,pet_name.ilike.%${search}%,customer_email.ilike.%${search}%`);
    }
    
    // Order by date and time
    query = query.order('appointment_date', { ascending: false })
                 .order('appointment_time');
    
    // Execute the query
    const { data: bookings, error } = await query;
    
    if (error) {
      console.error('Error fetching admin bookings:', error);
      throw error;
    }
    
    // Safely transform dates to handle potential invalid date strings
    const safeBookings = (bookings || []).map(booking => {
      // Make a copy of the booking to avoid mutation
      const safeBooking = { ...booking };
      
      // Ensure created_at is a valid string or null
      if (safeBooking.created_at && !isValidDateString(safeBooking.created_at)) {
        safeBooking.created_at = null;
      }
      
      // Ensure updated_at is a valid string or null
      if (safeBooking.updated_at && !isValidDateString(safeBooking.updated_at)) {
        safeBooking.updated_at = null;
      }
      
      return safeBooking;
    });
    
    return res.status(200).json(safeBookings);
  } catch (error) {
    console.error('Error in admin bookings API:', error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch bookings"
    });
  }
});

// Helper function to check if a string is a valid date
function isValidDateString(dateString) {
  if (!dateString) return false;
  
  try {
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  } catch (e) {
    return false;
  }
}

// Admin API to create a user
app.post('/api/admin/users', async (req, res) => {
  try {
    // Verify admin authentication
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      });
    }
    
    const token = authHeader.split(' ')[1];
    const { data: userData, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !userData.user) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token"
      });
    }
    
    const { email, password, name, role } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required"
      });
    }
    
    // Create user in Supabase Auth
    const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });
    
    if (createError) {
      console.error('Error creating user:', createError);
      return res.status(400).json({
        success: false,
        message: createError.message || "Failed to create user"
      });
    }
    
    // Add user to users table with role
    const { data: userRecord, error: userError } = await supabase
      .from('users')
      .insert([
        {
          email,
          name: name || email,
          role: role || 'user',
          auth_id: authData.user.id
        }
      ])
      .select();
      
    if (userError) {
      console.error('Error adding user to users table:', userError);
      return res.status(500).json({
        success: false,
        message: userError.message || "User created but failed to set role"
      });
    }
    
    return res.status(201).json({
      success: true,
      user: userRecord[0]
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create user"
    });
  }
});

// Health check endpoint that reports Supabase connection status
app.get('/api/health', async (req, res) => {
  try {
    // Test Supabase connection
    const { data, error } = await supabase.from('grooming_appointments').select('count').limit(1);
    
    if (error) {
      console.error('Supabase connection error:', error);
      return res.status(500).json({ 
        status: 'error', 
        message: 'Database connection failed',
        error: error.message,
        env: process.env.NODE_ENV,
        supabaseConfigured: !!supabaseUrl && !!supabaseKey
      });
    }
    
    res.json({ 
      status: 'ok', 
      databaseConnected: true,
      env: process.env.NODE_ENV,
      supabaseConfigured: !!supabaseUrl && !!supabaseKey
    });
  } catch (err) {
    console.error('Health check error:', err);
    res.status(500).json({ 
      status: 'error', 
      message: err.message,
      env: process.env.NODE_ENV
    });
  }
});

// API routes
app.get('/api/bookings', async (req, res) => {
  try {
    console.log('Attempting to fetch bookings from Supabase...');
    const { data, error } = await supabase
      .from('grooming_appointments')
      .select('*');
    
    if (error) {
      console.error('Error fetching bookings:', error);
      throw error;
    }
    
    console.log(`Successfully fetched ${data?.length || 0} bookings`);
    res.json(data || []);
  } catch (error) {
    console.error('Error in /api/bookings:', error);
    res.status(500).json({ 
      error: 'Failed to fetch bookings', 
      message: error.message,
      supabaseConfigured: !!supabaseUrl && !!supabaseKey
    });
  }
});

// Add endpoint for availability
app.get('/api/availability', async (req, res) => {
  try {
    const { date } = req.query;
    
    if (!date) {
      return res.status(400).json({
        success: false,
        message: "Date parameter is required"
      });
    }
    
    console.log(`Checking availability for date: ${date}`);
    
    // Get all bookings for this date to determine availability
    const { data: bookings, error } = await supabase
      .from('grooming_appointments')
      .select('*')
      .eq('appointment_date', date);
      
    if (error) {
      console.error('Error fetching availability:', error);
      throw error;
    }
    
    // Generate time slots (9 AM to 5 PM)
    const timeSlots = [];
    const groomers = ["Groomer 1", "Groomer 2"];
    
    for (let hour = 9; hour <= 17; hour++) {
      const time = `${hour}:00`;
      
      for (const groomer of groomers) {
        // Check if this slot is already booked
        const isBooked = bookings?.some(booking => 
          booking.appointment_time === time && 
          booking.groomer === groomer &&
          ['confirmed', 'pending'].includes(booking.status)
        );
        
        timeSlots.push({
          time,
          groomer,
          available: !isBooked
        });
      }
    }
    
    console.log(`Returning ${timeSlots.length} time slots for date ${date}`);
    
    return res.status(200).json({
      success: true,
      availableTimeSlots: timeSlots
    });
  } catch (error) {
    console.error('Error in /api/availability:', error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch availability"
    });
  }
});

// Add endpoint to create reservations temporarily holding a slot
app.post('/api/reservations', async (req, res) => {
  try {
    const { appointmentDate, appointmentTime, groomer } = req.body;
    
    if (!appointmentDate || !appointmentTime || !groomer) {
      return res.status(400).json({
        success: false,
        message: "Date, time, and groomer are required"
      });
    }
    
    // Check if slot is available
    const { data: bookings, error } = await supabase
      .from('grooming_appointments')
      .select('*')
      .eq('appointment_date', appointmentDate)
      .eq('appointment_time', appointmentTime)
      .eq('groomer', groomer);
      
    if (error) {
      console.error('Error checking slot availability:', error);
      throw error;
    }
    
    if (bookings && bookings.length > 0) {
      return res.status(409).json({
        success: false,
        message: "This slot is already booked"
      });
    }
    
    // Generate a reservation ID
    const reservationId = Math.random().toString(36).substring(2, 15);
    
    // In a real implementation you'd store this in a temporary reservations table
    // For now we'll just return the ID
    
    return res.status(200).json({
      success: true,
      reservationId,
      message: "Slot reserved temporarily"
    });
  } catch (error) {
    console.error('Error in reservations:', error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create reservation"
    });
  }
});

// Post endpoint for bookings
app.post('/api/bookings', async (req, res) => {
  try {
    console.log('Creating new booking with data:', JSON.stringify(req.body));
    
    const {
      appointmentDate,
      appointmentTime,
      petName,
      petBreed,
      petAge,
      serviceType,
      customerName,
      customerEmail,
      customerPhone,
      groomer
    } = req.body;
    
    // Validate required fields
    if (!appointmentDate || !appointmentTime || !petName || !customerName || !customerEmail) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields"
      });
    }
    
    // Generate a reference number
    const referenceNumber = `NVP-G-${Math.floor(Math.random() * 900000) + 100000}`;
    
    // Create booking in Supabase
    const { data, error } = await supabase
      .from('grooming_appointments')
      .insert([
        {
          appointment_date: appointmentDate,
          appointment_time: appointmentTime,
          pet_name: petName,
          pet_breed: petBreed,
          pet_age: petAge,
          service_type: serviceType || 'grooming',
          customer_name: customerName,
          customer_email: customerEmail,
          customer_phone: customerPhone,
          groomer: groomer || 'Groomer 1',
          status: 'pending',
          reference: referenceNumber,
          created_at: new Date().toISOString()
        }
      ])
      .select();
    
    if (error) {
      console.error('Error creating booking:', error);
      throw error;
    }
    
    console.log('Booking created successfully:', data);
    
    return res.status(201).json({
      success: true,
      booking: data[0]
    });
  } catch (error) {
    console.error('Error in POST /api/bookings:', error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create booking"
    });
  }
});

// Add endpoint to update booking status
app.put('/api/bookings/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Booking ID is required"
      });
    }
    
    if (!status || !['confirmed', 'cancelled', 'completed', 'pending'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Valid status is required"
      });
    }
    
    const { data, error } = await supabase
      .from('grooming_appointments')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select();
      
    if (error) {
      console.error('Error updating booking status:', error);
      throw error;
    }
    
    if (!data || data.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Booking not found"
      });
    }
    
    return res.status(200).json({
      success: true,
      booking: data[0]
    });
  } catch (error) {
    console.error('Error updating booking status:', error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to update booking status"
    });
  }
});

// Contact form submission endpoint
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, message } = req.body;
    
    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and message are required"
      });
    }
    
    const { data, error } = await supabase
      .from('contacts')
      .insert([
        {
          name,
          email,
          message,
          submitted_at: new Date().toISOString()
        }
      ]);
      
    if (error) {
      console.error('Error submitting contact form:', error);
      throw error;
    }
    
    return res.status(201).json({
      success: true,
      message: "Contact form submitted successfully"
    });
  } catch (error) {
    console.error('Error in contact form submission:', error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to submit contact form"
    });
  }
});

// Enable CORS pre-flight for all routes
app.options('*', cors());

// Handle 404 errors for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.path}`
  });
});

// This API handler only handles API routes
// The static files are managed by Vercel's static file handling
// in vercel.json, not here

export default app; 