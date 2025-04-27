// api/storage.js
// Implementation that connects to Google Sheets to check actual bookings
import { google } from 'googleapis';
import { GoogleAuth } from 'google-auth-library';

// Define array of time slots (from 9 AM to 6 PM)
const TIME_SLOTS = [
  "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"
];

// Define groomers
const GROOMERS = ["Groomer 1", "Groomer 2"];

// Google Sheets configuration
const googleSheetsConfig = {
  sheets: {
    bookings: 'Bookings',
    contacts: 'Contacts'
  }
};

/**
 * Utility function to normalize date strings to YYYY-MM-DD format
 */
function normalizeDate(dateStr) {
  try {
    // Create a Date object
    const date = new Date(dateStr);
    
    // Format in local timezone as YYYY-MM-DD
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    const normalizedDate = `${year}-${month}-${day}`;
    console.log(`Normalized date "${dateStr}" to "${normalizedDate}" in local timezone`);
    
    return normalizedDate;
  } catch (error) {
    console.error(`Error normalizing date ${dateStr}:`, error);
    // Fallback to simple string manipulation if Date parsing fails
    if (dateStr.includes('T')) {
      return dateStr.split('T')[0];
    }
    if (dateStr.includes(' ')) {
      return dateStr.split(' ')[0]; 
    }
    return dateStr;
  }
}

// Initialize Google Sheets service
const initGoogleSheetsClient = async () => {
  try {
    // Check if the required environment variables are set
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || 
        !process.env.GOOGLE_PRIVATE_KEY || 
        !process.env.GOOGLE_SPREADSHEET_ID) {
      console.error('Missing required Google Sheets environment variables');
      return null;
    }
    
    const auth = new GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    return { sheets, spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID };
  } catch (error) {
    console.error('Error initializing Google Sheets client:', error);
    return null;
  }
};

// Get rows from a specific sheet
const getRows = async (sheetName) => {
  try {
    const client = await initGoogleSheetsClient();
    if (!client) {
      return [];
    }

    const response = await client.sheets.spreadsheets.values.get({
      spreadsheetId: client.spreadsheetId,
      range: `${sheetName}!A:Z`,
    });

    const rows = response.data.values || [];
    
    // If there are no rows or only header row, return empty array
    if (rows.length <= 1) {
      return [];
    }

    // Get headers from the first row
    const headers = rows[0].map(header => 
      header.toLowerCase().replace(/\s+/g, '_')
    );

    // Convert rows to objects using headers as keys
    return rows.slice(1).map(row => {
      const rowObj = {};
      headers.forEach((header, index) => {
        rowObj[header] = index < row.length ? row[index] : '';
      });
      return rowObj;
    });
  } catch (error) {
    console.error(`Error getting rows from ${sheetName}:`, error);
    return [];
  }
};

// Get all bookings
const getBookings = async () => {
  try {
    const rows = await getRows(googleSheetsConfig.sheets.bookings);
    
    return rows.map(row => ({
      id: parseInt(row.id || '0'),
      serviceType: row.service_type || '',
      appointmentDate: row.appointment_date || '',
      appointmentTime: row.appointment_time || '',
      petName: row.pet_name || '',
      petBreed: row.pet_breed || '',
      petSize: row.pet_size || '',
      customerName: row.customer_name || '',
      customerPhone: row.customer_phone || '',
      customerEmail: row.customer_email || '',
      groomer: row.groomer || null,
      status: row.status || ''
    }));
  } catch (error) {
    console.error("Error getting bookings:", error);
    return [];
  }
};

// Get available time slots for a specific date
export const getAvailableTimeSlots = async (date) => {
  try {
    // Normalize date format
    const normalizedDate = normalizeDate(date);
    console.log(`Getting available time slots for date: ${normalizedDate}`);

    // Get all bookings
    const bookings = await getBookings();
    
    // Filter bookings for the requested date with status confirmed or pending
    const bookingsForDate = bookings.filter(booking => 
      normalizeDate(booking.appointmentDate) === normalizedDate && 
      (booking.status === "confirmed" || booking.status === "pending") &&
      booking.serviceType === "grooming"
    );
    
    console.log(`Found ${bookingsForDate.length} bookings for date ${normalizedDate}`);
    
    // Track booked slots for each groomer
    const bookedSlotsByGroomer = {};
    
    // Initialize empty sets for each groomer
    GROOMERS.forEach(groomer => {
      bookedSlotsByGroomer[groomer] = new Set();
    });
    
    // Populate booked slots for each groomer
    bookingsForDate.forEach(booking => {
      const bookedTime = booking.appointmentTime;
      const assignedGroomer = booking.groomer || "Groomer 1"; // Default to Groomer 1 if not specified
      
      if (bookedSlotsByGroomer[assignedGroomer]) {
        bookedSlotsByGroomer[assignedGroomer].add(bookedTime);
      }
    });
    
    // Create map of available slots for each groomer
    const availableSlotsByGroomer = {};
    
    // For each groomer, determine available slots
    GROOMERS.forEach(groomer => {
      availableSlotsByGroomer[groomer] = TIME_SLOTS.filter(
        timeSlot => !bookedSlotsByGroomer[groomer].has(timeSlot)
      );
    });
    
    // Format the result
    const result = [];
    
    // Add available slots for each groomer to the result
    for (const groomer of GROOMERS) {
      const slots = availableSlotsByGroomer[groomer];
      slots.forEach(slot => {
        result.push({
          time: slot,
          groomer: groomer
        });
      });
    }
    
    return result;
  } catch (error) {
    console.error("Error getting available time slots:", error);
    return [];
  }
};

export const storage = {
  getAvailableTimeSlots
}; 