// api/index.js
import express from 'express';
// Use direct JS imports
import fs from 'fs';
import path from 'path';
import { storage } from './storage.js';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Simple logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// API routes
app.get('/api/healthcheck', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Add the status endpoint to match our server/routes.ts file
app.get('/api/status', (req, res) => {
  console.log("Status API called - API is working");
  return res.status(200).json({ 
    status: "OK", 
    message: "API is working",
    timestamp: new Date().toISOString()
  });
});

// Google Sheets status check
app.get('/api/sheets-status', (req, res) => {
  // This endpoint will help diagnose if Google Sheets is connected
  res.json({ 
    status: 'checking', 
    message: 'Google Sheets connection check - see Vercel logs for details',
    env_vars_present: {
      GOOGLE_SERVICE_ACCOUNT_EMAIL: !!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      GOOGLE_PRIVATE_KEY: !!process.env.GOOGLE_PRIVATE_KEY,
      GOOGLE_SPREADSHEET_ID: !!process.env.GOOGLE_SPREADSHEET_ID
    }
  });
});

// Get available time slots for a specific date
app.get('/api/availability', async (req, res) => {
  try {
    const { date } = req.query;
    
    if (!date) {
      return res.status(400).json({
        success: false,
        message: "Date parameter is required"
      });
    }
    
    // Set strong cache control headers to prevent browser caching
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
    
    const availableTimeSlots = await storage.getAvailableTimeSlots(date);
    
    return res.status(200).json({
      success: true,
      availableTimeSlots
    });
  } catch (error) {
    console.error("Error fetching availability:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch availability"
    });
  }
});

// Create a reservation for a time slot
app.post('/api/reservations', async (req, res) => {
  try {
    const { appointmentDate, appointmentTime, groomer } = req.body;
    
    // Validate required fields
    if (!appointmentDate || !appointmentTime || !groomer) {
      return res.status(400).json({
        success: false,
        message: "Date, time, and groomer are required for reservation"
      });
    }
    
    console.log(`Creating reservation for ${appointmentDate} at ${appointmentTime} with ${groomer}`);
    
    // Check if the slot is actually available before creating the reservation
    const availableSlots = await storage.getAvailableTimeSlots(appointmentDate);
    
    // Find the exact slot for the requested time and groomer
    const requestedSlot = availableSlots.find(
      slot => slot.time === appointmentTime && 
             slot.groomer === groomer &&
             slot.available === true
    );
    
    if (!requestedSlot) {
      return res.status(409).json({
        success: false,
        message: `The requested time slot ${appointmentTime} for ${groomer} is not available.`,
        errorCode: 'SLOT_UNAVAILABLE'
      });
    }
    
    // Create the reservation
    const reservationId = storage.createReservation(appointmentDate, appointmentTime, groomer);
    
    // Set short expiration for this response
    res.setHeader('Cache-Control', 'no-store, private, max-age=0');
    
    return res.status(201).json({
      success: true,
      reservationId,
      expiresIn: 5 * 60, // 5 minutes in seconds
      message: "Reservation created successfully"
    });
  } catch (error) {
    console.error("Error creating reservation:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create reservation"
    });
  }
});

// Book a new appointment
app.post('/api/bookings', async (req, res) => {
  try {
    console.log('Booking request received:', req.body);
    
    // Validate required fields
    const requiredFields = ['appointmentDate', 'appointmentTime', 'petName', 'customerName', 'customerEmail'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }
    
    // Create booking
    const booking = await storage.createBooking(req.body);
    
    return res.status(201).json({
      success: true,
      booking
    });
  } catch (error) {
    console.error("Error creating booking:", error);
    
    // Check for specific error types to provide better responses
    if (error.message) {
      if (error.message.includes('not available') || error.message.includes('already booked') || error.message.includes('reservation')) {
        return res.status(409).json({
          success: false,
          message: error.message,
          errorCode: 'SLOT_UNAVAILABLE'
        });
      }
    }
    
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create booking"
    });
  }
});

// Update booking status
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
    
    if (!status || !['confirmed', 'canceled', 'completed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Valid status is required (confirmed, canceled, or completed)"
      });
    }
    
    // Update the booking status
    const updatedBooking = await storage.updateBookingStatus(id, status);
    
    return res.status(200).json({
      success: true,
      message: `Booking status updated to ${status}`,
      booking: updatedBooking
    });
  } catch (error) {
    console.error("Error updating booking status:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update booking status"
    });
  }
});

// Submit contact form
app.post('/api/contact', async (req, res) => {
  try {
    console.log('Contact form submission received:', req.body);
    
    // Validate required fields
    const requiredFields = ['name', 'email', 'message'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }
    
    // Submit the form
    const result = await storage.submitContactForm(req.body);
    
    return res.status(201).json({
      success: true,
      message: "Contact form submitted successfully"
    });
  } catch (error) {
    console.error("Error submitting contact form:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to submit contact form"
    });
  }
});

// Handle errors
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Serve static files
const __dirname = path.dirname(new URL(import.meta.url).pathname);
const staticDir = path.join(__dirname, '../dist/public');

if (fs.existsSync(staticDir)) {
  app.use(express.static(staticDir));
  
  // SPA fallback
  app.get('*', (req, res) => {
    res.sendFile(path.join(staticDir, 'index.html'));
  });
} else {
  app.get('*', (req, res) => {
    res.send('Application is being built. Please check back in a moment.');
  });
}

// Start the server if running directly
if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`API server listening on port ${PORT}`);
  });
}

// Export for testing and Vercel
export default app; 