// api/index.js
import express from 'express';
// Use direct JS imports
import fs from 'fs';
import path from 'path';
import { registerRoutes } from '../server/routes.js';
import { serveStatic, log } from '../server/vite.js';
import { googleSheetsConfig } from '../server/config.js';

// Create Express app
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

// Serve static files
const __dirname = path.dirname(new URL(import.meta.url).pathname);
const staticDir = path.join(__dirname, '../dist/client');

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

// Initialize server
(async () => {
  // Check if Google Sheets configuration is available
  if (googleSheetsConfig.credentials.spreadsheetId) {
    console.log(`🔄 Using Google Sheets as database (Spreadsheet ID: ${googleSheetsConfig.credentials.spreadsheetId})`);
  } else {
    console.log(`⚠️ Google Sheets configuration is missing. Please set up the required environment variables.`);
  }

  const server = await registerRoutes(app);

  // Error handler
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
  });

  // Use static file serving for production
  serveStatic(app);
})();

// Export the Express app as Vercel serverless function
export default app; 