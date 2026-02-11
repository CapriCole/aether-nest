import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BracketView } from "@/components/BracketView";

interface TeamMatch {
  id: string;
  team1: string;
  team2: string;
  winner?: string;
  status: "upcoming" | "live" | "completed";
  round: string;
}

const mockMatches: TeamMatch[] = [
  {
    id: "1",
    team1: "Phoenix Rising",
    team2: "Apex Predators",
    status: "completed",
    winner: "Phoenix Rising",
    round: "Round 1",
  },
  {
    id: "2",
    team1: "Sentinel Guard",
    team2: "Shadow Council",
    status: "completed",
    winner: "Sentinel Guard",
    round: "Round 1",
  },
  {
    id: "3",
    team1: "VortexX Elite",
    team2: "Rogue Alliance",
    status: "live",
    round: "Round 1",
  },
  {
    id: "4",
    team1: "Phoenix Rising",
    team2: "Sentinel Guard",
    status: "upcoming",
    round: "Semifinals",
  },
];

const mockRoster = {
  teamName: "Phoenix Rising",
  leader: "Phoenix",
  active: ["Nova Strike", "Titan Force", "IceBreaker"],
  bench: ["SkyFlyer", "ShadowHunter"],
  totalWins: 5,
  losses: 1,
  nextMatch: "vs Sentinel Guard - Tomorrow at 3 PM EST",
};

