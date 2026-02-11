interface LeaguePlayer {
  rank: number;
  username: string;
  wins: number;
  losses: number;
  points: number;
  isUser?: boolean;
}

interface LeagueTableProps {
  players: LeaguePlayer[];
  className?: string;
}

export function LeagueTable({ players, className = "" }: LeagueTableProps) {
  return (
    <div className={className}>
      <div className="bg-card border border-glow-emerald rounded-lg overflow-hidden glow-emerald">
        {/* Table header */}
        <div className="bg-secondary border-b border-border px-6 py-4 grid grid-cols-12 gap-4 font-bold text-sm uppercase text-muted-foreground tracking-wider">
          <div className="col-span-1">Rank</div>
          <div className="col-span-4">Player</div>
          <div className="col-span-2 text-center">Wins</div>
          <div className="col-span-2 text-center">Losses</div>
          <div className="col-span-3 text-center">Points</div>
        </div>

        {/* Table rows */}
        <div className="divide-y divide-border">
          {players.map((player, index) => (
            <div
              key={player.rank}
              className={`px-6 py-4 grid grid-cols-12 gap-4 items-center transition-all ${
                player.isUser
                  ? "bg-primary/10 border-l-2 border-primary"
                  : index % 2 === 0
                    ? "bg-background/50 hover:bg-background"
                    : "hover:bg-secondary/30"
              }`}
            >
              {/* Rank */}
              <div className="col-span-1">
                <div className="flex items-center gap-2">
                  {player.rank <= 3 ? (
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-white text-sm ${
                        player.rank === 1
                          ? "bg-premium"
                          : player.rank === 2
                            ? "bg-accent"
                            : "bg-primary"
                      }`}
                    >
                      {player.rank}
                    </div>
                  ) : (
                    <span className="text-muted-foreground font-bold">
                      #{player.rank}
                    </span>
                  )}
                </div>
              </div>

              {/* Player name */}
              <div className="col-span-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="font-bold text-primary-foreground text-sm">
                      {player.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">
                      {player.username}
                    </p>
                    {player.isUser && (
                      <p className="text-xs text-primary font-bold">
                        YOU
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Wins */}
              <div className="col-span-2 text-center">
                <p className="font-bold text-foreground">{player.wins}</p>
              </div>

              {/* Losses */}
              <div className="col-span-2 text-center">
                <p className="font-bold text-destructive">{player.losses}</p>
              </div>

              {/* Points */}
              <div className="col-span-3">
                <div className="flex items-center justify-center gap-2">
                  <div className="text-right">
                    <p className="font-black text-primary text-lg">
                      {player.points}
                    </p>
                    <p className="text-xs text-muted-foreground">pts</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
