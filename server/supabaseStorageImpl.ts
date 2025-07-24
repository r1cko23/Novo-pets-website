import { 
  type Booking, 
  type InsertBooking,
  type ContactFormValues,
  PetSize,
  ServiceType
} from "../shared/schema";
import { supabase } from "./supabase";

// Add PaymentMethod enum
enum PaymentMethod {
  CASH = "cash",
  CARD = "card"
}

// Define array of time slots in 24-hour format
const TIME_SLOTS = [
  "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"
];

// Define groomers
const GROOMERS = ["Groomer 1", "Groomer 2"];

// Simple in-memory cache for available time slots with expiration
interface AvailabilityCache {
  date: string;
  timeSlots: TimeSlot[];
  timestamp: number; // When this cache entry was created
}

// Cache expires after this many milliseconds (30 seconds)
const CACHE_TTL = 30 * 1000;

// Store cache by date
const availabilityCache = new Map<string, AvailabilityCache>();

/**
 * Format time string to proper time format for database
 * @param timeStr Time string in "HH:MM" format
 * @returns Time string in "HH:MM:00" format for PostgreSQL time
 */
function formatTimeForDB(timeStr: string): string {
  return `${timeStr}:00`;
}

/**
 * Format time from database (time) to simple time string
 * @param dbTime Time from database in time format
 * @returns Time string in "HH:MM" format
 */
function formatTimeFromDB(dbTime: string): string {
  if (!dbTime) return '';
  
  // Extract just the hours and minutes, handling different formats
  if (dbTime.includes(':')) {
    // If in format like "09:00:00" or similar
    return dbTime.substring(0, 5);
  }
  
  // If it's already in simple format, return as is
  return dbTime;
}

/**
 * Normalizes a time string to consistent "HH:MM" 24-hour format for comparison
 * Handles various input formats: "9:00 AM", "09:00", "09:00:00", etc.
 * @param timeStr Time string in any reasonable format
 * @returns Normalized time in "HH:MM" 24-hour format
 */
function normalizeTimeFormat(timeStr: string): string {
  if (!timeStr) return '';
  
  // Already in HH:MM or HH:MM:SS 24-hour format
  if (/^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/.test(timeStr)) {
    return timeStr.substring(0, 5);
  }
  
  // 12-hour format with AM/PM
  const amPmMatch = timeStr.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm)$/i);
  if (amPmMatch) {
    let hours = parseInt(amPmMatch[1], 10);
    const minutes = amPmMatch[2];
    const isPM = amPmMatch[4].toLowerCase() === 'pm';
    
    // Convert to 24-hour format
    if (isPM && hours < 12) hours += 12;
    if (!isPM && hours === 12) hours = 0;
    
    return `${hours.toString().padStart(2, '0')}:${minutes}`;
  }
  
  // If it's another format, try to parse with Date object
  try {
    // Use a reference date to parse just the time portion
    const date = new Date(`2000-01-01T${timeStr}`);
    if (!isNaN(date.getTime())) {
      return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    }
  } catch (e) {
    console.error(`Error normalizing time format for "${timeStr}":`, e);
  }
  
  // Return original if couldn't normalize
  console.warn(`Could not normalize time format for "${timeStr}", returning as is`);
  return timeStr;
}

/**
 * Utility function to normalize date strings to YYYY-MM-DD format
 * Handles timezone conversion to ensure dates are stored correctly
 * NOTE: PostgreSQL date columns have timezone issues - if the column is 'date' type
 * rather than 'text', PostgreSQL will convert the date to UTC and this can cause
 * the date to appear as one day earlier when retrieved
 */
function normalizeDate(dateStr: string): string {
  try {
    console.log(`Normalizing date input: "${dateStr}"`);
    
    // If the string is already in YYYY-MM-DD format with no time component
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      console.log(`Date "${dateStr}" is already in YYYY-MM-DD format`);
      return dateStr;
    }
    
    // Parse the date in the local timezone
    const date = new Date(dateStr);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      throw new Error(`Invalid date: ${dateStr}`);
    }
    
    // Format in local timezone as YYYY-MM-DD
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    const normalizedDate = `${year}-${month}-${day}`;
    console.log(`Normalized date "${dateStr}" to "${normalizedDate}" in local timezone`);
    
    return normalizedDate;
  } catch (error) {
    console.error(`Error normalizing date ${dateStr}:`, error);
    // Fallback to simple string manipulation if Date parsing fails
    if (dateStr.includes('T')) {
      return dateStr.split('T')[0];
    }
    if (dateStr.includes(' ')) {
      return dateStr.split(' ')[0]; 
    }
    return dateStr;
  }
}

// Define TimeSlot interface
interface TimeSlot {
  time: string;
  groomer: string;
  available: boolean;
  formattedTime?: string; // Add optional formatted time property
}

export interface IStorage {
  // Booking methods
  getBookings(): Promise<Booking[]>;
  getBooking(id: number): Promise<Booking | null>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  getAvailableTimeSlots(date: string): Promise<TimeSlot[]>;
  updateBookingStatus(id: number, status: string): Promise<Booking>;
  
  // Contact form methods
  submitContactForm(form: ContactFormValues): Promise<boolean>;
}

