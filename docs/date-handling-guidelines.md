# Date Handling Guidelines for Novo Pets API

## Overview
This document outlines the standards for date handling in the Novo Pets API to ensure consistent behavior across the application.

## Date Format Standards
- All dates should be in ISO 8601 format: **YYYY-MM-DD** (e.g., 2023-12-31)
- Dates should be handled as strings in YYYY-MM-DD format throughout the API
- No timezone conversions should be performed on date strings
- The API will preserve the exact date string provided by the client

## Client-Side Guidelines
When working with dates on the client side:
1. Extract year, month, day components directly from Date objects to avoid timezone issues
2. Format dates as YYYY-MM-DD strings before sending to the API
3. Never use Date.toISOString() for API requests as it includes time and applies timezone conversion
4. Example code for proper date formatting:
   ```javascript
   const dateObj = new Date(selectedDate);
   const year = dateObj.getFullYear();
   const month = String(dateObj.getMonth() + 1).padStart(2, '0');
   const day = String(dateObj.getDate()).padStart(2, '0');
   const formattedDate = `${year}-${month}-${day}`;
   ```

## API Implementation Notes
- The API accepts date parameters in YYYY-MM-DD format
- The API will not perform timezone conversions on input date strings
- All date validation is handled by the isValidDateString() function
- Dates will be stored in the database exactly as provided by the client
- For all endpoints that accept dates, we implement a cleaning procedure to strip any time components and ensure YYYY-MM-DD format

## Database Column Type Considerations
- **When using DATE column type (current configuration):**
  - PostgreSQL DATE columns apply server timezone when storing dates
  - Our API compensates by adding 1 day to dates before storing/querying
  - This ensures the date displayed to users matches the date they selected
  
- **When using TEXT column type (alternative approach):**
  - Store dates exactly as strings without server timezone conversions
  - No need to apply the +1 day compensation
  - More predictable but loses some database date validation

## Common Pitfalls to Avoid
- Using Date.toISOString() which includes time and applies UTC conversion
- Using libraries like moment.js or date-fns to format dates for API requests
- Performing implicit Date object conversions which can trigger timezone shifts
- Allowing Date objects to be serialized directly to JSON
- Storing dates with time components in the database, which can cause timezone issues

## Testing Date Handling
When testing the API:
1. Verify that dates are preserved exactly as entered by the user
2. Test across different timezones to ensure consistent behavior
3. Verify that bookings appear on the correct date in the admin calendar 