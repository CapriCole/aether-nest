import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { TeamProgressBar } from "@/components/TeamProgressBar";

interface Team {
  id: string;
  name: string;
  leader: string;
  wins: number;
  roster: string[];
  maxSize: number;
  status: "recruiting" | "full" | "completed";
}

const mockTeams: Team[] = [
  {
    id: "1",
    name: "Phoenix Rising",
    leader: "Phoenix",
    wins: 18,
    roster: ["Nova Strike", "Titan Force", "IceBreaker", "SkyFlyer"],
    maxSize: 5,
    status: "recruiting",
  },
  {
    id: "2",
    name: "Sentinel Guard",
    leader: "Sentinel",
    wins: 17,
    roster: [
      "StormBringer",
      "CrimsonBlade",
      "VenomStrike",
      "IronWill",
      "ShadowHunter",
    ],
    maxSize: 5,
    status: "full",
  },
  {
    id: "3",
    name: "Apex Predators",
    leader: "Apex",
    wins: 16,
    roster: ["PrimeHunter", "VortexMaster", "NovaBlaze"],
    maxSize: 5,
    status: "recruiting",
  },
  {
    id: "4",
    name: "VortexX Elite",
    leader: "VortexX",
    wins: 15,
    roster: ["EchoStrike", "SpecterX", "PhazeOut", "CyberNinja", "ZenithX"],
    maxSize: 5,
    status: "full",
  },
  {
    id: "5",
    name: "Shadow Council",
    leader: "ShadowPlay",
    wins: 14,
    roster: ["MidnightRun", "EclipseGhost"],
    maxSize: 5,
    status: "recruiting",
  },
];

const mockUnpickedPlayers = [
  "RadiantX",
  "OmegaStrike",
  "AscentMaster",
  "VenomPath",
  "InfernoKing",
  "FrostWhisper",
  "LunarEcho",
  "SolarFlare",
  "VoidWalker",
  "CelestialHunter",
];