export function TeamCompetition() {
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState("matches");

  const bracketRounds = [
    {
      label: "Round 1",
      matches: mockMatches
        .filter((m) => m.round === "Round 1")
        .map((m) => ({
          id: m.id,
          player1: m.team1,
          player2: m.team2,
          winner: m.winner,
          status: m.status as "upcoming" | "live" | "completed",
        })),
    },
    {
      label: "Semifinals",
      matches: mockMatches
        .filter((m) => m.round === "Semifinals")
        .map((m) => ({
          id: m.id,
          player1: m.team1,
          player2: m.team2,
          winner: m.winner,
          status: m.status as "upcoming" | "live" | "completed",
        })),
    },
    {
      label: "Finals",
      matches: [
        {
          id: "final",
          player1: undefined,
          player2: undefined,
          status: "upcoming" as const,
        },
      ],
    },
  ];

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-background via-secondary/30 to-background py-12">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-12 animate-fade-in">
            <div className="inline-block bg-primary/20 border border-primary/50 rounded-lg px-4 py-2 mb-4 animate-slide-in-down">
              <span className="text-primary font-bold uppercase tracking-wider text-sm">
                Phase 6
              </span>
            </div>
            <h1 className="text-5xl md:text-6xl font-black text-white mb-4 animate-slide-in-up">
              <span className="text-primary">Team</span>
              <br />
              <span>Competition.</span>
            </h1>
            <p
              className="text-lg text-muted-foreground max-w-lg mx-auto animate-fade-in"
              style={{ animationDelay: "200ms" }}
            >
              Teams of 5 compete in multi-round tournaments. Only the strongest
              rosters advance.
            </p>
            <p className="text-sm text-muted-foreground/80 mt-6 max-w-2xl mx-auto italic">
              "Your team's synergy will be tested. Rise together or fall apart."
            </p>
          </div>

          {/* Overview stats */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-12">
            <Card className="border-border bg-card p-6 text-center">
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-2">
                Total Teams
              </p>
              <p className="text-4xl font-black text-primary">5</p>
            </Card>
            <Card className="border-glow-emerald bg-card p-6 text-center glow-emerald">
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-2">
                Your Team Wins
              </p>
              <p className="text-4xl font-black text-accent">
                {mockRoster.totalWins}
              </p>
            </Card>
            <Card className="border-border bg-card p-6 text-center">
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-2">
                Total Matches
              </p>
              <p className="text-4xl font-black text-primary">
                {mockMatches.length}
              </p>
            </Card>
            <Card className="border-border bg-card p-6 text-center">
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-2">
                Teams Advancing
              </p>
              <p className="text-4xl font-black text-accent">2</p>
            </Card>
            <Card className="border-border bg-card p-6 text-center">
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-2">
                Phase Duration
              </p>
              <p className="text-lg font-bold text-primary">7 Days</p>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs
            value={selectedTab}
            onValueChange={setSelectedTab}
            className="mb-12"
          >
            <TabsList className="grid w-full grid-cols-3 bg-card border border-glow-emerald">
              <TabsTrigger
                value="matches"
                className="data-[state=active]:bg-primary"
              >
                Bracket
              </TabsTrigger>
              <TabsTrigger
                value="roster"
                className="data-[state=active]:bg-primary"
              >
                Your Roster
              </TabsTrigger>
              <TabsTrigger
                value="results"
                className="data-[state=active]:bg-primary"
              >
                Results
              </TabsTrigger>
            </TabsList>

            {/* Matches tab */}
            <TabsContent value="matches" className="space-y-6">
              <BracketView rounds={bracketRounds} />

              {/* Upcoming match */}
              <Card className="border-primary bg-primary/10 p-8">
                <h3 className="text-2xl font-bold text-foreground mb-6">
                  Your Next Match
                </h3>
                <div className="grid grid-cols-3 gap-6 items-center">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-2xl font-black text-primary-foreground">
                        P
                      </span>
                    </div>
                    <p className="font-bold text-foreground">Phoenix Rising</p>
                    <p className="text-xs text-muted-foreground">(Your Team)</p>
                  </div>

                  <div className="text-center">
                    <p className="text-sm font-bold text-muted-foreground uppercase">
                      vs
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Tomorrow at 3 PM EST
                    </p>
                  </div>

                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-accent to-primary rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-2xl font-black text-accent-foreground">
                        S
                      </span>
                    </div>
                    <p className="font-bold text-foreground">Sentinel Guard</p>
                    <p className="text-xs text-muted-foreground">
                      (5-0 Record)
                    </p>
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* Roster tab */}
            <TabsContent value="roster" className="space-y-6">
              <Card className="border-glow-emerald bg-card p-8 glow-emerald">
                <h3 className="text-2xl font-bold text-foreground mb-2">
                  {mockRoster.teamName}
                </h3>
                <p className="text-muted-foreground mb-6">
                  Led by {mockRoster.leader}
                </p>

                {/* Active roster */}
                <div className="mb-8 pb-8 border-b border-border">
                  <h4 className="text-lg font-bold text-primary mb-4">
                    Active Roster
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {mockRoster.active.map((player, idx) => (
                      <Card
                        key={idx}
                        className="border-primary bg-primary/20 p-4"
                      >
                        <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center mx-auto mb-3">
                          <span className="text-lg font-black text-primary-foreground">
                            {player.charAt(0)}
                          </span>
                        </div>
                        <p className="text-center font-bold text-foreground">
                          {player}
                        </p>
                        <Badge className="block text-center mt-2 mx-auto bg-primary">
                          Active
                        </Badge>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Bench */}
                <div>
                  <h4 className="text-lg font-bold text-accent mb-4">Bench</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {mockRoster.bench.map((player, idx) => (
                      <Card key={idx} className="border-border bg-card/50 p-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-muted to-muted rounded-full flex items-center justify-center mx-auto mb-3">
                          <span className="text-lg font-black text-muted-foreground">
                            {player.charAt(0)}
                          </span>
                        </div>
                        <p className="text-center font-bold text-foreground">
                          {player}
                        </p>
                        <Badge className="block text-center mt-2 mx-auto bg-muted text-muted-foreground">
                          Bench
                        </Badge>
                      </Card>
                    ))}
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* Results tab */}
            <TabsContent value="results" className="space-y-4">
              <Card className="border-border bg-card p-6">
                <h3 className="text-lg font-bold text-foreground mb-6">
                  Match Results
                </h3>
                <div className="space-y-4">
                  {mockMatches.map((match) => (
                    <Card
                      key={match.id}
                      className={`border p-4 ${
                        match.status === "completed"
                          ? "border-accent bg-accent/5"
                          : "border-border"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground mb-2">
                            {match.round}
                          </p>
                          <div className="flex items-center gap-4">
                            <span className="font-semibold text-foreground">
                              {match.team1}
                            </span>
                            <span className="text-muted-foreground">vs</span>
                            <span className="font-semibold text-foreground">
                              {match.team2}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          {match.status === "completed" && match.winner && (
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">
                                Winner
                              </p>
                              <p className="font-bold text-accent">
                                {match.winner}
                              </p>
                            </div>
                          )}
                          {match.status === "live" && (
                            <Badge className="bg-primary animate-pulse">
                              LIVE
                            </Badge>
                          )}
                          {match.status === "upcoming" && (
                            <Badge className="bg-muted text-muted-foreground">
                              Upcoming
                            </Badge>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Action buttons */}
          <div className="flex gap-3">
            <Button
              onClick={() => navigate("/individual-filtering")}
              className="flex-1 bg-primary hover:bg-primary/90 text-lg py-6 h-auto glow-emerald-strong"
            >
              Next Phase
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
