import { 
  type Booking, 
  type InsertBooking,
  type ContactFormValues,
  PetSize
} from "../shared/schema";
import { googleSheetsService } from "./googleSheets";
import { googleSheetsConfig } from "./config";

// Define array of time slots
const TIME_SLOTS = [
  "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"
];

// Define groomers
const GROOMERS = ["Groomer 1", "Groomer 2"];

/**
 * Utility function to normalize date strings to YYYY-MM-DD format
 * Handles timezone conversion to make dates comparable regardless of time component
 */
function normalizeDate(dateStr: string): string {
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

export interface IStorage {
  // Booking methods
  getBookings(): Promise<Booking[]>;
  getBooking(id: number): Promise<Booking | null>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  getAvailableTimeSlots(date: string): Promise<Array<{time: string, groomer: string, available?: boolean}>>;
  
  // Contact form methods
  submitContactForm(form: ContactFormValues): Promise<boolean>;
}

export class GoogleSheetsStorage implements IStorage {
  // Booking methods
  async getBookings(): Promise<Booking[]> {
    try {
      const rows = await googleSheetsService.getRows(googleSheetsConfig.sheets.bookings);
      
      return rows.map(row => ({
        id: parseInt(row.id),
        serviceType: row.service_type,
        groomingService: row.grooming_service || null,
        accommodationType: row.accommodation_type || null,
        durationHours: row.duration_hours ? parseInt(row.duration_hours) : null,
        durationDays: row.duration_days ? parseInt(row.duration_days) : null,
        appointmentDate: row.appointment_date,
        appointmentTime: row.appointment_time,
        petName: row.pet_name,
        petBreed: row.pet_breed,
        petSize: row.pet_size,
        addOnServices: row.add_on_services || null,
        specialRequests: row.special_requests || null,
        needsTransport: row.needs_transport === 'true',
        transportType: row.transport_type || null,
        pickupAddress: row.pickup_address || null,
        includeTreats: row.include_treats === 'true',
        treatType: row.treat_type || null,
        customerName: row.customer_name,
        customerPhone: row.customer_phone,
        customerEmail: row.customer_email,
        paymentMethod: row.payment_method,
        groomer: row.groomer || null,
        status: row.status,
        totalPrice: row.total_price ? parseInt(row.total_price) : null,
        reference: row.reference || null,
        createdAt: row.created_at ? new Date(row.created_at) : new Date()
      }));
    } catch (error) {
      console.error("Error getting bookings:", error);
      return [];
    }
  }
  
  async getBooking(id: number): Promise<Booking | null> {
    try {
      const rows = await googleSheetsService.getRows(googleSheetsConfig.sheets.bookings);
      const booking = rows.find(row => parseInt(row.id) === id);
      
      if (!booking) {
        return null;
      }
      
      return {
        id: parseInt(booking.id),
        serviceType: booking.service_type,
        groomingService: booking.grooming_service || null,
        accommodationType: booking.accommodation_type || null,
        durationHours: booking.duration_hours ? parseInt(booking.duration_hours) : null,
        durationDays: booking.duration_days ? parseInt(booking.duration_days) : null,
        appointmentDate: booking.appointment_date,
        appointmentTime: booking.appointment_time,
        petName: booking.pet_name,
        petBreed: booking.pet_breed,
        petSize: booking.pet_size,
        addOnServices: booking.add_on_services || null,
        specialRequests: booking.special_requests || null,
        needsTransport: booking.needs_transport === 'true',
        transportType: booking.transport_type || null,
        pickupAddress: booking.pickup_address || null,
        includeTreats: booking.include_treats === 'true',
        treatType: booking.treat_type || null,
        customerName: booking.customer_name,
        customerPhone: booking.customer_phone,
        customerEmail: booking.customer_email,
        paymentMethod: booking.payment_method,
        groomer: booking.groomer || null,
        status: booking.status,
        totalPrice: booking.total_price ? parseInt(booking.total_price) : null,
        reference: booking.reference || null,
        createdAt: booking.created_at ? new Date(booking.created_at) : new Date()
      };
    } catch (error) {
      console.error(`Error getting booking with ID ${id}:`, error);
      return null;
    }
  }
  
  async getAvailableTimeSlots(date: string): Promise<Array<{time: string, groomer: string, available?: boolean}>> {
    try {
      // Normalize date format
      const normalizedDate = normalizeDate(date);
      console.log(`Getting available time slots for date: ${normalizedDate}`);

      // Get all bookings for the specified date
      const bookings = await this.getBookings();
      
      // Filter bookings for the requested date with status confirmed or pending
      const bookingsForDate = bookings.filter(booking => 
        normalizeDate(booking.appointmentDate) === normalizedDate && 
        (booking.status === "confirmed" || booking.status === "pending") &&
        booking.serviceType === "grooming"
      );
      
      console.log(`Found ${bookingsForDate.length} bookings for date ${normalizedDate}`);
      
      // Track booked slots for each groomer
      const bookedSlotsByGroomer: Record<string, Set<string>> = {};
      
      // Initialize empty sets for each groomer
      GROOMERS.forEach(groomer => {
        bookedSlotsByGroomer[groomer] = new Set<string>();
      });
      
      // Populate booked slots for each groomer
      bookingsForDate.forEach(booking => {
        const bookedTime = booking.appointmentTime;
        const assignedGroomer = booking.groomer || "Groomer 1"; // Default to Groomer 1 if not specified
        
        if (bookedSlotsByGroomer[assignedGroomer]) {
          bookedSlotsByGroomer[assignedGroomer].add(bookedTime);
        }
      });
      
      // Format the result
      const result: Array<{time: string, groomer: string, available: boolean}> = [];
      
      // Add ALL time slots for each groomer to the result (both available and booked)
      for (const groomer of GROOMERS) {
        for (const timeSlot of TIME_SLOTS) {
          const isAvailable = !bookedSlotsByGroomer[groomer].has(timeSlot);
          result.push({
            time: timeSlot,
            groomer: groomer,
            available: isAvailable
          });
        }
      }
      
      return result;
    } catch (error) {
      console.error("Error getting available time slots:", error);
      return [];
    }
  }
  
  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    try {
      // Get available time slots for the requested date
      const availableTimeSlots = await this.getAvailableTimeSlots(insertBooking.appointmentDate);
      
      // Check if the requested time slot is available for any groomer
      const requestedSlot = availableTimeSlots.find(slot => 
        slot.time === insertBooking.appointmentTime && 
        (!insertBooking.groomer || slot.groomer === insertBooking.groomer)
      );
      
      if (!requestedSlot) {
        throw new Error(`The requested time slot ${insertBooking.appointmentTime} is not available${insertBooking.groomer ? ` for ${insertBooking.groomer}` : ''}.`);
      }
      
      // If groomer was not specified, assign the one from the available slot
      if (!insertBooking.groomer) {
        insertBooking.groomer = requestedSlot.groomer;
      }
      
      // Prepare booking data for Google Sheets
      const bookingData = {
        service_type: insertBooking.serviceType || 'grooming',
        grooming_service: insertBooking.groomingService || null,
        accommodation_type: insertBooking.accommodationType || null,
        duration_hours: insertBooking.durationHours || null,
        duration_days: insertBooking.durationDays || null,
        appointment_date: insertBooking.appointmentDate || new Date().toISOString().split('T')[0],
        appointment_time: insertBooking.appointmentTime || '10:00 AM',
        pet_name: insertBooking.petName || 'Pet',
        pet_breed: insertBooking.petBreed || 'Unknown',
        pet_size: insertBooking.petSize || PetSize.MEDIUM,
        add_on_services: insertBooking.addOnServices || null,
        special_requests: insertBooking.specialRequests || '',
        needs_transport: insertBooking.needsTransport ? 'true' : 'false',
        transport_type: insertBooking.transportType || null,
        pickup_address: insertBooking.pickupAddress || null,
        include_treats: insertBooking.includeTreats ? 'true' : 'false',
        treat_type: insertBooking.treatType || null,
        customer_name: insertBooking.customerName || 'Customer',
        customer_phone: insertBooking.customerPhone || 'Not provided',
        customer_email: insertBooking.customerEmail || 'Not provided',
        payment_method: insertBooking.paymentMethod || 'cash',
        groomer: insertBooking.groomer || null,
        status: insertBooking.status || 'pending',
        created_at: new Date().toISOString()
      };
      
      console.log("Sending booking data to Google Sheets:", bookingData);
      
      const booking = await googleSheetsService.appendRow(googleSheetsConfig.sheets.bookings, bookingData);
      
      return {
        id: parseInt(booking.id),
        serviceType: booking.service_type,
        groomingService: booking.grooming_service || null,
        accommodationType: booking.accommodation_type || null,
        durationHours: booking.duration_hours ? parseInt(booking.duration_hours) : null,
        durationDays: booking.duration_days ? parseInt(booking.duration_days) : null,
        appointmentDate: booking.appointment_date,
        appointmentTime: booking.appointment_time,
        petName: booking.pet_name,
        petBreed: booking.pet_breed,
        petSize: booking.pet_size,
        addOnServices: booking.add_on_services || null,
        specialRequests: booking.special_requests || null,
        needsTransport: booking.needs_transport === 'true',
        transportType: booking.transport_type || null,
        pickupAddress: booking.pickup_address || null,
        includeTreats: booking.include_treats === 'true',
        treatType: booking.treat_type || null,
        customerName: booking.customer_name,
        customerPhone: booking.customer_phone,
        customerEmail: booking.customer_email,
        paymentMethod: booking.payment_method,
        groomer: booking.groomer || null,
        status: booking.status,
        totalPrice: booking.total_price ? parseInt(booking.total_price) : null,
        reference: booking.reference || null,
        createdAt: booking.created_at ? new Date(booking.created_at) : new Date()
      };
    } catch (error) {
      console.error("Error creating booking:", error);
      throw error;
    }
  }
  
  // Contact form methods
  async submitContactForm(form: ContactFormValues): Promise<boolean> {
    try {
      await googleSheetsService.appendRow(googleSheetsConfig.sheets.contacts, {
        name: form.name,
        email: form.email,
        subject: form.subject,
        message: form.message,
        submitted_at: new Date().toISOString()
      });
      
      return true;
    } catch (error) {
      console.error("Error submitting contact form:", error);
      return false;
    }
  }
}

export const storage = new GoogleSheetsStorage();
