import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";

interface Team {
  id: string;
  name: string;
  leader_id: string;
  max_size: number;
  status: string;
}

interface Application {
  id: string;
  team_id: string;
  player_id: string;
  player_name: string;
  player_ign: string;
  player_rank: string;
  message: string;
  status: string;
  created_at: string;
}

interface Member {
  id: string;
  username: string;
  codm_ign: string;
  codm_rank: string;
  joined_at: string;
}

export function TeamSelection() {
  const navigate = useNavigate();
  const { token, user, isTeamLeader } = useAuth();
  const [myTeam, setMyTeam] = useState<Team | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  const fetchTeamData = useCallback(async () => {
    try {
      // First, get all teams and find the one led by current user
      const teamsRes = await fetch("/api/teams", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const teamsData = await teamsRes.json();
      if (!teamsData.success) return;

      const team = teamsData.teams.find((t: any) => t.leader_id === user?.id);
      if (!team) return;

      setMyTeam(team);

      // Fetch applications for this team
      const appsRes = await fetch(`/api/teams/${team.id}/applications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const appsData = await appsRes.json();
      if (appsData.success) setApplications(appsData.applications);

      // Fetch roster
      const detailRes = await fetch(`/api/teams/${team.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const detailData = await detailRes.json();
      if (detailData.success) setMembers(detailData.members);
    } catch (err) {
      console.error("Failed to fetch team data:", err);
    } finally {
      setLoading(false);
    }
  }, [token, user?.id]);

  useEffect(() => {
    fetchTeamData();
  }, [fetchTeamData]);

  async function handleReview(appId: string, status: "accepted" | "rejected") {
    setReviewingId(appId);
    try {
      const res = await fetch(`/api/teams/applications/${appId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) {
        fetchTeamData(); // Refresh everything
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error("Review error:", err);
    } finally {
      setReviewingId(null);
    }
  }

  const pendingApps = applications.filter((a) => a.status === "pending");
  const resolvedApps = applications.filter((a) => a.status !== "pending");
  const rosterCount = members.length + 1; // +1 for leader
  const maxSize = myTeam?.max_size || 5;

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="glass-card rounded-xl p-8 text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-sm text-muted-foreground">Loading your team...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!isTeamLeader || !myTeam) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="glass-card rounded-xl p-8 text-center max-w-md">
            <span className="text-4xl block mb-3">🔒</span>
            <h2 className="text-lg font-bold text-foreground mb-2">
              Leader Access Only
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              This page is for team leaders to manage their roster and review
              applications.
            </p>
            <Button onClick={() => navigate("/dashboard")}>
              Back to Dashboard
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen relative">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-[30%] w-[500px] h-[500px] bg-primary/[0.04] rounded-full blur-[120px]"></div>
        </div>

        <div className="container mx-auto px-4 py-10 max-w-4xl relative z-10">
          {/* Header */}
          <div className="text-center mb-10 animate-fade-in-up">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-[10px] font-bold text-yellow-400 uppercase tracking-[0.15em] mb-3">
              👑 Leader's Panel
            </span>
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">
              <span className="text-gradient">{myTeam.name}</span>
            </h1>
            <p className="text-sm text-muted-foreground max-w-lg mx-auto mt-3">
              Review applications and build your championship roster.
            </p>
          </div>

          {/* Roster Progress */}
          <div className="glass-card rounded-xl p-6 mb-6 animate-fade-in-up stagger-1">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">
                  Roster Progress
                </p>
                <p className="text-3xl font-black text-gradient">
                  {rosterCount} / {maxSize}
                </p>
              </div>
              <div
                className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${myTeam.status === "recruiting"
                    ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/20"
                    : "bg-blue-500/15 text-blue-400 border-blue-500/20"
                  }`}
              >
                {myTeam.status}
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all"
                style={{ width: `${(rosterCount / maxSize) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Current Roster */}
          <div className="glass-card rounded-xl p-6 mb-6 animate-fade-in-up stagger-2">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-[0.15em] mb-3">
              Current Roster
            </h3>
            <div className="space-y-2">
              {/* Leader */}
              <div className="flex items-center justify-between glass rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-yellow-500/15 border border-yellow-500/20 flex items-center justify-center text-sm">
                    👑
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {user?.username}
                    </p>
                    <p className="text-[10px] text-muted-foreground">You</p>
                  </div>
                </div>
                <span className="text-[10px] text-yellow-400 font-bold uppercase">
                  Leader
                </span>
              </div>

              {/* Members */}
              {members.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between glass rounded-lg p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                      {m.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {m.username}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {m.codm_ign || "No IGN"}
                        {m.codm_rank && ` · ${m.codm_rank}`}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-bold uppercase">
                    Member
                  </span>
                </div>
              ))}

              {members.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">
                  No members yet — accept applications below to fill your roster.
                </p>
              )}
            </div>
          </div>

          {/* Pending Applications */}
          <div className="glass-card rounded-xl p-6 mb-6 animate-fade-in-up stagger-3">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-[0.15em] mb-3">
              Pending Applications ({pendingApps.length})
            </h3>

            {pendingApps.length > 0 ? (
              <div className="space-y-2">
                {pendingApps.map((app) => (
                  <div
                    key={app.id}
                    className="glass rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-bold text-foreground">
                            {app.player_name}
                          </p>
                          {app.player_rank && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20 font-bold uppercase">
                              {app.player_rank}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          {app.player_ign || "No IGN"} · Applied{" "}
                          {new Date(app.created_at).toLocaleDateString()}
                        </p>
                        {app.message && (
                          <p className="text-xs text-muted-foreground italic mt-2 glass rounded-md p-2">
                            "{app.message}"
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleReview(app.id, "accepted")}
                          disabled={reviewingId === app.id || rosterCount >= maxSize}
                          className="px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold uppercase hover:bg-emerald-500/25 transition-colors disabled:opacity-40"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleReview(app.id, "rejected")}
                          disabled={reviewingId === app.id}
                          className="px-3 py-1.5 rounded-lg bg-red-500/15 text-red-400 border border-red-500/20 text-[10px] font-bold uppercase hover:bg-red-500/25 transition-colors disabled:opacity-40"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="glass rounded-lg p-8 text-center">
                <p className="text-sm text-muted-foreground">
                  {rosterCount >= maxSize
                    ? "Your team is full! 🎉"
                    : "No pending applications. Players can find your team on the Leadership page."}
                </p>
              </div>
            )}
          </div>

          {/* Resolved Applications History */}
          {resolvedApps.length > 0 && (
            <div className="glass-card rounded-xl p-6 mb-6 animate-fade-in-up stagger-4">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-[0.15em] mb-3">
                History
              </h3>
              <div className="space-y-1.5">
                {resolvedApps.map((app) => (
                  <div
                    key={app.id}
                    className="flex items-center justify-between glass rounded-lg p-2.5 opacity-60"
                  >
                    <p className="text-xs text-muted-foreground">
                      {app.player_name}
                    </p>
                    <span
                      className={`text-[10px] font-bold uppercase ${app.status === "accepted"
                          ? "text-emerald-400"
                          : "text-red-400"
                        }`}
                    >
                      {app.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 animate-fade-in-up stagger-5">
            <Button
              className="flex-1 btn-glow"
              onClick={() => navigate("/team-pools")}
            >
              View All Teams
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
      </div>
    </Layout>
  );
}
