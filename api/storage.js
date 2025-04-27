// api/storage.js
// Implementation with Google Sheets integration
import { appendRow, getRows, sheetsConfig } from './sheets.js';

// Define array of time slots (from 9 AM to 6 PM)
const TIME_SLOTS = [
  "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"
];

// Define groomers
const GROOMERS = ["Groomer 1", "Groomer 2"];

/**
 * Utility function to normalize date strings to YYYY-MM-DD format
 */
function normalizeDate(dateStr) {
  try {
    if (!dateStr) return '';
    
    // Create a Date object
    const date = new Date(dateStr);
    
    // Check for invalid date
    if (isNaN(date.getTime())) {
      console.error(`Invalid date string: ${dateStr}`);
      return dateStr;
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

/**
 * Normalize time format to ensure consistent comparison
 */
function normalizeTime(timeStr) {
  if (!timeStr) return '';
  
  // Convert to string and trim whitespace
  timeStr = String(timeStr).trim();
  
  // Handle format with period instead of colon (e.g., "9.00")
  if (timeStr.includes('.')) {
    timeStr = timeStr.replace('.', ':');
  }
  
  // Add leading zero for single-digit hours (e.g., "9:00" to "09:00")
  if (timeStr.length === 4 && timeStr[1] === ':') {
    timeStr = `0${timeStr}`;
  }
  
  // Handle AM/PM format
  if (timeStr.toLowerCase().includes('am')) {
    timeStr = timeStr.toLowerCase().replace('am', '').trim();
    // Add leading zero if needed
    if (timeStr.length === 4 && timeStr[1] === ':') {
      timeStr = `0${timeStr}`;
    }
  } else if (timeStr.toLowerCase().includes('pm')) {
    timeStr = timeStr.toLowerCase().replace('pm', '').trim();
    // Convert to 24-hour format
    const parts = timeStr.split(':');
    if (parts.length === 2) {
      let hour = parseInt(parts[0]);
      if (hour < 12) {
        hour += 12;
      }
      timeStr = `${hour}:${parts[1]}`;
    }
  }
  
  return timeStr;
}

// Get available time slots for a specific date
export async function getAvailableTimeSlots(date) {
  try {
    // Normalize date format
    const normalizedDate = normalizeDate(date);
    console.log(`Getting available time slots for date: ${normalizedDate}`);

    // IMPORTANT: Force a fresh fetch from Google Sheets each time to prevent stale data
    const bookings = await getBookings(true); // Pass true to force refresh
    console.log(`Total bookings found in sheet: ${bookings.length}`);
    
    // Debug log all bookings to see their format
    bookings.forEach((booking, index) => {
      console.log(`Booking ${index}: Date=${booking.appointment_date}, Time=${booking.appointment_time}, Groomer=${booking.groomer || 'Not specified'}, Status=${booking.status || 'Not specified'}`);
    });
    
    // Filter bookings for the requested date with status confirmed or pending
    const bookingsForDate = bookings.filter(booking => {
      // Ensure we normalize the booking date consistently
      const bookingDate = normalizeDate(booking.appointment_date);
      const isMatchingDate = bookingDate === normalizedDate;
      // Consider empty status as valid (pending)
      const isValidStatus = !booking.status || booking.status === "confirmed" || booking.status === "pending" || booking.status === "";
      // Consider empty service type as grooming
      const isGroomingService = !booking.service_type || booking.service_type === "grooming" || booking.service_type === "";
      
      console.log(`Checking booking: Date=${bookingDate} (Match=${isMatchingDate}), Status=${booking.status} (Valid=${isValidStatus}), Service=${booking.service_type} (Grooming=${isGroomingService})`);
      
      return isMatchingDate && isValidStatus && isGroomingService;
    });
    
    console.log(`Found ${bookingsForDate.length} bookings for date ${normalizedDate}`);
    
    // Debug log the filtered bookings
    bookingsForDate.forEach((booking, index) => {
      console.log(`Filtered booking ${index}: Time=${booking.appointment_time}, Groomer=${booking.groomer || "Groomer 1"}`);
    });
    
    // Track booked slots for each groomer
    const bookedSlotsByGroomer = {};
    
    // Initialize empty sets for each groomer
    GROOMERS.forEach(groomer => {
      bookedSlotsByGroomer[groomer] = new Set();
    });
    
    // Populate booked slots for each groomer
    bookingsForDate.forEach(booking => {
      // Normalize time format consistently
      const bookedTime = normalizeTime(booking.appointment_time);
      
      // Skip if no valid time
      if (!bookedTime) {
        console.log(`Skipping booking with empty time: ${JSON.stringify(booking)}`);
        return;
      }
      
      // Default to Groomer 1 if not specified or empty
      const assignedGroomer = (booking.groomer && booking.groomer.trim()) || "Groomer 1";
      
      // Check if this groomer is in our predefined list (case insensitive comparison)
      const matchedGroomer = GROOMERS.find(g => 
        g.toLowerCase() === assignedGroomer.toLowerCase()
      ) || "Groomer 1";
      
      if (bookedSlotsByGroomer[matchedGroomer]) {
        console.log(`Marking time slot ${bookedTime} as booked for ${matchedGroomer}`);
        bookedSlotsByGroomer[matchedGroomer].add(bookedTime);
      } else {
        console.error(`Unknown groomer: ${assignedGroomer}, defaulting to Groomer 1`);
        bookedSlotsByGroomer["Groomer 1"].add(bookedTime);
      }
    });
    
    // Log the booked slots for each groomer
    GROOMERS.forEach(groomer => {
      console.log(`Booked slots for ${groomer}: ${Array.from(bookedSlotsByGroomer[groomer]).join(', ')}`);
    });
    
    // Format the result
    const result = [];
    
    // Add ALL time slots for each groomer to the result (both available and booked)
    for (const groomer of GROOMERS) {
      for (const timeSlot of TIME_SLOTS) {
        const isAvailable = !bookedSlotsByGroomer[groomer].has(timeSlot);
        result.push({
          time: timeSlot,
          groomer: groomer,
          available: isAvailable // Explicitly set available property
        });
      }
    }
    
    console.log(`Returning ${result.length} available slots for ${normalizedDate}`);
    // Debug the final result being returned
    result.forEach(slot => {
      console.log(`Final slot: Time=${slot.time}, Groomer=${slot.groomer}, Available=${slot.available}`);
    });
    
    return result;
  } catch (error) {
    console.error("Error getting available time slots:", error);
    // Fallback to returning all time slots as available if there's an error
    const result = [];
    for (const groomer of GROOMERS) {
      for (const timeSlot of TIME_SLOTS) {
        result.push({
          time: timeSlot,
          groomer: groomer,
          available: true // Explicitly set all as available in case of error
        });
      }
    }
    return result;
  }
}

// Get all bookings from Google Sheets
async function getBookings(forceRefresh = false) {
  try {
    // Use a no-cache approach to force fresh data
    const options = forceRefresh ? { noCache: true } : {};
    const bookings = await getRows(sheetsConfig.SHEET_NAMES.BOOKINGS, options);
    console.log(`Retrieved ${bookings.length} bookings from Google Sheets`);
    return bookings;
  } catch (error) {
    console.error("Error getting bookings:", error);
    return [];
  }
}

// Create a booking in Google Sheets
export async function createBooking(bookingData) {
  try {
    // Normalize the appointment date
    const normalizedDate = normalizeDate(bookingData.appointmentDate || '');
    if (!normalizedDate) {
      throw new Error('Invalid appointment date');
    }
    
    // Normalize time format consistently
    const normalizedTime = normalizeTime(bookingData.appointmentTime);
    if (!normalizedTime) {
      throw new Error('Invalid appointment time');
    }
    
    console.log(`Creating booking for ${normalizedDate} at ${normalizedTime}`);
    
    // Double-check by getting all current bookings directly
    const allBookings = await getBookings();
    const existingBooking = allBookings.find(booking => {
      const bookingDate = normalizeDate(booking.appointment_date);
      const bookingTime = normalizeTime(booking.appointment_time);
      const groomer = booking.groomer?.trim() || "Groomer 1";
      
      const requestedGroomer = bookingData.groomer || "Groomer 1";
      
      // Check if this booking is for the same date, time, and groomer
      return (
        bookingDate === normalizedDate && 
        bookingTime === normalizedTime &&
        groomer.toLowerCase() === requestedGroomer.toLowerCase()
      );
    });
    
    if (existingBooking) {
      console.error(`Slot ${normalizedTime} on ${normalizedDate} for ${bookingData.groomer || "Groomer 1"} is already booked`);
      throw new Error(`This time slot is already booked. Please select another time or groomer.`);
    }
    
    // Check if this slot is actually available before creating the booking
    const availableSlots = await getAvailableTimeSlots(normalizedDate);
    console.log(`Available slots for booking: ${JSON.stringify(availableSlots)}`);
    
    // Determine which groomer to use
    const groomerToCheck = bookingData.groomer || "Groomer 1"; // Default to Groomer 1 if not specified
    
    // Find the exact slot for the requested time and groomer
    const requestedSlot = availableSlots.find(
      slot => slot.time === normalizedTime && 
             slot.groomer === groomerToCheck &&
             slot.available === true // Must be explicitly available
    );
    
    if (!requestedSlot) {
      console.error(`Slot ${normalizedTime} for ${groomerToCheck} is not available for booking on ${normalizedDate}`);
      throw new Error(`The requested time slot ${normalizedTime} for ${groomerToCheck} is not available or already booked.`);
    }
    
    // Prepare the row data for Google Sheets
    const rowData = {
      id: Date.now().toString(),
      service_type: bookingData.serviceType || 'grooming',
      appointment_date: normalizedDate,
      appointment_time: normalizedTime,
      pet_name: bookingData.petName || '',
      pet_breed: bookingData.petBreed || '',
      pet_size: bookingData.petSize || '',
      special_requests: bookingData.specialRequests || '',
      customer_name: bookingData.customerName || '',
      customer_email: bookingData.customerEmail || '',
      customer_phone: bookingData.customerPhone || '',
      groomer: groomerToCheck,
      status: 'pending',
      created_at: new Date().toISOString()
    };
    
    // Add additional fields if present
    if (bookingData.needs_transport) rowData.needs_transport = bookingData.needs_transport;
    if (bookingData.addOnServices) rowData.add_on_services = bookingData.addOnServices;
    
    console.log('Sending booking data to Google Sheets:', rowData);
    
    // Append the row to Google Sheets
    const result = await appendRow(sheetsConfig.SHEET_NAMES.BOOKINGS, rowData);
    
    // Return a properly formatted booking object
    return {
      id: rowData.id,
      serviceType: rowData.service_type,
      appointmentDate: rowData.appointment_date,
      appointmentTime: rowData.appointment_time,
      petName: rowData.pet_name,
      petBreed: rowData.pet_breed,
      petSize: rowData.pet_size,
      specialRequests: rowData.special_requests,
      customerName: rowData.customer_name,
      customerEmail: rowData.customer_email,
      customerPhone: rowData.customer_phone,
      groomer: rowData.groomer,
      status: rowData.status,
      createdAt: rowData.created_at
    };
  } catch (error) {
    console.error("Error creating booking:", error);
    throw error; // Rethrow the error to be handled by the API endpoint
  }
}

// Submit contact form to Google Sheets
export async function submitContactForm(formData) {
  try {
    const rowData = {
      id: Date.now().toString(),
      name: formData.name || '',
      email: formData.email || '',
      subject: formData.subject || '',
      message: formData.message || '',
      submitted_at: new Date().toISOString()
    };
    
    await appendRow(sheetsConfig.SHEET_NAMES.CONTACTS, rowData);
    return true;
  } catch (error) {
    console.error("Error submitting contact form:", error);
    return false;
  }
}

export const storage = {
  getAvailableTimeSlots,
  createBooking,
  submitContactForm
}; 