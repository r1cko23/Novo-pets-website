import { 
  users, 
  type User, 
  type InsertUser, 
  bookings, 
  type Booking, 
  type InsertBooking,
  type ContactFormValues
} from "@shared/schema";

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

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private bookings: Map<number, Booking>;
  userCurrentId: number;
  bookingCurrentId: number;

  constructor() {
    this.users = new Map();
    this.bookings = new Map();
    this.userCurrentId = 1;
    this.bookingCurrentId = 1;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Booking methods
  async getBookings(): Promise<Booking[]> {
    return Array.from(this.bookings.values());
  }
  
  async getBooking(id: number): Promise<Booking | undefined> {
    return this.bookings.get(id);
  }
  
  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    const id = this.bookingCurrentId++;
    const now = new Date();
    
    const booking: Booking = { 
      ...insertBooking, 
      id,
      status: insertBooking.status || "confirmed",
      createdAt: now 
    };
    
    this.bookings.set(id, booking);
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

export const storage = new MemStorage();
