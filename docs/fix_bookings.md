# Fix Double Booking Issue in Novo Pets

## The Problem

Users are able to book the same time slot with the same groomer multiple times, which should not be possible. This causes scheduling conflicts and confusion.

## Database Schema Fix Instructions

Follow these steps to fix the double booking issue by adding database-level constraints:

1. Log in to your Supabase dashboard
2. Navigate to the SQL Editor
3. Run each SQL query in the sections below

## Step 1: Find duplicate bookings

Run this query to find any existing duplicate bookings:

```sql
SELECT 
  appointment_date,
  appointment_time,
  groomer,
  COUNT(*) as booking_count,
  ARRAY_AGG(id ORDER BY created_at) as booking_ids
FROM 
  grooming_appointments
WHERE 
  status != 'cancelled'
GROUP BY 
  appointment_date, appointment_time, groomer
HAVING 
  COUNT(*) > 1;
```

## Step 2: Cancel duplicate bookings

If you found any duplicates in Step 1, run this script to cancel the newer duplicates:

```sql
-- This function lets us handle duplicate bookings
CREATE OR REPLACE FUNCTION cancel_duplicate_bookings()
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  duplicate RECORD;
  keepId INTEGER;
  cancelIds INTEGER[];
BEGIN
  FOR duplicate IN (
    SELECT 
      appointment_date,
      appointment_time,
      groomer,
      ARRAY_AGG(id ORDER BY created_at) as booking_ids
    FROM 
      grooming_appointments
    WHERE 
      status != 'cancelled'
    GROUP BY 
      appointment_date, appointment_time, groomer
    HAVING 
      COUNT(*) > 1
  ) LOOP
    -- Keep the oldest booking (first ID in array)
    keepId := duplicate.booking_ids[1];
    
    -- Get the rest of the IDs to cancel
    cancelIds := duplicate.booking_ids[2:];
    
    -- Update status to 'cancelled' for duplicate bookings
    UPDATE grooming_appointments
    SET status = 'cancelled'
    WHERE id = ANY(cancelIds);
    
    RAISE NOTICE 'Cancelled duplicates for % at % with %: keeping ID %, cancelled IDs %', 
      duplicate.appointment_date, duplicate.appointment_time, 
      duplicate.groomer, keepId, cancelIds;
  END LOOP;
END;
$$;

-- Run the function to cancel duplicates
SELECT cancel_duplicate_bookings();
```

## Step 3: Create a unique constraint

Now add a constraint to prevent future double bookings:

```sql
-- Add a unique constraint to prevent double bookings
ALTER TABLE grooming_appointments 
ADD CONSTRAINT unique_appointment_slot 
UNIQUE (appointment_date, appointment_time, groomer);
```

If the above query fails because there are still duplicates, run the Step 2 script again to clean them up.

## Step 4: Create a trigger to ensure only active bookings block slots

```sql
-- Create a trigger function to validate booking availability before insert
CREATE OR REPLACE FUNCTION check_booking_availability()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  -- Check if we already have an active booking for this slot
  IF EXISTS (
    SELECT 1 FROM grooming_appointments
    WHERE 
      appointment_date = NEW.appointment_date AND
      appointment_time = NEW.appointment_time AND
      groomer = NEW.groomer AND
      status != 'cancelled' AND
      id != NEW.id
  ) THEN
    RAISE EXCEPTION 'This time slot is already booked. Please select another time.';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on the grooming appointments table
DROP TRIGGER IF EXISTS booking_availability_check ON grooming_appointments;
CREATE TRIGGER booking_availability_check
BEFORE INSERT OR UPDATE ON grooming_appointments
FOR EACH ROW
EXECUTE FUNCTION check_booking_availability();

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS grooming_date_time_groomer_idx 
ON grooming_appointments(appointment_date, appointment_time, groomer);
```

## Step 5: Add a helper function to check availability (optional)

```sql
-- Add a function to check for availability of a time slot
CREATE OR REPLACE FUNCTION is_timeslot_available(
  check_date date,
  check_time text,
  check_groomer text
) RETURNS boolean LANGUAGE plpgsql AS $$
DECLARE
  booking_count integer;
BEGIN
  SELECT COUNT(*)
  INTO booking_count
  FROM grooming_appointments
  WHERE 
    appointment_date = check_date AND
    appointment_time = check_time AND
    groomer = check_groomer AND
    status != 'cancelled';
    
  RETURN booking_count = 0;
END;
$$;
```

## Verification

After running all these steps, test that double booking is prevented by trying to:

1. Create a new booking for an already booked slot
2. It should fail with a constraint violation error

The application code has also been updated to handle this case more gracefully. 