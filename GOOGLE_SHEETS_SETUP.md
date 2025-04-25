# Google Sheets Integration Setup Guide

This guide will walk you through the process of setting up Google Sheets as a database for your Novo Pets application.

## 1. Create a Google Sheets Spreadsheet

1. Go to [Google Sheets](https://sheets.google.com) and create a new spreadsheet
2. Create two sheets (tabs) named:
   - `Bookings`
   - `Contacts`

## 2. Set Up Headers in Your Sheets

Add the following headers to each sheet (first row):

### Bookings Sheet
```
id,serviceType,appointmentDate,appointmentTime,petName,petBreed,petSize,specialRequests,needsTransport,customerName,customerPhone,customerEmail,paymentMethod,status,createdAt
```

### Contacts Sheet
```
id,name,email,subject,message,submittedAt
```

## 3. Set Up Google Service Account

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Sheets API for your project
4. Create a Service Account:
   - Go to "IAM & Admin" > "Service Accounts"
   - Click "Create Service Account"
   - Give it a name and description
   - For the role, select "Editor" (or a more restricted role if preferred)
   - Click "Done"
5. Create and download a key for your service account:
   - Find your service account in the list
   - Click on the three dots menu and select "Manage keys"
   - Click "Add Key" > "Create new key"
   - Select JSON as the key type
   - Download the key file

## 4. Share Your Spreadsheet with the Service Account

1. Open your Google Sheets spreadsheet
2. Click the "Share" button in the top right
3. Add the email address of your service account (found in the JSON key file)
4. Give it "Editor" access
5. Uncheck "Notify people" and click "Share"

## 5. Configure Environment Variables

Create a `.env` file in your project root with the following variables (use the `env.example` file as a template):

```
# Google Sheets Integration
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account-email@your-project-id.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour Private Key Content Here\n-----END PRIVATE KEY-----\n"
GOOGLE_SPREADSHEET_ID=your-spreadsheet-id-from-google-sheets-url
```

Notes:
- The `GOOGLE_SERVICE_ACCOUNT_EMAIL` is the email address of your service account
- The `GOOGLE_PRIVATE_KEY` is the private key from the JSON key file you downloaded
  - Make sure to format it with `\n` characters as shown above
  - Keep the quotes around it
  - On Windows, you might need to use double backslashes (`\\n`) instead of single ones
- The `GOOGLE_SPREADSHEET_ID` is the ID of your spreadsheet, which you can find in the URL:
  - For example, in `https://docs.google.com/spreadsheets/d/1abc123def456ghi/edit#gid=0`, the ID is `1abc123def456ghi`

## 6. Restart Your Application

After setting up all the environment variables, restart your application to apply the changes:

```
npm run dev
```

## Windows-Specific Instructions

For Windows users, please note:

1. The scripts in package.json have been updated to be Windows-compatible
2. Make sure your `.env` file is in the root of the project
3. If you encounter issues with the private key formatting, try:
   - Using double backslashes: `"-----BEGIN PRIVATE KEY-----\\nKey\\nContent\\n-----END PRIVATE KEY-----\\n"`
   - Or removing the newlines completely and putting the key on one line (not recommended for security)

## Refreshing the Google Sheet Data

The application will fetch data from Google Sheets when needed. If you manually update the Google Sheet, the changes will be reflected the next time the application reads from the sheet.

To manually verify your Google Sheets connection and data:

```
npm run sheets:refresh
```

Remember that if you're making manual changes to the sheet:
1. Don't modify the headers (first row)
2. Keep the ID column values unique and numeric
3. For boolean fields like `needsTransport`, use string values 'true' or 'false'
4. Date fields should be in ISO format (e.g., '2023-06-15T08:30:00.000Z') 