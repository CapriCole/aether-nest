import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

export function Phase2() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    strategy: "",
    teamwork: false,
    adaptation: false,
    pressure: false,
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      formData.strategy &&
      (formData.teamwork || formData.adaptation || formData.pressure)
    ) {
      setSubmitted(true);
      setTimeout(() => {
        navigate("/dashboard");
      }, 2000);
    }
  };

  const isValid =
    formData.strategy &&
    (formData.teamwork || formData.adaptation || formData.pressure);

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-background via-secondary/30 to-background py-12">
        <div className="container mx-auto px-4 max-w-2xl">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-block bg-primary/20 border border-primary/50 rounded-lg px-4 py-2 mb-4">
              <span className="text-primary font-bold uppercase tracking-wider text-sm">
                Phase 2 of 5
              </span>
            </div>
            <h1 className="text-5xl md:text-6xl font-black text-white mb-4">
              <span className="text-primary">The Reckoning</span>
              <br />
              <span>Begins.</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-lg mx-auto">
              Now we test your strategic thinking. This isn't just about
              reflexes—it's about intelligence and adaptability.
            </p>
          </div>

          {/* Challenge card */}
          <Card className="border-glow-emerald bg-card p-8 mb-8">
            <div className="space-y-6">
              {/* Challenge instructions */}
              <div className="bg-background rounded-lg p-6 border border-border/50">
                <h3 className="font-bold text-foreground mb-3">Challenge</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Strategy separates champions from competitors. Describe how
                  you approach a high-pressure competitive situation. What's
                  your decision-making process? How do you handle unexpected
                  changes?
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Strategy question */}
                <div className="space-y-2">
                  <Label htmlFor="strategy" className="font-bold">
                    Your Strategic Approach
                  </Label>
                  <Textarea
                    id="strategy"
                    placeholder="Explain your decision-making under pressure..."
                    value={formData.strategy}
                    onChange={(e) =>
                      setFormData({ ...formData, strategy: e.target.value })
                    }
                    className="bg-background border-border min-h-32 resize-none"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.strategy.length}/400 words recommended
                  </p>
                </div>

                {/* Checkboxes for attributes */}
                <div className="bg-background rounded-lg p-4 border border-border/50 space-y-3">
                  <p className="font-bold text-sm mb-4">
                    Which of these describes your playstyle? (Select at least
                    one)
                  </p>

                  <div className="flex items-center gap-3">
                    <Checkbox
                      id="teamwork"
                      checked={formData.teamwork}
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          teamwork: checked as boolean,
                        })
                      }
                    />
                    <Label htmlFor="teamwork" className="font-normal cursor-pointer">
                      I excel in team coordination and communication
                    </Label>
                  </div>

                  <div className="flex items-center gap-3">
                    <Checkbox
                      id="adaptation"
                      checked={formData.adaptation}
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          adaptation: checked as boolean,
                        })
                      }
                    />
                    <Label
                      htmlFor="adaptation"
                      className="font-normal cursor-pointer"
                    >
                      I adapt quickly to unexpected situations
                    </Label>
                  </div>

                  <div className="flex items-center gap-3">
                    <Checkbox
                      id="pressure"
                      checked={formData.pressure}
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          pressure: checked as boolean,
                        })
                      }
                    />
                    <Label
                      htmlFor="pressure"
                      className="font-normal cursor-pointer"
                    >
                      I thrive under high-pressure competitive situations
                    </Label>
                  </div>
                </div>

                {/* Submit button */}
                <div className="flex gap-3 pt-4">
                  <Button
                    type="submit"
                    className="flex-1 bg-primary hover:bg-primary/90 text-lg py-6 h-auto glow-emerald-strong"
                    disabled={!isValid}
                  >
                    {submitted ? "Submitting..." : "Submit Challenge"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/dashboard")}
                    className="flex-1"
                  >
                    Back to Dashboard
                  </Button>
                </div>
              </form>

              {/* Success message */}
              {submitted && (
                <div className="bg-primary/20 border border-primary/50 rounded-lg p-4 text-center">
                  <p className="text-primary font-bold">✓ Challenge Submitted!</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    The reckoning is underway. Redirecting to dashboard...
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Info section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <Card className="border-border bg-card/50 p-4">
              <p className="text-2xl font-black text-primary mb-2">48h</p>
              <p className="text-xs text-muted-foreground uppercase font-bold">
                Response Time
              </p>
            </Card>
            <Card className="border-border bg-card/50 p-4">
              <p className="text-2xl font-black text-accent mb-2">180</p>
              <p className="text-xs text-muted-foreground uppercase font-bold">
                Will Advance
              </p>
            </Card>
            <Card className="border-border bg-card/50 p-4">
              <p className="text-2xl font-black text-primary mb-2">Strategy</p>
              <p className="text-xs text-muted-foreground uppercase font-bold">
                Matters Most
              </p>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
