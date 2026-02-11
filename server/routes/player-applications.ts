import { RequestHandler } from "express";

interface Application {
    id: string;
    teamId: string;
    teamName: string;
    leaderName: string;
    status: "pending" | "accepted" | "rejected";
    appliedAt: string;
    message: string;
}

export const handlePlayerApplications: RequestHandler = (req, res) => {
    // Mock data - in a real app this would query the DB by req.user.id
    const applications: Application[] = [
        {
            id: "app-1",
            teamId: "team-1",
            teamName: "Phoenix Rising",
            leaderName: "Phoenix",
            status: "pending",
            appliedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
            message: "I am a top 50fragger, let me in!",
        },
        {
            id: "app-2",
            teamId: "team-3",
            teamName: "Apex Predators",
            leaderName: "Apex",
            status: "rejected",
            appliedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
            message: "Looking for a serious team.",
        },
    ];

    res.json(applications);
};
