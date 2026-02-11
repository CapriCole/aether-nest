import { RequestHandler } from "express";
import { TournamentStats } from "@shared/api";

export const handleTournamentStats: RequestHandler = (req, res) => {
  // Mock data - in production, this would come from a database
  const registeredPlayers = Math.floor(Math.random() * 300) + 50;
  const maxPlayers = 500;
  
  const response: TournamentStats = {
    registeredPlayers,
    maxPlayers,
    currentPhase: 1,
    phaseLabel: "The Call",
    registrationPercentage: (registeredPlayers / maxPlayers) * 100,
  };

  res.json(response);
};
