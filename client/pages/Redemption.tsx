import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type RedemptionFormat = "knockout" | "roundrobin" | "bestof3";

const formatDetails: Record<
  RedemptionFormat,
  { name: string; description: string; slots: number }
> = {
  knockout: {
    name: "Single Elimination (Knockout)",
    description: "Lose once and you're out. Fast-paced, high-stakes.",
    slots: 25,
  },
  roundrobin: {
    name: "Round Robin Tournament",
    description: "Play multiple matches. Top performers advance.",
    slots: 40,
  },
  bestof3: {
    name: "Best of 3 Format",
    description: "Consistency matters. Win 2 out of 3.",
    slots: 35,
  },
};

export function Redemption() {
  const navigate = useNavigate();
  const [selectedFormat, setSelectedFormat] = useState<RedemptionFormat | null>(
    null
  );
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (selectedFormat) {
      setSubmitted(true);
      setTimeout(() => {
        navigate("/dashboard");
      }, 2000);
    }
  };

  const totalCompeting = 250;
  const totalSlots = 100;
  const remainingSlots = totalSlots - totalCompeting;

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-background via-secondary/30 to-background py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-block bg-primary/20 border border-primary/50 rounded-lg px-4 py-2 mb-4">
              <span className="text-primary font-bold uppercase tracking-wider text-sm">
                Phase 3.5
              </span>
            </div>
            <h1 className="text-5xl md:text-6xl font-black text-white mb-4">
              <span className="text-primary">Redemption</span>
              <br />
              <span>Arena.</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-lg mx-auto">
              You didn't make it through Battle Royale, but this isn't over.
              Choose your format and fight for a second chance.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
            <Card className="border-border bg-card p-6 text-center">
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-2">
                Competitors
              </p>
              <p className="text-4xl font-black text-primary">{totalCompeting}</p>
              <p className="text-sm text-muted-foreground mt-2">
                Eliminated players fighting back
              </p>
            </Card>
            <Card className="border-border bg-card p-6 text-center">
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-2">
                Total Slots
              </p>
              <p className="text-4xl font-black text-accent">{totalSlots}</p>
              <p className="text-sm text-muted-foreground mt-2">
                {remainingSlots} spots open
              </p>
            </Card>
            <Card className="border-border bg-card p-6 text-center">
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-2">
                Advancement Rate
              </p>
              <p className="text-4xl font-black text-primary">40%</p>
              <p className="text-sm text-muted-foreground mt-2">
                Average survivor rate
              </p>
            </Card>
          </div>

          {/* Format selection */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-6">
              Choose Your Redemption Format
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {(
                [
                  "knockout" as const,
                  "roundrobin" as const,
                  "bestof3" as const,
                ] as const
              ).map((format) => (
                <Card
                  key={format}
                  className={`border p-6 cursor-pointer transition-all hover:border-primary/50 ${
                    selectedFormat === format
                      ? "border-primary bg-primary/10 glow-emerald-strong ring-2 ring-primary"
                      : "border-glow-emerald"
                  }`}
                  onClick={() => setSelectedFormat(format)}
                >
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-bold text-foreground mb-2">
                        {formatDetails[format].name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {formatDetails[format].description}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-border space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground uppercase font-bold">
                          Available Slots
                        </span>
                        <Badge className="bg-accent text-accent-foreground">
                          {formatDetails[format].slots} spots
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <p className="text-muted-foreground font-bold">
                            Difficulty
                          </p>
                          <p className="text-primary">
                            {format === "knockout"
                              ? "Brutal"
                              : format === "roundrobin"
                                ? "Balanced"
                                : "Moderate"}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground font-bold">
                            Duration
                          </p>
                          <p className="text-accent">
                            {format === "knockout"
                              ? "2 days"
                              : format === "roundrobin"
                                ? "5 days"
                                : "3 days"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {selectedFormat === format && (
                      <div className="bg-primary/20 border border-primary/50 rounded-md p-2 text-xs text-primary font-bold text-center">
                        ✓ Selected
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Rules section */}
          <Card className="border-border bg-card p-6 mb-12">
            <h3 className="text-lg font-bold text-foreground mb-4">
              Redemption Arena Rules
            </h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex gap-3">
                <span className="text-primary font-bold">•</span>
                <span>All formats begin in 24 hours</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold">•</span>
                <span>Winners automatically advance to Phase 4</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold">•</span>
                <span>
                  Format choice is final—no changes after registration
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold">•</span>
                <span>
                  This is your last chance. Make it count.
                </span>
              </li>
            </ul>
          </Card>

          {/* Action buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleSubmit}
              disabled={!selectedFormat}
              className="flex-1 bg-primary hover:bg-primary/90 text-lg py-6 h-auto glow-emerald-strong"
            >
              {submitted ? "Registering..." : "Register for Redemption"}
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => navigate("/dashboard")}
            >
              Back to Dashboard
            </Button>
          </div>

          {/* Success message */}
          {submitted && (
            <div className="mt-6 bg-primary/20 border border-primary/50 rounded-lg p-4 text-center">
              <p className="text-primary font-bold">
                ✓ Redemption Format Selected!
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Tournament begins in 24 hours. Prepare yourself.
              </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
