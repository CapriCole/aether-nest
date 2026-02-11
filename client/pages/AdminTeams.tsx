import { useState, useEffect, useCallback } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
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

interface LobbyPlayer {
    id: string;
    username: string;
    codm_ign: string;
    codm_rank: string;
}

interface TeamMember {
    id: string;
    username: string;
    codm_ign: string;
    codm_rank: string;
    joined_at: string;
}

export function AdminTeams() {
    const { token } = useAuth();
    const [teams, setTeams] = useState<Team[]>([]);
    const [lobby, setLobby] = useState<LobbyPlayer[]>([]);
    const [expandedTeam, setExpandedTeam] = useState<string | null>(null);
    const [applications, setApplications] = useState<Record<string, Application[]>>({});
    const [members, setMembers] = useState<Record<string, TeamMember[]>>({});
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Create team form
    const [newTeamName, setNewTeamName] = useState("");
    const [newTeamLeader, setNewTeamLeader] = useState("");
    const [newTeamSize, setNewTeamSize] = useState(5);
    const [creating, setCreating] = useState(false);

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

    const fetchLobby = useCallback(async () => {
        try {
            const res = await fetch("/api/teams/lobby", {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success) setLobby(data.players);
        } catch (err) {
            console.error("Failed to fetch lobby:", err);
        }
    }, [token]);

    useEffect(() => {
        fetchTeams();
        fetchLobby();
    }, [fetchTeams, fetchLobby]);

    async function fetchTeamDetails(teamId: string) {
        try {
            // Fetch applications
            const appRes = await fetch(`/api/teams/${teamId}/applications`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const appData = await appRes.json();
            if (appData.success) {
                setApplications((prev) => ({ ...prev, [teamId]: appData.applications }));
            }

            // Fetch members (from team detail endpoint)
            const detailRes = await fetch(`/api/teams/${teamId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const detailData = await detailRes.json();
            if (detailData.success) {
                setMembers((prev) => ({ ...prev, [teamId]: detailData.members }));
            }
        } catch (err) {
            console.error("Failed to fetch team details:", err);
        }
    }

    function toggleTeam(teamId: string) {
        if (expandedTeam === teamId) {
            setExpandedTeam(null);
        } else {
            setExpandedTeam(teamId);
            fetchTeamDetails(teamId);
        }
    }

    async function handleCreateTeam() {
        if (!newTeamName.trim() || !newTeamLeader.trim()) return;
        setCreating(true);
        try {
            const res = await fetch("/api/teams", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    name: newTeamName,
                    leaderId: newTeamLeader,
                    maxSize: newTeamSize,
                }),
            });
            const data = await res.json();
            if (data.success) {
                setShowCreateModal(false);
                setNewTeamName("");
                setNewTeamLeader("");
                setNewTeamSize(5);
                fetchTeams();
                fetchLobby();
            } else {
                alert(data.message);
            }
        } catch (err) {
            console.error("Create team error:", err);
        } finally {
            setCreating(false);
        }
    }

    async function handleApplicationReview(appId: string, status: "accepted" | "rejected", teamId: string) {
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
                fetchTeamDetails(teamId);
                fetchTeams();
                fetchLobby();
            } else {
                alert(data.message);
            }
        } catch (err) {
            console.error("Review error:", err);
        }
    }

    const statusBadge = (status: string) => {
        const map: Record<string, string> = {
            recruiting: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
            full: "bg-blue-500/15 text-blue-400 border-blue-500/20",
            locked: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
            eliminated: "bg-red-500/15 text-red-400 border-red-500/20",
        };
        return map[status] || "bg-white/5 text-muted-foreground border-white/10";
    };

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
                </div>

                <div className="container mx-auto px-4 py-10 relative z-10">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8 animate-fade-in-up">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                                Team Management
                            </h1>
                            <p className="text-muted-foreground text-sm mt-1">
                                {teams.length} team{teams.length !== 1 ? "s" : ""} · {lobby.length} in lobby
                            </p>
                        </div>
                        <Button className="btn-glow" onClick={() => setShowCreateModal(true)}>
                            + Create Team
                        </Button>
                    </div>

                    {/* Teams List */}
                    <div className="space-y-3 mb-8 animate-fade-in-up stagger-1">
                        {teams.length === 0 ? (
                            <div className="glass-card rounded-xl p-12 text-center">
                                <span className="text-4xl block mb-3">🏆</span>
                                <p className="text-sm text-muted-foreground">No teams yet. Create the first one!</p>
                            </div>
                        ) : (
                            teams.map((team) => (
                                <div key={team.id} className="glass-card rounded-xl overflow-hidden">
                                    {/* Team Header */}
                                    <button
                                        onClick={() => toggleTeam(team.id)}
                                        className="w-full p-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors text-left"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-lg">
                                                🏆
                                            </div>
                                            <div>
                                                <p className="font-bold text-foreground">{team.name}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    👑 {team.leader_name}
                                                    {team.leader_ign && ` · ${team.leader_ign}`}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <div className="text-right hidden md:block">
                                                <p className="text-xs text-muted-foreground">
                                                    {team.member_count + 1}/{team.max_size} members
                                                </p>
                                                {team.pending_count > 0 && (
                                                    <p className="text-[10px] text-yellow-400 animate-pulse">
                                                        {team.pending_count} pending
                                                    </p>
                                                )}
                                            </div>
                                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${statusBadge(team.status)}`}>
                                                {team.status}
                                            </span>
                                            <span className="text-muted-foreground text-sm">
                                                {expandedTeam === team.id ? "▲" : "▼"}
                                            </span>
                                        </div>
                                    </button>

                                    {/* Expanded Detail */}
                                    {expandedTeam === team.id && (
                                        <div className="border-t border-white/5 p-5 space-y-4">
                                            {/* Roster */}
                                            <div>
                                                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-[0.15em] mb-2">
                                                    Roster
                                                </h4>
                                                <div className="space-y-1.5">
                                                    {/* Leader */}
                                                    <div className="flex items-center justify-between glass rounded-lg p-3">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm">👑</span>
                                                            <p className="text-sm font-semibold text-foreground">{team.leader_name}</p>
                                                        </div>
                                                        <span className="text-[10px] text-yellow-400 font-bold uppercase">Leader</span>
                                                    </div>
                                                    {/* Members */}
                                                    {(members[team.id] || []).map((m) => (
                                                        <div key={m.id} className="flex items-center justify-between glass rounded-lg p-3">
                                                            <div>
                                                                <p className="text-sm font-semibold text-foreground">{m.username}</p>
                                                                <p className="text-[10px] text-muted-foreground">{m.codm_ign || "No IGN"}</p>
                                                            </div>
                                                            <span className="text-[10px] text-emerald-400 font-bold uppercase">Member</span>
                                                        </div>
                                                    ))}
                                                    {(members[team.id] || []).length === 0 && (
                                                        <p className="text-xs text-muted-foreground pl-3">No members yet</p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Pending Applications */}
                                            <div>
                                                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-[0.15em] mb-2">
                                                    Applications
                                                </h4>
                                                {(applications[team.id] || []).filter((a) => a.status === "pending").length > 0 ? (
                                                    <div className="space-y-1.5">
                                                        {(applications[team.id] || [])
                                                            .filter((a) => a.status === "pending")
                                                            .map((app) => (
                                                                <div key={app.id} className="flex items-center justify-between glass rounded-lg p-3">
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="text-sm font-semibold text-foreground">{app.player_name}</p>
                                                                        <p className="text-[10px] text-muted-foreground">
                                                                            {app.player_ign || "No IGN"}
                                                                            {app.player_rank && ` · ${app.player_rank}`}
                                                                        </p>
                                                                        {app.message && (
                                                                            <p className="text-xs text-muted-foreground italic mt-1 truncate">"{app.message}"</p>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex gap-2 ml-3">
                                                                        <button
                                                                            onClick={() => handleApplicationReview(app.id, "accepted", team.id)}
                                                                            className="px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold uppercase hover:bg-emerald-500/25 transition-colors"
                                                                        >
                                                                            Accept
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleApplicationReview(app.id, "rejected", team.id)}
                                                                            className="px-3 py-1.5 rounded-lg bg-red-500/15 text-red-400 border border-red-500/20 text-[10px] font-bold uppercase hover:bg-red-500/25 transition-colors"
                                                                        >
                                                                            Reject
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                    </div>
                                                ) : (
                                                    <p className="text-xs text-muted-foreground pl-3">No pending applications</p>
                                                )}

                                                {/* Past applications (accepted/rejected) */}
                                                {(applications[team.id] || []).filter((a) => a.status !== "pending").length > 0 && (
                                                    <div className="mt-3">
                                                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1.5">History</p>
                                                        <div className="space-y-1">
                                                            {(applications[team.id] || [])
                                                                .filter((a) => a.status !== "pending")
                                                                .map((app) => (
                                                                    <div key={app.id} className="flex items-center justify-between glass rounded-lg p-2 opacity-60">
                                                                        <p className="text-xs text-muted-foreground">{app.player_name}</p>
                                                                        <span className={`text-[10px] font-bold uppercase ${app.status === "accepted" ? "text-emerald-400" : "text-red-400"}`}>
                                                                            {app.status}
                                                                        </span>
                                                                    </div>
                                                                ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>

                    {/* ── Lobby ─────────────────────────────────────────── */}
                    <div className="animate-fade-in-up stagger-2">
                        <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-[0.15em] mb-3">
                            Player Lobby ({lobby.length})
                        </h2>
                        <div className="glass-card rounded-xl p-6">
                            {lobby.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                    {lobby.map((player) => (
                                        <div key={player.id} className="flex items-center gap-3 glass rounded-lg p-3">
                                            <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                                                {player.username.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-foreground truncate">{player.username}</p>
                                                <p className="text-[10px] text-muted-foreground truncate">
                                                    {player.codm_ign || "No IGN"}
                                                    {player.codm_rank && ` · ${player.codm_rank}`}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <p className="text-sm text-muted-foreground">
                                        No qualified players in the lobby
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Create Team Modal ───────────────────────────────── */}
                {showCreateModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCreateModal(false)}></div>
                        <div className="glass-card rounded-xl p-6 w-full max-w-md relative z-10 animate-fade-in-up">
                            <h3 className="text-lg font-bold text-foreground mb-4">Create New Team</h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                                        Team Name
                                    </label>
                                    <input
                                        type="text"
                                        value={newTeamName}
                                        onChange={(e) => setNewTeamName(e.target.value)}
                                        placeholder="e.g. Shadow Wolves"
                                        className="w-full px-3 py-2 rounded-lg glass border border-white/10 bg-transparent text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/40"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                                        Team Leader (User ID)
                                    </label>
                                    <input
                                        type="text"
                                        value={newTeamLeader}
                                        onChange={(e) => setNewTeamLeader(e.target.value)}
                                        placeholder="Paste leader's user ID"
                                        className="w-full px-3 py-2 rounded-lg glass border border-white/10 bg-transparent text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/40"
                                    />
                                    {/* Leader picker from lobby */}
                                    {lobby.length > 0 && (
                                        <div className="mt-2">
                                            <p className="text-[10px] text-muted-foreground mb-1">Or pick from lobby:</p>
                                            <div className="max-h-32 overflow-y-auto space-y-1">
                                                {lobby.map((p) => (
                                                    <button
                                                        key={p.id}
                                                        onClick={() => setNewTeamLeader(p.id)}
                                                        className={`w-full text-left p-2 rounded-lg text-xs transition-colors ${newTeamLeader === p.id
                                                                ? "bg-primary/15 text-primary border border-primary/20"
                                                                : "glass hover:bg-white/5 text-muted-foreground"
                                                            }`}
                                                    >
                                                        {p.username} {p.codm_ign && `(${p.codm_ign})`}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                                        Max Team Size
                                    </label>
                                    <input
                                        type="number"
                                        value={newTeamSize}
                                        onChange={(e) => setNewTeamSize(parseInt(e.target.value) || 5)}
                                        min={2}
                                        max={20}
                                        className="w-20 px-3 py-2 rounded-lg glass border border-white/10 bg-transparent text-foreground text-sm focus:outline-none focus:border-primary/40"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <Button
                                    className="flex-1 btn-glow"
                                    onClick={handleCreateTeam}
                                    disabled={creating || !newTeamName.trim() || !newTeamLeader.trim()}
                                >
                                    {creating ? "Creating..." : "Create Team"}
                                </Button>
                                <Button
                                    variant="outline"
                                    className="border-white/10 hover:bg-white/5"
                                    onClick={() => setShowCreateModal(false)}
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
