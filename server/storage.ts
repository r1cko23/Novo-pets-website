import { 
  type Booking, 
  type InsertBooking,
  type ContactFormValues,
  PetSize
} from "../shared/schema";
import { supabaseStorage } from "./supabaseStorageImpl";

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
  getAvailableTimeSlots(date: string): Promise<Array<{time: string, groomer: string, available: boolean}>>;
  updateBookingStatus(id: number, status: string): Promise<Booking>;
  
  // Contact form methods
  submitContactForm(form: ContactFormValues): Promise<boolean>;
}

// Use Supabase implementation directly
export const storage = supabaseStorage;
