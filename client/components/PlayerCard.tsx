interface PlayerCardProps {
  playerNumber: number;
  username: string;
  status: "active" | "qualified" | "eliminated" | "redeemed";
  registeredPlayers: number;
  maxPlayers: number;
  className?: string;
}

const statusColors = {
  active: "bg-primary text-primary-foreground",
  qualified: "bg-accent text-accent-foreground",
  eliminated: "bg-destructive text-destructive-foreground",
  redeemed: "bg-premium text-premium-foreground",
};

const statusLabels = {
  active: "Active",
  qualified: "Qualified",
  eliminated: "Eliminated",
  redeemed: "Redeemed",
};

export function PlayerCard({
  playerNumber,
  username,
  status,
  registeredPlayers,
  maxPlayers,
  className = "",
}: PlayerCardProps) {
  const progressPercentage = (registeredPlayers / maxPlayers) * 100;

  return (
    <div
      className={`bg-card border border-glow-emerald rounded-lg p-6 space-y-4 glow-emerald ${className}`}
    >
      {/* Avatar section */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-2xl font-black text-primary-foreground">
            {username.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-black text-foreground">{username}</h3>
          <p className="text-sm text-muted-foreground">
            Player #{playerNumber}
          </p>
        </div>
      </div>

      {/* Status badge */}
      <div className="flex items-center gap-2">
        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${statusColors[status]}`}>
          {statusLabels[status]}
        </span>
      </div>

      {/* Progress section */}
      <div className="pt-2 border-t border-border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Tournament Progress
          </span>
          <span className="text-sm font-bold text-primary">
            {registeredPlayers} / {maxPlayers}
          </span>
        </div>
        <div className="w-full bg-background rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}