export class SupabaseStorage implements IStorage {
  async getBookings(): Promise<Booking[]> {
    try {
      // Get grooming appointments
      const { data: groomingData, error: groomingError } = await supabase
        .from('grooming_appointments')
        .select('*')
        .order('appointment_date', { ascending: false });
      
      if (groomingError) {
        console.error("Error fetching grooming appointments:", groomingError);
        return [];
      }
      
      // Get hotel bookings
      const { data: hotelData, error: hotelError } = await supabase
        .from('hotel_bookings')
        .select('*')
        .order('check_in_date', { ascending: false });
      
      if (hotelError) {
        console.error("Error fetching hotel bookings:", hotelError);
        return [];
      }
      
      // Map grooming appointments to Booking type
      const groomingBookings = groomingData.map(appointment => {
        // Adjust the date for display (subtract one day to compensate for PostgreSQL date column)
        const displayDate = new Date(appointment.appointment_date);
        displayDate.setDate(displayDate.getDate() - 1);
        const correctedDate = normalizeDate(displayDate.toISOString());
        
        return {
          id: appointment.id,
          serviceType: ServiceType.GROOMING,
          groomingService: appointment.grooming_service,
          accommodationType: null,
          durationHours: null,
          durationDays: null,
          appointmentDate: correctedDate, // Use corrected date
          appointmentTime: formatTimeFromDB(appointment.appointment_time),
          petName: appointment.pet_name,
          petBreed: appointment.pet_breed,
          petSize: appointment.pet_size as typeof PetSize[keyof typeof PetSize],
          addOnServices: appointment.add_on_services,
          specialRequests: appointment.special_requests,
          needsTransport: appointment.needs_transport,
          transportType: appointment.transport_type,
          pickupAddress: appointment.pickup_address,
          includeTreats: false,
          treatType: null,
          customerName: appointment.customer_name,
          customerPhone: appointment.customer_phone,
          customerEmail: appointment.customer_email,
          paymentMethod: "cash", // Default since we're removing payment methods
          groomer: appointment.groomer,
          status: appointment.status,
          totalPrice: null,
          reference: appointment.reference,
          createdAt: new Date(appointment.created_at)
        };
      });
      
      // Map hotel bookings to Booking type
      const hotelBookings = hotelData.map(booking => {
        // Adjust dates for display
        const checkInDate = new Date(booking.check_in_date);
        checkInDate.setDate(checkInDate.getDate() - 1);
        const correctedCheckInDate = normalizeDate(checkInDate.toISOString());
        
        const checkOutDate = new Date(booking.check_out_date);
        checkOutDate.setDate(checkOutDate.getDate() - 1);
        const correctedCheckOutDate = normalizeDate(checkOutDate.toISOString());
        
        // Calculate duration in days using corrected dates
        const checkInObj = new Date(correctedCheckInDate);
        const checkOutObj = new Date(correctedCheckOutDate);
        const durationDays = Math.ceil((checkOutObj.getTime() - checkInObj.getTime()) / (1000 * 60 * 60 * 24));
        
        return {
          id: booking.id,
          serviceType: ServiceType.HOTEL,
          groomingService: null,
          accommodationType: booking.accommodation_type,
          durationHours: null,
          durationDays: durationDays,
          appointmentDate: correctedCheckInDate, // Use corrected date
          appointmentTime: "12:00", // Default check-in time
          petName: booking.pet_name,
          petBreed: booking.pet_breed,
          petSize: booking.pet_size as typeof PetSize[keyof typeof PetSize],
          addOnServices: null,
          specialRequests: booking.special_requests,
          needsTransport: booking.needs_transport,
          transportType: booking.transport_type,
          pickupAddress: booking.pickup_address,
          includeTreats: booking.include_treats,
          treatType: booking.treat_type,
          customerName: booking.customer_name,
          customerPhone: booking.customer_phone,
          customerEmail: booking.customer_email,
          paymentMethod: "cash", // Default since we're removing payment methods
          groomer: null,
          status: booking.status,
          totalPrice: null,
          reference: booking.reference,
          createdAt: new Date(booking.created_at)
        };
      });
      
      // Combine and return all bookings
      return [...groomingBookings, ...hotelBookings];
    } catch (error) {
      console.error("Error getting bookings:", error);
      return [];
    }
  }
  
