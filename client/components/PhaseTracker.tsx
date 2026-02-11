import { Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Phase {
  number: number;
  label: string;
  status: "completed" | "current" | "locked";
  route?: string;
}

interface PhaseTrackerProps {
  phases: Phase[];
  className?: string;
}

export function PhaseTracker({ phases, className = "" }: PhaseTrackerProps) {
  const navigate = useNavigate();

  return (
    <div className={className}>
      <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">
        Tournament Phases
      </h3>
      <div className="flex flex-col gap-2">
        {phases.map((phase, index) => {
          const isCompleted = phase.status === "completed";
          const isCurrent = phase.status === "current";
          const isLocked = phase.status === "locked";
          const isClickable = phase.route && !isLocked;

          const Wrapper = isClickable ? "button" : "div";

          return (
            <Wrapper
              key={phase.number}
              className={`relative flex items-center gap-3 p-3 rounded-lg border transition-all ${isCurrent
                  ? "border-primary bg-primary/10 glow-emerald"
                  : isCompleted
                    ? "border-accent bg-accent/5"
                    : "border-border/50 bg-secondary/30"
                } ${isClickable ? "cursor-pointer hover:border-primary/40 hover:scale-[1.01] active:scale-[0.99]" : ""}`}
              {...(isClickable ? { onClick: () => navigate(phase.route!) } : {})}
            >
              {/* Phase number circle */}
              <div
                className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-black text-sm relative ${isCurrent
                    ? "bg-primary text-primary-foreground"
                    : isCompleted
                      ? "bg-accent text-accent-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
              >
                {isLocked ? <Lock size={16} /> : phase.number}
                {isCurrent && (
                  <div className="absolute inset-0 rounded-full border-2 border-primary animate-pulse"></div>
                )}
              </div>

              {/* Phase label */}
              <div className="flex-1">
                <p
                  className={`font-semibold text-sm ${isCurrent ? "text-primary" : "text-foreground"
                    }`}
                >
                  {phase.label}
                </p>
                <p className="text-xs text-muted-foreground">
                  {phase.status === "completed" && "Completed"}
                  {phase.status === "current" && "In Progress"}
                  {phase.status === "locked" && "Locked"}
                </p>
              </div>

              {/* Status badge */}
              {isCompleted && (
                <div className="text-accent font-bold text-xs uppercase tracking-wider">
                  ✓
                </div>
              )}
            </Wrapper>
          );
        })}
      </div>

      {/* Progress bar */}
      <div className="mt-6 bg-secondary rounded-full h-1 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
          style={{
            width: `${((phases.filter((p) => p.status !== "locked").length - 1) / (phases.length - 1)) * 100}%`,
          }}
        ></div>
      </div>
    </div>
  );
}

