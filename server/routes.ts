import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { bookingFormSchema, contactFormSchema } from "../shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { supabase } from "./supabase";

/**
 * IMPORTANT NOTE ON DATE HANDLING:
 * 
 * When working with PostgreSQL date columns (not text), there's a timezone issue
 * where dates can appear shifted by 1 day when stored and retrieved.
 * 
 * Our approach:
 * 1. For database queries: Add +1 day to adjust for PostgreSQL's timezone behavior
 * 2. For client display: Subtract -1 day from retrieved dates to show the correct original date
 * 
 * This adjustment is handled in the storage implementation for all date-related operations.
 * If the database schema is changed to use 'text' instead of 'date' columns, this adjustment
 * would not be necessary.
 */

// Simple in-memory store for temporary reservations
// In production, this should be moved to a proper database or cache like Redis
interface TimeSlotReservation {
  id: string;
  date: string;
  time: string;
  groomer: string;
  expiresAt: number; // Unix timestamp
}

const reservations: Map<string, TimeSlotReservation> = new Map();

// Clean expired reservations every minute
setInterval(() => {
  const now = Date.now();
  let countRemoved = 0;
  
  reservations.forEach((reservation, id) => {
    if (reservation.expiresAt < now) {
      reservations.delete(id);
      countRemoved++;
    }
  });
  
  if (countRemoved > 0) {
    console.log(`[Reservations] Cleaned up ${countRemoved} expired reservations`);
  }
}, 60000);