  async getBooking(id: number): Promise<Booking | null> {
    try {
      // Try to find in grooming appointments first
      const { data: groomingData, error: groomingError } = await supabase
        .from('grooming_appointments')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (groomingData) {
        // Adjust the date for display (subtract one day to compensate for PostgreSQL date column)
        const displayDate = new Date(groomingData.appointment_date);
        displayDate.setDate(displayDate.getDate() - 1);
        const correctedDate = normalizeDate(displayDate.toISOString());
        
        return {
          id: groomingData.id,
          serviceType: ServiceType.GROOMING,
          groomingService: groomingData.grooming_service,
          accommodationType: null,
          durationHours: null,
          durationDays: null,
          appointmentDate: correctedDate, // Use corrected date
          appointmentTime: formatTimeFromDB(groomingData.appointment_time),
          petName: groomingData.pet_name,
          petBreed: groomingData.pet_breed,
          petSize: groomingData.pet_size as typeof PetSize[keyof typeof PetSize],
          addOnServices: groomingData.add_on_services,
          specialRequests: groomingData.special_requests,
          needsTransport: groomingData.needs_transport,
          transportType: groomingData.transport_type,
          pickupAddress: groomingData.pickup_address,
          includeTreats: false,
          treatType: null,
          customerName: groomingData.customer_name,
          customerPhone: groomingData.customer_phone,
          customerEmail: groomingData.customer_email,
          paymentMethod: "cash",
          groomer: groomingData.groomer,
          status: groomingData.status,
          totalPrice: null,
          reference: groomingData.reference,
          createdAt: new Date(groomingData.created_at)
        };
      }
      
      // If not found in grooming, try hotel bookings
      const { data: hotelData, error: hotelError } = await supabase
        .from('hotel_bookings')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (hotelData) {
        // Adjust dates for display
        const checkInDate = new Date(hotelData.check_in_date);
        checkInDate.setDate(checkInDate.getDate() - 1);
        const correctedCheckInDate = normalizeDate(checkInDate.toISOString());
        
        const checkOutDate = new Date(hotelData.check_out_date);
        checkOutDate.setDate(checkOutDate.getDate() - 1);
        const correctedCheckOutDate = normalizeDate(checkOutDate.toISOString());
        
        // Calculate duration in days using corrected dates
        const checkInObj = new Date(correctedCheckInDate);
        const checkOutObj = new Date(correctedCheckOutDate);
        const durationDays = Math.ceil((checkOutObj.getTime() - checkInObj.getTime()) / (1000 * 60 * 60 * 24));
        
        return {
          id: hotelData.id,
          serviceType: ServiceType.HOTEL,
          groomingService: null,
          accommodationType: hotelData.accommodation_type,
          durationHours: null,
          durationDays: durationDays,
          appointmentDate: correctedCheckInDate, // Use corrected date
          appointmentTime: "12:00", // Default check-in time
          petName: hotelData.pet_name,
          petBreed: hotelData.pet_breed,
          petSize: hotelData.pet_size as typeof PetSize[keyof typeof PetSize],
          addOnServices: null,
          specialRequests: hotelData.special_requests,
          needsTransport: hotelData.needs_transport,
          transportType: hotelData.transport_type,
          pickupAddress: hotelData.pickup_address,
          includeTreats: hotelData.include_treats,
          treatType: hotelData.treat_type,
          customerName: hotelData.customer_name,
          customerPhone: hotelData.customer_phone,
          customerEmail: hotelData.customer_email,
          paymentMethod: "cash",
          groomer: null,
          status: hotelData.status,
          totalPrice: null,
          reference: hotelData.reference,
          createdAt: new Date(hotelData.created_at)
        };
      }
      
      return null; // Not found in either table
    } catch (error) {
      console.error("Error getting booking:", error);
      return null;
    }
  }
  
