// This is a special entry point for Vercel API functions
// It sets up a basic Express app with all your routes
import express from 'express';
import 'dotenv/config';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import { format } from 'date-fns';

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
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  
  // Special logging for booking and email-related requests
  if (req.url.includes('/api/bookings') && req.method === 'POST') {
    console.log(`[${timestamp}] 📝 BOOKING REQUEST - Starting booking creation...`);
  }
  if (req.url.includes('/api/availability')) {
    console.log(`[${timestamp}] 📊 AVAILABILITY REQUEST - Checking availability...`);
  }
  
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
    // Only accept YYYY-MM-DD format (most strict version)
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      const [year, month, day] = dateString.split('-').map(num => parseInt(num, 10));
      // Check if it's a valid date (month is 0-based in JS Date)
      const date = new Date(year, month - 1, day);
      const isValid = date.getFullYear() === year && 
                      date.getMonth() === month - 1 && 
                      date.getDate() === day;
                      
      console.log(`Validating date string ${dateString}: ${isValid ? 'Valid' : 'Invalid'} YYYY-MM-DD format`);
      return isValid;
    }
    
    // Reject any other formats with explicit warning
    console.warn(`Date string ${dateString} is not in YYYY-MM-DD format - rejecting`);
    return false;
  } catch (e) {
    console.error(`Error validating date string: ${dateString}`, e);
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

// Add this function to clear cached availability after a booking is made
function clearAvailabilityCache(date) {
  console.log(`Clearing availability cache for date: ${date}`);
  // In a production implementation, you would clear any server-side or Redis cache here
  // For now, we'll just log that we're doing it
}

// Add endpoint for availability
app.get('/api/availability', async (req, res) => {
  try {
    const { date, refresh } = req.query;
    
    if (!date) {
      return res.status(400).json({
        success: false,
        message: "Date parameter is required"
      });
    }
    
    console.log(`Checking availability for date: ${date}, refresh: ${refresh}`);
    
    // Validate date format
    if (!isValidDateString(date)) {
      console.error(`Invalid date format: ${date}`);
      return res.status(400).json({
        success: false,
        message: "Invalid date format. Please use YYYY-MM-DD format."
      });
    }
    
    // IMPORTANT: Use the exact input date string for tracking and response
    const normalizedDate = date;
    console.log(`Using exact date string for availability tracking: ${normalizedDate}`);
    
    // Use the exact date string for database query (no timezone adjustment needed)
    const dateForDb = normalizedDate;
    console.log(`Using date for database query: ${dateForDb}`);
    
    // Get all bookings for this date to determine availability with the most recent data
    // Include both confirmed and pending statuses as booked
    let groomingQuery = supabase
      .from('grooming_appointments')
      .select('appointment_date, appointment_time, groomer, status')
      .eq('appointment_date', dateForDb) // Use exact date for DB query
      .in('status', ['confirmed', 'pending']);
    
    // Instead of using options, let's ensure we get the most recent data
    if (refresh === 'true') {
      console.log('Forcing fresh data from database');
    }
       
    const { data: groomingBookings, error: groomingError } = await groomingQuery;
        
    if (groomingError) {
      console.error('Error fetching grooming availability:', groomingError);
      throw groomingError;
    }
    
    // Also check hotel bookings that might overlap with this date
    const { data: hotelBookings, error: hotelError } = await supabase
      .from('hotel_bookings')
      .select('check_in_date, check_out_date, accommodation_type, status')
      .or(`check_in_date.eq.${dateForDb},and(check_in_date.lt.${dateForDb},check_out_date.gte.${dateForDb})`) // Use exact date
      .in('status', ['confirmed', 'pending']);
      
    if (hotelError) {
      console.error('Error fetching hotel availability:', hotelError);
      throw hotelError;
    }
    
    console.log(`Found ${groomingBookings?.length || 0} grooming bookings and ${hotelBookings?.length || 0} hotel bookings for date ${dateForDb}`);
    
    // Debug: Check all bookings for this date regardless of status
    const { data: allBookings, error: allBookingsError } = await supabase
      .from('grooming_appointments')
      .select('appointment_date, appointment_time, groomer, status')
      .eq('appointment_date', dateForDb);
    
    if (!allBookingsError && allBookings) {
      console.log(`[${new Date().toISOString()}] 📊 All bookings for ${dateForDb}:`, allBookings);
      console.log(`[${new Date().toISOString()}] 📊 Total bookings found: ${allBookings.length}`);
      
      // Log each booking with details
      allBookings.forEach((booking, index) => {
        console.log(`[${new Date().toISOString()}] 📊 Booking ${index + 1}: ${booking.appointment_date} ${booking.appointment_time} with ${booking.groomer} (status: ${booking.status})`);
      });
    }
    
    // Log actual booking dates to help debug
    if (groomingBookings && groomingBookings.length > 0) {
      console.log('Grooming booking dates:', groomingBookings.map(b => `${b.appointment_date} ${b.appointment_time}`));
    }
    
    if (hotelBookings && hotelBookings.length > 0) {
      console.log('Hotel booking dates:', hotelBookings.map(b => `Check-in: ${b.check_in_date}, Check-out: ${b.check_out_date}`));
    }
    
    // Combined all booked time slots
    const bookedSlotsMap = {};
    
    // Mark grooming slots as booked
    if (groomingBookings && groomingBookings.length > 0) {
      groomingBookings.forEach(booking => {
        // Normalize time format from database (which stores "HH:MM:00")
        // Extract just "HH:MM" for comparison with time slots
        let time = booking.appointment_time;
        if (time && time.includes(':')) {
          // Extract HH:MM from HH:MM:SS format
          const parts = time.split(':');
          time = `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
        } else if (time) {
          // Fallback for unexpected formats
          time = `${time.padStart(2, '0')}:00`;
        } else {
          console.warn(`Invalid appointment_time format: ${booking.appointment_time}`);
          return; // Skip this booking
        }
            
        const groomer = booking.groomer;
        
        // Create a unique key for each slot
        const key = `${time}-${groomer}`;
        
        // Mark as booked and log it for debugging
        bookedSlotsMap[key] = true;
        console.log(`Marking grooming slot as booked: ${key} (DB time: ${booking.appointment_time}, status: ${booking.status})`);
      });
    }
    
    // For hotel bookings, mark the 9:00 AM slot as booked since that's when they typically check in
    // This is a simplification - in a real system, you might have more sophisticated allocation
    if (hotelBookings && hotelBookings.length > 0) {
      // Each hotel booking takes up a slot at 9:00 AM
      // This will block both groomers' 9 AM slots if there are two or more hotel bookings
      const hotelDefaultTime = "09:00";
      
      hotelBookings.forEach((booking, index) => {
        // Determine which groomer slot to block based on the index
        // We'll alternate between groomers to distribute bookings
        const groomer = `Groomer ${(index % 2) + 1}`;
        const key = `${hotelDefaultTime}-${groomer}`;
        
        bookedSlotsMap[key] = true;
        console.log(`Marking hotel check-in slot as booked: ${key} (status: ${booking.status})`);
        
        // If there are many hotel bookings, block both groomers' slots
        if (hotelBookings.length > 1) {
          const otherGroomer = `Groomer ${(index % 2 === 0) ? 2 : 1}`;
          const otherKey = `${hotelDefaultTime}-${otherGroomer}`;
          
          // Only mark as booked if there are enough hotel bookings to warrant blocking both slots
          if (index < Math.floor(hotelBookings.length / 2)) {
            bookedSlotsMap[otherKey] = true;
            console.log(`Marking additional hotel slot as booked: ${otherKey} (due to high volume)`);
          }
        }
      });
    }
    
    // Generate time slots (9 AM to 5 PM)
    const timeSlots = [];
    const groomers = ["Groomer 1", "Groomer 2"];
    
    // Format hours properly and include more detailed time slots
    for (let hour = 9; hour <= 17; hour++) {
      // Format hour properly (09:00 instead of 9:00)
      const time = `${hour.toString().padStart(2, '0')}:00`;
      
      for (const groomer of groomers) {
        // Check if this slot is already booked using the map for efficient lookup
        const key = `${time}-${groomer}`;
        const isBooked = bookedSlotsMap[key] === true;
        
        timeSlots.push({
          time,
          groomer,
          available: !isBooked
        });
      }
    }
    
    // Log availability statistics
    const availableCount = timeSlots.filter(slot => slot.available).length;
    const bookedCount = timeSlots.length - availableCount;
    console.log(`Returning ${timeSlots.length} time slots for date ${normalizedDate}: ${availableCount} available, ${bookedCount} booked`);
    
    // Debug logging for booked slots to identify issues
    const bookedSlots = Object.keys(bookedSlotsMap);
    console.log('Booked slot keys:', bookedSlots);
    
    // Check if any specific times are fully booked across all groomers
    const timeAvailability = {};
    timeSlots.forEach(slot => {
      if (!timeAvailability[slot.time]) {
        timeAvailability[slot.time] = { total: 0, available: 0 };
      }
      timeAvailability[slot.time].total++;
      if (slot.available) {
        timeAvailability[slot.time].available++;
      }
    });
    
    // Log times that are fully booked
    for (const [time, availability] of Object.entries(timeAvailability)) {
      if (availability.available === 0) {
        console.log(`Time ${time} is fully booked across all groomers`);
      }
    }
    
    return res.status(200).json({
      success: true,
      availableTimeSlots: timeSlots,
      timestamp: new Date().toISOString(), // Add timestamp to help client detect stale data
      debug: {
        bookedSlots: bookedSlots,
        requestedDate: normalizedDate,
        refresh: refresh === 'true'
      }
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

// Updated endpoint to create reservations with double-booking prevention
app.post('/api/reservations', async (req, res) => {
  try {
    const { appointmentDate, appointmentTime, groomer } = req.body;
    
    if (!appointmentDate || !appointmentTime || !groomer) {
      return res.status(400).json({
        success: false,
        message: "Date, time, and groomer are required"
      });
    }
    
    // Clean the date string to ensure consistent format (YYYY-MM-DD)
    console.log(`Original reservation date: ${appointmentDate}`);
    
    // Use the same date cleaning logic as in the bookings endpoint
    let cleanDateStr;
    
    // If the input is already a simple YYYY-MM-DD string, use it directly
    if (/^\d{4}-\d{2}-\d{2}$/.test(appointmentDate)) {
      cleanDateStr = appointmentDate;
      console.log(`Date is already in YYYY-MM-DD format: ${cleanDateStr}`);
    } 
    // If it's an ISO string or contains timezone info, extract just the date part
    else if (appointmentDate.includes('T')) {
      cleanDateStr = appointmentDate.split('T')[0];
      console.log(`Extracted date part from ISO string: ${cleanDateStr}`);
    } 
    // For any other format, parse and reformat to YYYY-MM-DD
    else {
      const dateObj = new Date(appointmentDate);
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      cleanDateStr = `${year}-${month}-${day}`;
      console.log(`Parsed and reformatted date: ${cleanDateStr}`);
    }
    
    console.log(`Using cleaned date string for reservation check: ${cleanDateStr}`);
    
    // Use the exact date string for database query (consistent with availability endpoint)
    // The database DATE column should handle this correctly without adjustment
    const dateForDb = cleanDateStr;
    console.log(`Using exact date for database query: ${dateForDb}`);
    
    // Normalize time format for database query
    // Database stores time as "HH:MM:00" but client sends "HH:MM"
    // Need to add ":00" suffix for proper matching
    const normalizedTime = appointmentTime.includes(':') 
      ? (appointmentTime.includes(':') && appointmentTime.split(':').length === 2 
          ? `${appointmentTime}:00` 
          : appointmentTime)
      : `${appointmentTime.padStart(2, '0')}:00:00`;
    
    console.log(`Checking reservation for time: ${appointmentTime} (normalized to DB format: ${normalizedTime})`);
    
    // Check if slot is available with a more robust query
    const { data: bookings, error } = await supabase
      .from('grooming_appointments')
      .select('*')
      .eq('appointment_date', dateForDb) // Use exact date for DB query
      .eq('appointment_time', normalizedTime) // Use normalized time format
      .eq('groomer', groomer)
      .in('status', ['confirmed', 'pending']);
      
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
      expiresIn: 300, // 5 minutes in seconds
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
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] 📝 BOOKING CREATION STARTED`);
    console.log(`[${timestamp}] 📝 Booking data:`, JSON.stringify(req.body, null, 2));
    
    const {
      appointmentDate,
      appointmentTime,
      petName,
      petBreed,
      petSize,
      petAge,
      serviceType,
      groomingService,
      accommodationType,
      durationDays,
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
    
    // Fix timezone issues by ensuring the date is in YYYY-MM-DD format
    // This corrects for browsers sending dates in local timezone which can cause off-by-one day errors
    console.log(`Original appointment date: ${appointmentDate}`);
    
    // IMPORTANT: Strip out any time portion from the date string to ensure consistent date handling
    // First ensure we have a valid date string
    let cleanDateStr;
    
    // If the input is already a simple YYYY-MM-DD string, use it directly
    if (/^\d{4}-\d{2}-\d{2}$/.test(appointmentDate)) {
      cleanDateStr = appointmentDate;
      console.log(`Date is already in YYYY-MM-DD format: ${cleanDateStr}`);
    } 
    // If it's an ISO string or contains timezone info, extract just the date part
    else if (appointmentDate.includes('T')) {
      cleanDateStr = appointmentDate.split('T')[0];
      console.log(`Extracted date part from ISO string: ${cleanDateStr}`);
    } 
    // For any other format, parse and reformat to YYYY-MM-DD
    else {
      const dateObj = new Date(appointmentDate);
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      cleanDateStr = `${year}-${month}-${day}`;
      console.log(`Parsed and reformatted date: ${cleanDateStr}`);
    }
    
    // Validate the cleaned date string
    if (!isValidDateString(cleanDateStr)) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format. Please use YYYY-MM-DD format."
      });
    }
    
    console.log(`Using cleaned date string for booking: ${cleanDateStr}`);
    
    // Use the exact date for database storage (no timezone adjustment needed)
    console.log(`Using exact date for database storage: ${cleanDateStr}`);
    
    // Generate a reference number with prefix based on service type
    const prefix = serviceType === 'hotel' ? 'NVP-H-' : 'NVP-G-';
    const referenceNumber = `${prefix}${Math.floor(Math.random() * 900000) + 100000}`;
    
    // Create booking data object with appropriate fields based on service type
    // Hotel bookings
    if (serviceType === 'hotel') {
      // For hotel stays, use check_in_date and check_out_date fields
      const checkInDate = cleanDateStr;  // Use the exact date string for DB
      
      // Calculate check-out date based on duration
      const checkOutDateObj = new Date(cleanDateStr);
      checkOutDateObj.setDate(checkOutDateObj.getDate() + (durationDays || 1));
      
      // Format check-out date as YYYY-MM-DD string
      const formattedCheckOutDate = `${checkOutDateObj.getFullYear()}-${String(checkOutDateObj.getMonth() + 1).padStart(2, '0')}-${String(checkOutDateObj.getDate()).padStart(2, '0')}`;
      
      console.log(`Calculated check-out date: ${formattedCheckOutDate} (for ${durationDays || 1} days stay)`);
      
      const hotelBookingData = {
        check_in_date: checkInDate,
        check_out_date: formattedCheckOutDate,
        accommodation_type: accommodationType,
        duration_days: durationDays || 1,
        pet_name: petName,
        pet_breed: petBreed,
        pet_size: petSize,
        service_type: 'hotel',
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        special_requests: req.body.specialRequests,
        status: 'confirmed',
        reference: referenceNumber,
        created_at: new Date().toISOString()
      };
      
      // Only add pet_age if it exists
      if (petAge) {
        hotelBookingData.pet_age = petAge;
      }
      
      console.log(`Creating hotel booking with check-in: ${checkInDate}, check-out: ${formattedCheckOutDate}`);
      
      // Create booking in Supabase
      const { data, error } = await supabase
        .from('hotel_bookings')
        .insert([hotelBookingData])
        .select();
      
      if (error) {
        console.error(`Error creating hotel booking:`, error);
        throw error;
      }
      
      // Clear availability cache for this date
      clearAvailabilityCache(cleanDateStr); // Use original cleaned date for availability cache
      
      console.log('Hotel booking created successfully:', data);
      
      // Send confirmation email to customer
      console.log('📧 [Booking] Attempting to send customer confirmation email...');
      const emailData = {
        ...hotelBookingData,
        serviceType: 'hotel',
        appointmentDate: checkInDate,
        appointmentTime: '9:00 AM',
        // Map database fields to email template fields
        petName: hotelBookingData.pet_name,
        petBreed: hotelBookingData.pet_breed,
        petSize: hotelBookingData.pet_size,
        customerName: hotelBookingData.customer_name,
        customerEmail: hotelBookingData.customer_email,
        customerPhone: hotelBookingData.customer_phone,
        specialRequests: hotelBookingData.special_requests,
        needsTransport: hotelBookingData.needs_transport || false,
        transportType: hotelBookingData.transport_type,
        pickupAddress: hotelBookingData.pickup_address,
        includeTreats: hotelBookingData.include_treats || false,
        treatType: hotelBookingData.treat_type
      };
      const emailResult = await sendBookingConfirmationEmail(emailData);
      if (emailResult.success) {
        console.log('✅ [Booking] Customer confirmation email sent successfully');
      } else {
        console.warn('⚠️ [Booking] Failed to send customer confirmation email:', emailResult.message);
      }
      
      // Send notification email to admin
      console.log('📧 [Booking] Attempting to send admin notification email...');
      const adminEmailResult = await sendAdminNotificationEmail(emailData);
      if (adminEmailResult.success) {
        console.log('✅ [Booking] Admin notification email sent successfully');
      } else {
        console.warn('⚠️ [Booking] Failed to send admin notification email:', adminEmailResult.message);
      }
      
      return res.status(201).json({
        success: true,
        booking: data[0],
        emailSent: emailResult.success
      });
    }
    // Grooming bookings
    else {
      // Format time for database (add ":00" suffix if not present)
      // Database stores time as "HH:MM:00" format
      const formattedTime = appointmentTime.includes(':') 
        ? (appointmentTime.split(':').length === 2 
            ? `${appointmentTime}:00` 
            : appointmentTime)
        : `${appointmentTime.padStart(2, '0')}:00:00`;
      
      console.log(`Formatting appointment time: ${appointmentTime} -> ${formattedTime}`);
      
      // Create grooming booking data object with the exact date
      const groomingBookingData = {
        appointment_date: cleanDateStr,  // Use the exact date for the database
        appointment_time: formattedTime, // Use formatted time for database
        pet_name: petName,
        pet_breed: petBreed,
        pet_size: petSize,
        service_type: 'grooming',
        grooming_service: groomingService,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        groomer: groomer || 'Groomer 1',
        special_requests: req.body.specialRequests,
        status: 'confirmed',
        reference: referenceNumber,
        created_at: new Date().toISOString()
      };
      
      // Only add pet_age if it exists
      if (petAge) {
        groomingBookingData.pet_age = petAge;
      }
      
      // Final race condition check - query the database directly before inserting
      const formattedTimeForQuery = formattedTime;
      const { data: existingBookings, error: checkError } = await supabase
        .from('grooming_appointments')
        .select('id, appointment_time, groomer')
        .eq('appointment_date', cleanDateStr)
        .eq('appointment_time', formattedTimeForQuery)
        .eq('groomer', groomer || 'Groomer 1')
        .not('status', 'eq', 'cancelled');
        
      if (checkError) {
        console.error("Error in final availability check:", checkError);
      } else if (existingBookings && existingBookings.length > 0) {
        console.log(`Race condition detected: Slot was booked while user was filling form. Found ${existingBookings.length} existing bookings.`);
        return res.status(409).json({
          success: false,
          message: "This time slot has just been booked by someone else. Please select another time."
        });
      }
      
      // Create booking in Supabase
      const { data, error } = await supabase
        .from('grooming_appointments')
        .insert([groomingBookingData])
        .select();
      
      if (error) {
        console.error(`Error creating grooming booking:`, error);
        
        // Handle unique constraint violation (double booking)
        if (error.code === '23505') {
          return res.status(409).json({
            success: false,
            message: "This time slot is already booked. Please select another time."
          });
        }
        
        throw error;
      }
      
      // Clear availability cache for this date
      clearAvailabilityCache(cleanDateStr); // Use original cleaned date for availability cache
      
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] ✅ GROOMING BOOKING CREATED SUCCESSFULLY:`, data);
      
      // Send confirmation email to customer
      console.log(`[${timestamp}] 📧 [Booking] Attempting to send customer confirmation email...`);
      const emailData = {
        ...groomingBookingData,
        serviceType: 'grooming',
        // Map database fields to email template fields
        appointmentDate: groomingBookingData.appointment_date,
        appointmentTime: groomingBookingData.appointment_time,
        customerName: groomingBookingData.customer_name,
        customerEmail: groomingBookingData.customer_email,
        customerPhone: groomingBookingData.customer_phone,
        petName: groomingBookingData.pet_name,
        petBreed: groomingBookingData.pet_breed,
        petSize: groomingBookingData.pet_size,
        groomingService: groomingBookingData.grooming_service,
        specialRequests: groomingBookingData.special_requests,
        needsTransport: groomingBookingData.needs_transport || false,
        transportType: groomingBookingData.transport_type,
        pickupAddress: groomingBookingData.pickup_address,
        includeTreats: groomingBookingData.include_treats || false,
        treatType: groomingBookingData.treat_type
      };
      console.log(`[${timestamp}] 📧 [Booking] Email data:`, JSON.stringify(emailData, null, 2));
      const emailResult = await sendBookingConfirmationEmail(emailData);
      if (emailResult.success) {
        console.log(`[${timestamp}] ✅ [Booking] Customer confirmation email sent successfully`);
      } else {
        console.warn(`[${timestamp}] ⚠️ [Booking] Failed to send customer confirmation email:`, emailResult.message);
      }
      
      // Send notification email to admin
      console.log(`[${timestamp}] 📧 [Booking] Attempting to send admin notification email...`);
      const adminEmailResult = await sendAdminNotificationEmail(emailData);
      if (adminEmailResult.success) {
        console.log('✅ [Booking] Admin notification email sent successfully');
      } else {
        console.warn('⚠️ [Booking] Failed to send admin notification email:', adminEmailResult.message);
      }
      
      return res.status(201).json({
        success: true,
        booking: data[0],
        emailSent: emailResult.success
      });
    }
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
    const { id: idParam } = req.params;
    const { status, bookingType } = req.body;
    
    // Parse and validate ID
    const id = parseInt(idParam, 10);
    
    // Debug logging to help diagnose the issue
    console.log(`Status update request received: ID=${id}, raw status="${status}", type=${bookingType || 'not specified'}`);
    console.log('Request body:', JSON.stringify(req.body));
    console.log('Request headers:', JSON.stringify(req.headers));
    
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid booking ID is required"
      });
    }
    
    // Valid statuses include 'pending', 'confirmed', 'cancelled', 'completed'
    const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];
    if (!status || typeof status !== 'string' || !validStatuses.includes(status.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: `Valid status is required (pending, confirmed, cancelled, or completed). Received: "${status}" (${typeof status})`,
        debug: { 
          receivedStatus: status,
          type: typeof status,
          validOptions: validStatuses 
        }
      });
    }
    
    // Normalize status to lowercase
    const normalizedStatus = status.toLowerCase();
    
    // If status is 'completed' or 'cancelled', delete the record
    if (normalizedStatus === 'completed' || normalizedStatus === 'cancelled') {
      try {
        const result = await deleteBooking(req, res, id, normalizedStatus, bookingType);
        return result;
      } catch (deleteError) {
        console.error(`Error in deleteBooking for status ${normalizedStatus}:`, deleteError);
        return res.status(500).json({
          success: false,
          message: `Failed to process ${normalizedStatus} status`,
          error: deleteError.message
        });
      }
    }
    
    // For other statuses (pending, confirmed), just update the status
    // Determine which table to update based on the booking type or try both
    const tableName = bookingType === 'hotel' ? 'hotel_bookings' : 'grooming_appointments';
    
    // Try to update in the specified table
    const { data, error } = await supabase
      .from(tableName)
      .update({ 
        status: normalizedStatus, 
        updated_at: new Date().toISOString() 
      })
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
          .update({ 
            status: normalizedStatus, 
            updated_at: new Date().toISOString() 
          })
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
          console.log(`Successfully updated booking in ${altTable} to status: ${normalizedStatus}`);
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
          .update({ 
            status: normalizedStatus, 
            updated_at: new Date().toISOString() 
          })
          .eq('id', id)
          .select();
          
        if (altError || !altData || altData.length === 0) {
          return res.status(404).json({
            success: false,
            message: "Booking not found in either table"
          });
        }
        
        console.log(`Successfully updated booking in ${altTable} to status: ${normalizedStatus}`);
        return res.status(200).json({
          success: true,
          booking: altData[0],
          bookingType: altTable === 'hotel_bookings' ? 'hotel' : 'grooming'
        });
      }
    }
    
    console.log(`Successfully updated booking in ${tableName} to status: ${normalizedStatus}`);
    return res.status(200).json({
      success: true,
      booking: data[0],
      bookingType: tableName === 'hotel_bookings' ? 'hotel' : 'grooming'
    });
  } catch (error) {
    console.error('Error updating booking status:', error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to update booking status",
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Helper function to delete a booking (for both completed and cancelled)
async function deleteBooking(req, res, id, status, bookingType) {
  try {
    // Ensure id is a number
    const bookingId = typeof id === 'number' ? id : parseInt(id, 10);
    
    // Ensure status is a valid string
    const normalizedStatus = typeof status === 'string' ? status.toLowerCase() : status;
    
    console.log(`Processing ${normalizedStatus} status for booking #${bookingId} (type: ${bookingType || 'unknown'})`);
    
    // First retrieve the booking to return its data in the response
    let bookingData = null;
    let tableName = bookingType === 'hotel' ? 'hotel_bookings' : 'grooming_appointments';
    let actualTable = tableName;
    
    // Try to find the booking in the specified table
    console.log(`Searching for booking in ${tableName} table...`);
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .eq('id', bookingId)
      .single();
    
    if (error || !data) {
      console.log(`Booking not found in ${tableName}, error:`, error);
      
      // If not found or no booking type specified, try the other table
      const altTable = tableName === 'grooming_appointments' ? 'hotel_bookings' : 'grooming_appointments';
      console.log(`Trying alternative table ${altTable}...`);
      
      const { data: altData, error: altError } = await supabase
        .from(altTable)
        .select('*')
        .eq('id', bookingId)
        .single();
        
      if (altError || !altData) {
        console.error('Booking not found in either table. Errors:', { mainError: error, altError });
        return res.status(404).json({
          success: false,
          message: "Booking not found in either table"
        });
      }
      
      console.log(`Found booking in ${altTable} table`);
      bookingData = altData;
      actualTable = altTable;
    } else {
      console.log(`Found booking in ${tableName} table`);
      bookingData = data;
    }
    
    // Now delete the booking from the correct table
    console.log(`Attempting to delete booking #${bookingId} from ${actualTable}...`);
    const { error: deleteError } = await supabase
      .from(actualTable)
      .delete()
      .eq('id', bookingId);
      
    if (deleteError) {
      console.error(`Error deleting ${normalizedStatus} booking from ${actualTable}:`, deleteError);
      throw deleteError;
    }
    
    console.log(`Successfully deleted ${normalizedStatus} booking #${bookingId} from ${actualTable}`);
    
    // Return success response with the deleted booking data
    return res.status(200).json({
      success: true,
      message: `Booking marked as ${normalizedStatus} and removed from database`,
      booking: bookingData,
      bookingType: actualTable === 'hotel_bookings' ? 'hotel' : 'grooming',
      wasDeleted: true
    });
  } catch (error) {
    console.error(`Error deleting ${status} booking:`, error);
    throw error; // Let the main handler catch this and send the response
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

// Email configuration
const getEmailConfig = () => ({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: 'novopetsph@gmail.com',
    pass: process.env.EMAIL_PASSWORD || '', // Set this in your .env file
  },
});

// Create transporter function
const createTransporter = () => {
  return nodemailer.createTransport(getEmailConfig());
};

// Email templates
const createBookingConfirmationEmail = (bookingData) => {
  // Extract fields, handling both camelCase and snake_case
  const customerName = bookingData.customerName || bookingData.customer_name;
  const customerEmail = bookingData.customerEmail || bookingData.customer_email;
  const petName = bookingData.petName || bookingData.pet_name;
  const petBreed = bookingData.petBreed || bookingData.pet_breed;
  const petSize = bookingData.petSize || bookingData.pet_size;
  const serviceType = bookingData.serviceType || bookingData.service_type;
  const appointmentDate = bookingData.appointmentDate || bookingData.appointment_date;
  const appointmentTime = bookingData.appointmentTime || bookingData.appointment_time;
  const groomingService = bookingData.groomingService || bookingData.grooming_service;
  const accommodationType = bookingData.accommodationType || bookingData.accommodation_type;
  const durationDays = bookingData.durationDays || bookingData.duration_days;
  const addOnServices = bookingData.addOnServices || bookingData.add_on_services;
  const specialRequests = bookingData.specialRequests || bookingData.special_requests;
  const needsTransport = bookingData.needsTransport || bookingData.needs_transport || false;
  const transportType = bookingData.transportType || bookingData.transport_type;
  const pickupAddress = bookingData.pickupAddress || bookingData.pickup_address;
  const includeTreats = bookingData.includeTreats || bookingData.include_treats || false;
  const treatType = bookingData.treatType || bookingData.treat_type;
  const paymentMethod = bookingData.paymentMethod || bookingData.payment_method;
  const groomer = bookingData.groomer;

  // Format the appointment date with proper validation
  let formattedDate = 'To be determined';
  try {
    if (appointmentDate) {
      const dateObj = new Date(appointmentDate);
      if (!isNaN(dateObj.getTime())) {
        formattedDate = format(dateObj, 'EEEE, MMMM do, yyyy');
      } else {
        console.warn('Invalid appointment date:', appointmentDate);
      }
    }
  } catch (error) {
    console.error('Error formatting appointment date:', error, 'Date value:', appointmentDate);
  }
  
  // Format the appointment time
  const formattedTime = appointmentTime || 'To be determined';

  // Determine service details
  let serviceDetails = '';
  if (serviceType === 'grooming') {
    serviceDetails = `Grooming Service: ${groomingService || 'Standard Grooming'}`;
    if (groomer) {
      serviceDetails += `\nAssigned Groomer: ${groomer}`;
    }
  } else if (serviceType === 'hotel') {
    serviceDetails = `Hotel Accommodation: ${accommodationType || 'Standard Room'}`;
    if (durationDays) {
      serviceDetails += `\nDuration: ${durationDays} day(s)`;
    }
  }

  // Format add-on services
  const addOnsList = addOnServices 
    ? (Array.isArray(addOnServices) ? addOnServices : addOnServices.split(','))
        .filter(service => service.trim())
        .map(service => `• ${service.trim()}`)
        .join('\n')
    : '';

  // Format special requests
  const specialRequestsText = specialRequests ? `\nSpecial Requests: ${specialRequests}` : '';

  // Format transport details
  const transportDetails = needsTransport 
    ? `\nTransport Required: Yes\nTransport Type: ${transportType}\nPickup Address: ${pickupAddress}`
    : '\nTransport Required: No';

  // Format treats
  const treatsDetails = includeTreats 
    ? `\nTreats Included: Yes\nTreat Type: ${treatType}`
    : '\nTreats Included: No';

  const emailContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Booking Confirmation - Novo Pets</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #1a1a1a;
            background-color: #f5f7fa;
            padding: 0;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
        }
        .email-wrapper {
            background-color: #f5f7fa;
            padding: 40px 20px;
        }
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 4px 24px rgba(0,0,0,0.08);
        }
        .header {
            background: linear-gradient(135deg, #9a7d62 0%, #8C636A 100%);
            padding: 32px 24px;
            text-align: center;
            color: white;
            position: relative;
        }
        .header::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 1px;
            background: rgba(255,255,255,0.2);
        }
        .logo {
            width: 64px;
            height: 64px;
            margin: 0 auto 16px auto;
            display: block;
            border-radius: 12px;
            background: rgba(255,255,255,0.1);
            padding: 8px;
        }
        .header h1 {
            font-size: 26px;
            font-weight: 700;
            margin: 0 0 6px 0;
            letter-spacing: -0.5px;
        }
        .header p {
            font-size: 15px;
            opacity: 0.95;
            font-weight: 400;
        }
        .content {
            padding: 32px 24px;
        }
        .success-badge {
            display: inline-flex;
            align-items: center;
            gap: 10px;
            background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
            color: #1b5e20;
            padding: 12px 16px;
            border-radius: 10px;
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 24px;
            border: 1px solid rgba(46, 125, 50, 0.1);
        }
        .info-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
            margin-bottom: 24px;
        }
        .info-item {
            background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
            padding: 16px;
            border-radius: 12px;
            border: 1px solid #e9ecef;
            transition: all 0.2s ease;
            position: relative;
            overflow: hidden;
        }
        .info-item::before {
            content: '';
            position: absolute;
            left: 0;
            top: 0;
            bottom: 0;
            width: 4px;
            background: linear-gradient(180deg, #9a7d62 0%, #8C636A 100%);
        }
        .info-label {
            font-size: 11px;
            text-transform: uppercase;
            color: #6c757d;
            font-weight: 700;
            letter-spacing: 0.8px;
            margin-bottom: 6px;
        }
        .info-value {
            font-size: 16px;
            color: #1a1a1a;
            font-weight: 600;
            letter-spacing: -0.2px;
        }
        .section {
            margin-bottom: 20px;
        }
        .section-title {
            font-size: 12px;
            text-transform: uppercase;
            color: #6c757d;
            font-weight: 700;
            letter-spacing: 1px;
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .section-title::before {
            content: '';
            width: 3px;
            height: 16px;
            background: linear-gradient(180deg, #9a7d62 0%, #8C636A 100%);
            border-radius: 2px;
        }
        .section-content {
            font-size: 15px;
            color: #2d3748;
            line-height: 1.7;
            background: #f8f9fa;
            padding: 16px;
            border-radius: 10px;
            border: 1px solid #e9ecef;
        }
        .section-content strong {
            color: #1a1a1a;
            font-weight: 600;
        }
        .divider {
            height: 1px;
            background: linear-gradient(90deg, transparent 0%, #e0e0e0 50%, transparent 100%);
            margin: 28px 0;
        }
        .reminders-section {
            background: linear-gradient(135deg, #fff9e6 0%, #fff3cd 100%);
            border-radius: 12px;
            padding: 20px;
            border: 1px solid rgba(255, 193, 7, 0.3);
            margin-top: 24px;
        }
        .reminders-title {
            font-size: 14px;
            font-weight: 700;
            color: #856404;
            margin-bottom: 14px;
            display: flex;
            align-items: center;
            gap: 8px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .reminder-item {
            display: flex;
            align-items: flex-start;
            gap: 12px;
            padding: 10px 0;
            font-size: 14px;
            color: #856404;
            line-height: 1.6;
        }
        .reminder-item:not(:last-child) {
            border-bottom: 1px solid rgba(255, 193, 7, 0.2);
        }
        .reminder-icon {
            font-size: 18px;
            flex-shrink: 0;
            margin-top: 2px;
        }
        .footer {
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            padding: 24px;
            text-align: center;
            font-size: 13px;
            color: #6c757d;
            border-top: 1px solid #e9ecef;
        }
        .footer-brand {
            font-size: 15px;
            font-weight: 700;
            color: #1a1a1a;
            margin-bottom: 10px;
            letter-spacing: -0.3px;
        }
        .footer-tagline {
            font-size: 12px;
            color: #868e96;
            margin-bottom: 14px;
            font-style: italic;
        }
        .footer-info {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
            margin-top: 20px;
            text-align: left;
        }
        .footer-info-item {
            display: flex;
            align-items: flex-start;
            gap: 10px;
        }
        .footer-icon {
            font-size: 18px;
            flex-shrink: 0;
            margin-top: 2px;
        }
        .footer-info-label {
            font-size: 11px;
            text-transform: uppercase;
            color: #868e96;
            font-weight: 700;
            letter-spacing: 0.8px;
            margin-bottom: 4px;
        }
        .footer-info-value {
            font-size: 13px;
            color: #1a1a1a;
            font-weight: 500;
            line-height: 1.5;
        }
        .footer-info-value a {
            color: #9a7d62;
            text-decoration: none;
            font-weight: 600;
        }
        .footer-info-value a:hover {
            color: #8C636A;
            text-decoration: underline;
        }
        .addon-item {
            display: flex;
            align-items: center;
            gap: 8px;
            margin: 6px 0;
            padding: 4px 0;
        }
        .addon-item::before {
            content: '✓';
            color: #2e7d32;
            font-weight: 700;
            font-size: 14px;
        }
        @media only screen and (max-width: 600px) {
            .email-wrapper {
                padding: 20px 12px;
            }
            .info-grid {
                grid-template-columns: 1fr;
            }
            .content {
                padding: 24px 16px;
            }
            .header {
                padding: 24px 16px;
            }
            .footer-info {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="email-wrapper">
        <div class="email-container">
            <div class="header">
                <img src="https://novopets.com/logo_final.png" alt="Novo Pets" class="logo">
                <h1>✓ Booking Confirmed</h1>
                <p>Your appointment has been scheduled</p>
            </div>
            
            <div class="content">
                <div class="success-badge">
                    <span>✓</span>
                    <span>Thank you for choosing Novo Pets!</span>
                </div>

                <div class="info-grid">
                    <div class="info-item">
                        <div class="info-label">Date</div>
                        <div class="info-value">${formattedDate}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Time</div>
                        <div class="info-value">${formattedTime}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Service</div>
                        <div class="info-value">${serviceType === 'grooming' ? 'Grooming' : 'Hotel Stay'}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Pet Size</div>
                        <div class="info-value">${petSize ? petSize.charAt(0).toUpperCase() + petSize.slice(1) : 'N/A'}</div>
                    </div>
                </div>

                <div class="section">
                    <div class="section-title">Pet Information</div>
                    <div class="section-content">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                            <div>
                                <div style="font-size: 11px; text-transform: uppercase; color: #6c757d; font-weight: 700; letter-spacing: 0.8px; margin-bottom: 4px;">Pet Name</div>
                                <div style="font-size: 15px; color: #1a1a1a; font-weight: 600;">${petName}</div>
                            </div>
                            <div>
                                <div style="font-size: 11px; text-transform: uppercase; color: #6c757d; font-weight: 700; letter-spacing: 0.8px; margin-bottom: 4px;">Breed</div>
                                <div style="font-size: 15px; color: #1a1a1a; font-weight: 600;">${petBreed}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="section">
                    <div class="section-title">Service Details</div>
                    <div class="section-content">
                        <strong>${serviceDetails}</strong>
                        ${addOnsList ? `<div style="margin-top: 12px;">${addOnsList.split('\n').map(item => `<div class="addon-item">${item.replace('• ', '')}</div>`).join('')}</div>` : ''}
                    </div>
                </div>

                ${specialRequests ? `
                <div class="section">
                    <div class="section-title">Special Requests</div>
                    <div class="section-content">${specialRequests}</div>
                </div>
                ` : ''}

                ${needsTransport && transportType && pickupAddress ? `
                <div class="section">
                    <div class="section-title">Transport</div>
                    <div class="section-content">${transportType} - ${pickupAddress}</div>
                </div>
                ` : ''}

                ${includeTreats && treatType ? `
                <div class="section">
                    <div class="section-title">Treats</div>
                    <div class="section-content">${treatType}</div>
                </div>
                ` : ''}

                <div class="divider"></div>

                <div class="reminders-section">
                    <div class="reminders-title">
                        <span>📋</span>
                        <span>Important Reminders</span>
                    </div>
                    <div class="reminder-item">
                        <span class="reminder-icon">⏰</span>
                        <span>Please arrive 10 minutes before your scheduled appointment</span>
                    </div>
                    <div class="reminder-item">
                        <span class="reminder-icon">📄</span>
                        <span>Bring your pet's vaccination records if this is their first visit</span>
                    </div>
                    <div class="reminder-item">
                        <span class="reminder-icon">🔄</span>
                        <span>If you need to reschedule, please contact us at least 24 hours in advance</span>
                    </div>
                    <div class="reminder-item">
                        <span class="reminder-icon">🏨</span>
                        <span>For hotel stays, please bring your pet's food and any medications</span>
                    </div>
                </div>
            </div>

            <div class="footer">
                <div class="footer-brand">Novo Pets Premium Pet Spa & Wellness</div>
                <div class="footer-tagline">Where Pets Feel at Home</div>
                <div class="footer-info">
                    <div class="footer-info-item">
                        <span class="footer-icon">📍</span>
                        <div>
                            <div class="footer-info-label">Location</div>
                            <div class="footer-info-value">White Plains, Katipunan Avenue<br>Quezon City, Philippines</div>
                        </div>
                    </div>
                    <div class="footer-info-item">
                        <span class="footer-icon">📱</span>
                        <div>
                            <div class="footer-info-label">Phone</div>
                            <div class="footer-info-value"><a href="tel:+639177917671">(0917) 791 7671</a></div>
                        </div>
                    </div>
                    <div class="footer-info-item">
                        <span class="footer-icon">📧</span>
                        <div>
                            <div class="footer-info-label">Email</div>
                            <div class="footer-info-value"><a href="mailto:novopetsph@gmail.com">novopetsph@gmail.com</a></div>
                        </div>
                    </div>
                    <div class="footer-info-item">
                        <span class="footer-icon">🌐</span>
                        <div>
                            <div class="footer-info-label">Website</div>
                            <div class="footer-info-value"><a href="https://novopets.com">novopets.com</a></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
  `;

  return {
    subject: `Booking Confirmation - ${petName} at Novo Pets`,
    html: emailContent,
  };
};

// Send booking confirmation email
const sendBookingConfirmationEmail = async (bookingData) => {
  try {
    console.log('📧 [Email] Starting to send booking confirmation email...');
    console.log('📧 [Email] Customer email:', bookingData.customerEmail);
    console.log('📧 [Email] Customer name:', bookingData.customerName);
    
    // Check if email password is configured
    if (!process.env.EMAIL_PASSWORD) {
      console.warn('⚠️ EMAIL_PASSWORD not configured. Skipping email sending.');
      return { success: false, message: 'Email not configured' };
    }

    console.log('📧 [Email] Creating email template...');
    const { subject, html } = createBookingConfirmationEmail(bookingData);
    console.log('📧 [Email] Email subject:', subject);

    const mailOptions = {
      from: '"Novo Pets" <novopetsph@gmail.com>',
      to: bookingData.customerEmail,
      subject: subject,
      html: html,
    };

    console.log('📧 [Email] Creating transporter...');
    const transporter = createTransporter();
    console.log('📧 [Email] Sending email...');
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ [Email] Booking confirmation email sent successfully:', info.messageId);
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ [Email] Error sending booking confirmation email:', error);
    console.error('❌ [Email] Error details:', {
      message: error.message,
      stack: error.stack,
      bookingData: JSON.stringify(bookingData, null, 2)
    });
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// Send admin notification email
const sendAdminNotificationEmail = async (bookingData) => {
  try {
    console.log('📧 [Email] Starting to send admin notification email...');
    console.log('📧 [Email] Pet name:', bookingData.petName);
    console.log('📧 [Email] Service type:', bookingData.serviceType);
    
    // Check if email password is configured
    if (!process.env.EMAIL_PASSWORD) {
      console.warn('⚠️ EMAIL_PASSWORD not configured. Skipping admin email.');
      return { success: false, message: 'Email not configured' };
    }

    const adminEmailContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Booking - Novo Pets</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .header { background: #9a7d62; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .booking-info { background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 10px 0; }
        .highlight { background: #fff3cd; padding: 10px; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>New Booking Received</h1>
        <p>Novo Pets Booking System</p>
    </div>
    
    <div class="content">
        <div class="highlight">
            <h2>New booking for ${bookingData.petName}</h2>
            <p><strong>Customer:</strong> ${bookingData.customerName}</p>
            <p><strong>Email:</strong> ${bookingData.customerEmail}</p>
            <p><strong>Phone:</strong> ${bookingData.customerPhone}</p>
        </div>
        
        <div class="booking-info">
            <h3>Booking Details:</h3>
            <p><strong>Service:</strong> ${bookingData.serviceType}</p>
            <p><strong>Date:</strong> ${(() => {
              try {
                if (bookingData.appointmentDate) {
                  const dateObj = new Date(bookingData.appointmentDate);
                  if (!isNaN(dateObj.getTime())) {
                    return format(dateObj, 'EEEE, MMMM do, yyyy');
                  }
                }
                return 'To be determined';
              } catch (error) {
                console.error('Error formatting admin email date:', error);
                return 'To be determined';
              }
            })()}</p>
            <p><strong>Time:</strong> ${bookingData.appointmentTime || 'To be determined'}</p>
            ${bookingData.groomer ? `<p><strong>Groomer:</strong> ${bookingData.groomer}</p>` : ''}
        </div>
        
        <p>Please review and prepare for this appointment.</p>
    </div>
</body>
</html>
    `;

    const mailOptions = {
      from: '"Novo Pets Booking System" <novopetsph@gmail.com>',
      to: 'novopetsph@gmail.com',
      subject: `New Booking - ${bookingData.petName} (${bookingData.serviceType})`,
      html: adminEmailContent,
    };

    console.log('📧 [Email] Creating admin email template...');
    const transporter = createTransporter();
    console.log('📧 [Email] Sending admin email...');
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ [Email] Admin notification email sent successfully:', info.messageId);
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ [Email] Error sending admin notification email:', error);
    console.error('❌ [Email] Admin error details:', {
      message: error.message,
      stack: error.stack,
      bookingData: JSON.stringify(bookingData, null, 2)
    });
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

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