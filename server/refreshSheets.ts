import { googleSheetsService } from './googleSheets';
import { googleSheetsConfig } from './config';
import { log } from './vite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';

// Load environment variables from .env file
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const envPath = path.resolve(rootDir, '.env');

if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
  log('✅ Loaded environment variables from .env file');
} else {
  log('⚠️ No .env file found at ' + envPath);
}

/**
 * Script to manually refresh data from Google Sheets
 * This can be used to verify the connection and data structure
 */
async function refreshSheets() {
  try {
    log('🔄 Starting Google Sheets refresh...');
    
    // Verify credentials are set
    if (!googleSheetsConfig.credentials.spreadsheetId) {
      log('❌ Google Sheets spreadsheet ID is not set.');
      return;
    }
    
    // Check all sheets
    for (const [key, sheetName] of Object.entries(googleSheetsConfig.sheets)) {
      try {
        log(`📊 Checking sheet: ${sheetName}...`);
        
        // Get headers
        const headers = await googleSheetsService.getHeaders(sheetName);
        log(`✅ Headers found: ${headers.join(', ')}`);
        
        // Get all rows
        const rows = await googleSheetsService.getRows(sheetName);
        log(`✅ Found ${rows.length} rows in ${sheetName}`);
        
        // Display the first row as a sample (if available)
        if (rows.length > 0) {
          log(`📋 Sample row: ${JSON.stringify(rows[0])}`);
        }
      } catch (error) {
        log(`❌ Error accessing sheet ${sheetName}: ${error}`);
      }
    }
    
    log('✅ Google Sheets refresh completed.');
  } catch (error) {
    log(`❌ Error refreshing Google Sheets: ${error}`);
  }
}

// Run the refresh
refreshSheets().catch(error => {
  log(`❌ Fatal error: ${error}`);
  process.exit(1);
}); 