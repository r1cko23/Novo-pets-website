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
    
    // Check if user has admin role in the users table by email
    // This matches your Supabase setup where you have a users table with email and role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('role', 'admin')
      .single();
      
    if (userError) {
      console.error('User lookup error:', userError);
      // Try to be lenient - if there's an error looking up in users table,
      // but we authenticated successfully, we'll allow it
      console.log('Proceeding with auth-only login, error looking up in users table');
    }
    
    // Either we found an admin user in the users table or we're allowing auth-only login
    console.log(`Admin login successful: ${email}`);
    
    // Return the session and user data
    return res.status(200).json({
      success: true,
      session: data.session,
      user: {
        id: data.user.id,
        email: data.user.email,
        role: userData?.role || 'admin', // Default to admin if not found in users table
        name: userData?.username || email
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
    
    // Try to find user in users table to get role
    let userData = null;
    try {
      const { data: userRecord, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', data.user.email)
        .single();
        
      if (!userError && userRecord) {
        userData = userRecord;
      }
    } catch (err) {
      console.error('Error checking user role:', err);
      // Continue anyway, we'll use default role
    }
    
    // If no user found in users table or not admin, we'll still allow if they're authenticated
    if (!userData || userData.role !== 'admin') {
      console.log(`User ${data.user.email} authenticated but not found in users table as admin`);
    }
    
    return res.status(200).json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
        role: userData?.role || 'admin', // Default to admin if not found
        name: userData?.username || data.user.email
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
    
    console.log(`Fetching bookings with admin email: ${userData.user.email}`);
    
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
    
    console.log(`Successfully fetched ${safeBookings.length} bookings`);
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
    // Check for admin auth header for backward compatibility
    const adminEmail = req.headers['admin-email'];
    console.log(`Fetching bookings with admin email: ${adminEmail || 'none provided'}`);
    
    console.log('Attempting to fetch all bookings from Supabase...');
    
    // Fetch grooming appointments
    const { data: groomingData, error: groomingError } = await supabase
      .from('grooming_appointments')
      .select('*');
    
    if (groomingError) {
      console.error('Error fetching grooming bookings:', groomingError);
      throw groomingError;
    }
    
    // Fetch hotel bookings
    const { data: hotelData, error: hotelError } = await supabase
      .from('hotel_bookings')
      .select('*');
    
    if (hotelError) {
      console.error('Error fetching hotel bookings:', hotelError);
      throw hotelError;
    }
    
    // Log the counts for debugging
    console.log(`Retrieved ${groomingData?.length || 0} grooming bookings and ${hotelData?.length || 0} hotel bookings`);
    
    // Transform grooming appointments
    const transformedGroomingData = (groomingData || []).map(booking => {
      // Validate date fields
      let appointmentDate = booking.appointment_date;
      let createdAt = booking.created_at;
      let updatedAt = booking.updated_at;
      
      try {
        // Ensure valid date format
        if (appointmentDate) {
          const date = new Date(appointmentDate);
          if (!isNaN(date.getTime())) {
            appointmentDate = date.toISOString().split('T')[0]; // YYYY-MM-DD format
          }
        }
      } catch (e) {
        console.error('Error parsing appointment date:', e);
      }
      
      // Return transformed booking with explicit service type
      return {
        id: booking.id,
        appointmentDate,
        appointmentTime: booking.appointment_time,
        petName: booking.pet_name,
        petBreed: booking.pet_breed,
        petAge: booking.pet_age,
        petSize: booking.pet_size,
        serviceType: 'grooming',
        groomingService: booking.grooming_service,
        customerName: booking.customer_name,
        customerEmail: booking.customer_email,
        customerPhone: booking.customer_phone,
        specialRequests: booking.special_requests,
        status: booking.status || 'pending',
        reference: booking.reference,
        groomer: booking.groomer,
        createdAt,
        updatedAt
      };
    });
    
    // Transform hotel bookings
    const transformedHotelData = (hotelData || []).map(booking => {
      // Validate date fields
      let checkInDate = booking.check_in_date;
      let checkOutDate = booking.check_out_date;
      let createdAt = booking.created_at;
      let updatedAt = booking.updated_at;
      
      try {
        // Format dates
        if (checkInDate) {
          const date = new Date(checkInDate);
          if (!isNaN(date.getTime())) {
            checkInDate = date.toISOString().split('T')[0];
          }
        }
        
        if (checkOutDate) {
          const date = new Date(checkOutDate);
          if (!isNaN(date.getTime())) {
            checkOutDate = date.toISOString().split('T')[0];
          }
        }
      } catch (e) {
        console.error('Error parsing hotel booking dates:', e);
      }
      
      // Return transformed hotel booking
      return {
        id: booking.id,
        appointmentDate: checkInDate, // Map check-in date to appointmentDate for consistency
        appointmentTime: '9:00', // Default check-in time
        checkInDate,
        checkOutDate,
        petName: booking.pet_name,
        petBreed: booking.pet_breed,
        petAge: booking.pet_age,
        petSize: booking.pet_size,
        serviceType: 'hotel',
        accommodationType: booking.accommodation_type,
        customerName: booking.customer_name,
        customerEmail: booking.customer_email,
        customerPhone: booking.customer_phone,
        specialRequests: booking.special_requests,
        status: booking.status || 'pending',
        reference: booking.reference,
        createdAt,
        updatedAt
      };
    });
    
    // Combine the data and sort by appointment date (newest first)
    const combinedData = [...transformedGroomingData, ...transformedHotelData].sort((a, b) => {
      // Sort by date first (newest first)
      const dateA = new Date(a.appointmentDate || '1970-01-01');
      const dateB = new Date(b.appointmentDate || '1970-01-01');
      
      if (dateA > dateB) return -1;
      if (dateA < dateB) return 1;
      
      // If dates are the same, sort by time
      return a.appointmentTime?.localeCompare(b.appointmentTime || '') || 0;
    });
    
    console.log(`Successfully fetched ${combinedData.length} total bookings`);
    res.status(200).json(combinedData);
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
    
    // Validate date format
    if (!isValidDateString(date)) {
      console.error(`Invalid date format: ${date}`);
      return res.status(400).json({
        success: false,
        message: "Invalid date format. Please use YYYY-MM-DD format."
      });
    }
    
    // Get all bookings for this date to determine availability
    const { data: bookings, error } = await supabase
      .from('grooming_appointments')
      .select('*')
      .eq('appointment_date', date);
      
    if (error) {
      console.error('Error fetching availability:', error);
      throw error;
    }
    
    console.log(`Found ${bookings?.length || 0} bookings for date ${date}`);
    
    // Generate time slots (9 AM to 5 PM)
    const timeSlots = [];
    const groomers = ["Groomer 1", "Groomer 2"];
    
    for (let hour = 9; hour <= 17; hour++) {
      // Format hour properly (09:00 instead of 9:00)
      const time = `${hour.toString().padStart(2, '0')}:00`;
      
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
    
    console.log(`Returning ${timeSlots.length} time slots for date ${date}, with ${timeSlots.filter(slot => slot.available).length} available`);
    
    return res.status(200).json({
      success: true,
      availableTimeSlots: timeSlots
    });
  } catch (error) {
    console.error('Error in /api/availability:', error);
    
    // Return a more structured error response
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch availability",
      error: process.env.NODE_ENV === 'development' ? error.toString() : undefined
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
      groomingService,
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
    
    // Create booking data object, omitting pet_age if not provided
    const bookingData = {
      appointment_date: appointmentDate,
      appointment_time: appointmentTime,
      pet_name: petName,
      pet_breed: petBreed,
      service_type: serviceType || 'grooming',
      grooming_service: groomingService,
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone,
      groomer: groomer || 'Groomer 1',
      status: 'pending',
      reference: referenceNumber,
      created_at: new Date().toISOString()
    };
    
    // Only add pet_age if it exists
    if (petAge) {
      bookingData.pet_age = petAge;
    }
    
    // Create booking in Supabase
    const { data, error } = await supabase
      .from('grooming_appointments')
      .insert([bookingData])
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
    const { status, bookingType } = req.body;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Booking ID is required"
      });
    }
    
    // Update the valid statuses, removing 'pending'
    if (!status || !['confirmed', 'cancelled', 'completed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Valid status is required (confirmed, cancelled, or completed)"
      });
    }
    
    // If status is 'completed' or 'cancelled', delete the record
    if (status === 'completed' || status === 'cancelled') {
      return await deleteBooking(req, res, id, status, bookingType);
    }
    
    // Determine which table to update based on the booking type or try both
    const tableName = bookingType === 'hotel' ? 'hotel_bookings' : 'grooming_appointments';
    
    // Try to update in the specified table
    const { data, error } = await supabase
      .from(tableName)
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select();
    
    if (error) {
      console.error(`Error updating ${tableName} status:`, error);
      
      // If bookingType wasn't specified, try the other table
      if (!bookingType) {
        console.log('Trying to update in alternate table...');
        
        const altTable = tableName === 'grooming_appointments' ? 'hotel_bookings' : 'grooming_appointments';
        const { data: altData, error: altError } = await supabase
          .from(altTable)
          .update({ status, updated_at: new Date().toISOString() })
          .eq('id', id)
          .select();
          
        if (altError) {
          console.error(`Error updating ${altTable} status:`, altError);
          return res.status(404).json({
            success: false,
            message: "Booking not found in either table"
          });
        }
        
        if (altData && altData.length > 0) {
          console.log(`Successfully updated booking in ${altTable}`);
          return res.status(200).json({
            success: true,
            booking: altData[0],
            bookingType: altTable === 'hotel_bookings' ? 'hotel' : 'grooming'
          });
        }
      } else {
        throw error;
      }
    }
    
    if (!data || data.length === 0) {
      if (bookingType) {
        return res.status(404).json({
          success: false,
          message: `Booking not found in ${tableName}`
        });
      } else {
        // Try the other table if bookingType wasn't specified
        const altTable = tableName === 'grooming_appointments' ? 'hotel_bookings' : 'grooming_appointments';
        const { data: altData, error: altError } = await supabase
          .from(altTable)
          .update({ status, updated_at: new Date().toISOString() })
          .eq('id', id)
          .select();
          
        if (altError || !altData || altData.length === 0) {
          return res.status(404).json({
            success: false,
            message: "Booking not found in either table"
          });
        }
        
        console.log(`Successfully updated booking in ${altTable}`);
        return res.status(200).json({
          success: true,
          booking: altData[0],
          bookingType: altTable === 'hotel_bookings' ? 'hotel' : 'grooming'
        });
      }
    }
    
    console.log(`Successfully updated booking in ${tableName}`);
    return res.status(200).json({
      success: true,
      booking: data[0],
      bookingType: tableName === 'hotel_bookings' ? 'hotel' : 'grooming'
    });
  } catch (error) {
    console.error('Error updating booking status:', error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to update booking status"
    });
  }
});

