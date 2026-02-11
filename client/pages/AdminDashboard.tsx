import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

interface Stats {
    users: {
        total: number;
        players: number;
        pending: number;
        verified: number;
        qualified: number;
        teamLeaders: number;
        teamMembers: number;
        eliminated: number;
    };
    teams: {
        total: number;
        recruiting: number;
        full: number;
    };
    applications: {
        pending: number;
        accepted: number;
        rejected: number;
    };
    recentActivity: any[];
}

export function AdminDashboard() {
    const navigate = useNavigate();
    const { token } = useAuth();
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
        const interval = setInterval(fetchStats, 15000); // Refresh every 15s
        return () => clearInterval(interval);
    }, []);

    async function fetchStats() {
        try {
            const res = await fetch("/api/auth/admin/stats", {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success) setStats(data.stats);
        } catch (err) {
            console.error("Failed to fetch stats:", err);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <Layout>
                <div className="min-h-screen flex items-center justify-center">
                    <div className="glass-card rounded-xl p-8 text-center">
                        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                        <p className="text-sm text-muted-foreground">Loading dashboard...</p>
                    </div>
                </div>
            </Layout>
        );
    }

    const s = stats!;

    return (
        <Layout>
            <div className="min-h-screen relative">
                {/* Ambient background */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute top-0 left-[30%] w-[600px] h-[600px] bg-primary/[0.03] rounded-full blur-[150px]"></div>
                    <div className="absolute bottom-[10%] right-[20%] w-[400px] h-[400px] bg-accent/[0.04] rounded-full blur-[120px]"></div>
                </div>

                <div className="container mx-auto px-4 py-10 relative z-10">
                    {/* Header */}
                    <div className="mb-8 animate-fade-in-up">
                        <div className="flex items-center gap-3 mb-2">
                            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-[10px] font-bold text-primary uppercase tracking-[0.15em]">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                                Command Center
                            </span>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                            Admin Dashboard
                        </h1>
                        <p className="text-muted-foreground text-sm mt-1">
                            Real-time tournament management and oversight
                        </p>
                    </div>

                    {/* ── Registration Pipeline ──────────────────────────── */}
                    <div className="mb-8 animate-fade-in-up stagger-1">
                        <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-[0.15em] mb-3">
                            Registration Pipeline
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <PipelineCard
                                label="Registered"
                                value={s.users.players}
                                icon="👤"
                                color="text-blue-400"
                                bgColor="bg-blue-500/10"
                                borderColor="border-blue-500/20"
                            />
                            <PipelineCard
                                label="Pending"
                                value={s.users.pending}
                                icon="⏳"
                                color="text-yellow-400"
                                bgColor="bg-yellow-500/10"
                                borderColor="border-yellow-500/20"
                                highlight={s.users.pending > 0}
                            />
                            <PipelineCard
                                label="Verified"
                                value={s.users.verified}
                                icon="✓"
                                color="text-emerald-400"
                                bgColor="bg-emerald-500/10"
                                borderColor="border-emerald-500/20"
                            />
                            <PipelineCard
                                label="Qualified"
                                value={s.users.qualified}
                                icon="⚡"
                                color="text-purple-400"
                                bgColor="bg-purple-500/10"
                                borderColor="border-purple-500/20"
                            />
                        </div>
                    </div>

                    {/* ── Teams & Lobby Grid ─────────────────────────────── */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8 animate-fade-in-up stagger-2">
                        {/* Team Stats */}
                        <div className="glass-card rounded-xl p-6">
                            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-[0.15em] mb-4">
                                Teams Overview
                            </h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Total Teams</span>
                                    <span className="text-xl font-black text-gradient">{s.teams.total}</span>
                                </div>
                                <div className="w-full h-px bg-white/5"></div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                                        Recruiting
                                    </span>
                                    <span className="text-sm font-bold text-foreground">{s.teams.recruiting}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                                        Full
                                    </span>
                                    <span className="text-sm font-bold text-foreground">{s.teams.full}</span>
                                </div>
                                <div className="w-full h-px bg-white/5"></div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">👑 Leaders</span>
                                    <span className="text-sm font-bold text-yellow-400">{s.users.teamLeaders}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">✦ Members</span>
                                    <span className="text-sm font-bold text-emerald-400">{s.users.teamMembers}</span>
                                </div>
                            </div>

                            <Button
                                className="w-full mt-4 btn-glow text-sm"
                                onClick={() => navigate("/admin/teams")}
                            >
                                Manage Teams
                            </Button>
                        </div>

                        {/* Applications Stats */}
                        <div className="glass-card rounded-xl p-6">
                            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-[0.15em] mb-4">
                                Applications
                            </h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></span>
                                        Pending
                                    </span>
                                    <span className={`text-xl font-black ${s.applications.pending > 0 ? "text-yellow-400" : "text-muted-foreground"}`}>
                                        {s.applications.pending}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                                        Accepted
                                    </span>
                                    <span className="text-sm font-bold text-foreground">{s.applications.accepted}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-red-400"></span>
                                        Rejected
                                    </span>
                                    <span className="text-sm font-bold text-foreground">{s.applications.rejected}</span>
                                </div>
                            </div>

                            {/* Lobby Count */}
                            <div className="glass rounded-lg p-4 mt-4 text-center">
                                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-[0.15em] mb-1">
                                    In the Lobby
                                </p>
                                <p className="text-3xl font-black text-gradient">{s.users.qualified}</p>
                                <p className="text-[10px] text-muted-foreground mt-1">
                                    Qualified players waiting for teams
                                </p>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="glass-card rounded-xl p-6">
                            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-[0.15em] mb-4">
                                Quick Actions
                            </h3>
                            <div className="space-y-3">
                                <Button
                                    variant="outline"
                                    className="w-full justify-start border-white/10 hover:bg-white/5 text-sm"
                                    onClick={() => navigate("/admin/teams")}
                                >
                                    <span className="mr-2">🏆</span> Create New Team
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full justify-start border-white/10 hover:bg-white/5 text-sm"
                                    onClick={() => navigate("/admin/users")}
                                >
                                    <span className="mr-2">👤</span> Manage Users
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full justify-start border-white/10 hover:bg-white/5 text-sm"
                                    onClick={() => navigate("/admin/users")}
                                >
                                    <span className="mr-2">✓</span> Review Pending ({s.users.pending})
                                </Button>
                            </div>

                            {/* Status Breakdown */}
                            <div className="mt-4 glass rounded-lg p-4">
                                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-[0.15em] mb-2">
                                    Tournament Status
                                </p>
                                <div className="space-y-1.5">
                                    {[
                                        { label: "Eliminated", count: s.users.eliminated, color: "bg-red-400" },
                                        { label: "None", count: s.users.players - s.users.qualified - s.users.teamLeaders - s.users.teamMembers - s.users.eliminated, color: "bg-white/20" },
                                    ].map((item) => (
                                        <div key={item.label} className="flex items-center justify-between text-xs">
                                            <span className="flex items-center gap-1.5 text-muted-foreground">
                                                <span className={`w-1.5 h-1.5 rounded-full ${item.color}`}></span>
                                                {item.label}
                                            </span>
                                            <span className="font-bold text-foreground">{Math.max(0, item.count)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Recent Activity ─────────────────────────────────── */}
                    <div className="animate-fade-in-up stagger-3">
                        <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-[0.15em] mb-3">
                            Recent Activity
                        </h2>
                        <div className="glass-card rounded-xl p-6">
                            {s.recentActivity.length > 0 ? (
                                <div className="space-y-3">
                                    {s.recentActivity.map((event: any, i: number) => (
                                        <div key={i} className="flex items-center gap-3 glass rounded-lg p-3">
                                            <span className="text-lg">
                                                {event.event_type === "registration" ? "👤" :
                                                    event.status === "accepted" ? "✅" :
                                                        event.status === "rejected" ? "❌" : "📩"}
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-foreground truncate">
                                                    {event.event_type === "registration"
                                                        ? `${event.username} registered`
                                                        : `${event.player_name} → ${event.team_name}`}
                                                </p>
                                                <p className="text-[10px] text-muted-foreground">
                                                    {event.event_type === "registration"
                                                        ? `Status: ${event.verification_status}`
                                                        : `Application ${event.status}`}
                                                </p>
                                            </div>
                                            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                                {new Date(event.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <p className="text-sm text-muted-foreground">No activity yet</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}

// ── Pipeline Card Component ──────────────────────────────────────

function PipelineCard({
    label, value, icon, color, bgColor, borderColor, highlight,
}: {
    label: string;
    value: number;
    icon: string;
    color: string;
    bgColor: string;
    borderColor: string;
    highlight?: boolean;
}) {
    return (
        <div className={`glass-card-hover rounded-xl p-5 border ${borderColor} ${highlight ? "ring-1 ring-yellow-500/30" : ""}`}>
            <div className="flex items-center justify-between mb-2">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${bgColor} ${color} border ${borderColor}`}>
                    {icon} {label}
                </span>
            </div>
            <p className={`text-3xl font-black ${color}`}>{value}</p>
            {highlight && (
                <p className="text-[10px] text-yellow-400 mt-1 animate-pulse">
                    Needs attention
                </p>
            )}
        </div>
    );
}
