import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LeagueTable } from "@/components/LeagueTable";

const mockLeaguePlayers = [
  { rank: 1, username: "Phoenix", wins: 18, losses: 2, points: 1850 },
  { rank: 2, username: "Sentinel", wins: 17, losses: 3, points: 1810 },
  { rank: 3, username: "Apex", wins: 16, losses: 4, points: 1760 },
  { rank: 4, username: "VortexX", wins: 15, losses: 5, points: 1680 },
  { rank: 5, username: "ShadowPlay", wins: 14, losses: 6, points: 1610 },
  { rank: 6, username: "NovaStrike", wins: 13, losses: 7, points: 1530 },
  { rank: 7, username: "TitanForce", wins: 12, losses: 8, points: 1440 },
  { rank: 8, username: "PrimeHunter", wins: 11, losses: 9, points: 1360 },
  { rank: 9, username: "IceBreaker", wins: 10, losses: 10, points: 1250 },
  { rank: 10, username: "SkyFlyer", wins: 9, losses: 11, points: 1150 },
  { rank: 11, username: "StormBringer", wins: 8, losses: 12, points: 1040 },
  { rank: 12, username: "CrimsonBlade", wins: 7, losses: 13, points: 920 },
  // User's rank
  { rank: 42, username: "ShadowPlayer", wins: 4, losses: 16, points: 180, isUser: true },
];

