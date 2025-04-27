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

// Add bookings endpoint to handle booking creation
app.post('/api/bookings', async (req, res) => {
  try {
    console.log('Received booking request:', req.body);
    
    // Basic validation
    const { 
      serviceType, appointmentDate, appointmentTime, 
      petName, petBreed, petSize,
      customerName, customerEmail, customerPhone 
    } = req.body;
    
    if (!serviceType || !appointmentDate || !appointmentTime || 
        !petName || !petBreed || !petSize ||
        !customerName || !customerEmail || !customerPhone) {
      return res.status(400).json({
        success: false,
        message: "Missing required booking information"
      });
    }
    
    // Use the storage implementation to create the booking
    const booking = await storage.createBooking(req.body);
    
    // Return success response
    return res.status(201).json({
      success: true,
      message: "Booking created successfully",
      data: booking
    });
  } catch (error) {
    console.error("Error creating booking:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create booking"
    });
  }
});

// Add contact form submission endpoint
app.post('/api/contact', async (req, res) => {
  try {
    console.log('Received contact form submission:', req.body);
    
    // Basic validation
    const { name, email, subject, message } = req.body;
    
    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: "Missing required contact information"
      });
    }
    
    // Submit the contact form
    const result = await storage.submitContactForm(req.body);
    
    if (result) {
      return res.status(200).json({
        success: true,
        message: "Contact form submitted successfully"
      });
    } else {
      return res.status(500).json({
        success: false,
        message: "Failed to submit contact form"
      });
    }
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

// Export the Express app as Vercel serverless function
export default app; 