import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { CountdownTimer } from "@/components/CountdownTimer";

export function Landing() {
  const navigate = useNavigate();
  const [registeredPlayers, setRegisteredPlayers] = useState(73);
  const maxPlayers = 500;

  // Simulate player registration updates
  useEffect(() => {
    const interval = setInterval(() => {
      setRegisteredPlayers((prev) => {
        const newCount = prev + Math.floor(Math.random() * 5);
        return Math.min(newCount, maxPlayers);
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Phase 1 closing date (30 days from now)
  const phase1ClosingDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  return (
    <Layout>
      <div className="min-h-screen aurora-bg noise-overlay flex flex-col items-center justify-center relative">
        {/* Floating ambient particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[10%] left-[8%] w-80 h-80 rounded-full bg-primary/10 blur-[100px] animate-float-slow"></div>
          <div className="absolute bottom-[15%] right-[5%] w-96 h-96 rounded-full bg-accent/8 blur-[120px] animate-float-slow" style={{ animationDelay: "2s" }}></div>
          <div className="absolute top-[50%] left-[40%] w-72 h-72 rounded-full bg-primary/5 blur-[80px] animate-float" style={{ animationDelay: "4s" }}></div>
        </div>

        <div className="relative z-10 container mx-auto px-4 py-16 md:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Left side — Hero content */}
            <div className="flex flex-col gap-10">
              {/* Badge */}
              <div className="animate-fade-in-up stagger-1">
                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-xs font-semibold text-primary uppercase tracking-widest">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                  Season 1 — Live
                </span>
              </div>

              {/* Heading */}
              <div className="space-y-5 animate-fade-in-up stagger-2">
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-white leading-[1.05] tracking-tight">
                  <span className="block text-gradient text-glow">
                    From the Call
                  </span>
                  <span className="block">to the Crown.</span>
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-lg">
                  Join AetherNEST's ultimate esports tournament platform. Compete
                  across five phases, qualify through battle royale challenges,
                  and claim your place at the final stage.
                </p>
              </div>

              {/* Registration Counter — Glass card */}
              <div className="glass-card rounded-xl p-6 animate-fade-in-up stagger-3">
                <div className="text-xs text-muted-foreground uppercase tracking-[0.2em] font-bold mb-3">
                  Players Registered
                </div>
                <div className="flex items-baseline gap-2">
                  <div className="text-5xl font-black text-gradient">
                    <AnimatedNumber value={registeredPlayers} />
                  </div>
                  <div className="text-2xl text-muted-foreground font-light">/ {maxPlayers}</div>
                </div>
                <div className="mt-4 bg-background/50 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full gradient-primary transition-all duration-700 ease-out rounded-full"
                    style={{ width: `${(registeredPlayers / maxPlayers) * 100}%` }}
                  ></div>
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  {maxPlayers - registeredPlayers} slots remaining
                </p>
              </div>

              {/* Phase 1 Countdown — Glass card */}
              <div className="glass-card rounded-xl p-6 animate-fade-in-up stagger-4">
                <div className="text-xs text-muted-foreground uppercase tracking-[0.2em] font-bold mb-4">
                  Phase 1 Closing In
                </div>
                <CountdownTimer
                  targetDate={phase1ClosingDate}
                  className="mb-6"
                />
              </div>

              {/* CTA Button */}
              <div className="animate-fade-in-up stagger-5">
                <Button
                  size="lg"
                  onClick={() => navigate("/register")}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg py-6 h-auto btn-glow glow-emerald-strong rounded-xl px-10"
                >
                  Join the Challenge
                </Button>
              </div>
            </div>

            {/* Right side — Orb visualization */}
            <div className="hidden lg:flex items-center justify-center animate-fade-in-up stagger-6">
              <div className="relative w-full aspect-square max-w-md">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative w-72 h-72">
                    {/* Outer glow ring */}
                    <div className="absolute -inset-8 rounded-full bg-primary/10 blur-2xl animate-pulse"></div>

                    {/* Center circle — glass */}
                    <div className="absolute inset-0 rounded-full glass-strong flex items-center justify-center border-beam">
                      <div className="text-center relative z-10">
                        <div className="text-6xl font-black text-gradient">
                          500
                        </div>
                        <p className="text-muted-foreground uppercase tracking-[0.25em] font-bold mt-2 text-xs">
                          Players
                        </p>
                      </div>
                    </div>

                    {/* Orbiting rings */}
                    <div className="absolute -inset-4 rounded-full border border-primary/20 animate-spin" style={{ animationDuration: "25s" }}></div>
                    <div className="absolute -inset-12 rounded-full border border-accent/10 animate-spin" style={{ animationDuration: "35s", animationDirection: "reverse" }}></div>
                    <div className="absolute -inset-20 rounded-full border border-primary/5 animate-spin" style={{ animationDuration: "45s" }}></div>

                    {/* Accent dots */}
                    <div className="absolute top-0 left-1/2 w-2.5 h-2.5 bg-primary rounded-full -translate-x-1/2 -translate-y-1/2 glow-emerald animate-pulse"></div>
                    <div className="absolute right-0 top-1/2 w-2 h-2 bg-accent rounded-full translate-x-1/2 -translate-y-1/2 animate-pulse" style={{ animationDelay: "0.5s" }}></div>
                    <div className="absolute bottom-0 left-1/2 w-2.5 h-2.5 bg-primary rounded-full -translate-x-1/2 translate-y-1/2 glow-emerald animate-pulse" style={{ animationDelay: "1s" }}></div>
                    <div className="absolute left-0 top-1/2 w-2 h-2 bg-accent rounded-full -translate-x-1/2 -translate-y-1/2 animate-pulse" style={{ animationDelay: "1.5s" }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom stats — Bento row */}
          <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in-up stagger-7">
            {[
              { value: "5", label: "Tournament Phases", color: "text-gradient" },
              { value: "50", label: "Finalists", color: "text-gradient" },
              { value: "$∞", label: "Glory & Rewards", color: "text-gradient-gold" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="glass-card-hover rounded-xl p-6 text-center"
              >
                <div className={`text-4xl font-black mb-2 ${stat.color}`}>{stat.value}</div>
                <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