export function Phase4() {
  const navigate = useNavigate();
  const [selectedFormat, setSelectedFormat] = useState<"league" | "playoffs">("league");
  const [hasEntryFee, setHasEntryFee] = useState(false);

  const topRankedPlayers = useMemo(
    () => mockLeaguePlayers.slice(0, 12),
    []
  );

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-background via-secondary/30 to-background py-12">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-block bg-primary/20 border border-primary/50 rounded-lg px-4 py-2 mb-4">
              <span className="text-primary font-bold uppercase tracking-wider text-sm">
                Phase 4 of 5
              </span>
            </div>
            <h1 className="text-5xl md:text-6xl font-black text-white mb-4">
              <span className="text-primary">League</span>
              <br />
              <span>System.</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-lg mx-auto">
              300 players compete in leagues. The strongest advance to finals.
            </p>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
            <Card className="border-border bg-card p-6 text-center">
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-2">
                Total Competitors
              </p>
              <p className="text-4xl font-black text-primary">300</p>
            </Card>
            <Card className="border-border bg-card p-6 text-center">
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-2">
                Advancing to Finals
              </p>
              <p className="text-4xl font-black text-accent">50</p>
            </Card>
            <Card className="border-border bg-card p-6 text-center">
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-2">
                Your Current Rank
              </p>
              <p className="text-4xl font-black text-primary">#42</p>
            </Card>
            <Card className="border-border bg-card p-6 text-center">
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-2">
                Your Points
              </p>
              <p className="text-4xl font-black text-accent">180</p>
            </Card>
          </div>

          {/* Format Selection */}
          <Tabs
            value={selectedFormat}
            onValueChange={(v) => setSelectedFormat(v as "league" | "playoffs")}
            className="mb-12"
          >
            <TabsList className="grid w-full grid-cols-2 bg-card border border-glow-emerald">
              <TabsTrigger value="league" className="data-[state=active]:bg-primary">
                League Play
              </TabsTrigger>
              <TabsTrigger value="playoffs" className="data-[state=active]:bg-primary">
                Playoffs Format
              </TabsTrigger>
            </TabsList>

            {/* League Play Tab */}
            <TabsContent value="league" className="space-y-6">
              <Card className="border-border bg-card p-6">
                <h3 className="text-lg font-bold text-foreground mb-4">
                  League Standings (Top 12)
                </h3>
                <LeagueTable players={topRankedPlayers} />
              </Card>

              <Card className="border-border bg-card p-6 space-y-4">
                <h3 className="text-lg font-bold text-foreground">
                  League Format Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="space-y-2">
                    <p className="font-bold text-muted-foreground uppercase text-xs tracking-wider">
                      Round Robin
                    </p>
                    <p className="text-muted-foreground">
                      Play against each opponent once. Points awarded per win.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="font-bold text-muted-foreground uppercase text-xs tracking-wider">
                      Point System
                    </p>
                    <p className="text-muted-foreground">
                      Win = 100 pts, Tie = 50 pts, Loss = 0 pts
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="font-bold text-muted-foreground uppercase text-xs tracking-wider">
                      Duration
                    </p>
                    <p className="text-muted-foreground">
                      7 days of competitive play
                    </p>
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* Playoffs Tab */}
            <TabsContent value="playoffs" className="space-y-6">
              <Card className="border-border bg-card p-6">
                <h3 className="text-lg font-bold text-foreground mb-4">
                  Playoff Bracket (Top 8 Seeded)
                </h3>
                <div className="bg-background rounded-lg p-6 border border-border/50">
                  <div className="grid grid-cols-3 gap-4">
                    {/* Semifinals */}
                    <div className="space-y-4">
                      <p className="text-xs font-bold text-muted-foreground uppercase text-center">
                        Semifinals
                      </p>
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className="bg-card border border-border rounded p-2 text-center"
                        >
                          <p className="text-sm font-semibold">Seed {i}</p>
                        </div>
                      ))}
                    </div>

                    {/* Finals */}
                    <div className="flex flex-col justify-center items-center space-y-8">
                      <p className="text-xs font-bold text-muted-foreground uppercase">
                        Finals
                      </p>
                      <div className="w-full h-32 border-2 border-primary rounded flex items-center justify-center text-center">
                        <span className="text-primary font-bold">
                          Champion
                        </span>
                      </div>
                    </div>

                    {/* Seeds 5-8 */}
                    <div className="space-y-4">
                      <p className="text-xs font-bold text-muted-foreground uppercase text-center">
                        Semifinals
                      </p>
                      {[5, 6, 7, 8].map((i) => (
                        <div
                          key={i}
                          className="bg-card border border-border rounded p-2 text-center"
                        >
                          <p className="text-sm font-semibold">Seed {i}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="border-border bg-card p-6 space-y-4">
                <h3 className="text-lg font-bold text-foreground">
                  Playoff Format Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="space-y-2">
                    <p className="font-bold text-muted-foreground uppercase text-xs tracking-wider">
                      Qualification
                    </p>
                    <p className="text-muted-foreground">
                      Top 8 from league automatically seed
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="font-bold text-muted-foreground uppercase text-xs tracking-wider">
                      Format
                    </p>
                    <p className="text-muted-foreground">
                      Best of 3 semifinals and finals
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="font-bold text-muted-foreground uppercase text-xs tracking-wider">
                      Duration
                    </p>
                    <p className="text-muted-foreground">
                      2 days of playoff competition
                    </p>
                  </div>
                </div>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Entry Fee Section */}
          <Card className="border-primary bg-primary/10 p-6 mb-8">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-foreground mb-2">
                  Entry Fee Required
                </h3>
                <p className="text-muted-foreground mb-4">
                  To secure your spot and compete for the finals, an entry fee
                  is required. This contributes to the prize pool.
                </p>
                <p className="text-2xl font-black text-primary">$50 USD</p>
              </div>
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90"
                onClick={() => setHasEntryFee(true)}
              >
                Pay Entry Fee
              </Button>
            </div>
            {hasEntryFee && (
              <div className="mt-4 bg-primary/20 border border-primary/50 rounded-lg p-3 text-sm text-primary font-bold">
                ✓ Entry fee paid. You're in the competition!
              </div>
            )}
          </Card>

          {/* Action buttons */}
          <div className="flex gap-3">
            <Button
              onClick={() => navigate("/phase-5")}
              className="flex-1 bg-primary hover:bg-primary/90 text-lg py-6 h-auto glow-emerald-strong"
              disabled={!hasEntryFee}
            >
              Proceed to Finals
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
