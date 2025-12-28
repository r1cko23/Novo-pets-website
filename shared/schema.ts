import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";
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

export type PetSizeType = (typeof PetSize)[keyof typeof PetSize];

// Service types
export const ServiceType = {
  GROOMING: "grooming",
  HOTEL: "hotel",
  DAYCARE: "daycare",
} as const;

export type ServiceTypeValue = (typeof ServiceType)[keyof typeof ServiceType];

// Payment methods
export const PaymentMethod = {
  CASH: "cash",
  BANK_TRANSFER: "bank_transfer",
  ONLINE: "online",
} as const;

export type PaymentMethodType =
  (typeof PaymentMethod)[keyof typeof PaymentMethod];

// Bookings
export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  // Primary service type
  serviceType: text("service_type").notNull(),

  // Specific service options
  groomingService: text("grooming_service"),
  accommodationType: text("accommodation_type"),

  // Duration
  durationHours: integer("duration_hours"),
  durationDays: integer("duration_days"),

  // Appointment details
  appointmentDate: text("appointment_date").notNull(),
  appointmentTime: text("appointment_time").notNull(),

  // Pet information
  petName: text("pet_name").notNull(),
  petBreed: text("pet_breed").notNull(),
  petSize: text("pet_size").notNull(),

  // Add-ons and special requests
  addOnServices: text("add_on_services"), // Stored as comma-separated values
  specialRequests: text("special_requests"),

  // Transport details (as add-on)
  needsTransport: boolean("needs_transport").default(false),
  transportType: text("transport_type"),
  pickupAddress: text("pickup_address"),

  // Treats add-on
  includeTreats: boolean("include_treats").default(false),
  treatType: text("treat_type"),

  // Customer information
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone").notNull(),
  customerEmail: text("customer_email").notNull(),

  // Payment and status
  paymentMethod: text("payment_method").notNull(),
  status: text("status").default("pending"),
  totalPrice: integer("total_price"),
  reference: text("reference"),

  // Assigned groomer
  groomer: text("groomer"),

  // System fields
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  createdAt: true,
});

export const bookingFormSchema = z
  .object({
    // Primary service selection
    serviceType: z.enum([
      ServiceType.GROOMING,
      ServiceType.HOTEL,
      ServiceType.DAYCARE,
    ]),

    // Service-specific options
    // For grooming: which package
    groomingService: z.string().optional(),

    // For hotel: which accommodation type
    accommodationType: z.string().optional(),

    // Duration options
    // For hotel and daycare - number of days/hours
    durationHours: z.number().optional(),
    durationDays: z.number().optional(),

    // Scheduling
    appointmentDate: z.string().min(1, { message: "Please select a date" }),
    appointmentTime: z
      .string()
      .min(1, { message: "Please select a time slot" }),

    // Pet information
    petName: z.string().min(1, { message: "Please enter your pet's name" }),
    petBreed: z.string().min(1, { message: "Please enter your pet's breed" }),
    petSize: z.enum([
      PetSize.SMALL,
      PetSize.MEDIUM,
      PetSize.LARGE,
      PetSize.GIANT,
    ]),

    // Add-ons and special requests
    addOnServices: z.array(z.string()).optional(),
    specialRequests: z.string().optional(),

    // Transport add-on (no longer a separate service)
    needsTransport: z.boolean().default(false),
    transportType: z.string().optional(),
    pickupAddress: z.string().optional(),

    // Add treats as an optional add-on
    includeTreats: z.boolean().default(false),
    treatType: z.string().optional(),

    // Customer information
    customerName: z.string().min(1, { message: "Please enter your name" }),
    customerPhone: z
      .string()
      .min(6, { message: "Please enter a valid phone number" }),
    customerEmail: z
      .string()
      .email({ message: "Please enter a valid email address" }),

    // Payment details
    paymentMethod: z.enum([
      PaymentMethod.CASH,
      PaymentMethod.BANK_TRANSFER,
      PaymentMethod.ONLINE,
    ]),

    // Assigned groomer
    groomer: z.string().optional(),

    // System fields
    status: z.string().default("pending"),
    totalPrice: z.number().optional(),
    reference: z.string().optional(),

    // Reservation handling
    reservationId: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    // If service type is grooming, the grooming service should be set
    if (data.serviceType === ServiceType.GROOMING && !data.groomingService) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please select a grooming service",
        path: ["groomingService"],
      });
    }
  });

