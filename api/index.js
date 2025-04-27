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

// Use the proper implementation for availability endpoint
app.get('/api/availability', async (req, res) => {
  try {
    const { date } = req.query;
    
    if (!date || typeof date !== 'string') {
      return res.status(400).json({ 
        success: false, 
        message: "Date parameter is required" 
      });
    }
    
    console.log(`Availability request for date: ${date}`);
    const availableTimeSlots = await storage.getAvailableTimeSlots(date);
    
    return res.status(200).json({ 
      success: true, 
      availableTimeSlots 
    });
  } catch (error) {
    console.error("Error fetching availability:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Failed to fetch availability" 
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
      if (error.message.includes('not available') || error.message.includes('already booked')) {
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