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
app.use(cors());

// Init Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Basic health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', env: process.env.NODE_ENV });
});

// API routes
app.get('/api/bookings', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('grooming_appointments')
      .select('*');
    
    if (error) throw error;
    
    res.json(data || []);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// This API handler only handles API routes
// The static files are managed by Vercel's static file handling
// in vercel.json, not here

export default app; 