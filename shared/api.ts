/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */

/**
 * Example response type for /api/demo
 */
export interface DemoResponse {
  message: string;
}

/**
 * Tournament stats response
 */
export interface TournamentStats {
  registeredPlayers: number;
  maxPlayers: number;
  currentPhase: number;
  phaseLabel: string;
  registrationPercentage: number;
}

/**
 * Phase information response
 */
export interface PhaseInfo {
  number: number;
  label: string;
  status: "completed" | "current" | "locked";
  startDate: string;
  endDate: string;
  description: string;
}

/**
 * Player data response
 */
export interface PlayerData {
  id: string;
  username: string;
  playerNumber: number;
  status: "active" | "qualified" | "eliminated" | "redeemed";
  currentPhase: number;
  wins: number;
  losses: number;
  points: number;
  joinedAt: string;
}
