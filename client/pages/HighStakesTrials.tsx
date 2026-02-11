import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Trial {
  id: string;
  opponent: string;
  opponentWins: number;
  stakes: string;
  outcome?: "win" | "loss";
  status: "upcoming" | "active" | "completed";
}

const mockTrials: Trial[] = [
  {
    id: "1",
    opponent: "Nova Strike",
    opponentWins: 8,
    stakes: "Finals Qualification",
    status: "completed",
    outcome: "loss",
  },
  {
    id: "2",
    opponent: "Titan Force",
    opponentWins: 7,
    stakes: "Finals Qualification",
    status: "completed",
    outcome: "win",
  },
  {
    id: "3",
    opponent: "IceBreaker",
    opponentWins: 6,
    stakes: "Finals Qualification",
    status: "active",
  },
];

export function HighStakesTrials() {
  const navigate = useNavigate();
  const [selectedTrial, setSelectedTrial] = useState<string>("3");
  const [revealed, setRevealed] = useState(false);

  const currentTrial = mockTrials.find((t) => t.id === selectedTrial);
  const completedTrials = mockTrials.filter((t) => t.status === "completed");
  const wins = completedTrials.filter((t) => t.outcome === "win").length;

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-background via-secondary/30 to-background py-12">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-12 animate-fade-in">
            <div className="inline-block bg-primary/20 border border-primary/50 rounded-lg px-4 py-2 mb-4 animate-slide-in-down">
              <span className="text-primary font-bold uppercase tracking-wider text-sm">
                Phase 8
              </span>
            </div>
            <h1 className="text-5xl md:text-6xl font-black text-white mb-4 animate-slide-in-up">
              <span className="text-primary">High-Stakes</span>
              <br />
              <span>Trials.</span>
            </h1>
            <p
              className="text-lg text-muted-foreground max-w-lg mx-auto animate-fade-in"
              style={{ animationDelay: "200ms" }}
            >
              One-on-one battles. No room for error. Your decision to fight or
              concede determines your fate.
            </p>
            <p className="text-sm text-muted-foreground/80 mt-6 max-w-2xl mx-auto italic">
              "This is where champions are forged. Everything comes down to this
              moment."
            </p>
          </div>

          {/* Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
            <Card className="border-border bg-card p-6 text-center">
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-2">
                Total Trials
              </p>
              <p className="text-4xl font-black text-primary">
                {mockTrials.length}
              </p>
            </Card>
            <Card className="border-glow-emerald bg-card p-6 text-center glow-emerald">
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-2">
                Your Wins
              </p>
              <p className="text-4xl font-black text-accent">{wins}</p>
            </Card>
            <Card className="border-border bg-card p-6 text-center">
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-2">
                Completed
              </p>
              <p className="text-4xl font-black text-primary">
                {completedTrials.length}
              </p>
            </Card>
            <Card className="border-border bg-card p-6 text-center">
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-2">
                Win Rate
              </p>
              <p className="text-4xl font-black text-accent">
                {Math.round((wins / completedTrials.length) * 100) || 0}%
              </p>
            </Card>
          </div>

          {/* Current trial */}
          {currentTrial && (
            <Card
              className={`border p-8 mb-12 transition-all ${
                currentTrial.status === "active"
                  ? "border-primary bg-primary/10 glow-emerald-strong animate-pulse"
                  : "border-glow-emerald"
              }`}
            >
              <div className="text-center space-y-8">
                {/* Title */}
                <div>
                  <p className="text-sm text-muted-foreground uppercase font-bold tracking-wider mb-2">
                    {currentTrial.status === "active"
                      ? "NOW LIVE"
                      : "COMPLETED"}
                  </p>
                  <h2 className="text-3xl font-black text-foreground mb-2">
                    {currentTrial.status === "active"
                      ? "Prepare for Battle"
                      : "Trial Complete"}
                  </h2>
                  <p className="text-muted-foreground">{currentTrial.stakes}</p>
                </div>

                {/* Matchup */}
                <div className="grid grid-cols-3 gap-6 items-center">
                  {/* You */}
                  <div>
                    <div className="w-20 h-20 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-3xl font-black text-primary-foreground">
                        S
                      </span>
                    </div>
                    <p className="font-bold text-foreground">ShadowPlayer</p>
                    <p className="text-xs text-muted-foreground">1 Win</p>
                  </div>

                  {/* VS */}
                  <div>
                    <p className="text-2xl font-black text-primary">VS</p>
                    <p className="text-xs text-muted-foreground uppercase mt-2 tracking-wider">
                      One Match
                    </p>
                  </div>

                  {/* Opponent */}
                  <div>
                    <div className="w-20 h-20 bg-gradient-to-br from-accent to-primary rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-3xl font-black text-accent-foreground">
                        {currentTrial.opponent.charAt(0)}
                      </span>
                    </div>
                    <p className="font-bold text-foreground">
                      {currentTrial.opponent}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {currentTrial.opponentWins} Wins
                    </p>
                  </div>
                </div>

                {/* Action */}
                {currentTrial.status === "active" && (
                  <div className="space-y-4">
                    <Button
                      size="lg"
                      className="w-full bg-primary hover:bg-primary/90 text-lg py-6 h-auto glow-emerald-strong"
                      onClick={() => setRevealed(true)}
                    >
                      {revealed ? "Outcome Revealed" : "Face Your Trial"}
                    </Button>

                    {revealed && (
                      <Card className="border-accent bg-accent/20 p-6">
                        <div className="space-y-3">
                          <p className="font-black text-3xl text-accent">
                            ✓ VICTORY
                          </p>
                          <p className="text-muted-foreground">
                            You've defeated {currentTrial.opponent} and secured
                            your path to the finals!
                          </p>
                        </div>
                      </Card>
                    )}
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Trial history */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-6">
              Trial History
            </h2>
            <div className="space-y-3">
              {mockTrials.map((trial) => (
                <Card
                  key={trial.id}
                  className={`border p-4 cursor-pointer transition-all ${
                    selectedTrial === trial.id
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                  onClick={() => setSelectedTrial(trial.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-lg font-bold text-foreground">
                          {trial.opponent}
                        </h4>
                        <Badge className="bg-muted text-muted-foreground">
                          {trial.opponentWins} Wins
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {trial.stakes}
                      </p>
                    </div>

                    <div className="text-right">
                      {trial.status === "active" && (
                        <Badge className="bg-primary animate-pulse">LIVE</Badge>
                      )}
                      {trial.status === "completed" && (
                        <div>
                          <p
                            className={`text-lg font-black ${
                              trial.outcome === "win"
                                ? "text-accent"
                                : "text-destructive"
                            }`}
                          >
                            {trial.outcome === "win" ? "✓ WON" : "✗ LOST"}
                          </p>
                        </div>
                      )}
                      {trial.status === "upcoming" && (
                        <Badge className="bg-muted text-muted-foreground">
                          Upcoming
                        </Badge>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Info */}
          <Card className="border-border bg-card p-6 mb-12">
            <h3 className="font-bold text-foreground mb-4">
              What Happens Next?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-muted-foreground">
              <div>
                <p className="font-bold text-foreground mb-2">If You Win All</p>
                <p>
                  Advance directly to the Grand Finals as a top seed with
                  guaranteed entry and premium positioning.
                </p>
              </div>
              <div>
                <p className="font-bold text-foreground mb-2">If You Win 2/3</p>
                <p>
                  Advance to Finals but as a lower seed. You'll need to fight
                  through the bracket.
                </p>
              </div>
              <div>
                <p className="font-bold text-foreground mb-2">If You Win 1/3</p>
                <p>
                  Consolation bracket opportunity. One last chance to prove
                  yourself for a Finals spot.
                </p>
              </div>
              <div>
                <p className="font-bold text-foreground mb-2">
                  If You Lose All
                </p>
                <p>
                  You're eliminated from competition. Season ends here. No
                  redemption.
                </p>
              </div>
            </div>
          </Card>

          {/* Action buttons */}
          <div className="flex gap-3">
            <Button
              onClick={() => navigate("/phase-5")}
              className="flex-1 bg-primary hover:bg-primary/90 text-lg py-6 h-auto glow-emerald-strong"
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
