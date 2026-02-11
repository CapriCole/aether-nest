import { RequestHandler } from "express";

interface TeamProgress {
  teamId: string;
  teamName: string;
  leader: string;
  rosterSize: number;
  maxSize: number;
  status: "recruiting" | "full" | "completed";
  roster: string[];
}

interface TeamsProgressResponse {
  teams: TeamProgress[];
  totalPlayers: number;
  unpickedCount: number;
}

export const handleTeamsProgress: RequestHandler = (req, res) => {
  // Mock team progress data
  const teams: TeamProgress[] = [
    {
      teamId: "team-1",
      teamName: "Phoenix Rising",
      leader: "Phoenix",
      rosterSize: 4,
      maxSize: 5,
      status: "recruiting",
      roster: ["Nova Strike", "Titan Force", "IceBreaker", "SkyFlyer"],
    },
    {
      teamId: "team-2",
      teamName: "Sentinel Guard",
      leader: "Sentinel",
      rosterSize: 5,
      maxSize: 5,
      status: "full",
      roster: [
        "StormBringer",
        "CrimsonBlade",
        "VenomStrike",
        "IronWill",
        "ShadowHunter",
      ],
    },
    {
      teamId: "team-3",
      teamName: "Apex Predators",
      leader: "Apex",
      rosterSize: 3,
      maxSize: 5,
      status: "recruiting",
      roster: ["PrimeHunter", "VortexMaster", "NovaBlaze"],
    },
    {
      teamId: "team-4",
      teamName: "VortexX Elite",
      leader: "VortexX",
      rosterSize: 5,
      maxSize: 5,
      status: "full",
      roster: ["EchoStrike", "SpecterX", "PhazeOut", "CyberNinja", "ZenithX"],
    },
    {
      teamId: "team-5",
      teamName: "Shadow Council",
      leader: "ShadowPlay",
      rosterSize: 2,
      maxSize: 5,
      status: "recruiting",
      roster: ["MidnightRun", "EclipseGhost"],
    },
  ];

  const totalRostered = teams.reduce((acc, t) => acc + t.rosterSize, 0);
  const totalSlots = teams.reduce((acc, t) => acc + t.maxSize, 0);

  const response: TeamsProgressResponse = {
    teams,
    totalPlayers: totalRostered,
    unpickedCount: totalSlots - totalRostered,
  };

  res.json(response);
};
