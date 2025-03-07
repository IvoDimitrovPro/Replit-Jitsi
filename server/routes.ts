import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertMeetingSchema } from "@shared/schema";
import { generateJWT } from "./lib/jwt";

const REQUIRED_ENV_VARS = [
  "JITSI_APP_ID",
  "JITSI_API_KEY",
  "JITSI_PRIVATE_KEY",
];

function validateEnvVars() {
  const missing = REQUIRED_ENV_VARS.filter((v) => !process.env[v]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  try {
    validateEnvVars();
  } catch (error) {
    console.error("Environment validation failed:", error);
  }
  
  // Add a diagnostic endpoint to check environment variables
  app.get("/api/diagnostics", (req, res) => {
    const envStatus = {
      jitsi_app_id: process.env.JITSI_APP_ID ? "Set" : "Missing",
      jitsi_api_key: process.env.JITSI_API_KEY ? "Set" : "Missing",
      jitsi_private_key: process.env.JITSI_PRIVATE_KEY ? "Set (length: " + process.env.JITSI_PRIVATE_KEY.length + ")" : "Missing",
      all_vars_set: Boolean(
        process.env.JITSI_APP_ID && 
        process.env.JITSI_API_KEY && 
        process.env.JITSI_PRIVATE_KEY
      )
    };
    
    res.json({ 
      status: "ok",
      environment: envStatus,
      message: envStatus.all_vars_set ? "All required environment variables are set" : "Missing required environment variables"
    });
  });

  app.post("/api/meetings", async (req, res) => {
    const result = insertMeetingSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: result.error.message });
    }

    const meeting = await storage.createMeeting(result.data);
    res.json(meeting);
  });

  app.get("/api/meetings/token/:roomName", async (req, res) => {
    const { roomName } = req.params;
    const jwt = generateJWT(roomName);
    res.json({ jwt });
  });

  const httpServer = createServer(app);
  return httpServer;
}