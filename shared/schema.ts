import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table (keeping the existing one)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Pet sizes
export const PetSize = {
  SMALL: "small",
  MEDIUM: "medium",
  LARGE: "large",
  GIANT: "giant",
} as const;

export type PetSizeType = typeof PetSize[keyof typeof PetSize];

// Service types
export const ServiceType = {
  GROOMING: "grooming",
  HOTEL: "hotel",
  DAYCARE: "daycare",
  TRANSPORT: "transport",
  TREATS: "treats",
} as const;

export type ServiceTypeValue = typeof ServiceType[keyof typeof ServiceType];

// Payment methods
export const PaymentMethod = {
  CASH: "cash",
  BANK_TRANSFER: "bank_transfer",
  ONLINE: "online",
} as const;

export type PaymentMethodType = typeof PaymentMethod[keyof typeof PaymentMethod];

// Bookings
export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  serviceType: text("service_type").notNull(),
  appointmentDate: text("appointment_date").notNull(),
  appointmentTime: text("appointment_time").notNull(),
  petName: text("pet_name").notNull(),
  petBreed: text("pet_breed").notNull(),
  petSize: text("pet_size").notNull(),
  specialRequests: text("special_requests"),
  needsTransport: boolean("needs_transport").default(false),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone").notNull(),
  customerEmail: text("customer_email").notNull(),
  paymentMethod: text("payment_method").notNull(),
  status: text("status").default("confirmed"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  createdAt: true,
});

export const bookingFormSchema = z.object({
  serviceType: z.enum([
    ServiceType.GROOMING,
    ServiceType.HOTEL,
    ServiceType.DAYCARE,
    ServiceType.TRANSPORT,
    ServiceType.TREATS
  ]),
  appointmentDate: z.string().min(1, { message: "Please select a date" }),
  appointmentTime: z.string().min(1, { message: "Please select a time slot" }),
  petName: z.string().min(1, { message: "Please enter your pet's name" }),
  petBreed: z.string().min(1, { message: "Please enter your pet's breed" }),
  petSize: z.enum([PetSize.SMALL, PetSize.MEDIUM, PetSize.LARGE, PetSize.GIANT]),
  specialRequests: z.string().optional(),
  needsTransport: z.boolean().default(false),
  customerName: z.string().min(1, { message: "Please enter your name" }),
  customerPhone: z.string().min(6, { message: "Please enter a valid phone number" }),
  customerEmail: z.string().email({ message: "Please enter a valid email address" }),
  paymentMethod: z.enum([
    PaymentMethod.CASH,
    PaymentMethod.BANK_TRANSFER,
    PaymentMethod.ONLINE
  ]),
  status: z.string().default("confirmed"),
});

export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookings.$inferSelect;
export type BookingFormValues = z.infer<typeof bookingFormSchema>;

