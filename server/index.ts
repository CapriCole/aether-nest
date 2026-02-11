import "dotenv/config";
import express from "express";
import cors from "cors";
import { getDb } from "./db";
import { handleDemo } from "./routes/demo";
import { handleTournamentStats } from "./routes/tournament-stats";
import { handleTournamentPhases } from "./routes/tournament-phases";
import { handlePlayerData } from "./routes/player-data";
import { handleTeamApply } from "./routes/team-apply";
import { handleTeamSelect } from "./routes/team-select";
import { handleTeamsProgress } from "./routes/teams-progress";

import { handlePlayerApplications } from "./routes/player-applications";
import authRoutes from "./routes/auth";
import teamsRoutes from "./routes/teams";
import tournamentsRoutes from "./routes/tournaments";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Auth Routes
  app.use("/api/auth", authRoutes);

  // Teams Routes
  app.use("/api/teams", teamsRoutes);

  // Tournaments Routes
  app.use("/api/tournaments", tournamentsRoutes);



  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/health", (req, res) => {
    try {
      const db = getDb();
      const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get();
      res.json({
        status: 'ok',
        database: 'connected',
        userCount,
        env: {
          VERCEL: process.env.VERCEL,
          NODE_ENV: process.env.NODE_ENV
        }
      });
    } catch (error: any) {
      console.error("Health check failed:", error);
      res.status(500).json({
        status: 'error',
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  });

  app.get("/api/demo", handleDemo);

  // Tournament API routes
  app.get("/api/tournament/stats", handleTournamentStats);
  app.get("/api/tournament/phases", handleTournamentPhases);
  app.get("/api/player/:id", handlePlayerData);
  app.get("/api/player/applications", handlePlayerApplications);

  // Team API routes
  app.post("/api/team/apply", handleTeamApply);
  app.post("/api/team/select", handleTeamSelect);
  app.get("/api/teams/progress", handleTeamsProgress);

  // Global error handling middleware (must be last)
  app.use((err: any, req: any, res: any, next: any) => {
    console.error("Error:", err.stack || err);

    // Handle Zod validation errors
    if (err.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: err.errors,
      });
    }

    // Handle generic errors
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Internal server error",
    });
  });

  return app;
}