  async getAvailableTimeSlots(date: string, forceRefresh: boolean = false): Promise<TimeSlot[]> {
    try {
      // Normalize the requested date
      const normalizedDate = normalizeDate(date);
      console.log(`[DB] Getting available time slots for date: ${normalizedDate} (forceRefresh: ${forceRefresh})`);
      
      // Check cache first if not forcing a refresh
      if (!forceRefresh) {
        const cached = availabilityCache.get(normalizedDate);
        const now = Date.now();
        
        if (cached && (now - cached.timestamp) < CACHE_TTL) {
          console.log(`[DB] Using cached availability data for ${normalizedDate}, created ${(now - cached.timestamp)/1000}s ago`);
          
          // Special check for 9:00 AM slots - always query database directly for these
          const nineAmSlots = cached.timeSlots.filter(slot => normalizeTimeFormat(slot.time) === '09:00');
          if (nineAmSlots.length > 0 && nineAmSlots.some(slot => slot.available)) {
            console.log(`[DB] Found 9:00 AM slots in cache, performing direct database check to verify`);
            
            // Perform a direct database check for 9:00 AM slots
            try {
              const { data, error } = await supabase
                .from('grooming_appointments')
                .select('*')
                .eq('appointment_date', normalizedDate)
                .eq('appointment_time', '09:00:00')
                .not('status', 'eq', 'cancelled');
                
              if (error) {
                console.error(`[DB] Error verifying 9:00 AM slots: ${error.message}`);
              } else if (data && data.length > 0) {
                console.log(`[DB] Direct DB check found ${data.length} bookings at 9:00 AM`);
                
                // Mark matching slots as booked
                data.forEach(booking => {
                  const matchedSlot = cached.timeSlots.find(slot => 
                    normalizeTimeFormat(slot.time) === '09:00' && 
                    slot.groomer.toLowerCase() === (booking.groomer || 'groomer 1').toLowerCase()
                  );
                  
                  if (matchedSlot && matchedSlot.available) {
                    console.log(`[DB] Updating cached data: Marking ${matchedSlot.groomer} at 9:00 AM as booked`);
                    matchedSlot.available = false;
                  }
                });
              } else {
                console.log(`[DB] Direct DB check confirmed no 9:00 AM bookings`);
              }
            } catch (verifyError) {
              console.error(`[DB] Exception during 9:00 AM verification: ${verifyError}`);
            }
          }
          
          return cached.timeSlots;
        } else if (cached) {
          console.log(`[DB] Cached data for ${normalizedDate} is stale (${(now - cached.timestamp)/1000}s old), fetching fresh data`);
          // Remove expired cache entry
          availabilityCache.delete(normalizedDate);
        }
      } else {
        console.log(`[DB] Force refresh requested, bypassing cache for ${normalizedDate}`);
        // Clear the cache for this date when forcing a refresh
        availabilityCache.delete(normalizedDate);
      }
      
      // IMPORTANT: Ensure we're querying for the *exact* date the user selected
      // We should not adjust the date here, as we want to check the availability
      // for the date the user explicitly requested
      const queryDate = normalizedDate;
      
      console.log(`[DB] Executing SQL query for date: ${queryDate}`);
      
      // DIRECT DATABASE QUERY (for verification)
      // Make a direct RAW SQL query to verify what's in the database for debug purposes
      const { data: rawBookings, error: rawError } = await supabase.rpc('exec_sql', {
        sql: `
          SELECT * FROM grooming_appointments 
          WHERE appointment_date = '${queryDate}' 
          AND status != 'cancelled'
        `
      });
      
      if (rawBookings && Array.isArray(rawBookings)) {
        console.log(`[DB] RAW SQL query found ${rawBookings.length} bookings for ${queryDate}`);
        
        // Log each booking for debugging
        rawBookings.forEach(booking => {
          console.log(`[DB] RAW Booking: Date=${booking.appointment_date}, Time=${booking.appointment_time}, Groomer=${booking.groomer || 'No groomer'}, Status=${booking.status}`);
        });
        
        // Check specifically for 9AM bookings
        const nineAmBookings = rawBookings.filter(b => {
          // Handle different time formats by normalizing
          const normalizedBookingTime = normalizeTimeFormat(b.appointment_time);
          const isNineAM = normalizedBookingTime === '09:00';
          if (isNineAM) {
            console.log(`[DB] Identified 9:00 AM booking: Time=${b.appointment_time}, normalized=${normalizedBookingTime}`);
          }
          return isNineAM;
        });
        
        if (nineAmBookings.length > 0) {
          console.log(`[DB] Found ${nineAmBookings.length} bookings at 9:00 AM through direct SQL`);
          nineAmBookings.forEach(b => {
            console.log(`[DB] 9:00 AM booking: ID=${b.id}, Groomer=${b.groomer}, Status=${b.status}, Time=${b.appointment_time}`);
          });
        } else {
          console.log(`[DB] No 9:00 AM bookings found in raw SQL query`);
        }
      } else if (rawError) {
        console.error(`[DB] Error in raw SQL query:`, rawError);
      }
      
      // Get all grooming appointments for the specified date using the standard API
      // Important: Include all statuses except 'cancelled' to ensure proper availability checking
      const { data: appointments, error } = await supabase
        .from('grooming_appointments')
        .select('*')
        .eq('appointment_date', queryDate)
        .not('status', 'eq', 'cancelled');
      
      if (error) {
        console.error("[DB] Error fetching appointments for availability check:", error);
        throw error; // Propagate error instead of returning empty array
      }
      
      console.log(`[DB] Standard query found ${appointments?.length || 0} existing appointments for ${queryDate}`);
      if (appointments && appointments.length > 0) {
        appointments.forEach(appt => {
          console.log(`[DB] Found appointment: Date=${appt.appointment_date}, Time=${appt.appointment_time}, Groomer=${appt.groomer}, Status=${appt.status}`);
        });
      }
      
      // If no appointments found, do a second query with the adjusted date
      // This handles potential timezone issues in the database
      if (!appointments || appointments.length === 0) {
        console.log("[DB] No appointments found with exact date, trying with adjusted date");
        
        // Try with the adjusted date (adding one day)
        const dateObj = new Date(normalizedDate);
        dateObj.setDate(dateObj.getDate() + 1);
        const adjustedDate = normalizeDate(dateObj.toISOString());
        
        console.log(`[DB] Trying again with adjusted date: ${adjustedDate}`);
        
        const { data: adjustedAppointments, error: adjustedError } = await supabase
          .from('grooming_appointments')
          .select('*')
          .eq('appointment_date', adjustedDate)
          .not('status', 'eq', 'cancelled');
          
        if (adjustedError) {
          console.error("[DB] Error fetching appointments with adjusted date:", adjustedError);
        } else if (adjustedAppointments && adjustedAppointments.length > 0) {
          console.log(`[DB] Found ${adjustedAppointments.length} appointments with adjusted date`);
          adjustedAppointments.forEach(appt => {
            console.log(`[DB] Found appointment (adjusted date): Date=${appt.appointment_date}, Time=${appt.appointment_time}, Groomer=${appt.groomer}, Status=${appt.status}`);
          });
          
          // Use these appointments instead
          appointments.length = 0;
          appointments.push(...adjustedAppointments);
        }
      }
      
      // Track booked slots for each groomer
      const bookedSlotsByGroomer: Record<string, Set<string>> = {};
      
      // Initialize empty sets for each groomer
      GROOMERS.forEach(groomer => {
        bookedSlotsByGroomer[groomer] = new Set<string>();
      });
      
      // Populate booked slots for each groomer
      if (appointments && appointments.length > 0) {
        appointments.forEach(appointment => {
          // Format time from database time format to simple "HH:MM" string
          // and normalize it for consistent comparison
          const bookedTime = normalizeTimeFormat(formatTimeFromDB(appointment.appointment_time));
          
          // Normalize groomer name to handle case sensitivity
          // This ensures "Groomer 1" matches "groomer 1" or any case variations
          let assignedGroomer = appointment.groomer || "Groomer 1";
          assignedGroomer = GROOMERS.find(g => g.toLowerCase() === assignedGroomer.toLowerCase()) || assignedGroomer;
          
          console.log(`[DB] Marking slot as booked: ${assignedGroomer} at ${bookedTime} (Status: ${appointment.status})`);
          
          // Mark the slot as booked for this groomer
          GROOMERS.forEach(groomer => {
            if (groomer.toLowerCase() === assignedGroomer.toLowerCase()) {
              bookedSlotsByGroomer[groomer].add(bookedTime);
            }
          });
        });
      }
      
      // Generate all time slots with availability information
      const allTimeSlots: TimeSlot[] = [];
      
      // Create the availability data structure
      TIME_SLOTS.forEach(time => {
        // Normalize the time slot for consistent comparison
        const normalizedTime = normalizeTimeFormat(time);
        
        GROOMERS.forEach(groomer => {
          const isBooked = bookedSlotsByGroomer[groomer]?.has(normalizedTime) || false;
          console.log(`Time slot ${time} (normalized: ${normalizedTime}) for ${groomer}: ${isBooked ? 'BOOKED' : 'Available'}`);
          
          allTimeSlots.push({
            time,
            groomer,
            available: !isBooked,
            formattedTime: formatTimeForDB(time)
          });
        });
      });
      
      // Log all unavailable slots for debugging
      const unavailableSlots = allTimeSlots.filter(slot => !slot.available);
      if (unavailableSlots.length > 0) {
        console.log(`Unavailable slots for ${normalizedDate}:`, 
          unavailableSlots.map(slot => `${slot.groomer} at ${slot.time}`).join(', '));
      }
      
      // Cache the results
      availabilityCache.set(normalizedDate, {
        date: normalizedDate,
        timeSlots: [...allTimeSlots], // Create a copy to avoid reference issues
        timestamp: Date.now()
      });
      
      console.log(`Returning ${allTimeSlots.length} time slots (${allTimeSlots.filter(s => s.available).length} available) and updating cache`);
      return allTimeSlots;
    } catch (error) {
      console.error("Error getting available time slots:", error);
      // Return all slots as available as a fallback instead of an empty array
      const fallbackSlots: TimeSlot[] = [];
      TIME_SLOTS.forEach(time => {
        GROOMERS.forEach(groomer => {
          fallbackSlots.push({ time, groomer, available: true, formattedTime: formatTimeForDB(time) });
        });
      });
      console.log(`Error occurred, returning ${fallbackSlots.length} fallback available slots`);
      return fallbackSlots;
    }
  }
  