export function TeamPools() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedTeam, setSelectedTeam] = useState<string>("1");
  const [isApplying, setIsApplying] = useState(false);
  const [message, setMessage] = useState("");
  const [applicationOpen, setApplicationOpen] = useState(false);

  const handleApply = async () => {
    if (!message.trim()) return;

    setIsApplying(true);

    try {
      // API call would go here
      const response = await fetch("/api/team/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerId: "current-user-id", // Mock ID
          leaderId: currentTeam?.leader || "",
          message: message,
        }),
      });

      if (response.ok) {
        toast({
          title: "Application Sent",
          description: `Your application to ${currentTeam?.name} has been sent to ${currentTeam?.leader}.`,
        });
        setApplicationOpen(false);
        setMessage("");
      } else {
        const error = await response.json();
        toast({
          title: "Application Failed",
          description: error.message || "Something went wrong.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send application. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsApplying(false);
    }
  };

  const currentTeam = mockTeams.find((t) => t.id === selectedTeam);
  const totalRosterSlots = mockTeams.reduce((acc, t) => acc + t.maxSize, 0);
  const totalRostered = mockTeams.reduce((acc, t) => acc + t.roster.length, 0);

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-background via-secondary/30 to-background py-12">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-block bg-primary/20 border border-primary/50 rounded-lg px-4 py-2 mb-4">
              <span className="text-primary font-bold uppercase tracking-wider text-sm">
                Team Formation Status
              </span>
            </div>
            <h1 className="text-5xl md:text-6xl font-black text-white mb-4">
              <span className="text-primary">Team Pools &</span>
              <br />
              <span>Roster Visibility.</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-lg mx-auto">
              Watch as teams fill their rosters. Leaders have 24 hours to lock
              their selections.
            </p>
          </div>

          {/* Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
            <Card className="border-border bg-card p-6 text-center">
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-2">
                Teams Forming
              </p>
              <p className="text-4xl font-black text-primary">
                {mockTeams.length}
              </p>
            </Card>
            <Card className="border-border bg-card p-6 text-center">
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-2">
                Rostered Players
              </p>
              <p className="text-4xl font-black text-accent">{totalRostered}</p>
            </Card>
            <Card className="border-border bg-card p-6 text-center">
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-2">
                Total Slots
              </p>
              <p className="text-4xl font-black text-primary">
                {totalRosterSlots}
              </p>
            </Card>
            <Card className="border-border bg-card p-6 text-center">
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-2">
                Unpicked Players
              </p>
              <p className="text-4xl font-black text-destructive">
                {mockUnpickedPlayers.length}
              </p>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="teams" className="mb-12">
            <TabsList className="grid w-full grid-cols-2 bg-card border border-glow-emerald">
              <TabsTrigger
                value="teams"
                className="data-[state=active]:bg-primary"
              >
                Team Rosters
              </TabsTrigger>
              <TabsTrigger
                value="unpicked"
                className="data-[state=active]:bg-primary"
              >
                Unpicked Players
              </TabsTrigger>
            </TabsList>

            {/* Team Rosters */}
            <TabsContent value="teams" className="space-y-6">
              {/* Team selector */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-6">
                {mockTeams.map((team) => (
                  <button
                    key={team.id}
                    onClick={() => setSelectedTeam(team.id)}
                    className={`p-3 rounded-lg border transition-all font-bold text-sm ${selectedTeam === team.id
                      ? "border-primary bg-primary/20 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/50"
                      }`}
                  >
                    {team.leader}
                  </button>
                ))}
              </div>

              {/* Selected team details */}
              {currentTeam && (
                <Card className="border-glow-emerald bg-card p-8 glow-emerald">
                  <div className="space-y-8">
                    {/* Team header */}
                    <div>
                      <h3 className="text-3xl font-black text-primary mb-2">
                        {currentTeam.name}
                      </h3>
                      <p className="text-lg text-muted-foreground">
                        Led by{" "}
                        <span className="text-primary font-bold">
                          {currentTeam.leader}
                        </span>
                      </p>
                    </div>

                    {/* Progress bar */}
                    <TeamProgressBar
                      teamName={currentTeam.name}
                      currentSize={currentTeam.roster.length}
                      maxSize={currentTeam.maxSize}
                      leader={currentTeam.leader}
                      status={currentTeam.status}
                    />

                    {/* Apply Button */}
                    <div className="flex justify-end">
                      {currentTeam.status === "recruiting" ? (
                        <Dialog open={applicationOpen} onOpenChange={setApplicationOpen}>
                          <DialogTrigger asChild>
                            <Button className="bg-primary hover:bg-primary/90 glow-emerald">
                              Apply to Join Team
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="bg-card border-glow-emerald">
                            <DialogHeader>
                              <DialogTitle>Apply to {currentTeam.name}</DialogTitle>
                              <DialogDescription>
                                Tell {currentTeam.leader} why you're a good fit for this team.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="py-4">
                              <Label htmlFor="message" className="mb-2 block">
                                Message
                              </Label>
                              <Textarea
                                id="message"
                                placeholder="I play aggressive entry fragger and have a 2.5 KD..."
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                className="min-h-[100px]"
                              />
                            </div>
                            <DialogFooter>
                              <Button
                                variant="outline"
                                onClick={() => setApplicationOpen(false)}
                              >
                                Cancel
                              </Button>
                              <Button
                                onClick={handleApply}
                                disabled={!message.trim() || isApplying}
                                className="bg-primary text-primary-foreground"
                              >
                                {isApplying ? "Sending..." : "Send Application"}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      ) : (
                        <Button disabled variant="secondary">
                          Team Full
                        </Button>
                      )}
                    </div>

                    {/* Roster */}
                    <div>
                      <h4 className="font-bold text-foreground mb-4">
                        Current Roster
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {currentTeam.roster.map((player, idx) => (
                          <div
                            key={idx}
                            className="bg-background rounded-lg p-3 border border-border text-center"
                          >
                            <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center mx-auto mb-2">
                              <span className="text-xs font-black text-primary-foreground">
                                {player.charAt(0)}
                              </span>
                            </div>
                            <p className="text-sm font-semibold text-foreground">
                              {player}
                            </p>
                          </div>
                        ))}
                        {/* Empty slots */}
                        {Array(currentTeam.maxSize - currentTeam.roster.length)
                          .fill(null)
                          .map((_, idx) => (
                            <div
                              key={`empty-${idx}`}
                              className="bg-background rounded-lg p-3 border border-border/30 text-center opacity-50"
                            >
                              <p className="text-xs text-muted-foreground font-semibold">
                                Empty
                              </p>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                </Card>
              )}
            </TabsContent>

            {/* Unpicked Players */}
            <TabsContent value="unpicked" className="space-y-6">
              <Card className="border-border bg-card p-6">
                <h3 className="text-lg font-bold text-foreground mb-6">
                  Available Players ({mockUnpickedPlayers.length})
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {mockUnpickedPlayers.map((player, idx) => (
                    <div
                      key={idx}
                      className="bg-background rounded-lg p-4 border border-border text-center hover:border-primary/50 transition-all"
                    >
                      <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center mx-auto mb-3">
                        <span className="text-sm font-black text-primary-foreground">
                          {player.charAt(0)}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-foreground">
                        {player}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Available
                      </p>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="border-border bg-card p-6">
                <h3 className="font-bold text-foreground mb-3">
                  Closing Draft
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Once all leaders have finalized their selections, remaining
                  unpicked players will be distributed to fill incomplete
                  rosters in the closing draft process.
                </p>
                <p className="text-xs text-muted-foreground italic">
                  Time remaining: 18 hours 42 minutes
                </p>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Action buttons */}
          <div className="flex gap-3">
            <Button
              onClick={() => navigate("/team-competition")}
              className="flex-1 bg-primary hover:bg-primary/90 text-lg py-6 h-auto glow-emerald-strong"
            >
              View Team Competition
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => navigate("/dashboard")}
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
