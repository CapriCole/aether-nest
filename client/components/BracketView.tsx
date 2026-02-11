interface BracketMatch {
  id: string;
  player1?: string;
  player2?: string;
  winner?: string;
  status: "upcoming" | "live" | "completed";
}

interface BracketRound {
  label: string;
  matches: BracketMatch[];
}

interface BracketViewProps {
  rounds: BracketRound[];
  title?: string;
  className?: string;
}

export function BracketView({
  rounds,
  title = "Tournament Bracket",
  className = "",
}: BracketViewProps) {
  return (
    <div className={className}>
      {title && (
        <h3 className="text-lg font-bold text-foreground mb-6">{title}</h3>
      )}

      <div className="bg-background rounded-lg p-6 border border-border/50 overflow-x-auto">
        <div
          className="grid gap-4 min-w-max"
          style={{
            gridTemplateColumns: `repeat(${rounds.length}, minmax(180px, 1fr))`,
          }}
        >
          {rounds.map((round, roundIndex) => (
            <div key={roundIndex} className="space-y-2">
              {/* Round label */}
              <p className="text-xs font-bold text-muted-foreground uppercase text-center mb-4 tracking-wider">
                {round.label}
              </p>

              {/* Matches */}
              <div className="space-y-3 flex flex-col justify-center">
                {round.matches.map((match) => {
                  const isCompleted = match.status === "completed";
                  const isLive = match.status === "live";

                  return (
                    <div
                      key={match.id}
                      className={`rounded-lg p-3 border transition-all ${
                        isCompleted
                          ? "border-accent bg-accent/5"
                          : isLive
                            ? "border-primary bg-primary/10 animate-pulse"
                            : "border-border bg-card"
                      }`}
                    >
                      {/* Player 1 */}
                      <div className="mb-2 pb-2 border-b border-border/50">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-foreground truncate flex-1">
                            {match.player1 ? match.player1 : "TBD"}
                          </span>
                          {isCompleted && match.winner === match.player1 && (
                            <span className="text-accent font-bold text-xs ml-2">
                              ✓
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Player 2 */}
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-foreground truncate flex-1">
                            {match.player2 ? match.player2 : "TBD"}
                          </span>
                          {isCompleted && match.winner === match.player2 && (
                            <span className="text-accent font-bold text-xs ml-2">
                              ✓
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Status indicator */}
                      {isLive && (
                        <div className="mt-2 pt-2 border-t border-border/50">
                          <span className="text-xs font-bold text-primary uppercase tracking-wider">
                            LIVE
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
