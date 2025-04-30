import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import 'dotenv/config';
import { storage } from "./storage";
import { checkDatabaseConnection } from "./supabase";
import path from "path";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  log(`🔄 Using Supabase as database`);

  // Test database connection
  try {
    log("Testing database connection...");
    const isConnected = await checkDatabaseConnection();
    
    if (isConnected) {
      log("✅ Database connection successful");
    } else {
      log("❌ Database connection failed");
      log("Will continue startup but API endpoints may not work correctly");
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log(`Error during database connection test: ${errorMessage}`);
  }

  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Use port from environment variable or default to 3000
  // For Vercel, this doesn't matter as they handle the port binding
  const port = process.env.PORT || 3000;
  
  if (process.env.VERCEL) {
    // When running on Vercel, we export the app
    module.exports = app;
  } else {
    // For local/traditional hosting
    server.listen(port, () => {
      log(`[express] 🔄 Server started`);
      log(`[express] serving on port ${port}`);
    });
  }
})();
