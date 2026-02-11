import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { PhaseTracker } from "@/components/PhaseTracker";
import { PlayerCard } from "@/components/PlayerCard";
import { RegistrationCounter } from "@/components/RegistrationCounter";
import { useAuth } from "@/context/AuthContext";
import { Shield } from "lucide-react";

interface Phase {
  number: number;
  label: string;
  status: "completed" | "current" | "locked";
  route?: string;
}

interface Application {
  id: string;
  team_id: string;
  team_name: string;
  leader_name?: string;
  player_name?: string;
  status: string;
  message: string;
  created_at: string;
}

interface TeamInfo {
  id: string;
  name: string;
  leader_name: string;
  leader_ign: string;
  max_size: number;
  status: string;
  member_count: number;
}

export function Dashboard() {
  const navigate = useNavigate();
  const { user, isTeamLeader, token, isAdmin } = useAuth();
  const tournamentStatus = user?.tournamentStatus || "none";
  const [registeredPlayers, setRegisteredPlayers] = useState(73);
  const maxPlayers = 500;

  // Simulated registration counter
  useEffect(() => {
    const interval = setInterval(() => {
      setRegisteredPlayers((prev) => {
        const newCount = prev + Math.floor(Math.random() * 3);
        return Math.min(newCount, maxPlayers);
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // ── Real data fetching ─────────────────────
  const [applications, setApplications] = useState<Application[]>([]);
  const [myTeam, setMyTeam] = useState<TeamInfo | null>(null);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [phases, setPhases] = useState<Phase[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch tournament phases
  const fetchPhases = useCallback(async () => {
    if (!token) return;
    try {
      // Get all tournaments
      const res = await fetch("/api/tournaments", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.tournaments.length > 0) {
        // Pick the most relevant tournament (active > registration > draft)
        const sorted = data.tournaments.sort((a: any, b: any) => {
          const weights: Record<string, number> = { active: 3, registration: 2, draft: 1, completed: 0, cancelled: -1, paused: 2.5 };
          return (weights[b.status] || 0) - (weights[a.status] || 0);
        });
        const activeT = sorted[0];

        // Fetch detail for phases
        const detailRes = await fetch(`/api/tournaments/${activeT.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const detailData = await detailRes.json();
        if (detailData.success) {
          setPhases(detailData.phases.map((p: any) => ({
            number: p.phase_number,
            label: p.label,
            status: p.status,
            route: p.route
          })));
        }
      } else {
        // Fallback or empty state if no tournament
        setPhases([]);
      }
    } catch (err) {
      console.error("Failed to fetch phases:", err);
    }
  }, [token]);

  // For PLAYERS: fetch my applications
  const fetchPlayerApps = useCallback(async () => {
    if (!token || isTeamLeader || tournamentStatus === "team_member") return;
    try {
      const res = await fetch("/api/teams/my-applications", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setApplications(
          data.applications.map((a: any) => ({
            id: a.id,
            team_id: a.team_id,
            team_name: a.team_name || "Unknown Team",
            leader_name: a.leader_name,
            status: a.status,
            message: a.message || "",
            created_at: a.created_at,
          }))
        );
      }
    } catch (err) {
      console.error("Failed to fetch player apps:", err);
    }
  }, [token, isTeamLeader, tournamentStatus]);

  // For LEADERS: fetch incoming applications
  const fetchLeaderApps = useCallback(async () => {
    if (!token || !isTeamLeader) return;
    setLoading(true);
    try {
      // Find my team
      const teamsRes = await fetch("/api/teams", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const teamsData = await teamsRes.json();
      if (!teamsData.success) return;

      const team = teamsData.teams.find((t: any) => t.leader_id === user?.id);
      if (!team) return;
      setMyTeam(team);

      // Fetch pending applications
      const appsRes = await fetch(`/api/teams/${team.id}/applications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const appsData = await appsRes.json();
      if (appsData.success) {
        setApplications(
          appsData.applications.map((a: any) => ({
            id: a.id,
            team_id: team.id,
            team_name: team.name,
            player_name: a.player_name,
            status: a.status,
            message: a.message || "",
            created_at: a.created_at,
          }))
        );
      }
    } catch (err) {
      console.error("Failed to fetch leader data:", err);
    } finally {
      setLoading(false);
    }
  }, [token, isTeamLeader, user?.id]);

  // For TEAM MEMBERS: fetch my team info
  const fetchMemberTeam = useCallback(async () => {
    if (!token || tournamentStatus !== "team_member") return;
    try {
      const teamsRes = await fetch("/api/teams", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const teamsData = await teamsRes.json();
      if (!teamsData.success) return;

      // Find team where I'm a member (check detail for each team)
      for (const team of teamsData.teams) {
        const detailRes = await fetch(`/api/teams/${team.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const detailData = await detailRes.json();
        if (detailData.success) {
          const isMember = detailData.members.some(
            (m: any) => m.id === user?.id
          );
          if (isMember) {
            setMyTeam(team);
            setTeamMembers(detailData.members);
            break;
          }
        }
      }
    } catch (err) {
      console.error("Failed to fetch team info:", err);
    }
  }, [token, tournamentStatus, user?.id]);

  useEffect(() => {
    fetchPhases();
    fetchPlayerApps();
    fetchLeaderApps();
    fetchMemberTeam();
  }, [fetchPhases, fetchPlayerApps, fetchLeaderApps, fetchMemberTeam]);

  // Badge for tournament status
  const statusConfig: Record<string, { label: string; color: string; icon: string }> = {
    none: { label: "Registered", color: "text-muted-foreground bg-white/5 border-white/10", icon: "○" },
    qualified: { label: "Qualified", color: "text-blue-400 bg-blue-500/10 border-blue-500/20", icon: "◆" },
    team_leader: { label: "Team Leader", color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20", icon: "👑" },
    team_member: { label: "Team Member", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", icon: "✦" },
    eliminated: { label: "Eliminated", color: "text-red-400 bg-red-500/10 border-red-500/20", icon: "✕" },
  };
  const badge = statusConfig[tournamentStatus] || statusConfig.none;

  const pendingApps = applications.filter((a) => a.status === "pending");

  return (
    <Layout>
      <div className="min-h-screen relative">
        {/* Subtle ambient background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 right-[20%] w-[500px] h-[500px] bg-primary/[0.04] rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[20%] left-[10%] w-[400px] h-[400px] bg-accent/[0.03] rounded-full blur-[100px]"></div>
        </div>

        <div className="container mx-auto px-4 py-10 relative z-10">
          {/* Page header */}
          <div className="mb-10 animate-fade-in-up">
            <div className="flex items-center gap-3 mb-2">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-[10px] font-bold text-primary uppercase tracking-[0.15em]">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                Live
              </span>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.1em] border ${badge.color}`}>
                {badge.icon} {badge.label}
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
              {isTeamLeader ? "Team Leader Dashboard" : "Player Dashboard"}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {isTeamLeader
                ? `Welcome back, ${user?.username}. Manage your team and review applications.`
                : "Track your tournament progress and next steps"}
            </p>
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-min">

            {/* Player Card */}
            <div className="glass-card-hover rounded-xl animate-fade-in-up stagger-1">
              <PlayerCard
                playerNumber={73}
                username={user?.username || "Player"}
                status="active"
                registeredPlayers={registeredPlayers}
                maxPlayers={maxPlayers}
              />
            </div>

            {/* Registration Counter */}
            <div className="glass-card-hover rounded-xl animate-fade-in-up stagger-2">
              <RegistrationCounter
                currentPlayers={registeredPlayers}
                maxPlayers={maxPlayers}
              />
            </div>

            {/* Quick Stats — 2 small cells */}
            <div className="glass-card-hover rounded-xl p-6 animate-fade-in-up stagger-3">
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-[0.15em] mb-3">
                Players Advancing
              </p>
              <p className="text-4xl font-black text-gradient">50%</p>
              <p className="text-xs text-muted-foreground mt-2">
                250 out of 500 advance
              </p>
            </div>

            <div className="glass-card-hover rounded-xl p-6 animate-fade-in-up stagger-4">
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-[0.15em] mb-3">
                {isTeamLeader ? "Your Status" : "Your Rank"}
              </p>
              <p className="text-4xl font-black text-gradient">
                {isTeamLeader ? "👑" : "#73"}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                {isTeamLeader ? "Team Leader" : "Registration order"}
              </p>
            </div>

            {/* Phase Tracker — full width */}
            <div className="lg:col-span-4 glass-card rounded-xl p-1 animate-fade-in-up stagger-5">
              <PhaseTracker phases={phases} />
            </div>

            {/* ===== TEAM LEADER VIEW ===== */}
            {isTeamLeader && (
              <>
                {/* Team Management Card */}
                <div className="md:col-span-2 glass-card-hover rounded-xl p-6 space-y-4 animate-fade-in-up stagger-6">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xl">👑</span>
                      <h3 className="text-base font-bold text-foreground">
                        {myTeam ? myTeam.name : "Your Team"}
                      </h3>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      You are a team leader. Review incoming applications from players who want to join your team.
                    </p>
                    {myTeam && (
                      <div className="flex gap-3 mt-3">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-bold">
                          {(myTeam.member_count || 0) + 1}/{myTeam.max_size} Members
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${myTeam.status === "recruiting"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                          }`}>
                          {myTeam.status}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 pt-1">
                    <Button
                      className="flex-1 btn-glow"
                      onClick={() => navigate("/team-selection")}
                    >
                      Review Applications
                      {pendingApps.length > 0 && (
                        <span className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-white/20 text-[10px] font-bold">
                          {pendingApps.length}
                        </span>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 border-white/10 hover:bg-white/5"
                      onClick={() => navigate("/team-pools")}
                    >
                      View All Teams
                    </Button>
                  </div>
                </div>

                {/* Incoming Applications */}
                <div className="md:col-span-2 glass-card-hover rounded-xl p-6 animate-fade-in-up stagger-7">
                  <h3 className="text-base font-bold text-foreground mb-4">
                    Incoming Applications
                  </h3>
                  {pendingApps.length > 0 ? (
                    <div className="space-y-2">
                      {pendingApps.slice(0, 5).map((app) => (
                        <div
                          key={app.id}
                          className="flex items-center justify-between glass rounded-lg p-3"
                        >
                          <div>
                            <p className="font-bold text-sm text-foreground">{app.player_name || "Player"}</p>
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {app.message || "No message"}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-yellow-500/15 text-yellow-400 border border-yellow-500/20">
                              pending
                            </span>
                            <p className="text-[10px] text-muted-foreground mt-1">
                              {new Date(app.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                      {pendingApps.length > 5 && (
                        <p className="text-xs text-muted-foreground text-center pt-1">
                          +{pendingApps.length - 5} more — open Review Applications to see all
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="glass rounded-lg p-8 text-center">
                      <p className="text-sm text-muted-foreground">
                        No pending applications. Players will apply to your team once they see your profile.
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* ===== REGULAR PLAYER VIEW (not a leader or member) ===== */}
            {!isTeamLeader && tournamentStatus !== "team_member" && !isAdmin && (
              <>
                {/* Action card */}
                <div className="md:col-span-2 glass-card-hover rounded-xl p-6 space-y-4 animate-fade-in-up stagger-6">
                  <div>
                    <h3 className="text-base font-bold text-foreground mb-1.5">
                      Leadership & Team Formation
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      The strongest players become leaders. Choose your team
                      wisely — your roster will determine your fate in team
                      competition.
                    </p>
                  </div>

                  <div className="glass rounded-lg p-4 text-sm text-muted-foreground">
                    <p className="font-semibold mb-2 text-foreground text-xs">What's Next:</p>
                    <ul className="list-none space-y-1.5 text-xs">
                      <li className="flex items-center gap-2">
                        <span className="w-1 h-1 rounded-full bg-primary"></span>
                        Apply to teams led by top players
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1 h-1 rounded-full bg-primary"></span>
                        Leaders finalize their rosters
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1 h-1 rounded-full bg-primary"></span>
                        Remaining players distributed in closing draft
                      </li>
                    </ul>
                  </div>

                  <div className="flex gap-3 pt-1">
                    <Button
                      className="flex-1 btn-glow"
                      onClick={() => navigate("/leadership")}
                    >
                      View Leaders & Apply
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 border-white/10 hover:bg-white/5"
                      onClick={() => navigate("/team-pools")}
                    >
                      See Team Progress
                    </Button>
                  </div>
                </div>

                {/* My Applications */}
                <div className="md:col-span-2 glass-card-hover rounded-xl p-6 animate-fade-in-up stagger-7">
                  <h3 className="text-base font-bold text-foreground mb-4">
                    My Applications
                  </h3>
                  {applications.length > 0 ? (
                    <div className="space-y-2">
                      {applications.map((app) => (
                        <div
                          key={app.id}
                          className="flex items-center justify-between glass rounded-lg p-3"
                        >
                          <div>
                            <p className="font-bold text-sm text-foreground">{app.team_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {app.leader_name ? `Leader: ${app.leader_name}` : ""}
                            </p>
                          </div>
                          <div className="text-right">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${app.status === "accepted"
                                ? "bg-primary/15 text-primary border border-primary/20"
                                : app.status === "rejected"
                                  ? "bg-destructive/15 text-destructive border border-destructive/20"
                                  : "bg-yellow-500/15 text-yellow-400 border border-yellow-500/20"
                                }`}
                            >
                              {app.status}
                            </span>
                            <p className="text-[10px] text-muted-foreground mt-1">
                              {new Date(app.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="glass rounded-lg p-8 text-center">
                      <p className="text-sm text-muted-foreground">
                        You haven't applied to any teams yet.
                      </p>
                      <Button
                        variant="outline"
                        className="mt-3 border-white/10 hover:bg-white/5 text-sm"
                        onClick={() => navigate("/leadership")}
                      >
                        Browse Teams
                      </Button>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* ===== ADMIN VIEW ON PLAYER DASHBOARD ===== */}
            {isAdmin && !isTeamLeader && tournamentStatus !== "team_member" && (
              <div className="md:col-span-4 glass-card-hover rounded-xl p-8 text-center animate-fade-in-up stagger-6">
                <Shield size={40} className="text-primary mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-bold text-foreground mb-2">Administrator Oversight</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
                  You are viewing the player-facing dashboard. As an administrator, you have full control over teams and participants through the Command Center.
                </p>
                <div className="flex justify-center gap-4">
                  <Button className="btn-glow" onClick={() => navigate("/admin/dashboard")}>
                    Go to Command Center
                  </Button>
                  <Button variant="outline" className="border-white/10" onClick={() => navigate("/admin/tournaments")}>
                    Manage Tournaments
                  </Button>
                </div>
              </div>
            )}

            {/* ===== TEAM MEMBER VIEW ===== */}
            {tournamentStatus === "team_member" && (
              <>
                <div className="md:col-span-2 glass-card-hover rounded-xl p-6 space-y-4 animate-fade-in-up stagger-6">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xl">✦</span>
                    <h3 className="text-base font-bold text-foreground">
                      {myTeam ? myTeam.name : "You're On a Team!"}
                    </h3>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    You've been accepted onto a team. Stay tuned for team competition details and prepare for the next phase.
                  </p>
                  {myTeam && (
                    <div className="flex gap-3">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                        {(myTeam.member_count || 0) + 1}/{myTeam.max_size} Members
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-bold">
                        Leader: {myTeam.leader_name}
                      </span>
                    </div>
                  )}
                  <div className="flex gap-3 pt-1">
                    <Button
                      className="flex-1 btn-glow"
                      onClick={() => navigate("/team-pools")}
                    >
                      View Your Team
                    </Button>
                  </div>
                </div>

                <div className="md:col-span-2 glass-card-hover rounded-xl p-6 animate-fade-in-up stagger-7">
                  <h3 className="text-base font-bold text-foreground mb-4">
                    Teammates
                  </h3>
                  {teamMembers.length > 0 ? (
                    <div className="space-y-2">
                      {teamMembers.map((m: any) => (
                        <div key={m.id} className="flex items-center gap-3 glass rounded-lg p-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                            {m.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground">{m.username}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {m.codm_ign || "No IGN"}
                              {m.codm_rank && ` · ${m.codm_rank}`}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="glass rounded-lg p-8 text-center">
                      <span className="text-4xl mb-3 block">🎮</span>
                      <p className="text-sm text-foreground font-semibold">Ready for Competition</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Your team is preparing for the next phase. Check back for updates.
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
