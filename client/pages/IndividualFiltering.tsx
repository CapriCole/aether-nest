import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Competitor {
  rank: number;
  name: string;
  wins: number;
  points: number;
  status: "qualified" | "at-risk" | "eliminated";
}

const mockCompetitors: Competitor[] = [
  { rank: 1, name: "Nova Strike", wins: 8, points: 2400, status: "qualified" },
  { rank: 2, name: "Titan Force", wins: 7, points: 2100, status: "qualified" },
  { rank: 3, name: "IceBreaker", wins: 6, points: 1800, status: "qualified" },
  {
    rank: 4,
    name: "SkyFlyer",
    wins: 5,
    points: 1500,
    status: "at-risk",
  },
  {
    rank: 5,
    name: "StormBringer",
    wins: 4,
    points: 1200,
    status: "at-risk",
  },
  {
    rank: 6,
    name: "CrimsonBlade",
    wins: 3,
    points: 900,
    status: "eliminated",
  },
  {
    rank: 7,
    name: "VenomStrike",
    wins: 2,
    points: 600,
    status: "eliminated",
  },
  {
    rank: 8,
    name: "IronWill",
    wins: 1,
    points: 300,
    status: "eliminated",
  },
];

export function IndividualFiltering() {
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState("standings");

  const qualifiedCount = mockCompetitors.filter(
    (c) => c.status === "qualified",
  ).length;

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-background via-secondary/30 to-background py-12">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-12 animate-fade-in">
            <div className="inline-block bg-primary/20 border border-primary/50 rounded-lg px-4 py-2 mb-4 animate-slide-in-down">
              <span className="text-primary font-bold uppercase tracking-wider text-sm">
                Phase 7
              </span>
            </div>
            <h1 className="text-5xl md:text-6xl font-black text-white mb-4 animate-slide-in-up">
              <span className="text-primary">Individual</span>
              <br />
              <span>Filtering.</span>
            </h1>
            <p
              className="text-lg text-muted-foreground max-w-lg mx-auto animate-fade-in"
              style={{ animationDelay: "200ms" }}
            >
              Team dynamics gave way to individual performance. Solo competition
              filters the best from the rest.
            </p>
            <p className="text-sm text-muted-foreground/80 mt-6 max-w-2xl mx-auto italic">
              "The strongest individuals emerge from the chaos. Can you stand
              alone?"
            </p>
          </div>

          {/* Overview stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
            <Card className="border-border bg-card p-6 text-center">
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-2">
                Competitors
              </p>
              <p className="text-4xl font-black text-primary">
                {mockCompetitors.length}
              </p>
            </Card>
            <Card className="border-glow-emerald bg-card p-6 text-center glow-emerald">
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-2">
                Currently Qualified
              </p>
              <p className="text-4xl font-black text-accent">
                {qualifiedCount}
              </p>
            </Card>
            <Card className="border-border bg-card p-6 text-center">
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-2">
                At Risk
              </p>
              <p className="text-4xl font-black text-destructive">
                {mockCompetitors.filter((c) => c.status === "at-risk").length}
              </p>
            </Card>
            <Card className="border-border bg-card p-6 text-center">
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-2">
                Phase Duration
              </p>
              <p className="text-lg font-bold text-primary">5 Days</p>
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
                value="standings"
                className="data-[state=active]:bg-primary"
              >
                Standings
              </TabsTrigger>
              <TabsTrigger
                value="your-progress"
                className="data-[state=active]:bg-primary"
              >
                Your Progress
              </TabsTrigger>
              <TabsTrigger
                value="rules"
                className="data-[state=active]:bg-primary"
              >
                Rules
              </TabsTrigger>
            </TabsList>

            {/* Standings */}
            <TabsContent value="standings" className="space-y-6">
              <Card className="border-glow-emerald bg-card overflow-hidden glow-emerald">
                <div className="divide-y divide-border">
                  {/* Header */}
                  <div className="bg-secondary border-b border-border px-6 py-4 grid grid-cols-12 gap-4 font-bold text-sm uppercase text-muted-foreground tracking-wider">
                    <div className="col-span-1">Rank</div>
                    <div className="col-span-5">Player</div>
                    <div className="col-span-2 text-center">Wins</div>
                    <div className="col-span-2 text-center">Points</div>
                    <div className="col-span-2 text-center">Status</div>
                  </div>

                  {/* Rows */}
                  {mockCompetitors.map((competitor) => (
                    <div
                      key={competitor.rank}
                      className={`px-6 py-4 grid grid-cols-12 gap-4 items-center transition-all ${
                        competitor.status === "qualified"
                          ? "bg-accent/10"
                          : competitor.status === "at-risk"
                            ? "bg-destructive/10"
                            : "bg-background/50"
                      }`}
                    >
                      <div className="col-span-1">
                        <span className="font-bold text-foreground">
                          #{competitor.rank}
                        </span>
                      </div>

                      <div className="col-span-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-black text-primary-foreground">
                              {competitor.name.charAt(0)}
                            </span>
                          </div>
                          <span className="font-semibold text-foreground">
                            {competitor.name}
                          </span>
                        </div>
                      </div>

                      <div className="col-span-2 text-center font-bold text-foreground">
                        {competitor.wins}
                      </div>

                      <div className="col-span-2 text-center font-black text-primary">
                        {competitor.points}
                      </div>

                      <div className="col-span-2 text-center">
                        {competitor.status === "qualified" && (
                          <span className="text-xs font-bold text-accent uppercase tracking-wider">
                            ✓ Qualified
                          </span>
                        )}
                        {competitor.status === "at-risk" && (
                          <span className="text-xs font-bold text-destructive uppercase tracking-wider">
                            ⚠ At Risk
                          </span>
                        )}
                        {competitor.status === "eliminated" && (
                          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                            ✗ Out
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>

            {/* Your Progress */}
            <TabsContent value="your-progress" className="space-y-6">
              <Card className="border-glow-emerald bg-card p-8 glow-emerald">
                <div className="space-y-8">
                  {/* Status */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-black text-foreground mb-2">
                        ShadowPlayer
                      </h3>
                      <p className="text-muted-foreground">Currently Rank #4</p>
                    </div>
                    <div className="bg-primary/20 border border-primary/50 rounded-lg px-4 py-3">
                      <p className="text-sm text-muted-foreground uppercase font-bold mb-1">
                        Status
                      </p>
                      <p className="text-lg font-black text-primary">At Risk</p>
                    </div>
                  </div>

                  {/* Progress bars */}
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase font-bold mb-2">
                        Wins
                      </p>
                      <p className="text-3xl font-black text-primary mb-2">5</p>
                      <div className="w-full bg-background rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full bg-primary"
                          style={{ width: "62.5%" }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase font-bold mb-2">
                        Points
                      </p>
                      <p className="text-3xl font-black text-accent mb-2">
                        1500
                      </p>
                      <div className="w-full bg-background rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full bg-accent"
                          style={{ width: "62.5%" }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase font-bold mb-2">
                        Qualification %
                      </p>
                      <p className="text-3xl font-black text-primary mb-2">
                        62%
                      </p>
                      <div className="w-full bg-background rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary to-accent"
                          style={{ width: "62%" }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Recommendation */}
                  <div className="bg-destructive/20 border border-destructive/50 rounded-lg p-4">
                    <p className="font-bold text-destructive mb-2">
                      ⚠️ At Risk
                    </p>
                    <p className="text-sm text-muted-foreground">
                      You need at least 3 more wins to secure qualification.
                      Only 2 matches remaining. Win or be eliminated.
                    </p>
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* Rules */}
            <TabsContent value="rules" className="space-y-6">
              <Card className="border-border bg-card p-6">
                <h3 className="text-lg font-bold text-foreground mb-6">
                  Individual Filtering Rules
                </h3>
                <div className="space-y-6">
                  <div>
                    <h4 className="font-bold text-foreground mb-3">
                      Qualification System
                    </h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex gap-3">
                        <span className="text-primary">•</span>
                        <span>
                          Top 3 players after round-robin advance automatically
                        </span>
                      </li>
                      <li className="flex gap-3">
                        <span className="text-primary">•</span>
                        <span>
                          Players ranked 4-5 are "at risk" (can still qualify
                          with wins)
                        </span>
                      </li>
                      <li className="flex gap-3">
                        <span className="text-primary">•</span>
                        <span>
                          Players ranked 6+ are eliminated from competition
                        </span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-bold text-foreground mb-3">
                      Points System
                    </h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex gap-3">
                        <span className="text-primary">•</span>
                        <span>Win = 300 points</span>
                      </li>
                      <li className="flex gap-3">
                        <span className="text-primary">•</span>
                        <span>Tie = 150 points</span>
                      </li>
                      <li className="flex gap-3">
                        <span className="text-primary">•</span>
                        <span>Loss = 0 points</span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-bold text-foreground mb-3">
                      Phase Duration
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      5 days of solo competition with daily matches. Rankings
                      update in real-time.
                    </p>
                  </div>
                </div>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Action buttons */}
          <div className="flex gap-3">
            <Button
              onClick={() => navigate("/high-stakes-trials")}
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