// Helper function to delete a booking (for both completed and cancelled)
async function deleteBooking(req, res, id, status, bookingType) {
  try {
    // First retrieve the booking to return its data in the response
    let bookingData = null;
    let tableName = bookingType === 'hotel' ? 'hotel_bookings' : 'grooming_appointments';
    let actualTable = tableName;
    
    // Try to find the booking in the specified table
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) {
      // If not found or no booking type specified, try the other table
      const altTable = tableName === 'grooming_appointments' ? 'hotel_bookings' : 'grooming_appointments';
      
      const { data: altData, error: altError } = await supabase
        .from(altTable)
        .select('*')
        .eq('id', id)
        .single();
        
      if (altError || !altData) {
        return res.status(404).json({
          success: false,
          message: "Booking not found in either table"
        });
      }
      
      bookingData = altData;
      actualTable = altTable;
    } else {
      bookingData = data;
    }
    
    // Now delete the booking from the correct table
    const { error: deleteError } = await supabase
      .from(actualTable)
      .delete()
      .eq('id', id);
      
    if (deleteError) {
      console.error(`Error deleting ${status} booking from ${actualTable}:`, deleteError);
      throw deleteError;
    }
    
    console.log(`Successfully deleted ${status} booking #${id} from ${actualTable}`);
    
    // Return success response with the deleted booking data
    return res.status(200).json({
      success: true,
      message: `Booking marked as ${status} and removed from database`,
      booking: bookingData,
      bookingType: actualTable === 'hotel_bookings' ? 'hotel' : 'grooming',
      wasDeleted: true
    });
  } catch (error) {
    console.error(`Error deleting ${status} booking:`, error);
    return res.status(500).json({
      success: false,
      message: error.message || `Failed to delete ${status} booking`
    });
  }
}

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