  async createBooking(booking: InsertBooking): Promise<Booking> {
    try {
      if (booking.serviceType === ServiceType.GROOMING) {
        return this.createGroomingAppointment(booking);
      } else if (booking.serviceType === ServiceType.HOTEL) {
        return this.createHotelBooking(booking);
      } else {
        throw new Error(`Unsupported service type: ${booking.serviceType}`);
      }
    } catch (error) {
      console.error("Error creating booking:", error);
      throw error;
    }
  }
  
  private async createGroomingAppointment(booking: InsertBooking): Promise<Booking> {
    try {
      // First check if the slot is available
      const availableSlots = await this.getAvailableTimeSlots(booking.appointmentDate);
      
      // Normalize the requested appointment time for consistent comparison
      const normalizedRequestedTime = normalizeTimeFormat(booking.appointmentTime);
      console.log(`[Booking] Checking availability for normalized time: ${normalizedRequestedTime} (original: ${booking.appointmentTime})`);
      
      const requestedSlot = availableSlots.find(
        slot => normalizeTimeFormat(slot.time) === normalizedRequestedTime && 
                slot.groomer === (booking.groomer || "Groomer 1") && 
                slot.available === true
      );
      
      // Verify the requested slot was found and is available
      if (!requestedSlot) {
        // Get specific information about why the slot is unavailable
        const conflictingSlot = availableSlots.find(
          slot => slot.time === booking.appointmentTime && 
                 slot.groomer === (booking.groomer || "Groomer 1")
        );
        
        if (conflictingSlot) {
          // Slot exists but is unavailable
          throw new Error(`The requested time slot (${booking.appointmentTime} with ${booking.groomer || "Groomer 1"}) is already booked.`);
        } else {
          // Slot not found at all (invalid time or groomer)
          throw new Error(`The requested time slot (${booking.appointmentTime} with ${booking.groomer || "Groomer 1"}) is not available.`);
        }
      }
      
      // Use the exact date from the booking request
      // Do not adjust for PostgreSQL timezone issues, as we want to store the date
      // exactly as requested by the user
      const appointmentDate = normalizeDate(booking.appointmentDate);
      
      console.log(`Using exact appointment date for DB storage: ${appointmentDate}`);
      
      // Prepare data for Supabase
      const appointmentData = {
        appointment_date: appointmentDate,
        appointment_time: formatTimeForDB(booking.appointmentTime),
        pet_name: booking.petName,
        pet_breed: booking.petBreed,
        pet_size: booking.petSize,
        grooming_service: booking.groomingService || 'Basic Groom',
        add_on_services: booking.addOnServices,
        special_requests: booking.specialRequests,
        customer_name: booking.customerName,
        customer_phone: booking.customerPhone,
        customer_email: booking.customerEmail,
        groomer: booking.groomer || "Groomer 1",
        status: 'confirmed',
        reference: `NVP-G-${Date.now().toString().slice(-6)}`,
        needs_transport: booking.needsTransport,
        transport_type: booking.transportType,
        pickup_address: booking.pickupAddress,
        created_at: new Date().toISOString()
      };
      
      // Final race condition check - query the database directly to see if the slot 
      // was taken while the user was filling out the form
      // Use the formatted time for DB query (adds seconds to match DB format)
      const formattedTimeForQuery = formatTimeForDB(booking.appointmentTime);
      console.log(`[Booking] Performing final race condition check with time: ${formattedTimeForQuery}`);
      
      const { data: existingBookings, error: checkError } = await supabase
        .from('grooming_appointments')
        .select('id, appointment_time, groomer')
        .eq('appointment_date', appointmentDate)
        .eq('appointment_time', formattedTimeForQuery)
        .eq('groomer', booking.groomer || "Groomer 1")
        .not('status', 'eq', 'cancelled');
        
      if (checkError) {
        console.error("Error in final availability check:", checkError);
      } else if (existingBookings && existingBookings.length > 0) {
        console.log(`Race condition detected: Slot was booked while user was filling form. Found ${existingBookings.length} existing bookings.`);
        throw new Error(`This time slot has just been booked by someone else. Please select another time.`);
      }
      
      // Insert into Supabase
      const { data, error } = await supabase
        .from('grooming_appointments')
        .insert(appointmentData)
        .select()
        .single();
      
      if (error) {
        if (error.code === '23505') { // PostgreSQL unique constraint violation
          throw new Error(`This time slot is already booked. Please select another time.`);
        }
        throw error;
      }
      
      // Invalidate the availability cache for this date to ensure fresh data
      // This prevents the issue where cached data shows slots as available after booking
      const normalizedDate = normalizeDate(booking.appointmentDate);
      availabilityCache.delete(normalizedDate);
      console.log(`[Booking] Invalidated availability cache for date: ${normalizedDate}`);
      
      // Return the booking with the exact same date as stored in the database
      // No need to adjust the date anymore
      return {
        id: data.id,
        serviceType: ServiceType.GROOMING,
        groomingService: data.grooming_service,
        accommodationType: null,
        durationHours: null,
        durationDays: null,
        appointmentDate: data.appointment_date, // Use the exact date from the database
        appointmentTime: formatTimeFromDB(data.appointment_time),
        petName: data.pet_name,
        petBreed: data.pet_breed,
        petSize: data.pet_size as typeof PetSize[keyof typeof PetSize],
        addOnServices: data.add_on_services,
        specialRequests: data.special_requests,
        needsTransport: data.needs_transport,
        transportType: data.transport_type,
        pickupAddress: data.pickup_address,
        includeTreats: data.include_treats || false,
        treatType: data.treat_type || null,
        customerName: data.customer_name,
        customerPhone: data.customer_phone,
        customerEmail: data.customer_email,
        paymentMethod: data.payment_method || PaymentMethod.CASH,
        status: data.status,
        groomer: data.groomer,
        reference: data.reference,
        totalPrice: null,
        createdAt: new Date(data.created_at)
      };
    } catch (error) {
      console.error("Error creating grooming appointment:", error);
      throw error;
    }
  }
  
