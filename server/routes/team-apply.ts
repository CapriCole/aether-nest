import { RequestHandler } from "express";
import { z } from "zod";

const teamApplySchema = z.object({
  playerId: z.string().min(1, "Player ID is required").max(100),
  leaderId: z.string().min(1, "Leader ID is required").max(100),
  message: z.string().max(500).optional(),
});

interface TeamApplyRequest {
  playerId: string;
  leaderId: string;
  message?: string;
}

interface TeamApplyResponse {
  success: boolean;
  message: string;
  applicationId: string;
  status: "pending" | "accepted" | "rejected";
}

export const handleTeamApply: RequestHandler = (req, res, next) => {
  try {
    // Validate request body with Zod
    const validatedData = teamApplySchema.parse(req.body);
    const { playerId, leaderId } = validatedData;

    // Mock application
    const response: TeamApplyResponse = {
      success: true,
      message: `Application submitted to leader ${leaderId}`,
      applicationId: `app-${Date.now()}`,
      status: "pending",
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};
