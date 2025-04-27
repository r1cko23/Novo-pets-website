import { google } from 'googleapis';
import { GoogleAuth } from 'google-auth-library';

// Fallback data when Sheets integration fails
const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID;
const SHEET_NAMES = {
  BOOKINGS: 'Bookings',
  CONTACTS: 'Contacts'
};

// Initialize Google Sheets client with proper error handling
async function getGoogleSheetsClient() {
  try {
    // Check if credentials are available
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || 
        !process.env.GOOGLE_PRIVATE_KEY || 
        !process.env.GOOGLE_SPREADSHEET_ID) {
      console.error('Missing required Google credentials in environment variables');
      return null;
    }

    // Create auth client
    const auth = new GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n')
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });

    // Create sheets client
    const sheets = google.sheets({ version: 'v4', auth });
    return sheets;
  } catch (error) {
    console.error('Error initializing Google Sheets client:', error);
    return null;
  }
}

// Add a row to a sheet
export async function appendRow(sheetName, rowData) {
  try {
    const sheets = await getGoogleSheetsClient();
    if (!sheets) {
      console.error('Failed to initialize Google Sheets client');
      return null;
    }

    // Convert object to array of values
    const headers = await getSheetHeaders(sheetName);
    if (!headers || headers.length === 0) {
      console.error('Failed to get sheet headers');
      return null;
    }

    // Prepare row values based on headers
    const values = headers.map(header => {
      const key = header.toLowerCase().replace(/\s+/g, '_');
      return rowData[key] !== undefined ? rowData[key].toString() : '';
    });

    // Append row to sheet
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A:Z`,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      resource: {
        values: [values]
      }
    });

    console.log(`Appended row to ${sheetName}:`, response.data);
    return { ...rowData, id: Date.now() }; // Return with mock ID
  } catch (error) {
    console.error(`Error appending row to ${sheetName}:`, error);
    
    // Still return something to the client even if sheets fails
    console.log('Returning mock data due to sheets error');
    return { ...rowData, id: Date.now() };
  }
}

// Get column headers for a sheet
async function getSheetHeaders(sheetName) {
  try {
    const sheets = await getGoogleSheetsClient();
    if (!sheets) {
      return getDefaultHeaders(sheetName);
    }

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A1:Z1`
    });

    if (!response.data.values || response.data.values.length === 0) {
      return getDefaultHeaders(sheetName);
    }

    return response.data.values[0];
  } catch (error) {
    console.error(`Error getting headers for ${sheetName}:`, error);
    return getDefaultHeaders(sheetName);
  }
}

// Default headers if we can't get them from Google Sheets
function getDefaultHeaders(sheetName) {
  switch (sheetName) {
    case SHEET_NAMES.BOOKINGS:
      return [
        'ID', 'Service Type', 'Appointment Date', 'Appointment Time', 
        'Pet Name', 'Pet Breed', 'Pet Size', 'Customer Name', 
        'Customer Email', 'Customer Phone', 'Groomer', 'Status', 'Created At'
      ];
    case SHEET_NAMES.CONTACTS:
      return ['ID', 'Name', 'Email', 'Subject', 'Message', 'Submitted At'];
    default:
      return [];
  }
}

// Get all rows from a sheet
export async function getRows(sheetName) {
  try {
    const sheets = await getGoogleSheetsClient();
    if (!sheets) {
      console.error('Failed to initialize Google Sheets client');
      return [];
    }

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A:Z`
    });

    if (!response.data.values || response.data.values.length <= 1) {
      console.log(`No data found in sheet: ${sheetName}`);
      return [];
    }

    // Log the raw data for debugging
    console.log(`Raw data from ${sheetName}:`, JSON.stringify(response.data.values.slice(0, 3)));

    const headers = response.data.values[0].map(header => 
      header.toLowerCase().replace(/\s+/g, '_')
    );
    
    console.log(`Headers in ${sheetName}:`, headers.join(', '));

    const rows = response.data.values.slice(1).map(row => {
      const rowObj = {};
      headers.forEach((header, index) => {
        rowObj[header] = index < row.length ? row[index] : '';
      });
      return rowObj;
    });
    
    console.log(`Fetched ${rows.length} rows from ${sheetName}`);
    return rows;
  } catch (error) {
    console.error(`Error getting rows from ${sheetName}:`, error);
    return [];
  }
}

export const sheetsConfig = {
  SHEET_NAMES
}; 