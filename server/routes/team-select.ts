import { RequestHandler } from "express";
import { z } from "zod";

const teamSelectSchema = z.object({
  leaderId: z.string().min(1, "Leader ID is required").max(100),
  selectedPlayerIds: z
    .array(z.string().min(1).max(100))
    .min(5, "Team must have exactly 5 players")
    .max(5, "Team must have exactly 5 players"),
});

interface TeamSelectRequest {
  leaderId: string;
  selectedPlayerIds: string[];
}

interface TeamSelectResponse {
  success: boolean;
  message: string;
  teamId: string;
  rosterSize: number;
}

export const handleTeamSelect: RequestHandler = (req, res, next) => {
  try {
    // Validate request body with Zod
    const validatedData = teamSelectSchema.parse(req.body);
    const { leaderId, selectedPlayerIds } = validatedData;

    // Mock team finalization
    const response: TeamSelectResponse = {
      success: true,
      message: `Team roster finalized with ${selectedPlayerIds.length} players`,
      teamId: `team-${Date.now()}`,
      rosterSize: selectedPlayerIds.length,
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};
