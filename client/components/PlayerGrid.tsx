import { useMemo } from "react";

interface Player {
  id: string;
  username: string;
  status: "qualified" | "eliminated";
}

interface PlayerGridProps {
  players: Player[];
  yourPlayerId?: string;
  gridSize?: number;
  className?: string;
}

export function PlayerGrid({
  players,
  yourPlayerId,
  gridSize = 10,
  className = "",
}: PlayerGridProps) {
  const displayedPlayers = useMemo(() => {
    // Pad to fill grid if needed
    const totalSlots = gridSize * gridSize;
    const padded = [...players];
    while (padded.length < totalSlots) {
      padded.push({
        id: `placeholder-${padded.length}`,
        username: "",
        status: "eliminated",
      });
    }
    return padded.slice(0, totalSlots);
  }, [players, gridSize]);

  const qualifiedCount = players.filter(
    (p) => p.status === "qualified"
  ).length;

  return (
    <div className={className}>
      {/* Stats */}
      <div className="mb-6 flex items-center gap-6">
        <div className="text-sm">
          <p className="text-muted-foreground uppercase text-xs font-bold tracking-wider">
            Qualified Players
          </p>
          <p className="text-3xl font-black text-primary">
            {qualifiedCount}
            <span className="text-lg text-muted-foreground ml-2">/ 50</span>
          </p>
        </div>
        <div className="text-sm">
          <p className="text-muted-foreground uppercase text-xs font-bold tracking-wider">
            Eliminated
          </p>
          <p className="text-3xl font-black text-destructive">
            {players.length - qualifiedCount}
            <span className="text-lg text-muted-foreground ml-2">/ 50</span>
          </p>
        </div>
      </div>

      {/* Grid */}
      <div className="bg-card border border-glow-emerald rounded-lg p-4 glow-emerald overflow-auto max-h-96">
        <div
          className="grid gap-1 inline-grid"
          style={{
            gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
            width: "100%",
          }}
        >
          {displayedPlayers.map((player) => {
            const isYou = player.id === yourPlayerId;
            const isQualified = player.status === "qualified";
            const isEmpty = player.username === "";

            return (
              <div
                key={player.id}
                className={`aspect-square rounded-md flex items-center justify-center text-xs font-bold transition-all relative group ${
                  isEmpty
                    ? "bg-secondary/20 border border-border/30"
                    : isQualified
                      ? "bg-accent/30 border border-accent/50"
                      : "bg-destructive/30 border border-destructive/50"
                } ${isYou ? "ring-2 ring-primary" : ""}`}
                title={player.username || "Empty slot"}
              >
                {!isEmpty && (
                  <>
                    <span className={isQualified ? "text-accent" : "text-destructive"}>
                      {player.username.charAt(0).toUpperCase()}
                    </span>
                    {isYou && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full border border-background"></span>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 flex gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-accent/30 border border-accent/50 rounded-md"></div>
          <span className="text-muted-foreground">Qualified</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-destructive/30 border border-destructive/50 rounded-md"></div>
          <span className="text-muted-foreground">Eliminated</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-secondary/20 border border-border/30 rounded-md"></div>
          <span className="text-muted-foreground">Empty</span>
        </div>
      </div>
    </div>
  );
}
