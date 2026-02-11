import { useState, useMemo } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlayerGrid } from "@/components/PlayerGrid";
import { Input } from "@/components/ui/input";

type GroupId = "A" | "B" | "C" | "D" | "E";

interface GroupPlayer {
  id: string;
  username: string;
  status: "qualified" | "eliminated";
}

// Generate mock players for a group
function generateGroupPlayers(groupId: GroupId, seed: number): GroupPlayer[] {
  const baseNames = [
    "Shadow",
    "Phoenix",
    "Viper",
    "Raze",
    "Sage",
    "Omen",
    "Jett",
    "Reyna",
    "Cypher",
    "Sova",
    "Breach",
    "Skye",
    "Yoru",
    "Astra",
    "Killjoy",
    "Chamber",
    "Neon",
    "Fade",
    "Harbor",
    "Vyse",
  ];

  const players: GroupPlayer[] = [];
  for (let i = 0; i < 100; i++) {
    const baseIndex = (i + seed) % baseNames.length;
    const isQualified = i < 50; // First 50 are qualified
    players.push({
      id: `${groupId}-${i}`,
      username: `${baseNames[baseIndex]}${Math.floor(i / baseNames.length) + 1}`,
      status: isQualified ? "qualified" : "eliminated",
    });
  }
  return players;
}

export function Phase3() {
  const [activeGroup, setActiveGroup] = useState<GroupId>("A");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "qualified" | "eliminated">("all");

  const groups: Record<GroupId, GroupPlayer[]> = useMemo(
    () => ({
      A: generateGroupPlayers("A", 0),
      B: generateGroupPlayers("B", 5),
      C: generateGroupPlayers("C", 10),
      D: generateGroupPlayers("D", 15),
      E: generateGroupPlayers("E", 20),
    }),
    []
  );

  const filteredPlayers = useMemo(() => {
    let players = groups[activeGroup];

    // Apply status filter
    if (filterStatus !== "all") {
      players = players.filter((p) => p.status === filterStatus);
    }

    // Apply search filter
    if (searchQuery) {
      players = players.filter((p) =>
        p.username.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return players;
  }, [activeGroup, searchQuery, filterStatus, groups]);

  const groupStats = useMemo(
    () =>
      Object.entries(groups).reduce(
        (acc, [groupId, players]) => {
          acc[groupId as GroupId] = {
            qualified: players.filter((p) => p.status === "qualified").length,
            eliminated: players.filter((p) => p.status === "eliminated").length,
          };
          return acc;
        },
        {} as Record<GroupId, { qualified: number; eliminated: number }>
      ),
    [groups]
  );

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-background via-secondary/30 to-background py-12">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-block bg-primary/20 border border-primary/50 rounded-lg px-4 py-2 mb-4">
              <span className="text-primary font-bold uppercase tracking-wider text-sm">
                Phase 3 of 5
              </span>
            </div>
            <h1 className="text-5xl md:text-6xl font-black text-white mb-4">
              <span className="text-primary">Battle Royale</span>
              <br />
              <span>Qualification.</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-lg mx-auto">
              500 players divided into 5 groups. Only 50 per group survive.
              <br />
              Find yourself and see who qualified.
            </p>
          </div>

          {/* Group Overview Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
            {(["A", "B", "C", "D", "E"] as const).map((group) => (
              <Card
                key={group}
                className={`border p-4 cursor-pointer transition-all ${
                  activeGroup === group
                    ? "border-primary bg-primary/10 glow-emerald"
                    : "border-border hover:border-primary/50"
                }`}
                onClick={() => {
                  setActiveGroup(group);
                  setSearchQuery("");
                  setFilterStatus("all");
                }}
              >
                <div className="text-center">
                  <p className="text-3xl font-black text-primary mb-1">
                    {group}
                  </p>
                  <p className="text-xs text-muted-foreground font-bold mb-3">
                    Group
                  </p>
                  <div className="space-y-1 text-xs">
                    <p>
                      <span className="text-accent font-bold">
                        {groupStats[group].qualified}
                      </span>
                      <span className="text-muted-foreground"> qualified</span>
                    </p>
                    <p>
                      <span className="text-destructive font-bold">
                        {groupStats[group].eliminated}
                      </span>
                      <span className="text-muted-foreground"> eliminated</span>
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Controls */}
          <div className="bg-card border border-glow-emerald rounded-lg p-6 mb-8 glow-emerald">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Search */}
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">
                    Search Player
                  </label>
                  <Input
                    placeholder="Find a player by name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-background border-border"
                  />
                </div>

                {/* Filter */}
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">
                    Filter
                  </label>
                  <div className="flex gap-2">
                    {(
                      [
                        { value: "all" as const, label: "All" },
                        { value: "qualified" as const, label: "Qualified" },
                        { value: "eliminated" as const, label: "Eliminated" },
                      ] as const
                    ).map((option) => (
                      <Button
                        key={option.value}
                        size="sm"
                        variant={
                          filterStatus === option.value ? "default" : "outline"
                        }
                        onClick={() => setFilterStatus(option.value)}
                        className={
                          filterStatus === option.value
                            ? "bg-primary"
                            : "border-border"
                        }
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Player Grid */}
          {filteredPlayers.length > 0 ? (
            <PlayerGrid
              players={filteredPlayers}
              yourPlayerId="A-73"
              gridSize={10}
              className="mb-8"
            />
          ) : (
            <Card className="border-border bg-card p-8 text-center mb-8">
              <p className="text-muted-foreground">
                No players match your search criteria
              </p>
            </Card>
          )}

          {/* Info cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-border bg-card/50 p-4">
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-2">
                Survival Rate
              </p>
              <p className="text-3xl font-black text-primary mb-2">50%</p>
              <p className="text-xs text-muted-foreground">50 per group advance</p>
            </Card>
            <Card className="border-border bg-card/50 p-4">
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-2">
                Active Group
              </p>
              <p className="text-3xl font-black text-accent mb-2">{activeGroup}</p>
              <p className="text-xs text-muted-foreground">
                {groupStats[activeGroup].qualified} qualified
              </p>
            </Card>
            <Card className="border-border bg-card/50 p-4">
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-2">
                Results
              </p>
              <p className="text-3xl font-black text-primary mb-2">250</p>
              <p className="text-xs text-muted-foreground">total advanced</p>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
