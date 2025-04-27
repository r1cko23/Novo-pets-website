import { google } from 'googleapis';
import { GoogleAuth } from 'google-auth-library';

// Fallback data when Sheets integration fails
const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID;
const SHEET_NAMES = {
  BOOKINGS: 'Bookings',
  CONTACTS: 'Contacts'
};

// Cache configuration
const CACHE_TTL_MS = 30 * 1000; // 30 seconds cache lifetime
const cache = {
  data: {},
  timestamps: {},
  locks: new Map()
};

// LRU cache helper functions
function getCachedData(key) {
  if (!cache.timestamps[key]) return null;
  
  const now = Date.now();
  const timestamp = cache.timestamps[key];
  
  // Check if the cache entry has expired
  if (now - timestamp > CACHE_TTL_MS) {
    console.log(`Cache entry for ${key} has expired`);
    delete cache.data[key];
    delete cache.timestamps[key];
    return null;
  }
  
  console.log(`Cache hit for ${key}`);
  return cache.data[key];
}

function setCachedData(key, data) {
  console.log(`Caching data for ${key}`);
  cache.data[key] = data;
  cache.timestamps[key] = Date.now();
}

// Function to acquire a lock for a specific operation
// This prevents multiple concurrent requests for the same data
async function acquireLock(key, timeout = 5000) {
  const startTime = Date.now();
  
  while (cache.locks.has(key)) {
    // Wait for the lock to be released
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Check if we've timed out waiting for the lock
    if (Date.now() - startTime > timeout) {
      console.warn(`Lock acquisition timeout for ${key}`);
      return false;
    }
  }
  
  // Acquire the lock
  cache.locks.set(key, Date.now());
  return true;
}

// Function to release a lock
function releaseLock(key) {
  cache.locks.delete(key);
}

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

    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A2:${getColumnLetter(headers.length)}`,
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [values]
      }
    });

    console.log(`Appended row to ${sheetName}:`, response.data);
    
    // Invalidate the cache for this sheet
    const cacheKey = `sheet_${sheetName}`;
    delete cache.data[cacheKey];
    delete cache.timestamps[cacheKey];
    
    return rowData;
  } catch (error) {
    console.error(`Error appending row to ${sheetName}:`, error);
    return null;
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

// Get all rows from a sheet with optional caching
export async function getRows(sheetName, forceRefresh = false) {
  const cacheKey = `sheet_${sheetName}`;
  
  // Check cache first if not forcing a refresh
  if (!forceRefresh) {
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      return cachedData;
    }
  }
  
  // Try to acquire a lock for this sheet
  const lockAcquired = await acquireLock(cacheKey);
  
  try {
    // If we couldn't acquire the lock, someone else is already fetching
    // Check the cache again in case it was just populated
    if (!lockAcquired) {
      const cachedData = getCachedData(cacheKey);
      if (cachedData) {
        return cachedData;
      }
      // If still no cached data, we'll proceed with the fetch anyway
    }
    
    // Even after acquiring the lock, check the cache again
    // in case another process just finished updating it
    if (!forceRefresh) {
      const cachedData = getCachedData(cacheKey);
      if (cachedData) {
        return cachedData;
      }
    }
    
    const sheets = await getGoogleSheetsClient();
    if (!sheets) {
      console.error('Failed to initialize Google Sheets client');
      return [];
    }

    const headers = await getSheetHeaders(sheetName);
    if (!headers || headers.length === 0) {
      console.error('Failed to get sheet headers');
      return [];
    }

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A2:${getColumnLetter(headers.length)}`,
    });

    const rows = response.data.values || [];
    
    // Transform rows into objects with header keys
    const results = rows.map((row, index) => {
      const obj = {};
      headers.forEach((header, i) => {
        const key = header.toLowerCase().replace(/\s+/g, '_');
        obj[key] = i < row.length ? row[i] : '';
      });
      obj._rowIndex = index; // Add the row index for reference
      return obj;
    });
    
    // Cache the results
    setCachedData(cacheKey, results);
    
    return results;
  } catch (error) {
    console.error(`Error fetching rows from ${sheetName}:`, error);
    return [];
  } finally {
    // Always release the lock when done
    if (lockAcquired) {
      releaseLock(cacheKey);
    }
  }
}

// Update a specific row in a sheet with cache invalidation
export async function updateRow(sheetName, rowIndex, rowData) {
  try {
    const sheets = await getGoogleSheetsClient();
    if (!sheets) {
      console.error('Failed to initialize Google Sheets client');
      return null;
    }

    // Get headers to ensure proper order of values
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

    // Row indices in the API are 1-based, and row 1 is typically headers,
    // so the actual data starts at row 2, meaning rowIndex 0 corresponds to row 2 in the sheet
    const actualRowNumber = rowIndex + 2; 

    // Update the specific row
    const response = await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A${actualRowNumber}:${getColumnLetter(values.length)}${actualRowNumber}`,
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [values]
      }
    });

    console.log(`Updated row ${rowIndex} in ${sheetName}:`, response.data);
    
    // Invalidate the cache for this sheet
    const cacheKey = `sheet_${sheetName}`;
    delete cache.data[cacheKey];
    delete cache.timestamps[cacheKey];
    
    return rowData;
  } catch (error) {
    console.error(`Error updating row ${rowIndex} in ${sheetName}:`, error);
    throw error;
  }
}

// Convert column number to letter (e.g., 1 -> A, 26 -> Z, 27 -> AA)
function getColumnLetter(columnNumber) {
  let letter = '';
  
  while (columnNumber > 0) {
    const remainder = (columnNumber - 1) % 26;
    letter = String.fromCharCode(65 + remainder) + letter;
    columnNumber = Math.floor((columnNumber - 1) / 26);
  }
  
  return letter;
}

export const sheetsConfig = {
  SHEET_NAMES
}; 