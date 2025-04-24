import { 
  users, 
  type User, 
  type InsertUser, 
  bookings, 
  type Booking, 
  type InsertBooking,
  type ContactFormValues
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  // User methods (keeping original)
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Booking methods
  getBookings(): Promise<Booking[]>;
  getBooking(id: number): Promise<Booking | undefined>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  
  // Contact form methods
  submitContactForm(form: ContactFormValues): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }
  
  // Booking methods
  async getBookings(): Promise<Booking[]> {
    return await db.select().from(bookings);
  }
  
  async getBooking(id: number): Promise<Booking | undefined> {
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, id));
    return booking || undefined;
  }
  
  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    // Set default values if not provided
    const bookingData = {
      ...insertBooking,
      specialRequests: insertBooking.specialRequests || null,
      status: insertBooking.status || "confirmed"
    };
    
    const [booking] = await db
      .insert(bookings)
      .values(bookingData)
      .returning();
    
    return booking;
  }
  
  // Contact form methods
  async submitContactForm(form: ContactFormValues): Promise<boolean> {
    // In a real implementation, this would send an email or store the contact form
    // For now, we'll just return true to simulate successful submission
    console.log("Contact form submitted:", form);
    return true;
  }
}

export const storage = new DatabaseStorage();
