import { 
  type Booking, 
  type InsertBooking,
  type ContactFormValues,
  PetSize,
  ServiceType
} from "../shared/schema";
import { supabase } from "./supabase";

// Define array of time slots
const TIME_SLOTS = [
  "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"
];

// Define groomers
const GROOMERS = ["Groomer 1", "Groomer 2"];

/**
 * Utility function to normalize date strings to YYYY-MM-DD format
 */
function normalizeDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
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
  getAvailableTimeSlots(date: string): Promise<Array<{time: string, groomer: string, available: boolean}>>;
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
      const groomingBookings = groomingData.map(appointment => ({
        id: appointment.id,
        serviceType: ServiceType.GROOMING,
        groomingService: appointment.grooming_service,
        accommodationType: null,
        durationHours: null,
        durationDays: null,
        appointmentDate: appointment.appointment_date,
        appointmentTime: appointment.appointment_time,
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
      }));
      
      // Map hotel bookings to Booking type
      const hotelBookings = hotelData.map(booking => {
        // Calculate duration in days
        const checkInDate = new Date(booking.check_in_date);
        const checkOutDate = new Date(booking.check_out_date);
        const durationDays = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
        
        return {
          id: booking.id,
          serviceType: ServiceType.HOTEL,
          groomingService: null,
          accommodationType: booking.accommodation_type,
          durationHours: null,
          durationDays: durationDays,
          appointmentDate: booking.check_in_date, // Use check-in date as appointment date
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
        return {
          id: groomingData.id,
          serviceType: ServiceType.GROOMING,
          groomingService: groomingData.grooming_service,
          accommodationType: null,
          durationHours: null,
          durationDays: null,
          appointmentDate: groomingData.appointment_date,
          appointmentTime: groomingData.appointment_time,
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
        // Calculate duration in days
        const checkInDate = new Date(hotelData.check_in_date);
        const checkOutDate = new Date(hotelData.check_out_date);
        const durationDays = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
        
        return {
          id: hotelData.id,
          serviceType: ServiceType.HOTEL,
          groomingService: null,
          accommodationType: hotelData.accommodation_type,
          durationHours: null,
          durationDays: durationDays,
          appointmentDate: hotelData.check_in_date,
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
  
  async getAvailableTimeSlots(date: string): Promise<Array<{time: string, groomer: string, available: boolean}>> {
    try {
      const normalizedDate = normalizeDate(date);
      console.log(`Getting available time slots for date: ${normalizedDate}`);
      
      // Get all grooming appointments for the specified date
      const { data: appointments, error } = await supabase
        .from('grooming_appointments')
        .select('*')
        .eq('appointment_date', normalizedDate)
        .in('status', ['confirmed', 'pending']);
      
      if (error) {
        console.error("Error fetching appointments for availability check:", error);
        throw error; // Propagate error instead of returning empty array
      }
      
      console.log(`Found ${appointments?.length || 0} existing appointments for ${normalizedDate}`);
      
      // Track booked slots for each groomer
      const bookedSlotsByGroomer: Record<string, Set<string>> = {};
      
      // Initialize empty sets for each groomer
      GROOMERS.forEach(groomer => {
        bookedSlotsByGroomer[groomer] = new Set<string>();
      });
      
      // Populate booked slots for each groomer
      if (appointments && appointments.length > 0) {
        appointments.forEach(appointment => {
          const bookedTime = appointment.appointment_time;
          const assignedGroomer = appointment.groomer || "Groomer 1"; // Default to Groomer 1 if not specified
          
          console.log(`Booking found: ${assignedGroomer} at ${bookedTime}`);
          if (bookedSlotsByGroomer[assignedGroomer]) {
            bookedSlotsByGroomer[assignedGroomer].add(bookedTime);
          }
        });
      }
      
      // Generate all time slots with availability information
      const allTimeSlots: Array<{time: string, groomer: string, available: boolean}> = [];
      
      // Create the availability data structure
      TIME_SLOTS.forEach(time => {
        GROOMERS.forEach(groomer => {
          const isBooked = bookedSlotsByGroomer[groomer]?.has(time) || false;
          allTimeSlots.push({
            time,
            groomer,
            available: !isBooked
          });
        });
      });
      
      console.log(`Returning ${allTimeSlots.length} time slots`);
      return allTimeSlots;
    } catch (error) {
      console.error("Error getting available time slots:", error);
      // Return all slots as available as a fallback instead of an empty array
      const fallbackSlots: Array<{time: string, groomer: string, available: boolean}> = [];
      TIME_SLOTS.forEach(time => {
        GROOMERS.forEach(groomer => {
          fallbackSlots.push({ time, groomer, available: true });
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
      // Check if the slot is available
      const availableSlots = await this.getAvailableTimeSlots(booking.appointmentDate);
      const requestedSlot = availableSlots.find(
        slot => slot.time === booking.appointmentTime && 
                slot.groomer === (booking.groomer || "Groomer 1") && 
                slot.available === true
      );
      
      if (!requestedSlot) {
        throw new Error(`The requested time slot is not available.`);
      }
      
      // Prepare data for Supabase
      const appointmentData = {
        appointment_date: normalizeDate(booking.appointmentDate),
        appointment_time: booking.appointmentTime,
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
      
      // Insert into Supabase
      const { data, error } = await supabase
        .from('grooming_appointments')
        .insert(appointmentData)
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      // Convert to Booking type
      return {
        id: data.id,
        serviceType: ServiceType.GROOMING,
        groomingService: data.grooming_service,
        accommodationType: null,
        durationHours: null,
        durationDays: null,
        appointmentDate: data.appointment_date,
        appointmentTime: data.appointment_time,
        petName: data.pet_name,
        petBreed: data.pet_breed,
        petSize: data.pet_size as typeof PetSize[keyof typeof PetSize],
        addOnServices: data.add_on_services,
        specialRequests: data.special_requests,
        needsTransport: data.needs_transport,
        transportType: data.transport_type,
        pickupAddress: data.pickup_address,
        includeTreats: false,
        treatType: null,
        customerName: data.customer_name,
        customerPhone: data.customer_phone,
        customerEmail: data.customer_email,
        paymentMethod: "cash",
        groomer: data.groomer,
        status: data.status,
        totalPrice: null,
        reference: data.reference,
        createdAt: new Date(data.created_at)
      };
    } catch (error) {
      console.error("Error creating grooming appointment:", error);
      throw error;
    }
  }
  
  private async createHotelBooking(booking: InsertBooking): Promise<Booking> {
    try {
      // Calculate check-out date based on duration
      const checkInDate = normalizeDate(booking.appointmentDate);
      const duration = booking.durationDays || 1;
      
      const checkInDateObj = new Date(checkInDate);
      const checkOutDateObj = new Date(checkInDateObj);
      checkOutDateObj.setDate(checkOutDateObj.getDate() + duration);
      const checkOutDate = normalizeDate(checkOutDateObj.toISOString());
      
      console.log(`Creating hotel booking: Check-in ${checkInDate}, Check-out ${checkOutDate}, Duration: ${duration} days`);
      
      // Prepare data for Supabase
      const hotelData = {
        check_in_date: checkInDate,
        check_out_date: checkOutDate,
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
      
      // Convert to Booking type
      return {
        id: data.id,
        serviceType: ServiceType.HOTEL,
        groomingService: null,
        accommodationType: data.accommodation_type,
        durationHours: null,
        durationDays: duration,
        appointmentDate: data.check_in_date,
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
        
        // Convert to Booking type
        return {
          id: updatedGrooming.id,
          serviceType: ServiceType.GROOMING,
          groomingService: updatedGrooming.grooming_service,
          accommodationType: null,
          durationHours: null,
          durationDays: null,
          appointmentDate: updatedGrooming.appointment_date,
          appointmentTime: updatedGrooming.appointment_time,
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
}

export const supabaseStorage = new SupabaseStorage(); 