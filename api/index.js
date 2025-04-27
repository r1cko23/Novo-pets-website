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

// Add other API routes here
app.get('/api/pets', (req, res) => {
  res.json([
    { id: 1, name: 'Fluffy', type: 'cat', size: 'small' },
    { id: 2, name: 'Buddy', type: 'dog', size: 'medium' },
    { id: 3, name: 'Rex', type: 'dog', size: 'large' }
  ]);
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