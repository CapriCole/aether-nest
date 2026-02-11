import { useEffect, useState } from "react";
import { AnimatedNumber } from "./AnimatedNumber";

interface RegistrationCounterProps {
  currentPlayers: number;
  maxPlayers: number;
  className?: string;
}

export function RegistrationCounter({
  currentPlayers,
  maxPlayers,
  className = "",
}: RegistrationCounterProps) {
  const [pulse, setPulse] = useState(false);

  // Add pulse effect when count changes
  useEffect(() => {
    setPulse(true);
    const timer = setTimeout(() => setPulse(false), 600);
    return () => clearTimeout(timer);
  }, [currentPlayers]);

  const percentage = (currentPlayers / maxPlayers) * 100;
  const remaining = maxPlayers - currentPlayers;

  return (
    <div
      className={`bg-card border border-glow-emerald rounded-lg p-6 space-y-4 ${className} ${
        pulse ? "glow-emerald-strong" : "glow-emerald"
      }`}
    >
      <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
        Live Registration
      </div>

      <div className="flex items-baseline gap-2">
        <div className={`text-5xl font-black text-primary transition-all ${pulse ? "scale-110" : "scale-100"}`}>
          <AnimatedNumber value={currentPlayers} />
        </div>
        <div className="text-2xl text-muted-foreground">/ {maxPlayers}</div>
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="w-full bg-background rounded-full h-3 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary via-accent to-primary transition-all duration-500 animate-glow-pulse"
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
        <div className="flex justify-between items-center text-xs text-muted-foreground">
          <span>{percentage.toFixed(1)}% Full</span>
          <span>{remaining} slots remaining</span>
        </div>
      </div>

      {/* Status message */}
      {remaining <= 50 && remaining > 0 && (
        <div className="bg-primary/10 border border-primary/30 rounded-md p-2 text-xs text-primary font-semibold">
          🔥 Filling fast! Only {remaining} spots left!
        </div>
      )}
      {remaining === 0 && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-md p-2 text-xs text-destructive font-semibold">
          Tournament is FULL!
        </div>
      )}
    </div>
  );
}