  private async createHotelBooking(booking: InsertBooking): Promise<Booking> {
    try {
      // Normalize the check-in date
      let checkInDate = normalizeDate(booking.appointmentDate);
      
      // Calculate check-out date based on duration
      const duration = booking.durationDays || 1;
      
      // Create date objects for calculations
      const checkInDateObj = new Date(checkInDate);
      const checkOutDateObj = new Date(checkInDateObj);
      checkOutDateObj.setDate(checkOutDateObj.getDate() + duration);
      let checkOutDate = normalizeDate(checkOutDateObj.toISOString());
      
      // Adjust dates for PostgreSQL date column timezone issue
      // Add one day to counteract PostgreSQL timezone handling
      const adjustedCheckInDateObj = new Date(checkInDate);
      adjustedCheckInDateObj.setDate(adjustedCheckInDateObj.getDate() + 1);
      const adjustedCheckInDate = normalizeDate(adjustedCheckInDateObj.toISOString());
      
      const adjustedCheckOutDateObj = new Date(checkOutDate);
      adjustedCheckOutDateObj.setDate(adjustedCheckOutDateObj.getDate() + 1);
      const adjustedCheckOutDate = normalizeDate(adjustedCheckOutDateObj.toISOString());
      
      console.log(`Original check-in: ${checkInDate}, Adjusted for DB: ${adjustedCheckInDate}`);
      console.log(`Original check-out: ${checkOutDate}, Adjusted for DB: ${adjustedCheckOutDate}`);
      console.log(`Creating hotel booking: Duration: ${duration} days`);
      
      // Prepare data for Supabase
      const hotelData = {
        check_in_date: adjustedCheckInDate,
        check_out_date: adjustedCheckOutDate,
        accommodation_type: booking.accommodationType || 'Standard',
        pet_name: booking.petName,
        pet_breed: booking.petBreed,
        pet_size: booking.petSize,
        special_requests: booking.specialRequests,
        customer_name: booking.customerName,
        customer_phone: booking.customerPhone,
        customer_email: booking.customerEmail,
        status: 'confirmed',
        reference: `NVP-H-${Date.now().toString().slice(-6)}`,
        include_treats: booking.includeTreats || false,
        treat_type: booking.treatType || null,
        needs_transport: booking.needsTransport || false,
        transport_type: booking.transportType || null,
        pickup_address: booking.pickupAddress || null,
        created_at: new Date().toISOString()
      };
      
      // Insert into Supabase - with retry logic
      let attempts = 0;
      const maxAttempts = 3;
      let data: any = null;
      let error: any = null;
      
      while (attempts < maxAttempts) {
        try {
          const result = await supabase
            .from('hotel_bookings')
            .insert(hotelData)
            .select()
            .single();
          
          data = result.data;
          error = result.error;
          
          if (!error) break; // Success, exit the retry loop
          
          console.error(`Attempt ${attempts + 1}/${maxAttempts} failed:`, error);
          
          // If it's a connection error, wait before retrying
          if (error.code === 'ECONNREFUSED' || error.code === 'ERR_CONNECTION_REFUSED') {
            await new Promise(resolve => setTimeout(resolve, 1000 * (attempts + 1)));
          } else {
            // If it's not a connection error, don't retry
            break;
          }
        } catch (innerError) {
          console.error(`Attempt ${attempts + 1}/${maxAttempts} exception:`, innerError);
          error = innerError;
        }
        
        attempts++;
      }
      
      if (error) {
        console.error("All attempts to create hotel booking failed:", error);
        throw error;
      }
      
      if (!data) {
        throw new Error("No data returned from hotel booking creation");
      }
      
      console.log("Hotel booking created successfully:", data.id);
      
      // When returning the booking, adjust the dates back to display correctly
      const displayCheckInDate = new Date(data.check_in_date);
      displayCheckInDate.setDate(displayCheckInDate.getDate() - 1);
      const correctedCheckInDate = normalizeDate(displayCheckInDate.toISOString());
      
      // Invalidate the availability cache for this date to ensure fresh data
      // This prevents the issue where cached data shows slots as available after booking
      const normalizedDate = normalizeDate(booking.appointmentDate);
      availabilityCache.delete(normalizedDate);
      console.log(`[Booking] Invalidated availability cache for date: ${normalizedDate}`);
      
      // Convert to Booking type
      return {
        id: data.id,
        serviceType: ServiceType.HOTEL,
        groomingService: null,
        accommodationType: data.accommodation_type,
        durationHours: null,
        durationDays: duration,
        appointmentDate: correctedCheckInDate, // Use corrected date for display
        appointmentTime: "12:00", // Default check-in time
        petName: data.pet_name,
        petBreed: data.pet_breed,
        petSize: data.pet_size as typeof PetSize[keyof typeof PetSize],
        addOnServices: null,
        specialRequests: data.special_requests,
        needsTransport: data.needs_transport,
        transportType: data.transport_type,
        pickupAddress: data.pickup_address,
        includeTreats: data.include_treats,
        treatType: data.treat_type,
        customerName: data.customer_name,
        customerPhone: data.customer_phone,
        customerEmail: data.customer_email,
        paymentMethod: "cash",
        groomer: null,
        status: data.status,
        totalPrice: null,
        reference: data.reference,
        createdAt: new Date(data.created_at)
      };
    } catch (error) {
      console.error("Error creating hotel booking:", error);
      throw error;
    }
  }
  
