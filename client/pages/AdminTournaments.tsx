import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import {
    Trophy, Plus, Calendar, Users, Swords, ChevronRight,
    LayoutGrid, Clock, CheckCircle, XCircle, Pause, FileText,
} from "lucide-react";

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
    draft: { label: "Draft", color: "text-muted-foreground bg-muted/30 border-border/50", icon: FileText },
    registration: { label: "Registration", color: "text-blue-400 bg-blue-500/10 border-blue-500/20", icon: Users },
    active: { label: "Active", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", icon: Swords },
    paused: { label: "Paused", color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20", icon: Pause },
    completed: { label: "Completed", color: "text-accent bg-accent/10 border-accent/20", icon: CheckCircle },
    cancelled: { label: "Cancelled", color: "text-destructive bg-destructive/10 border-destructive/20", icon: XCircle },
};

const formatLabels: Record<string, string> = {
    "single-elimination": "Single Elimination",
    "double-elimination": "Double Elimination",
    "round-robin": "Round Robin",
    "swiss": "Swiss System",
    "battle-royale": "Battle Royale",
    "group-knockout": "Group + Knockout",
};

export function AdminTournaments() {
    const { token } = useAuth();
    const navigate = useNavigate();
    const [tournaments, setTournaments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchTournaments = useCallback(async () => {
        if (!token) return;
        try {
            const res = await fetch("/api/tournaments", {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success) setTournaments(data.tournaments);
        } catch (err) {
            console.error("Failed to fetch tournaments:", err);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchTournaments();
    }, [fetchTournaments]);

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Header />
            <main className="container mx-auto px-4 py-8 max-w-6xl">
                {/* Page Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                            <Trophy size={20} className="text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black tracking-tight">Tournaments</h1>
                            <p className="text-sm text-muted-foreground">Create and manage tournament brackets</p>
                        </div>
                    </div>
                    <Link to="/admin/tournaments/create">
                        <Button className="btn-glow gap-2">
                            <Plus size={16} /> New Tournament
                        </Button>
                    </Link>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {[
                        { label: "Total", value: tournaments.length, icon: LayoutGrid, color: "text-primary" },
                        { label: "Active", value: tournaments.filter(t => t.status === "active").length, icon: Swords, color: "text-emerald-400" },
                        { label: "Draft", value: tournaments.filter(t => t.status === "draft").length, icon: FileText, color: "text-muted-foreground" },
                        { label: "Completed", value: tournaments.filter(t => t.status === "completed").length, icon: CheckCircle, color: "text-accent" },
                    ].map(stat => (
                        <div key={stat.label} className="glass rounded-xl p-4 border border-white/[0.06]">
                            <div className="flex items-center gap-2 mb-1">
                                <stat.icon size={14} className={stat.color} />
                                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{stat.label}</span>
                            </div>
                            <p className="text-2xl font-black">{stat.value}</p>
                        </div>
                    ))}
                </div>

                {/* Tournament List */}
                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="glass rounded-xl p-6 border border-white/[0.06] animate-pulse">
                                <div className="h-6 w-48 bg-white/10 rounded mb-3"></div>
                                <div className="h-4 w-32 bg-white/5 rounded"></div>
                            </div>
                        ))}
                    </div>
                ) : tournaments.length === 0 ? (
                    <div className="glass rounded-xl p-12 border border-white/[0.06] text-center">
                        <Trophy size={48} className="mx-auto text-muted-foreground/30 mb-4" />
                        <h3 className="text-lg font-bold mb-2">No Tournaments Yet</h3>
                        <p className="text-sm text-muted-foreground mb-6">Create your first tournament to get started</p>
                        <Link to="/admin/tournaments/create">
                            <Button className="btn-glow gap-2">
                                <Plus size={16} /> Create Tournament
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {tournaments.map(tournament => {
                            const status = statusConfig[tournament.status] || statusConfig.draft;
                            const StatusIcon = status.icon;
                            return (
                                <button
                                    key={tournament.id}
                                    onClick={() => navigate(`/admin/tournaments/${tournament.id}`)}
                                    className="w-full glass rounded-xl p-5 border border-white/[0.06] hover:border-primary/30 transition-all group text-left"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-lg font-bold truncate group-hover:text-primary transition-colors">
                                                    {tournament.name}
                                                </h3>
                                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${status.color} flex items-center gap-1`}>
                                                    <StatusIcon size={10} />
                                                    {status.label}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <Swords size={12} />
                                                    {formatLabels[tournament.format] || tournament.format}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Users size={12} />
                                                    {tournament.participant_count} participants
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <LayoutGrid size={12} />
                                                    {tournament.completed_matches}/{tournament.match_count} matches
                                                </span>
                                                {tournament.start_date && (
                                                    <span className="flex items-center gap-1">
                                                        <Calendar size={12} />
                                                        {new Date(tournament.start_date).toLocaleDateString()}
                                                    </span>
                                                )}
                                                <span className="flex items-center gap-1">
                                                    <Clock size={12} />
                                                    {new Date(tournament.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                        <ChevronRight size={18} className="text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 ml-4" />
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
}
