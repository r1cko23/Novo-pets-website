export const googleSheetsConfig = {
  // Your Google credentials will be stored here
  credentials: {
    clientEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    privateKey: formatPrivateKey(process.env.GOOGLE_PRIVATE_KEY),
    spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID
  },
  // Sheets within the spreadsheet
  sheets: {
    bookings: 'Bookings',
    contacts: 'Contacts'
  }
};

/**
 * Properly format the Google private key, handling different formats that might come from environment variables
 */
function formatPrivateKey(key?: string): string | undefined {
  if (!key) return undefined;
  
  // Log key format for debugging (without exposing the actual key)
  console.log(`Private key format check - length: ${key.length}, starts with: ${key.substring(0, 10)}...`);
  
  // If the key already contains actual newlines, return it as is
  if (key.includes('\n') && !key.includes('\\n')) {
    return key;
  }
  
  // If the key has JSON escaped newlines, replace them with actual newlines
  let formattedKey = key.replace(/\\n/g, '\n');
  
  // Sometimes keys from environment variables come with quotes - remove them
  if (formattedKey.startsWith('"') && formattedKey.endsWith('"')) {
    formattedKey = formattedKey.slice(1, -1);
  }
  
  console.log('Private key was reformatted');
  return formattedKey;
} 