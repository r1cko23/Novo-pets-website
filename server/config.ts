import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Supabase configuration
export const supabaseConfig = {
  url: process.env.SUPABASE_URL || "",
  key: process.env.SUPABASE_ANON_KEY || "",
  serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  // Use transaction pooler connection string format for Vercel deployment
  // This is optimized for serverless functions with brief, isolated connections
  dbUrl: process.env.DATABASE_URL || process.env.POSTGRES_URL || "",
  tables: {
    bookings: "bookings",
    contacts: "contacts",
    users: "users",
  },
};

export const serverConfig = {
  port: process.env.PORT || 3000,
  sessionSecret: process.env.SESSION_SECRET || "novo-pets-session-secret",
  isDevelopment: process.env.NODE_ENV !== "development",
}; 