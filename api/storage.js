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
    // Create a Date object
    const date = new Date(dateStr);
    
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

// Get available time slots for a specific date
export async function getAvailableTimeSlots(date) {
  try {
    // Normalize date format
    const normalizedDate = normalizeDate(date);
    console.log(`Getting available time slots for date: ${normalizedDate}`);

    // Get all bookings
    const bookings = await getBookings();
    
    // Filter bookings for the requested date with status confirmed or pending
    const bookingsForDate = bookings.filter(booking => 
      normalizeDate(booking.appointment_date) === normalizedDate && 
      (booking.status === "confirmed" || booking.status === "pending") &&
      booking.service_type === "grooming"
    );
    
    console.log(`Found ${bookingsForDate.length} bookings for date ${normalizedDate}`);
    
    // Track booked slots for each groomer
    const bookedSlotsByGroomer = {};
    
    // Initialize empty sets for each groomer
    GROOMERS.forEach(groomer => {
      bookedSlotsByGroomer[groomer] = new Set();
    });
    
    // Populate booked slots for each groomer
    bookingsForDate.forEach(booking => {
      const bookedTime = booking.appointment_time;
      const assignedGroomer = booking.groomer || "Groomer 1"; // Default to Groomer 1 if not specified
      
      if (bookedSlotsByGroomer[assignedGroomer]) {
        bookedSlotsByGroomer[assignedGroomer].add(bookedTime);
      }
    });
    
    // Create map of available slots for each groomer
    const availableSlotsByGroomer = {};
    
    // For each groomer, determine available slots
    GROOMERS.forEach(groomer => {
      availableSlotsByGroomer[groomer] = TIME_SLOTS.filter(
        timeSlot => !bookedSlotsByGroomer[groomer].has(timeSlot)
      );
    });
    
    // Format the result
    const result = [];
    
    // Add available slots for each groomer to the result
    for (const groomer of GROOMERS) {
      const slots = availableSlotsByGroomer[groomer];
      slots.forEach(slot => {
        result.push({
          time: slot,
          groomer: groomer
        });
      });
    }
    
    return result;
  } catch (error) {
    console.error("Error getting available time slots:", error);
    // Fallback to returning all time slots if there's an error
    const result = [];
    for (const groomer of GROOMERS) {
      for (const timeSlot of TIME_SLOTS) {
        result.push({
          time: timeSlot,
          groomer: groomer
        });
      }
    }
    return result;
  }
}

// Get all bookings from Google Sheets
async function getBookings() {
  try {
    return await getRows(sheetsConfig.SHEET_NAMES.BOOKINGS);
  } catch (error) {
    console.error("Error getting bookings:", error);
    return [];
  }
}

// Create a booking in Google Sheets
export async function createBooking(bookingData) {
  try {
    // Prepare the row data for Google Sheets
    const rowData = {
      id: Date.now().toString(),
      service_type: bookingData.serviceType || 'grooming',
      appointment_date: bookingData.appointmentDate || '',
      appointment_time: bookingData.appointmentTime || '',
      pet_name: bookingData.petName || '',
      pet_breed: bookingData.petBreed || '',
      pet_size: bookingData.petSize || '',
      customer_name: bookingData.customerName || '',
      customer_email: bookingData.customerEmail || '',
      customer_phone: bookingData.customerPhone || '',
      groomer: bookingData.groomer || '',
      status: 'pending',
      created_at: new Date().toISOString()
    };
    
    // Add additional fields if present
    if (bookingData.specialRequests) rowData.special_requests = bookingData.specialRequests;
    if (bookingData.addOnServices) rowData.add_on_services = bookingData.addOnServices;
    
    // Append the row to Google Sheets
    const result = await appendRow(sheetsConfig.SHEET_NAMES.BOOKINGS, rowData);
    
    // Return a properly formatted booking object
    return {
      id: parseInt(rowData.id),
      serviceType: rowData.service_type,
      appointmentDate: rowData.appointment_date,
      appointmentTime: rowData.appointment_time,
      petName: rowData.pet_name,
      petBreed: rowData.pet_breed,
      petSize: rowData.pet_size,
      customerName: rowData.customer_name,
      customerEmail: rowData.customer_email,
      customerPhone: rowData.customer_phone,
      groomer: rowData.groomer,
      status: rowData.status,
      createdAt: rowData.created_at
    };
  } catch (error) {
    console.error("Error creating booking:", error);
    // Return a mock booking in case of error to avoid breaking the client
    return {
      id: Date.now(),
      serviceType: bookingData.serviceType,
      appointmentDate: bookingData.appointmentDate,
      appointmentTime: bookingData.appointmentTime,
      petName: bookingData.petName,
      petBreed: bookingData.petBreed,
      petSize: bookingData.petSize,
      customerName: bookingData.customerName,
      customerEmail: bookingData.customerEmail,
      customerPhone: bookingData.customerPhone,
      groomer: bookingData.groomer,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
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