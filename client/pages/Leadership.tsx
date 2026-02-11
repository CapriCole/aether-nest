import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TeamProgressBar } from "@/components/TeamProgressBar";
import { useAuth } from "@/context/AuthContext";

interface Team {
  id: string;
  name: string;
  leader_id: string;
  leader_name: string;
  leader_ign: string;
  max_size: number;
  status: string;
  member_count: number;
  pending_count: number;
  created_at: string;
}

export function Leadership() {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [applyingTo, setApplyingTo] = useState<string | null>(null);
  const [appliedTeams, setAppliedTeams] = useState<Set<string>>(new Set());
  const [applyMessage, setApplyMessage] = useState("");
  const [showApplyModal, setShowApplyModal] = useState<string | null>(null);

  const fetchTeams = useCallback(async () => {
    try {
      const res = await fetch("/api/teams", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setTeams(data.teams);
    } catch (err) {
      console.error("Failed to fetch teams:", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Fetch player's existing applications to mark teams as already applied
  const fetchMyApplications = useCallback(async () => {
    try {
      const res = await fetch("/api/teams/my-applications", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        const applied = new Set<string>(
          data.applications
            .filter((a: any) => a.status === "pending")
            .map((a: any) => a.team_id)
        );
        setAppliedTeams(applied);
      }
    } catch (err) {
      console.error("Failed to fetch applications:", err);
    }
  }, [token]);

  useEffect(() => {
    fetchTeams();
    fetchMyApplications();
  }, [fetchTeams, fetchMyApplications]);

  async function handleApply(teamId: string) {
    setApplyingTo(teamId);
    try {
      const res = await fetch(`/api/teams/${teamId}/apply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: applyMessage }),
      });
      const data = await res.json();
      if (data.success) {
        setAppliedTeams((prev) => new Set([...prev, teamId]));
        setShowApplyModal(null);
        setApplyMessage("");
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error("Apply error:", err);
    } finally {
      setApplyingTo(null);
    }
  }

  const recruitingTeams = teams.filter((t) => t.status === "recruiting");
  const fullTeams = teams.filter((t) => t.status !== "recruiting");
  const totalSlots = recruitingTeams.reduce(
    (acc, t) => acc + (t.max_size - t.member_count - 1), // -1 for leader
    0
  );

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="glass-card rounded-xl p-8 text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-sm text-muted-foreground">Loading teams...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen relative">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 right-[20%] w-[500px] h-[500px] bg-primary/[0.04] rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[20%] left-[10%] w-[400px] h-[400px] bg-accent/[0.03] rounded-full blur-[100px]"></div>
        </div>

        <div className="container mx-auto px-4 py-10 relative z-10">
          {/* Header */}
          <div className="text-center mb-10 animate-fade-in-up">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-[10px] font-bold text-primary uppercase tracking-[0.15em] mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
              Team Formation
            </span>
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">
              <span className="text-gradient">Leadership &</span>
              <br />
              Team Formation
            </h1>
            <p className="text-sm text-muted-foreground max-w-lg mx-auto mt-3">
              The strongest players become leaders. Choose wisely — your team will
              determine your fate.
            </p>
          </div>

          {/* Overview stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10 animate-fade-in-up stagger-1">
            <div className="glass-card-hover rounded-xl p-5 text-center">
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1.5">
                Total Teams
              </p>
              <p className="text-3xl font-black text-gradient">{teams.length}</p>
            </div>
            <div className="glass-card-hover rounded-xl p-5 text-center">
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1.5">
                Recruiting
              </p>
              <p className="text-3xl font-black text-emerald-400">{recruitingTeams.length}</p>
            </div>
            <div className="glass-card-hover rounded-xl p-5 text-center">
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1.5">
                Available Slots
              </p>
              <p className="text-3xl font-black text-accent">{Math.max(0, totalSlots)}</p>
            </div>
            <div className="glass-card-hover rounded-xl p-5 text-center">
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1.5">
                Team Full
              </p>
              <p className="text-3xl font-black text-blue-400">{fullTeams.length}</p>
            </div>
          </div>

          {/* Teams list */}
          {teams.length === 0 ? (
            <div className="glass-card rounded-xl p-12 text-center animate-fade-in-up stagger-2">
              <span className="text-4xl block mb-3">🏆</span>
              <p className="text-sm text-muted-foreground">
                No teams have been created yet. Check back soon!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10 animate-fade-in-up stagger-2">
              {teams.map((team) => {
                const memberCount = team.member_count + 1; // +1 for leader
                const isFull = team.status !== "recruiting";
                const hasApplied = appliedTeams.has(team.id);

                return (
                  <div
                    key={team.id}
                    className={`glass-card-hover rounded-xl p-6 transition-all ${isFull ? "opacity-60" : ""
                      }`}
                  >
                    <div className="space-y-4">
                      {/* Team header */}
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-xl font-black text-foreground mb-0.5">
                            {team.name}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            👑 {team.leader_name}
                            {team.leader_ign && ` · ${team.leader_ign}`}
                          </p>
                        </div>
                        <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-black text-primary-foreground">
                            {team.name.charAt(0)}
                          </span>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <TeamProgressBar
                        teamName={team.name}
                        currentSize={memberCount}
                        maxSize={team.max_size}
                        leader={team.leader_name}
                        status={isFull ? "full" : "recruiting"}
                      />

                      {/* Action button */}
                      {!isFull && !hasApplied && (
                        <Button
                          className="w-full btn-glow"
                          onClick={() => {
                            setShowApplyModal(team.id);
                            setApplyMessage("");
                          }}
                        >
                          Apply to Join
                        </Button>
                      )}
                      {hasApplied && (
                        <Button disabled className="w-full opacity-60">
                          ✓ Application Sent
                        </Button>
                      )}
                      {isFull && (
                        <Button disabled className="w-full opacity-40">
                          Team Full
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* How it works */}
          <div className="glass-card rounded-xl p-6 mb-8 animate-fade-in-up stagger-3">
            <h3 className="text-sm font-bold text-foreground mb-4">
              How Team Selection Works
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { step: "1", title: "Apply", desc: "Submit applications to teams" },
                { step: "2", title: "Leaders Decide", desc: "Leaders review and select" },
                { step: "3", title: "Closing Draft", desc: "Remaining players distributed" },
                { step: "✓", title: "Teams Locked", desc: "Full rosters advance" },
              ].map((item) => (
                <div key={item.step} className="space-y-1.5">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center font-black text-white text-xs">
                    {item.step}
                  </div>
                  <p className="font-bold text-foreground text-sm">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex gap-3 animate-fade-in-up stagger-4">
            <Button
              className="flex-1 btn-glow"
              onClick={() => navigate("/team-pools")}
            >
              View Team Pools & Progress
            </Button>
            <Button
              variant="outline"
              className="flex-1 border-white/10 hover:bg-white/5"
              onClick={() => navigate("/dashboard")}
            >
              Back to Dashboard
            </Button>
          </div>
        </div>

        {/* ── Apply Modal ────────────────────────────────── */}
        {showApplyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowApplyModal(null)}
            ></div>
            <div className="glass-card rounded-xl p-6 w-full max-w-md relative z-10 animate-fade-in-up">
              <h3 className="text-lg font-bold text-foreground mb-1">
                Apply to {teams.find((t) => t.id === showApplyModal)?.name}
              </h3>
              <p className="text-xs text-muted-foreground mb-4">
                Send a short message to the team leader with your application.
              </p>

              <textarea
                value={applyMessage}
                onChange={(e) => setApplyMessage(e.target.value)}
                placeholder="Why should they pick you? (optional)"
                maxLength={200}
                rows={3}
                className="w-full px-3 py-2 rounded-lg glass border border-white/10 bg-transparent text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 resize-none"
              />
              <p className="text-[10px] text-muted-foreground text-right mt-1">
                {applyMessage.length}/200
              </p>

              <div className="flex gap-3 mt-4">
                <Button
                  className="flex-1 btn-glow"
                  disabled={applyingTo === showApplyModal}
                  onClick={() => handleApply(showApplyModal)}
                >
                  {applyingTo === showApplyModal ? "Sending..." : "Send Application"}
                </Button>
                <Button
                  variant="outline"
                  className="border-white/10 hover:bg-white/5"
                  onClick={() => setShowApplyModal(null)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
