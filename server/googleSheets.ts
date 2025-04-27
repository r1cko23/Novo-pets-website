import { google, sheets_v4 } from 'googleapis';
import { JWT } from 'google-auth-library';
import { googleSheetsConfig } from './config';

export class GoogleSheetsService {
  private sheets: sheets_v4.Sheets;
  private readonly spreadsheetId: string | undefined;

  constructor() {
    // Log important info for debugging
    console.log('GoogleSheetsService initializing...');
    console.log(`Client email exists: ${!!googleSheetsConfig.credentials.clientEmail}`);
    console.log(`Private key exists: ${!!googleSheetsConfig.credentials.privateKey}`);
    console.log(`Spreadsheet ID exists: ${!!googleSheetsConfig.credentials.spreadsheetId}`);
    
    // Initialize the Google Sheets client
    if (!googleSheetsConfig.credentials.clientEmail || 
        !googleSheetsConfig.credentials.privateKey || 
        !googleSheetsConfig.credentials.spreadsheetId) {
      const error = new Error('Google Sheets credentials are missing. Please check your environment variables.');
      console.error(error);
      throw error;
    }

    try {
      const auth = new JWT({
        email: googleSheetsConfig.credentials.clientEmail,
        key: googleSheetsConfig.credentials.privateKey,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });

      this.sheets = google.sheets({ version: 'v4', auth });
      this.spreadsheetId = googleSheetsConfig.credentials.spreadsheetId;
      console.log('GoogleSheetsService initialized successfully');
    } catch (error) {
      console.error('Error initializing GoogleSheetsService:', error);
      throw error;
    }
  }

  /**
   * Get all rows from a specific sheet
   * 
   * @param sheetName - Name of the sheet to read from
   * @returns Array of data rows
   */
  async getRows(sheetName: string): Promise<any[]> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}!A2:Z`,
      });

      const rows = response.data.values || [];
      const headers = await this.getHeaders(sheetName);

      // Convert rows to objects with header keys
      return rows.map((row) => {
        const obj: Record<string, any> = {};
        headers.forEach((header, index) => {
          obj[header] = row[index] || null;
        });
        return obj;
      });
    } catch (error) {
      console.error(`Error fetching rows from ${sheetName}:`, error);
      throw error;
    }
  }

  /**
   * Get headers from a specific sheet
   * 
   * @param sheetName - Name of the sheet to read headers from
   * @returns Array of header strings
   */
  async getHeaders(sheetName: string): Promise<string[]> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}!A1:Z1`,
      });

      return response.data.values?.[0] || [];
    } catch (error) {
      console.error(`Error fetching headers from ${sheetName}:`, error);
      throw error;
    }
  }

  /**
   * Add a new row to a specific sheet
   * 
   * @param sheetName - Name of the sheet to append data to
   * @param data - Object containing the data to append
   * @returns The appended data with any generated IDs
   */
  async appendRow(sheetName: string, data: Record<string, any>): Promise<Record<string, any>> {
    try {
      const headers = await this.getHeaders(sheetName);
      
      // Get the next ID for the new row
      const rows = await this.getRows(sheetName);
      let nextId = 1;
      
      if (rows.length > 0) {
        const maxId = Math.max(...rows.map(row => parseInt(row.id) || 0));
        nextId = maxId + 1;
      }
      
      // Add ID to the data
      const rowData: Record<string, any> = { id: nextId.toString(), ...data };
      
      // Format the row according to the headers
      const formattedRow = headers.map(header => {
        return rowData[header] !== undefined ? rowData[header] : '';
      });
      
      // Append the row
      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}!A:Z`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [formattedRow],
        },
      });
      
      return rowData;
    } catch (error) {
      console.error(`Error appending row to ${sheetName}:`, error);
      throw error;
    }
  }

  /**
   * Get a specific row by ID
   * 
   * @param sheetName - Name of the sheet to search in
   * @param id - ID of the row to find
   * @returns The row data or undefined if not found
   */
  async getRowById(sheetName: string, id: number): Promise<Record<string, any> | undefined> {
    try {
      const rows = await this.getRows(sheetName);
      return rows.find(row => parseInt(row.id) === id);
    } catch (error) {
      console.error(`Error getting row by ID from ${sheetName}:`, error);
      throw error;
    }
  }
}

export const googleSheetsService = new GoogleSheetsService(); 