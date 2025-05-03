-- Create a function to get table constraints
CREATE OR REPLACE FUNCTION get_table_constraints(table_name text)
RETURNS TABLE (
  constraint_name text,
  constraint_type text,
  constraint_definition text
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT
    tc.constraint_name::text,
    tc.constraint_type::text,
    pg_get_constraintdef(c.oid)::text as constraint_definition
  FROM 
    information_schema.table_constraints tc
    JOIN pg_constraint c ON c.conname = tc.constraint_name
    JOIN pg_class t ON t.oid = c.conrelid
  WHERE 
    tc.table_name = $1
    AND t.relname = $1;
END;
$$;

-- Create a function to execute arbitrary SQL (for admin use only)
CREATE OR REPLACE FUNCTION exec_sql(sql text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  EXECUTE sql;
END;
$$;

-- Add a function to check for availability of a time slot
CREATE OR REPLACE FUNCTION is_timeslot_available(
  check_date date,
  check_time text,
  check_groomer text
) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER AS $$
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

-- Add a unique constraint to prevent double bookings
-- Note: This may fail if there are already duplicate bookings in the system
DO $$
BEGIN
  BEGIN
    ALTER TABLE grooming_appointments 
    ADD CONSTRAINT unique_appointment_slot 
    UNIQUE (appointment_date, appointment_time, groomer);
  EXCEPTION
    WHEN duplicate_table THEN
      RAISE NOTICE 'Constraint already exists';
  END;
END $$;

-- Create a trigger function to validate booking availability before insert
CREATE OR REPLACE FUNCTION check_booking_availability()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  -- Check if we already have a booking for this slot (that's not cancelled)
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