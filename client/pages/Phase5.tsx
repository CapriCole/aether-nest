import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function Phase5() {
  const navigate = useNavigate();
  const [showChampion, setShowChampion] = useState(false);

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-background via-secondary/30 to-background py-12">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-block bg-primary/20 border border-primary/50 rounded-lg px-4 py-2 mb-4">
              <span className="text-primary font-bold uppercase tracking-wider text-sm">
                Phase 5 of 5
              </span>
            </div>
            <h1 className="text-5xl md:text-6xl font-black text-white mb-4">
              <span className="text-premium">The Final</span>
              <br />
              <span>Stage.</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-lg mx-auto">
              50 players. One champion. This is where legends are made.
            </p>
          </div>

          {/* Tournament Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
            <Card className="border-border bg-card p-6 text-center">
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-2">
                Total Finalists
              </p>
              <p className="text-4xl font-black text-primary">50</p>
            </Card>
            <Card className="border-border bg-card p-6 text-center">
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-2">
                Finals Format
              </p>
              <p className="text-lg font-bold text-accent">Single Elimination</p>
            </Card>
            <Card className="border-border bg-card p-6 text-center">
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-2">
                Match Format
              </p>
              <p className="text-lg font-bold text-primary">Best of 3</p>
            </Card>
            <Card className="border-border bg-card p-6 text-center">
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-2">
                Prize Pool
              </p>
              <p className="text-2xl font-black text-premium">$50K</p>
            </Card>
          </div>

          {/* Main bracket section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            {/* Bracket visualization */}
            <Card className="lg:col-span-2 border-glow-emerald bg-card p-8">
              <h3 className="text-lg font-bold text-foreground mb-6">
                Tournament Bracket
              </h3>

              <div className="bg-background rounded-lg p-6 border border-border/50 overflow-x-auto">
                <div className="grid grid-cols-4 gap-4 min-w-max">
                  {/* Round 1 - Round of 32 */}
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-muted-foreground uppercase text-center mb-3">
                      Round 1
                    </p>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                      <div
                        key={`r1-${i}`}
                        className="bg-card border border-border rounded p-2 text-center text-xs"
                      >
                        <p className="font-semibold">Seed {i}</p>
                        <p className="text-muted-foreground">VS</p>
                        <p className="font-semibold">Seed {i + 1}</p>
                      </div>
                    ))}
                  </div>

                  {/* Round 2 - Round of 16 */}
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-muted-foreground uppercase text-center mb-3">
                      Round 2
                    </p>
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={`r2-${i}`}
                        className="bg-card border border-border rounded p-2 text-center text-xs h-24 flex items-center justify-center"
                      >
                        <p className="text-muted-foreground">TBD</p>
                      </div>
                    ))}
                  </div>

                  {/* Semifinals */}
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-muted-foreground uppercase text-center mb-3">
                      Semis
                    </p>
                    {[1, 2].map((i) => (
                      <div
                        key={`semi-${i}`}
                        className="bg-card border border-border rounded p-2 text-center text-xs h-32 flex items-center justify-center"
                      >
                        <p className="text-muted-foreground">TBD</p>
                      </div>
                    ))}
                  </div>

                  {/* Finals & Champion */}
                  <div className="space-y-2 flex flex-col justify-center">
                    <p className="text-xs font-bold text-muted-foreground uppercase text-center mb-3">
                      Final
                    </p>
                    <div className="bg-primary/20 border-2 border-primary rounded p-3 text-center text-xs h-40 flex items-center justify-center cursor-pointer hover:bg-primary/30 transition-all" onClick={() => setShowChampion(true)}>
                      {showChampion ? (
                        <div className="text-center">
                          <p className="text-premium font-black text-lg mb-1">
                            👑
                          </p>
                          <p className="text-primary font-bold">Champion!</p>
                        </div>
                      ) : (
                        <p className="text-muted-foreground">TBD</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div className="mt-6 pt-6 border-t border-border">
                <p className="text-xs font-bold text-muted-foreground uppercase mb-3">
                  Bracket Status
                </p>
                <div className="flex gap-6 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-card border border-border rounded"></div>
                    <span className="text-muted-foreground">Upcoming</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-primary border border-primary rounded"></div>
                    <span className="text-muted-foreground">Finals</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Side section - Player info & Prize pool */}
            <div className="space-y-6">
              {/* Your position */}
              <Card className="border-glow-emerald bg-card p-6 glow-emerald">
                <h4 className="font-bold text-foreground mb-4">
                  Your Position
                </h4>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">
                      Seeding
                    </p>
                    <p className="text-3xl font-black text-accent">Seed 32</p>
                  </div>
                  <div className="pt-4 border-t border-border">
                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">
                      Status
                    </p>
                    <Badge className="bg-primary">Ready to Compete</Badge>
                  </div>
                </div>
              </Card>

              {/* Prize breakdown */}
              <Card className="border-premium bg-premium/10 p-6">
                <h4 className="font-bold text-foreground mb-4">
                  Prize Distribution
                </h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">1st Place</span>
                    <span className="font-black text-premium">$25,000</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">2nd Place</span>
                    <span className="font-black text-accent">$12,500</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">3rd Place</span>
                    <span className="font-black text-primary">$7,500</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">4th Place</span>
                    <span className="font-black text-primary">$3,500</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-border pt-3 mt-3">
                    <span className="text-muted-foreground font-bold">
                      Top 50
                    </span>
                    <span className="font-black text-premium">$1,500</span>
                  </div>
                </div>
              </Card>

              {/* Schedule */}
              <Card className="border-border bg-card p-6">
                <h4 className="font-bold text-foreground mb-4">Schedule</h4>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-muted-foreground uppercase font-bold text-xs mb-1">
                      Round 1
                    </p>
                    <p className="text-foreground">In 2 hours</p>
                  </div>
                  <div className="pt-3 border-t border-border">
                    <p className="text-muted-foreground uppercase font-bold text-xs mb-1">
                      Finals
                    </p>
                    <p className="text-foreground">In 6 hours</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Championship moment section */}
          {showChampion && (
            <Card className="border-primary bg-gradient-to-r from-primary/20 via-background to-premium/20 p-8 mb-8 text-center">
              <div className="space-y-4">
                <div className="text-5xl">👑</div>
                <h2 className="text-3xl font-black text-white">
                  CHAMPION CROWNED
                </h2>
                <p className="text-lg text-muted-foreground">
                  This is the ultimate moment. Glory, recognition, and
                  legendary status await.
                </p>
                <Button
                  size="lg"
                  className="bg-primary hover:bg-primary/90 mx-auto"
                  onClick={() => navigate("/dashboard")}
                >
                  Return to Dashboard
                </Button>
              </div>
            </Card>
          )}

          {/* Tournament Rules */}
          <Card className="border-border bg-card p-6">
            <h3 className="text-lg font-bold text-foreground mb-4">
              Finals Tournament Rules
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-muted-foreground">
              <ul className="space-y-2">
                <li className="flex gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span>Single elimination bracket (50 → 1 champion)</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span>All matches are Best of 3</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span>Seeding based on League performance</span>
                </li>
              </ul>
              <ul className="space-y-2">
                <li className="flex gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span>Live broadcast of all matches</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span>Professional commentary and analysis</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span>Winner receives championship belt and title</span>
                </li>
              </ul>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
