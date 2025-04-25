export const googleSheetsConfig = {
  // Your Google credentials will be stored here
  credentials: {
    clientEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    privateKey: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID
  },
  // Sheets within the spreadsheet
  sheets: {
    bookings: 'Bookings',
    contacts: 'Contacts'
  }
}; 