// Contact form 
export const contactFormSchema = z.object({
  name: z.string().min(1, { message: "Please enter your name" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  subject: z.string().min(1, { message: "Please select a subject" }),
  message: z.string().min(10, { message: "Message should be at least 10 characters" }),
});

export type ContactFormValues = z.infer<typeof contactFormSchema>;

// Pricing data for services
export const groomingPrices = [
  {
    service: "Basic Groom", 
    description: "Bath, Blowdry, Nail Trim, Ear Cleaning, Paw Moisturizing",
    small: 600,
    medium: 850,
    large: 1000,
    giant: 1300
  },
  {
    service: "Full Groom", 
    description: "Basic + Haircut & Styling, Deep Conditioning, De-shedding, Cologne",
    small: 900,
    medium: 1200,
    large: 1500,
    giant: 1900
  },
  {
    service: "Luxury Spa Package", 
    description: "Full Groom + Hypoallergenic Shampoo, Aromatherapy, Paw Balm, Teeth Brushing",
    small: 1200,
    medium: 1500,
    large: 1900,
    giant: 2400
  },
  {
    service: "Express Grooming",
    description: "1-hour rush service, Limited Slots",
    small: 1400,
    medium: 1800,
    large: 2200,
    giant: 2800
  }
];

export const spaAddOns = [
  { service: "Aromatherapy Bliss Add-On", price: "₱250 - ₱450" },
  { service: "Deep Coat Hydration Mask", price: "₱350 - ₱500" },
  { service: "Luxury Flea & Tick Treatment", price: "₱450 - ₱600" },
  { service: "Paw Balm & Nail Spa Treatment", price: "₱300 - ₱450" }
];

export const hotelPrices = [
  {
    type: "Standard",
    description: "Comfortable accommodations with regular care",
    small: 1000,
    medium: 1150,
    large: 1350
  },
  {
    type: "Owner's Cage",
    description: "Using pet owner's provided cage",
    small: 850,
    medium: 1000,
    large: 1200
  },
  {
    type: "Holiday/Weekend Rate",
    description: "Special rates for holidays and weekends",
    small: 1200,
    medium: 1350,
    large: 1550
  }
];

export const daycarePrices = [
  { size: "Small", rate: 100, notes: "Minimum 3 hours" },
  { size: "Medium", rate: 130, notes: "Minimum 3 hours" },
  { size: "Large", rate: 150, notes: "Minimum 3 hours" },
  { size: "Giant", rate: 180, notes: "Minimum 3 hours" }
];

export const transportPrices = [
  { 
    service: "One-way Transport", 
    description: "Pick-up or drop-off service", 
    price: 280, 
    notes: "Within 5km radius" 
  },
  { 
    service: "Round-trip Transport", 
    description: "Both pick-up and drop-off service", 
    price: 380, 
    notes: "Within 5km radius" 
  }
];

export const treatsPrices = [
  { 
    type: "For Pets (1 Cup)", 
    price: 85, 
    description: "Pet-friendly frozen yogurt" 
  },
  { 
    type: "For Humans (One Size)", 
    price: 150, 
    description: "Human-friendly frozen yogurt" 
  },
  { 
    type: "Premium Yogurt", 
    price: 285, 
    description: "With strawberry bits & Dubai chocolate pistachio" 
  }
];

// Service overview items for homepage
export const serviceOverviewItems = [
  {
    title: "Luxury Grooming",
    description: "Pamper your pet with our premium grooming services including aromatherapy and spa treatments.",
    image: "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?q=80&w=800&auto=format&fit=crop"
  },
  {
    title: "Boutique Pet Hotel",
    description: "Comfortable accommodations with personalized care for your pet's staycation needs.",
    image: "https://images.unsplash.com/photo-1541599540903-216a046a8d00?q=80&w=800&auto=format&fit=crop"
  },
  {
    title: "Exclusive Daycare",
    description: "Fun and safe supervised activities in a social setting for your pet while you're away.",
    image: "https://images.unsplash.com/photo-1548199569-3e1c6aa8f469?q=80&w=800&auto=format&fit=crop"
  },
  {
    title: "Pick-up & Drop-off",
    description: "Convenient transport service for your pet to and from our facility within a 5km radius.",
    image: "https://images.unsplash.com/photo-1583512603806-077998240c7a?q=80&w=800&auto=format&fit=crop"
  }
];

// Testimonials data
export const testimonials = [
  {
    name: "Max & Sarah",
    image: "https://images.unsplash.com/photo-1517849845537-4d257902454a?q=80&w=100&auto=format&fit=crop",
    text: "Novo Pets is absolutely incredible! My dog Max comes back from grooming looking and smelling amazing. The staff truly care about pets and treat him like royalty.",
    serviceUsed: "Golden Retriever • Full Groom Service",
    rating: 5
  },
  {
    name: "Luna & Miguel",
    image: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=100&auto=format&fit=crop",
    text: "I've tried many pet hotels, but none compare to Novo Pets. Luna always comes back happy and well-cared for. Their pick-up service is super convenient too!",
    serviceUsed: "Siamese Cat • Pet Hotel Service",
    rating: 5
  },
  {
    name: "Rocky & Jamie",
    image: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?q=80&w=100&auto=format&fit=crop",
    text: "The Luxury Spa Package is worth every peso! Rocky's coat has never looked better, and he even seems more confident after his visits. The staff is knowledgeable and caring.",
    serviceUsed: "French Bulldog • Luxury Spa Package",
    rating: 4.5
  },
  {
    name: "Bella & Nina",
    image: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=100&auto=format&fit=crop",
    text: "Bella loves the daycare at Novo Pets! The staff sends photos throughout the day, and she comes home happily tired. Their frozen yogurt treats are her favorite!",
    serviceUsed: "Pomeranian • Daycare & Treats",
    rating: 5
  }
];
