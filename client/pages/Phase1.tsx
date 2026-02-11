import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function Phase1() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    answer: "",
    gamertag: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.answer && formData.gamertag) {
      setSubmitted(true);
      setTimeout(() => {
        navigate("/dashboard");
      }, 2000);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-background via-secondary/30 to-background py-12">
        <div className="container mx-auto px-4 max-w-2xl">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-block bg-primary/20 border border-primary/50 rounded-lg px-4 py-2 mb-4">
              <span className="text-primary font-bold uppercase tracking-wider text-sm">
                Phase 1 of 5
              </span>
            </div>
            <h1 className="text-5xl md:text-6xl font-black text-white mb-4">
              <span className="text-primary">You Answered</span>
              <br />
              <span>the Call.</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-lg mx-auto">
              Welcome to AetherNEST. This is where your journey begins. Show us
              what you're made of.
            </p>
          </div>

          {/* Challenge card */}
          <Card className="border-glow-emerald bg-card p-8 mb-8">
            <div className="space-y-6">
              {/* Challenge instructions */}
              <div className="bg-background rounded-lg p-6 border border-border/50">
                <h3 className="font-bold text-foreground mb-3">Challenge</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Tell us about your greatest gaming achievement. In 100-300
                  words, describe a moment when you demonstrated exceptional
                  skill, strategy, or sportsmanship. This helps us understand
                  your mindset and experience level.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Gamertag */}
                <div className="space-y-2">
                  <Label htmlFor="gamertag" className="font-bold">
                    Gamertag
                  </Label>
                  <Input
                    id="gamertag"
                    placeholder="Your esports nickname"
                    value={formData.gamertag}
                    onChange={(e) =>
                      setFormData({ ...formData, gamertag: e.target.value })
                    }
                    className="bg-background border-border"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    This will be your public profile name
                  </p>
                </div>

                {/* Challenge answer */}
                <div className="space-y-2">
                  <Label htmlFor="answer" className="font-bold">
                    Your Challenge Response
                  </Label>
                  <Textarea
                    id="answer"
                    placeholder="Share your greatest gaming moment..."
                    value={formData.answer}
                    onChange={(e) =>
                      setFormData({ ...formData, answer: e.target.value })
                    }
                    className="bg-background border-border min-h-32 resize-none"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.answer.length}/300 words recommended
                  </p>
                </div>

                {/* Submit button */}
                <div className="flex gap-3 pt-4">
                  <Button
                    type="submit"
                    className="flex-1 bg-primary hover:bg-primary/90 text-lg py-6 h-auto glow-emerald-strong"
                    disabled={!formData.answer || !formData.gamertag}
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
                    You've advanced. Redirecting to dashboard...
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Info section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <Card className="border-border bg-card/50 p-4">
              <p className="text-2xl font-black text-primary mb-2">24h</p>
              <p className="text-xs text-muted-foreground uppercase font-bold">
                Response Time
              </p>
            </Card>
            <Card className="border-border bg-card/50 p-4">
              <p className="text-2xl font-black text-accent mb-2">250</p>
              <p className="text-xs text-muted-foreground uppercase font-bold">
                Will Advance
              </p>
            </Card>
            <Card className="border-border bg-card/50 p-4">
              <p className="text-2xl font-black text-primary mb-2">Proving</p>
              <p className="text-xs text-muted-foreground uppercase font-bold">
                Your Worth
              </p>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
