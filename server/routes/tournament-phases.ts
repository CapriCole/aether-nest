import { RequestHandler } from "express";
import { PhaseInfo } from "@shared/api";

export const handleTournamentPhases: RequestHandler = (req, res) => {
  // Mock data - in production, this would come from a database
  const phases: PhaseInfo[] = [
    {
      number: 1,
      label: "The Call",
      status: "current",
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      description: "Initial challenge to prove your worth.",
    },
    {
      number: 2,
      label: "The Reckoning",
      status: "locked",
      startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(Date.now() + 37 * 24 * 60 * 60 * 1000).toISOString(),
      description: "Strategic thinking challenge.",
    },
    {
      number: 3,
      label: "Battle Royale",
      status: "locked",
      startDate: new Date(Date.now() + 37 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(Date.now() + 44 * 24 * 60 * 60 * 1000).toISOString(),
      description: "500 players divided into groups, top 50% advance.",
    },
    {
      number: 3.5,
      label: "Redemption Arena",
      status: "locked",
      startDate: new Date(Date.now() + 44 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(Date.now() + 50 * 24 * 60 * 60 * 1000).toISOString(),
      description: "Second chance for eliminated players.",
    },
    {
      number: 4,
      label: "League System",
      status: "locked",
      startDate: new Date(Date.now() + 50 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(Date.now() + 57 * 24 * 60 * 60 * 1000).toISOString(),
      description: "300 players compete in leagues.",
    },
    {
      number: 5,
      label: "Final Stage",
      status: "locked",
      startDate: new Date(Date.now() + 57 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
      description: "50 players, one champion.",
    },
  ];

  res.json(phases);
};