// Admin authentication middleware - simplified version
const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const adminEmail = req.headers['admin-email'] as string;
    
    console.log(`[Auth] Request to ${req.path}, Admin email: ${adminEmail ? 'Present' : 'Missing'}`);
    
    if (!adminEmail) {
      return res.status(401).json({ 
        success: false, 
        message: "Authentication required. Please provide admin email." 
      });
    }
    
    // Find user by email in the users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', adminEmail)
      .eq('role', 'admin')
      .single();
    
    if (userError || !userData) {
      console.error(`[Auth] Admin authentication failed for ${adminEmail}:`, userError);
      return res.status(401).json({ 
        success: false, 
        message: "Unauthorized: Admin access required" 
      });
    }
    
    console.log(`[Auth] Admin authenticated: ${adminEmail}`);
    
    // Attach user info to request
    (req as any).user = { email: adminEmail };
    
    next();
  } catch (error) {
    console.error("[Auth] Middleware error:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Authentication failed due to server error." 
    });
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Admin login route - simplified version
  app.post("/api/admin/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ 
          success: false, 
          message: "Email and password are required" 
        });
      }
      
      // Find user by email in the users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();
      
      if (userError || !userData) {
        return res.status(401).json({ 
          success: false, 
          message: "Invalid credentials" 
        });
      }
      
      // Check if user has admin role
      if (userData.role !== 'admin') {
        return res.status(403).json({ 
          success: false, 
          message: "Unauthorized: Admin access required" 
        });
      }
      
      // Verify password
      if (userData.password !== password) {
        return res.status(401).json({ 
          success: false, 
          message: "Invalid credentials" 
        });
      }
      
      // Return user info instead of token
      res.status(200).json({ 
        success: true, 
        user: { 
          email: userData.email,
          username: userData.username,
          role: userData.role
        } 
      });
    } catch (error) {
      console.error("Admin login error:", error);
      res.status(500).json({ 
        success: false, 
        message: "Login failed" 
      });
    }
  });
  
  // Create admin user (this should be protected or removed in production)
  app.post("/api/admin/create", async (req: Request, res: Response) => {
    try {
      const { email, username, password } = req.body;
      
      if (!email || !username || !password) {
        return res.status(400).json({ 
          success: false, 
          message: "Email, username, and password are required" 
        });
      }
      
      // Check if user already exists
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('email')
        .eq('email', email)
        .maybeSingle();
      
      if (existingUser) {
        return res.status(409).json({ 
          success: false, 
          message: "User with this email already exists" 
        });
      }
      
      // In a production environment, you would hash the password here
      // Example: const hashedPassword = await bcrypt.hash(password, 10);
      
      // Create new admin user
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          email,
          username,
          password: password, // Should be hashed in production
          role: 'admin',
          created_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (createError) {
        console.error("Error creating admin user:", createError);
        return res.status(500).json({ 
          success: false, 
          message: "Failed to create admin user" 
        });
      }
      
      // Return success without sensitive data
      return res.status(201).json({ 
        success: true, 
        message: "Admin user created successfully",
        user: {
          email: newUser.email,
          username: newUser.username,
          role: newUser.role
        }
      });
    } catch (error) {
      console.error("Error in admin creation:", error);
      return res.status(500).json({ 
        success: false, 
        message: "Failed to create admin user" 
      });
    }
  });
  
  // Update booking status route (protected)
  app.put("/api/bookings/:id/status", authenticate, async (req: Request, res: Response) => {
    try {
      const bookingId = parseInt(req.params.id);
      const { status } = req.body;
      
      if (isNaN(bookingId)) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid booking ID" 
        });
      }
      
      if (!status || typeof status !== 'string') {
        return res.status(400).json({ 
          success: false, 
          message: "Status is required" 
        });
      }
      
      const allowedStatuses = ['confirmed', 'completed', 'cancelled', 'pending'];
      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid status value" 
        });
      }
      
      const updatedBooking = await storage.updateBookingStatus(bookingId, status);
      
      return res.status(200).json({
        success: true,
        message: "Booking status updated successfully",
        data: updatedBooking
      });
    } catch (error) {
      console.error("Error updating booking status:", error);
      return res.status(500).json({ 
        success: false, 
        message: "Failed to update booking status" 
      });
    }
  });

  // prefix all routes with /api
  
  // Booking routes
  app.post("/api/bookings", async (req: Request, res: Response) => {
    try {
      console.log("Received booking request:", req.body);
      
      const validatedData = bookingFormSchema.parse(req.body);
      
      // Convert addOnServices from string[] to string if needed
      const bookingData = {
        ...validatedData,
        // Convert array to string if it exists, otherwise use the existing value or null
        addOnServices: Array.isArray(validatedData.addOnServices) 
          ? validatedData.addOnServices.join(',') 
          : (validatedData.addOnServices || null)
      };
      
      console.log("Processed booking data:", bookingData);
      
      // Check if there's a reservation ID
      const reservationId = req.body.reservationId;
      if (reservationId && reservations.has(reservationId)) {
        const reservation = reservations.get(reservationId)!;
        
        // Verify the reservation matches the booking details
        if (reservation.date === bookingData.appointmentDate && 
            reservation.time === bookingData.appointmentTime && 
            reservation.groomer === bookingData.groomer) {
          
          console.log(`[API] Valid reservation ${reservationId} found for booking`);
          
          // Remove the reservation as we're now creating the actual booking
          reservations.delete(reservationId);
        } else {
          console.log(`[API] Reservation ${reservationId} details don't match booking details`);
        }
      } else if (reservationId) {
        console.log(`[API] Reservation ${reservationId} not found or expired`);
      }
      
      try {
        const booking = await storage.createBooking(bookingData);
        return res.status(201).json({ 
          success: true, 
          message: "Booking created successfully",
          data: booking 
        });
      } catch (storageError) {
        console.error("Storage error creating booking:", storageError);
        
        if (storageError instanceof Error && storageError.message.includes("not available")) {
          return res.status(409).json({ 
            success: false, 
            message: storageError.message 
          });
        }
        
        throw storageError; // Re-throw to be caught by outer handler
      }
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ 
          success: false, 
          message: "Validation error", 
          errors: validationError.details
        });
      }
      
      console.error("Error creating booking:", error);
      
      return res.status(500).json({ 
        success: false, 
        message: error instanceof Error ? error.message : "Failed to create booking" 
      });
    }
  });
  
  app.get("/api/bookings", async (req: Request, res: Response) => {
    try {
      // Check if request is authenticated
      const adminEmail = req.headers['admin-email'] as string;
      console.log(`[API] GET /api/bookings request from ${adminEmail ? 'admin user' : 'public user'}`);
      
      // If admin email provided, verify admin access
      let isAdmin = false;
      if (adminEmail) {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('role')
          .eq('email', adminEmail)
          .eq('role', 'admin')
          .single();
        
        isAdmin = !userError && !!userData;
      }
      
      const bookings = await storage.getBookings();
      
      // If not admin, filter out sensitive data
      if (!isAdmin) {
        const publicBookings = bookings.map(booking => {
          const { customerEmail, customerPhone, ...publicData } = booking;
          return {
            ...publicData,
            // Mask customer data for non-admin users
            customerName: booking.customerName,
            customerEmail: booking.customerEmail.replace(/(.{2})(.*)(@.*)/, '$1***$3'),
            customerPhone: '***' + booking.customerPhone.slice(-4)
          };
        });
        return res.status(200).json(publicBookings);
      }
      
      return res.status(200).json(bookings);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      return res.status(500).json({ 
        success: false, 
        message: "Failed to fetch bookings" 
      });
    }
  });
  
  app.get("/api/bookings/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ success: false, message: "Invalid booking ID" });
      }
      
      const booking = await storage.getBooking(id);
      if (!booking) {
        return res.status(404).json({ success: false, message: "Booking not found" });
      }
      
      return res.status(200).json(booking);
    } catch (error) {
      console.error("Error fetching booking:", error);
      return res.status(500).json({ 
        success: false, 
        message: "Failed to fetch booking" 
      });
    }
  });
  
  // Get available time slots for a specific date
  app.get("/api/availability", async (req: Request, res: Response) => {
    try {
      const { date } = req.query;
      
      if (!date || typeof date !== 'string') {
        return res.status(400).json({ 
          success: false, 
          message: "Date parameter is required" 
        });
      }
      
      console.log(`[API] Received availability request for date: ${date}`);
      
      try {
        const availableTimeSlots = await storage.getAvailableTimeSlots(date);
        console.log(`[API] Returning ${availableTimeSlots.length} time slots for date ${date}`);
        
        return res.status(200).json({ 
          success: true, 
          availableTimeSlots 
        });
      } catch (availabilityError) {
        console.error("Error fetching availability:", availabilityError);
        
        // Define fallback time slots (all available)
        const TIME_SLOTS = [
          "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"
        ];
        const GROOMERS = ["Groomer 1", "Groomer 2"];
        
        const fallbackTimeSlots = TIME_SLOTS.flatMap(time => 
          GROOMERS.map(groomer => ({ 
            time, 
            groomer, 
            available: true 
          }))
        );
        
        console.log(`[API] Error in availability check, returning ${fallbackTimeSlots.length} fallback time slots`);
        
        // Return fallback slots in case of error
        return res.status(200).json({ 
          success: true, 
          availableTimeSlots: fallbackTimeSlots,
          message: "Using fallback availability data due to server error"
        });
      }
    } catch (error) {
      console.error("Unhandled error in availability endpoint:", error);
      
      // Define fallback time slots (all available)
      const TIME_SLOTS = [
        "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"
      ];
      const GROOMERS = ["Groomer 1", "Groomer 2"];
      
      const fallbackTimeSlots = TIME_SLOTS.flatMap(time => 
        GROOMERS.map(groomer => ({ 
          time, 
          groomer, 
          available: true 
        }))
      );
      
      return res.status(200).json({ 
        success: true, 
        availableTimeSlots: fallbackTimeSlots,
        message: "Using fallback availability data due to server error"
      });
    }
  });
  
  // Create a temporary reservation for a time slot
  app.post("/api/reservations", async (req: Request, res: Response) => {
    try {
      const { appointmentDate, appointmentTime, groomer } = req.body;
      
      if (!appointmentDate || !appointmentTime || !groomer) {
        return res.status(400).json({
          success: false,
          message: "Date, time, and groomer are required"
        });
      }
      
      console.log(`[API] Received reservation request for ${appointmentDate} at ${appointmentTime} with ${groomer}`);
      
      // Check if the slot is available
      try {
        const availableTimeSlots = await storage.getAvailableTimeSlots(appointmentDate);
        const requestedSlot = availableTimeSlots.find(
          slot => slot.time === appointmentTime && 
                  slot.groomer === groomer && 
                  slot.available === true
        );
        
        if (!requestedSlot) {
          return res.status(409).json({
            success: false,
            message: "The requested time slot is no longer available"
          });
        }
        
        // Check if there's an existing reservation for this slot
        let slotAlreadyReserved = false;
        
        // When checking against existing reservations, we need to use the original date
        // since reservations are stored in memory with the original date format
        reservations.forEach(reservation => {
          if (reservation.date === appointmentDate && 
              reservation.time === appointmentTime && 
              reservation.groomer === groomer) {
            slotAlreadyReserved = true;
          }
        });
        
        if (slotAlreadyReserved) {
          return res.status(409).json({
            success: false,
            message: "The requested time slot is temporarily reserved"
          });
        }
        
        // Create a new reservation that expires in 10 minutes
        const reservationId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        const expiresIn = 10 * 60 * 1000; // 10 minutes in milliseconds
        const expiresAt = Date.now() + expiresIn;
        
        // Store with the original date since this is just an in-memory reservation
        reservations.set(reservationId, {
          id: reservationId,
          date: appointmentDate,
          time: appointmentTime,
          groomer: groomer,
          expiresAt: expiresAt
        });
        
        console.log(`[API] Created reservation ${reservationId} for ${appointmentDate} at ${appointmentTime} with ${groomer}`);
        
        return res.status(200).json({
          success: true,
          message: "Time slot successfully reserved",
          reservationId: reservationId,
          expiresIn: Math.floor(expiresIn / 1000) // Return in seconds
        });
      } catch (availabilityError) {
        console.error("Error checking availability for reservation:", availabilityError);
        
        return res.status(500).json({
          success: false,
          message: "Failed to check slot availability"
        });
      }
    } catch (error) {
      console.error("Error creating reservation:", error);
      
      return res.status(500).json({
        success: false,
        message: "Failed to create reservation"
      });
    }
  });
  
  // Check reservation status
  app.get("/api/reservations/:id", async (req: Request, res: Response) => {
    try {
      const reservationId = req.params.id;
      
      if (!reservationId) {
        return res.status(400).json({
          success: false,
          message: "Reservation ID is required"
        });
      }
      
      const reservation = reservations.get(reservationId);
      
      if (!reservation) {
        return res.status(404).json({
          success: false,
          message: "Reservation not found or expired"
        });
      }
      
      // Calculate remaining time
      const now = Date.now();
      const remainingMs = Math.max(0, reservation.expiresAt - now);
      
      return res.status(200).json({
        success: true,
        reservation: {
          id: reservation.id,
          date: reservation.date,
          time: reservation.time,
          groomer: reservation.groomer,
          remainingSeconds: Math.floor(remainingMs / 1000)
        }
      });
    } catch (error) {
      console.error("Error checking reservation:", error);
      
      return res.status(500).json({
        success: false,
        message: "Failed to check reservation"
      });
    }
  });
  
  // Contact form submission
  app.post("/api/contact", async (req: Request, res: Response) => {
    try {
      const validatedData = contactFormSchema.parse(req.body);
      
      const result = await storage.submitContactForm(validatedData);
      if (result) {
        return res.status(200).json({ 
          success: true, 
          message: "Contact form submitted successfully" 
        });
      } else {
        return res.status(500).json({ 
          success: false, 
          message: "Failed to submit contact form" 
        });
      }
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ 
          success: false, 
          message: "Validation error", 
          errors: validationError.details
        });
      }
      
      console.error("Error submitting contact form:", error);
      return res.status(500).json({ 
        success: false, 
        message: "Failed to submit contact form" 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