  async updateBookingStatus(id: number, status: string): Promise<Booking> {
    try {
      // Try to find and update in grooming appointments
      const { data: existingGrooming } = await supabase
        .from('grooming_appointments')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (existingGrooming) {
        // Update status in grooming appointments
        const { data: updatedGrooming, error } = await supabase
          .from('grooming_appointments')
          .update({ status })
          .eq('id', id)
          .select()
          .single();
        
        if (error) throw error;
        
        // Invalidate the availability cache for this date to ensure fresh data
        // This ensures that if a booking is cancelled, the slot becomes available again
        const normalizedDate = normalizeDate(updatedGrooming.appointment_date);
        availabilityCache.delete(normalizedDate);
        console.log(`[Booking] Invalidated availability cache for date: ${normalizedDate} after status update`);
        
        // Convert to Booking type
        return {
          id: updatedGrooming.id,
          serviceType: ServiceType.GROOMING,
          groomingService: updatedGrooming.grooming_service,
          accommodationType: null,
          durationHours: null,
          durationDays: null,
          appointmentDate: updatedGrooming.appointment_date,
          appointmentTime: formatTimeFromDB(updatedGrooming.appointment_time),
          petName: updatedGrooming.pet_name,
          petBreed: updatedGrooming.pet_breed,
          petSize: updatedGrooming.pet_size as typeof PetSize[keyof typeof PetSize],
          addOnServices: updatedGrooming.add_on_services,
          specialRequests: updatedGrooming.special_requests,
          needsTransport: updatedGrooming.needs_transport,
          transportType: updatedGrooming.transport_type,
          pickupAddress: updatedGrooming.pickup_address,
          includeTreats: false,
          treatType: null,
          customerName: updatedGrooming.customer_name,
          customerPhone: updatedGrooming.customer_phone,
          customerEmail: updatedGrooming.customer_email,
          paymentMethod: "cash",
          groomer: updatedGrooming.groomer,
          status: updatedGrooming.status,
          totalPrice: null,
          reference: updatedGrooming.reference,
          createdAt: new Date(updatedGrooming.created_at)
        };
      }
      
      // Try to find and update in hotel bookings
      const { data: existingHotel } = await supabase
        .from('hotel_bookings')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (existingHotel) {
        // Update status in hotel bookings
        const { data: updatedHotel, error } = await supabase
          .from('hotel_bookings')
          .update({ status })
          .eq('id', id)
          .select()
          .single();
        
        if (error) throw error;
        
        // Calculate duration in days
        const checkInDate = new Date(updatedHotel.check_in_date);
        const checkOutDate = new Date(updatedHotel.check_out_date);
        const durationDays = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
        
        // Convert to Booking type
        return {
          id: updatedHotel.id,
          serviceType: ServiceType.HOTEL,
          groomingService: null,
          accommodationType: updatedHotel.accommodation_type,
          durationHours: null,
          durationDays: durationDays,
          appointmentDate: updatedHotel.check_in_date,
          appointmentTime: "12:00", // Default check-in time
          petName: updatedHotel.pet_name,
          petBreed: updatedHotel.pet_breed,
          petSize: updatedHotel.pet_size as typeof PetSize[keyof typeof PetSize],
          addOnServices: null,
          specialRequests: updatedHotel.special_requests,
          needsTransport: updatedHotel.needs_transport,
          transportType: updatedHotel.transport_type,
          pickupAddress: updatedHotel.pickup_address,
          includeTreats: updatedHotel.include_treats,
          treatType: updatedHotel.treat_type,
          customerName: updatedHotel.customer_name,
          customerPhone: updatedHotel.customer_phone,
          customerEmail: updatedHotel.customer_email,
          paymentMethod: "cash",
          groomer: null,
          status: updatedHotel.status,
          totalPrice: null,
          reference: updatedHotel.reference,
          createdAt: new Date(updatedHotel.created_at)
        };
      }
      
      throw new Error(`Booking with ID ${id} not found`);
    } catch (error) {
      console.error(`Error updating booking status for ID ${id}:`, error);
      throw error;
    }
  }
  
