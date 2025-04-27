// api/storage.js
// Implementation with Google Sheets integration
import { appendRow, getRows, updateRow, sheetsConfig } from './sheets.js';

// Define array of time slots (from 9 AM to 6 PM)
const TIME_SLOTS = [
  "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"
];

// Define groomers
const GROOMERS = ["Groomer 1", "Groomer 2"];

// Define the timeout for pending bookings in minutes
const PENDING_BOOKING_TIMEOUT_MINUTES = 15;

// Define the temporary reservation timeout in minutes
const RESERVATION_TIMEOUT_MINUTES = 5;

// Map to track temporary reservations
const reservations = new Map();

// Cleanup interval for expired reservations (every minute)
setInterval(() => {
  const now = new Date();
  for (const [key, reservation] of reservations.entries()) {
    const diffMinutes = (now.getTime() - reservation.timestamp) / (1000 * 60);
    if (diffMinutes > RESERVATION_TIMEOUT_MINUTES) {
      console.log(`Removing expired reservation: ${key}`);
      reservations.delete(key);
    }
  }
}, 60000);

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

/**
 * Check if a pending booking has expired
 * @param {Object} booking - The booking object
 * @returns {boolean} - True if the booking has expired
 */
function hasPendingBookingExpired(booking) {
  if (!booking || booking.status !== 'pending') {
    return false;
  }
  
  try {
    const createdAt = new Date(booking.created_at);
    const now = new Date();
    
    // Calculate the difference in minutes
    const diffMinutes = (now.getTime() - createdAt.getTime()) / (1000 * 60);
    
    // Check if the booking has expired based on the timeout
    return diffMinutes > PENDING_BOOKING_TIMEOUT_MINUTES;
  } catch (error) {
    console.error("Error checking if pending booking has expired:", error);
    return false;
  }
}

/**
 * Create a temporary reservation for a time slot
 * @param {string} date - The appointment date
 * @param {string} time - The appointment time
 * @param {string} groomer - The selected groomer
 * @returns {string} - Reservation ID
 */