export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookings.$inferSelect;
export type BookingFormValues = z.infer<typeof bookingFormSchema>;

// Contact form
export const contactFormSchema = z.object({
  name: z.string().min(1, { message: "Please enter your name" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  subject: z.string().min(1, { message: "Please select a subject" }),
  message: z
    .string()
    .min(10, { message: "Message should be at least 10 characters" }),
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
    giant: 1300,
    features: [
      "Premium shampoo bath",
      "Professional blow dry",
      "Nail trimming & filing",
      "Gentle ear cleaning",
      "Paw pad moisturizing",
    ],
  },
  {
    service: "Full Groom",
    description:
      "Basic + Haircut & Styling, Deep Conditioning, De-shedding, Cologne",
    small: 900,
    medium: 1200,
    large: 1500,
    giant: 1900,
    features: [
      "All basic groom services",
      "Breed-specific haircut & styling",
      "Deep conditioning treatment",
      "De-shedding treatment",
      "Pet-safe cologne finish",
    ],
  },
  {
    service: "Luxury Spa Package",
    description:
      "Full Groom + Hypoallergenic Shampoo, Aromatherapy, Paw Balm, Teeth Brushing",
    small: 1200,
    medium: 1500,
    large: 1900,
    giant: 2400,
    features: [
      "All full groom services",
      "Hypoallergenic premium shampoo",
      "Calming aromatherapy session",
      "Therapeutic paw balm treatment",
      "Gentle teeth brushing & breath care",
    ],
  },
];

export const spaAddOns = [
  {
    service: "Aromatherapy Bliss Treatment",
    description: "Calming essential oils massage therapy",
    price: 350,
    priceRange: "₱250 - ₱450",
    features: [
      "Relaxing aromatherapy oils",
      "Gentle massage technique",
      "Calming effect for anxious pets",
      "Premium essential oil blends",
    ],
  },
  {
    service: "Deep Coat Hydration Mask",
    description: "Intensive moisturizing treatment for dry coats",
    price: 400,
    priceRange: "₱350 - ₱500",
    features: [
      "Premium hydrating formula",
      "Restores coat shine",
      "Treats dry, damaged fur",
      "Heat-activated treatment",
    ],
  },
  {
    service: "Luxury Flea & Tick Treatment",
    description: "Premium natural parasite prevention",
    price: 500,
    priceRange: "₱450 - ₱600",
    features: [
      "All-natural ingredients",
      "Soothes irritated skin",
      "Deters parasites naturally",
      "No harsh chemicals",
    ],
  },
  {
    service: "Paw Balm & Nail Spa Treatment",
    description: "Moisturizing paw treatment with nail polish option",
    price: 350,
    priceRange: "₱300 - ₱450",
    features: [
      "Therapeutic paw pad balm",
      "Nail trimming and buffing",
      "Optional pet-safe nail polish",
      "Moisturizing treatment",
    ],
  },
  {
    service: "Teeth Brushing & Breath Freshener",
    description: "Dental hygiene treatment for healthier teeth",
    price: 300,
    priceRange: "₱250 - ₱400",
    features: [
      "Pet-friendly toothpaste",
      "Gentle brushing technique",
      "Breath freshening treatment",
      "Basic dental check",
    ],
  },
];

export const hotelPrices = [
  {
    type: "Standard",
    description:
      "Comfortable accommodations with regular care, playtime, and monitoring",
    small: 1000,
    medium: 1150,
    large: 1350,
    features: ["Comfortable bedding", "Regular exercise", "24/7 monitoring"],
  },
  {
    type: "Owner's Cage",
    description:
      "Using pet owner's provided cage with our premium care services",
    small: 850,
    medium: 1000,
    large: 1200,
    features: ["Familiar environment", "Regular care", "Cost-effective option"],
  },
  {
    type: "Luxury Suite",
    description: "Premium accommodation with extra space and amenities",
    small: 1400,
    medium: 1650,
    large: 1850,
    features: ["Spacious quarters", "Extra playtime", "Daily grooming"],
  },
];

export const daycarePrices = [
  {
    size: "Small",
    rate: 100,
    notes: "Minimum 3 hours",
    description: "For pets up to 10kg",
    features: ["Supervised play", "Rest periods", "Socialization"],
  },
  {
    size: "Medium",
    rate: 130,
    notes: "Minimum 3 hours",
    description: "For pets 10-25kg",
    features: ["Supervised play", "Rest periods", "Socialization"],
  },
  {
    size: "Large",
    rate: 150,
    notes: "Minimum 3 hours",
    description: "For pets 25-40kg",
    features: ["Supervised play", "Rest periods", "Socialization"],
  },
  {
    size: "Giant",
    rate: 180,
    notes: "Minimum 3 hours",
    description: "For pets 40kg+",
    features: ["Supervised play", "Rest periods", "Socialization"],
  },
  {
    size: "All Sizes - Full Day",
    rate: 500,
    notes: "8 hours (9am-5pm)",
    description: "Full day care with all amenities",
    features: ["Full day care", "Meals included", "Extra activities"],
  },
];

export const transportPrices = [
  {
    service: "One-way Transport",
    description: "Pick-up or drop-off service",
    price: 280,
    notes: "Within 3km radius",
    features: ["Safe vehicle", "Professional handler", "Scheduled timing"],
  },
  {
    service: "Round-trip Transport",
    description: "Both pick-up and drop-off service",
    price: 380,
    notes: "Within 3km radius",
    features: ["Same-day service", "Convenient option", "Cost-effective"],
  },
];

export const treatsPrices = [
  {
    type: "For Pets (1 Cup)",
    price: 85,
    description: "Pet-friendly frozen yogurt",
    features: [
      "Pet-safe ingredients",
      "No artificial sweeteners",
      "Cooling treat",
    ],
  },
  {
    type: "For Humans (One Size)",
    price: 150,
    description: "Human-friendly frozen yogurt",
    features: ["Premium quality", "Artisanal flavors", "While you wait"],
  },
  {
    type: "Premium Yogurt",
    price: 285,
    description: "With strawberry bits & Dubai chocolate pistachio",
    features: ["Gourmet ingredients", "Special blend", "Limited availability"],
  },
  {
    type: "Doggy Birthday Cake",
    price: 450,
    description: "Special celebration cake safe for pets",
    features: [
      "Custom designs",
      "Pet-safe ingredients",
      "Perfect for celebrations",
    ],
  },
];

// Add a dedicated spa treatments array
export const spaTreatments = [
  {
    service: "Aromatherapy Full Session",
    description: "Complete relaxation session with premium essential oils",
    small: 800,
    medium: 950,
    large: 1100,
    giant: 1300,
    features: [
      "Full-body aromatherapy massage",
      "Custom essential oil blend",
      "30-minute relaxation session",
      "Stress and anxiety reduction",
      "Promotes overall wellbeing",
    ],
  },
  {
    service: "Luxury Mud Bath Treatment",
    description: "Detoxifying and skin-nourishing spa experience",
    small: 900,
    medium: 1050,
    large: 1200,
    giant: 1400,
    features: [
      "Natural clay-based formula",
      "Draws out skin impurities",
      "Soothes skin irritations",
      "Conditions coat and skin",
      "Followed by gentle rinse and dry",
    ],
  },
  {
    service: "Premium Coat Therapy",
    description: "Deep conditioning with heat treatment for coat restoration",
    small: 750,
    medium: 900,
    large: 1100,
    giant: 1300,
    features: [
      "Intensive conditioning treatment",
      "Heat-activated formula",
      "Repairs damaged coats",
      "Reduces shedding",
      "Makes coat silky and manageable",
    ],
  },
  {
    service: "Complete Paw & Nail Spa",
    description:
      "Full paw treatment including massage, moisturizing and nail care",
    small: 600,
    medium: 700,
    large: 800,
    giant: 950,
    features: [
      "Therapeutic paw soak",
      "Pad exfoliation treatment",
      "Deep moisturizing therapy",
      "Nail trimming and buffing",
      "Paw massage for circulation",
    ],
  },
];

// Service overview items for homepage
export const serviceOverviewItems = [
  {
    title: "Luxury Grooming & Spa",
    description:
      "Pamper your pet with our premium grooming services including aromatherapy and spa treatments.",
    image: "/images/spa/spa-7.jpg",
  },
  {
    title: "Boutique Pet Hotel",
    description:
      "Comfortable accommodations with personalized care for your pet's staycation needs.",
    image: "/images/services/Hotel 1-fnl.jpg",
  },
  {
    title: "Pet DayCare",
    description:
      "Fun and safe supervised activities in a social setting for your pet while you're away.",
    image: "/images/services/Playpen 3-fnl.jpg",
  },
  {
    title: "Paw Pickup & Drop-off",
    description:
      "Convenient transport service for your pet to and from our facility within a 3km radius.",
    image: "/images/services/Transpo 2-fnl.jpg",
  },
];

// Testimonials data
export const testimonials = [
  {
    name: "Jericko and Jacob",
    image: "/images/testimonials/jericko-and-jacob.jpg",
    text: "Omg Novo Pets is actually so good?? Jacob came back looking so fresh and clean, like he just came from a spa day fr. The staff are so nice and they really treat your pets like family. 10/10 would recommend!",
    serviceUsed: "Pomeranian • Full Groom Service",
    rating: 5,
  },
  {
    name: "Migi & Oreo",
    image: "/images/testimonials/migi_and_oreo.jpg",
    text: "Okay so I've been to a few places but Novo Pets hits different. Oreo always comes back looking so good and he's literally so happy after. The staff really know what they're doing and Oreo loves going there!",
    serviceUsed: "Shih Tzu • Full Groom Service",
    rating: 5,
  },
  {
    name: "Sophie & Macchi",
    image: "/images/testimonials/sophie_and_macchi.jpg",
    text: "Thank you so much for handling my macchi baby with care ❤️",
    serviceUsed: "Exotic Shorthair • Luxury Spa Package",
    rating: 4.5,
  },
  {
    name: "Tovi & Unli",
    image: "/images/testimonials/tovi_and_unli.jpg",
    text: "Unli looks so good after her groom! Like she's a whole different dog, so soft and shiny. The staff are super patient with her and she actually enjoys going now. Best decision ever!",
    serviceUsed: "French Bulldog • Full Groom Service",
    rating: 5,
  },
];

// Service images for use throughout the application
export const serviceImages = {
  petSpa: "/images/spa/spa-7.jpg",
  petHotel: "/images/services/Hotel 1-fnl.jpg",
  petDaycare: "/images/services/Playpen 3-fnl.jpg",
  pawPickup: "/images/services/Transpo 2-fnl.jpg",
  groomingServices: "/images/services/Spa 2-fnl.jpg",
  spaSession: "/images/spa/spa-6.jpg",
  daycarePlay: "/images/services/Playpen 2-fnl.jpg",
  heroBackground: "/images/novopets_newbg.jpg",
  logo: null, // Set to null to use the original import in Navbar.tsx
};
