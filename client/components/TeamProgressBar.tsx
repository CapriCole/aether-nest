interface TeamProgressBarProps {
  teamName: string;
  currentSize: number;
  maxSize: number;
  leader: string;
  status: "recruiting" | "full" | "completed";
  className?: string;
}

export function TeamProgressBar({
  teamName,
  currentSize,
  maxSize,
  leader,
  status,
  className = "",
}: TeamProgressBarProps) {
  const percentage = (currentSize / maxSize) * 100;
  const isFull = status === "full" || status === "completed";

  const statusColor =
    status === "recruiting"
      ? "from-primary to-accent"
      : status === "full"
        ? "from-primary to-primary"
        : "from-accent to-accent";

  return (
    <div className={className}>
      <div className="space-y-3">
        {/* Team name and leader */}
        <div className="flex items-start justify-between">
          <div>
            <h4 className="font-bold text-foreground text-lg">{teamName}</h4>
            <p className="text-xs text-muted-foreground">
              Led by{" "}
              <span className="text-primary font-semibold">{leader}</span>
            </p>
          </div>
          {isFull && (
            <div className="bg-accent/20 border border-accent/50 px-3 py-1 rounded-full">
              <span className="text-xs font-bold text-accent uppercase tracking-wider">
                {status === "full" ? "Full" : "Locked"}
              </span>
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground font-bold">Roster Size</span>
            <span className="text-primary font-black">
              {currentSize} / {maxSize}
            </span>
          </div>
          <div className="w-full bg-background rounded-full h-3 overflow-hidden border border-border/50">
            <div
              className={`h-full bg-gradient-to-r ${statusColor} transition-all duration-500`}
              style={{ width: `${percentage}%` }}
            ></div>
          </div>
        </div>

        {/* Status message */}
        {status === "recruiting" && (
          <p className="text-xs text-muted-foreground">
            {maxSize - currentSize} slot{maxSize - currentSize !== 1 ? "s" : ""}{" "}
            available
          </p>
        )}
        {status === "full" && (
          <p className="text-xs text-accent">Team roster is complete</p>
        )}
      </div>
    </div>
  );
}