export function createReservation(date, time, groomer) {
  const reservationId = `res_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const normalizedDate = normalizeDate(date);
  const normalizedTime = normalizeTime(time);
  
  const key = `${normalizedDate}_${normalizedTime}_${groomer}`;
  reservations.set(key, {
    id: reservationId,
    timestamp: Date.now()
  });
  
  console.log(`Created reservation ${reservationId} for ${key}`);
  return reservationId;
}

/**
 * Check if a reservation exists and is valid
 * @param {string} date - The appointment date
 * @param {string} time - The appointment time
 * @param {string} groomer - The selected groomer
 * @param {string} reservationId - The reservation ID to validate
 * @returns {boolean} - Whether the reservation is valid
 */
export function validateReservation(date, time, groomer, reservationId) {
  const normalizedDate = normalizeDate(date);
  const normalizedTime = normalizeTime(time);
  
  const key = `${normalizedDate}_${normalizedTime}_${groomer}`;
  const reservation = reservations.get(key);
  
  if (!reservation) {
    console.log(`No reservation found for ${key}`);
    return false;
  }
  
  if (reservation.id !== reservationId) {
    console.log(`Reservation ID mismatch for ${key}: expected ${reservation.id}, got ${reservationId}`);
    return false;
  }
  
  const now = new Date();
  const diffMinutes = (now.getTime() - reservation.timestamp) / (1000 * 60);
  if (diffMinutes > RESERVATION_TIMEOUT_MINUTES) {
    console.log(`Reservation ${reservationId} for ${key} has expired`);
    reservations.delete(key);
    return false;
  }
  
  return true;
}

/**
 * Remove a reservation after it's been used or cancelled
 * @param {string} date - The appointment date
 * @param {string} time - The appointment time
 * @param {string} groomer - The selected groomer
 */
export function removeReservation(date, time, groomer) {
  const normalizedDate = normalizeDate(date);
  const normalizedTime = normalizeTime(time);
  
  const key = `${normalizedDate}_${normalizedTime}_${groomer}`;
  if (reservations.has(key)) {
    console.log(`Removing reservation for ${key}`);
    reservations.delete(key);
    return true;
  }
  return false;
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
    
    // Filter bookings for the requested date
    const bookingsForDate = bookings.filter(booking => {
      // Ensure we normalize the booking date consistently
      const bookingDate = normalizeDate(booking.appointment_date);
      const isMatchingDate = bookingDate === normalizedDate;
      
      // Consider a booking valid (meaning the slot is taken) if it's either "confirmed" or "expired"
      // We don't want to show slots that are marked as "expired" in the database as available
      const isValidStatus = booking.status === "confirmed" || booking.status === "expired";
      
      // Consider empty service type as grooming
      const isGroomingService = !booking.service_type || booking.service_type === "grooming" || booking.service_type === "";
      
      console.log(`Checking booking: Date=${bookingDate} (Match=${isMatchingDate}), Status=${booking.status} (Valid=${isValidStatus}), Service=${booking.service_type} (Grooming=${isGroomingService})`);
      
      return isMatchingDate && isValidStatus && isGroomingService;
    });
    
    console.log(`Found ${bookingsForDate.length} valid bookings for date ${normalizedDate}`);
    
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
    
    // Also mark slots with active reservations as unavailable
    for (const [key, reservation] of reservations.entries()) {
      const [resDate, resTime, resGroomer] = key.split('_');
      if (resDate === normalizedDate) {
        console.log(`Marking reserved slot ${resTime} for ${resGroomer} as unavailable`);
        if (bookedSlotsByGroomer[resGroomer]) {
          bookedSlotsByGroomer[resGroomer].add(resTime);
        }
      }
    }
    
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
    
    // Check for expired pending bookings and update their status
    const now = new Date();
    const expiredBookings = bookings.filter(booking => 
      booking.status === 'pending' && hasPendingBookingExpired(booking)
    );
    
    // Log expired bookings for debugging
    if (expiredBookings.length > 0) {
      console.log(`Found ${expiredBookings.length} expired pending bookings`);
      
      // Update each expired booking to 'expired' status
      // This is done asynchronously, but we don't wait for it to complete
      expiredBookings.forEach(async (booking) => {
        try {
          await updateBookingStatus(booking.id, 'expired');
        } catch (error) {
          console.error(`Error updating expired booking ${booking.id}:`, error);
        }
      });
    }
    
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
    
    // Check if there's a valid reservation for this slot
    const groomerToCheck = bookingData.groomer || "Groomer 1";
    
    // Validate reservation if provided
    if (bookingData.reservationId) {
      const isValidReservation = validateReservation(
        normalizedDate, 
        normalizedTime, 
        groomerToCheck, 
        bookingData.reservationId
      );
      
      if (!isValidReservation) {
        throw new Error(`Your reservation for this time slot has expired. Please select another time.`);
      }
      
      // If valid, remove the reservation since we're booking it now
      removeReservation(normalizedDate, normalizedTime, groomerToCheck);
    } else {
      // Double-check by getting all current bookings directly
      const allBookings = await getBookings();
      const existingBooking = allBookings.find(booking => {
        const bookingDate = normalizeDate(booking.appointment_date);
        const bookingTime = normalizeTime(booking.appointment_time);
        const groomer = booking.groomer?.trim() || "Groomer 1";
        
        // Check if this booking is for the same date, time, and groomer
        return (
          bookingDate === normalizedDate && 
          bookingTime === normalizedTime &&
          groomer.toLowerCase() === groomerToCheck.toLowerCase()
        );
      });
      
      if (existingBooking) {
        console.error(`Slot ${normalizedTime} on ${normalizedDate} for ${groomerToCheck} is already booked`);
        throw new Error(`This time slot is already booked. Please select another time or groomer.`);
      }
      
      // Check if this slot is actually available before creating the booking
      const availableSlots = await getAvailableTimeSlots(normalizedDate);
      console.log(`Available slots for booking: ${JSON.stringify(availableSlots)}`);
      
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
      status: 'confirmed',
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

/**
 * Update the status of a booking
 * @param {string} bookingId - The ID of the booking to update
 * @param {string} newStatus - The new status ('confirmed', 'canceled', 'expired', etc.)
 * @returns {Promise<Object>} - The updated booking
 */
export async function updateBookingStatus(bookingId, newStatus) {
  try {
    console.log(`Updating booking ${bookingId} to status ${newStatus}`);
    
    // Get all bookings
    const bookings = await getBookings(true); // Force refresh
    
    // Find the booking with the given ID
    const bookingIndex = bookings.findIndex(booking => booking.id.toString() === bookingId.toString());
    
    if (bookingIndex === -1) {
      throw new Error(`Booking with ID ${bookingId} not found`);
    }
    
    const booking = bookings[bookingIndex];
    
    // Update the status in the booking object
    booking.status = newStatus;
    
    // Update the row in Google Sheets
    await updateRow(sheetsConfig.SHEET_NAMES.BOOKINGS, bookingIndex, booking);
    
    console.log(`Successfully updated booking ${bookingId} to status ${newStatus}`);
    
    // Return the updated booking
    return {
      id: booking.id,
      serviceType: booking.service_type,
      appointmentDate: booking.appointment_date,
      appointmentTime: booking.appointment_time,
      petName: booking.pet_name,
      petBreed: booking.pet_breed,
      petSize: booking.pet_size,
      specialRequests: booking.special_requests,
      customerName: booking.customer_name,
      customerEmail: booking.customer_email,
      customerPhone: booking.customer_phone,
      groomer: booking.groomer,
      status: booking.status,
      createdAt: booking.created_at
    };
  } catch (error) {
    console.error(`Error updating booking status for ${bookingId}:`, error);
    throw error;
  }
}

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
  updateBookingStatus,
  submitContactForm,
  createReservation,
  validateReservation,
  removeReservation
}; 