# Date Handling in Novo Pets Booking System

## Problem: PostgreSQL Date Columns and Timezone Issues

When working with dates in the Novo Pets booking system, we encountered an issue where dates appear to shift by one day when stored in PostgreSQL date columns. This occurs because:

1. PostgreSQL applies timezone conversions when storing dates in `date` columns
2. JavaScript's `Date` object uses local timezone for display
3. This can cause dates to appear as one day earlier when retrieved from the database

## Solution: Date Adjustment Strategy

To handle this issue correctly, we've implemented the following strategy:

### 1. For Database Operations (Storage)

When storing dates in PostgreSQL `date` columns:
- Add +1 day to the date before storing in the database
- This compensates for PostgreSQL's timezone handling

```typescript
// Example of adjusting a date for storage
const normalizedDate = normalizeDate(appointmentDate); // YYYY-MM-DD format
const dateObj = new Date(normalizedDate);
dateObj.setDate(dateObj.getDate() + 1);
const adjustedDate = normalizeDate(dateObj.toISOString());
```

### 2. For Display (Retrieval)

When retrieving dates for display to users:
- Subtract -1 day from the retrieved date
- This returns the date to its original intended value

```typescript
// Example of correcting a date for display
const displayDate = new Date(databaseDate);
displayDate.setDate(displayDate.getDate() - 1);
const correctedDate = normalizeDate(displayDate.toISOString());
```

### 3. For Date Comparisons

- Be consistent about which "version" of the date you're using
- For database queries, use the adjusted date
- For application logic, use the original date

## Column Type Options

This adjustment is only necessary when using PostgreSQL `date` columns. There are two approaches:

### Option 1: Use `date` Column Type (Current Implementation)

- Pros: Type safety, database-level date validation
- Cons: Requires the +1/-1 day adjustment to handle timezone issues
- Implementation: See the code in `server/supabaseStorageImpl.ts`

### Option 2: Use `text` Column Type

- Pros: No timezone issues, dates are stored exactly as provided
- Cons: No type validation, could store invalid date formats
- Implementation: Would require removing the +1/-1 day adjustment logic

## Debugging

If you encounter date issues:

1. Check the column type in the database schema
2. Verify the adjustment is being applied consistently
3. Use console.log to track date transformations:

```typescript
console.log(`Original date: ${originalDate}`);
console.log(`Normalized date: ${normalizedDate}`);
console.log(`Adjusted for DB: ${adjustedDate}`);
```

## Future Considerations

If the database schema changes:

1. If changing from `date` to `text` columns:
   - Remove the +1/-1 day adjustment logic
   - Update all date-handling code

2. If changing from `text` to `date` columns:
   - Implement the +1/-1 day adjustment logic
   - Test thoroughly with dates near timezone boundaries 