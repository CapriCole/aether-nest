import { RequestHandler } from "express";
import { PlayerData } from "@shared/api";

export const handlePlayerData: RequestHandler = (req, res) => {
  const playerId = (req.params.id as string) || "default";

  // Mock data - in production, this would come from a database
  const playerData: PlayerData = {
    id: playerId,
    username: "ShadowPlayer",
    playerNumber: 73,
    status: "active",
    currentPhase: 1,
    wins: 0,
    losses: 0,
    points: 0,
    joinedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  };

  res.json(playerData);
};
