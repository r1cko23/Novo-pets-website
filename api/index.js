// api/index.js
import express from 'express';
// Use direct JS imports
import fs from 'fs';
import path from 'path';

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

// Add placeholder for availability endpoint
app.get('/api/availability', (req, res) => {
  const { date } = req.query;
  console.log(`Availability request for date: ${date}`);
  
  // Return mock data for now
  res.json({
    success: true,
    availableTimeSlots: [
      { time: "09:00", groomer: "Groomer 1" },
      { time: "10:00", groomer: "Groomer 1" },
      { time: "11:00", groomer: "Groomer 2" },
      { time: "13:00", groomer: "Groomer 2" },
      { time: "14:00", groomer: "Groomer 1" }
    ]
  });
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