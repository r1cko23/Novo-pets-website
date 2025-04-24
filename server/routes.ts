import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { bookingFormSchema, contactFormSchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  // prefix all routes with /api
  
  // Booking routes
  app.post("/api/bookings", async (req: Request, res: Response) => {
    try {
      const validatedData = bookingFormSchema.parse(req.body);
      
      const booking = await storage.createBooking(validatedData);
      return res.status(201).json({ 
        success: true, 
        message: "Booking created successfully",
        data: booking 
      });
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
        message: "Failed to create booking" 
      });
    }
  });
  
  app.get("/api/bookings", async (req: Request, res: Response) => {
    try {
      const bookings = await storage.getBookings();
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