  async submitContactForm(form: ContactFormValues): Promise<boolean> {
    try {
      // Prepare contact data for Supabase
      const contactData = {
        name: form.name,
        email: form.email,
        subject: form.subject,
        message: form.message,
        created_at: new Date().toISOString()
      };
      
      // Insert into Supabase
      const { error } = await supabase
        .from('contacts')
        .insert(contactData);
      
      if (error) {
        console.error("Error submitting contact form:", error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error("Error in submitContactForm:", error);
      return false;
    }
  }

  /**
   * Creates a unique reservation index in Supabase to prevent double bookings
   * This function should be called once during application initialization
   * It adds a constraint to ensure no duplicate (date+time+groomer) combinations
   */
  async createReservationIndices(): Promise<void> {
    try {
      // First, check if the constraint already exists to avoid errors
      const { data: constraints, error: constraintError } = await supabase
        .rpc('get_table_constraints', { table_name: 'grooming_appointments' });
        
      if (constraintError) {
        console.error("Error checking constraints:", constraintError);
        return;
      }
      
      // Check if our desired constraint already exists
      const constraintExists = constraints && Array.isArray(constraints) && 
        constraints.some(c => c.constraint_name === 'unique_appointment_slot');
        
      if (constraintExists) {
        console.log("Reservation uniqueness constraint already exists");
        return;
      }
      
      // Create a unique constraint on appointment_date + appointment_time + groomer
      // This SQL is specific to PostgreSQL
      const { error } = await supabase.rpc('exec_sql', {
        sql: `
          ALTER TABLE grooming_appointments 
          ADD CONSTRAINT unique_appointment_slot 
          UNIQUE (appointment_date, appointment_time, groomer);
        `
      });
      
      if (error) {
        console.error("Error creating reservation index:", error);
      } else {
        console.log("Successfully created reservation uniqueness constraint");
      }
    } catch (error) {
      console.error("Error in createReservationIndices:", error);
    }
  }
}

export const supabaseStorage = new SupabaseStorage(); 