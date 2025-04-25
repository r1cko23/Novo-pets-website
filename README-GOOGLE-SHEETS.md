# Novo Pets - Google Sheets Database Integration

This project has been updated to use Google Sheets as a database instead of a traditional database. This README explains how to use this integration.

## What Was Implemented

1. **Google Sheets Service**: A service that handles all interactions with Google Sheets API.
2. **Storage Adapter**: Modified the existing storage layer to use Google Sheets instead of a database.
3. **Configuration**: Added configuration for Google Sheets credentials and sheet names.
4. **Refresh Script**: Added a script to manually refresh and verify Google Sheets data.

> **Note**: User functionality has been removed from this implementation. The application only stores booking and contact form data in Google Sheets.

## How to Set Up

1. Follow the detailed setup instructions in `GOOGLE_SHEETS_SETUP.md`
2. Create the required Google Sheets with the correct headers
3. Create a `.env` file in the project root based on the `env.example` template
4. Set up your Google service account credentials in the `.env` file

## Running the Application

After setting up everything:

1. Start the application:
   ```
   npm run dev
   ```

2. To verify your Google Sheets connection and view data:
   ```
   npm run sheets:refresh
   ```

> **Note for Windows Users**: The scripts have been updated to be compatible with Windows. If you encounter any issues, please check that your environment variables are correctly set in the `.env` file.

## How It Works

### Data Flow

1. When the application starts, it connects to Google Sheets using your service account credentials
2. When data is requested (e.g., when loading bookings):
   - The application fetches the data from the corresponding sheet
   - The data is transformed to match the application's data models
   - The data is returned to the client

3. When data is created (e.g., when creating a booking):
   - The application validates the data
   - The data is transformed for Google Sheets
   - A new row is added to the corresponding sheet

### Manual Data Updates

If you manually update the Google Sheets:
1. The changes will be reflected the next time the application reads from the sheet
2. Make sure to maintain the proper data structure (don't change headers)
3. Keep the ID column values unique
4. Boolean fields should use the string values 'true' or 'false'

## Troubleshooting

If you encounter issues:

1. Check that your environment variables are correctly set in the `.env` file
2. Verify that your service account has permission to access the spreadsheet
3. Run `npm run sheets:refresh` to check if the Google Sheets connection is working
4. Check the application logs for any error messages

## Need Help?

If you need additional help, check the following resources:
- Google Sheets API documentation: https://developers.google.com/sheets/api
- Google Cloud Console: https://console.cloud.google.com/ 