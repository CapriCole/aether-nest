import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import {
    ArrowLeft, Trophy, Users, Swords, Plus, Play, SkipForward,
    CheckCircle, XCircle, Shield, Clock, Crown, UserPlus, Trash2,
    ChevronDown, ChevronUp, LayoutGrid,
} from "lucide-react";

const statusColors: Record<string, string> = {
    draft: "text-muted-foreground bg-muted/30 border-border/50",
    registration: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    active: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    paused: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
    completed: "text-accent bg-accent/10 border-accent/20",
    cancelled: "text-destructive bg-destructive/10 border-destructive/20",
};

const matchStatusColors: Record<string, string> = {
    pending: "text-muted-foreground",
    live: "text-emerald-400",
    completed: "text-accent",
    cancelled: "text-destructive",
};

export function AdminTournamentDetail() {
    const { token } = useAuth();
    const { id } = useParams();
    const navigate = useNavigate();

    const [tournament, setTournament] = useState<any>(null);
    const [phases, setPhases] = useState<any[]>([]);
    const [participants, setParticipants] = useState<any[]>([]);
    const [matches, setMatches] = useState<any[]>([]);
    const [rounds, setRounds] = useState<Record<number, any[]>>({});
    const [standings, setStandings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [lobbyParticipants, setLobbyParticipants] = useState<any[]>([]);
    const [reportingLobbyMatch, setReportingLobbyMatch] = useState<any>(null);
    const [lobbyResults, setLobbyResults] = useState<any[]>([]);

    // Add participants modal
    const [showAddPanel, setShowAddPanel] = useState(false);
    const [availableTeams, setAvailableTeams] = useState<any[]>([]);
    const [selectedTeams, setSelectedTeams] = useState<string[]>([]);

    // Match result modal
    const [reportingMatch, setReportingMatch] = useState<any>(null);
    const [score1, setScore1] = useState(0);
    const [score2, setScore2] = useState(0);
    const [winnerId, setWinnerId] = useState("");

    // Expanded rounds
    const [expandedRounds, setExpandedRounds] = useState<Set<number>>(new Set([1]));

    const fetchTournament = useCallback(async () => {
        if (!token || !id) return;
        try {
            const res = await fetch(`/api/tournaments/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success) {
                setTournament(data.tournament);
                setPhases(data.phases);
                setParticipants(data.participants);
            }
        } catch (err) {
            console.error("Fetch tournament error:", err);
        } finally {
            setLoading(false);
        }
    }, [token, id]);

    const fetchMatches = useCallback(async () => {
        if (!token || !id) return;
        try {
            const res = await fetch(`/api/tournaments/${id}/matches`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success) {
                setMatches(data.matches);
                setRounds(data.rounds);
            }
        } catch { /* silent */ }
    }, [token, id]);

    const fetchStandings = useCallback(async () => {
        if (!token || !id || !tournament) return;
        try {
            const res = await fetch(`/api/tournaments/${id}/standings`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success && data.standings) {
                setStandings(data.standings);
            }
        } catch { /* silent */ }
    }, [token, id, tournament]);

    const fetchAvailableTeams = useCallback(async () => {
        if (!token) return;
        try {
            const res = await fetch("/api/teams", {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success) {
                const existingIds = new Set(participants.map(p => p.participant_id));
                setAvailableTeams((data.teams || []).filter((t: any) => !existingIds.has(t.id)));
            }
        } catch { /* silent */ }
    }, [token, participants]);

    useEffect(() => { fetchTournament(); }, [fetchTournament]);
    useEffect(() => { if (tournament) { fetchMatches(); fetchStandings(); } }, [tournament, fetchMatches, fetchStandings]);
    useEffect(() => { if (showAddPanel) fetchAvailableTeams(); }, [showAddPanel, fetchAvailableTeams]);

    const handleStatusChange = async (newStatus: string) => {
        try {
            const res = await fetch(`/api/tournaments/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ status: newStatus }),
            });
            const data = await res.json();
            if (data.success) fetchTournament();
            else alert(data.message);
        } catch { alert("Failed to update status"); }
    };

    const handleGenerate = async () => {
        if (!confirm("Generate bracket/schedule? This will clear existing matches.")) return;
        try {
            const res = await fetch(`/api/tournaments/${id}/generate`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success) {
                fetchTournament();
                fetchMatches();
                fetchStandings();
            } else {
                alert(data.message);
            }
        } catch { alert("Failed to generate"); }
    };

    const handleReportLobbyResult = async () => {
        if (!reportingLobbyMatch || lobbyResults.length === 0) return;
        try {
            const res = await fetch(`/api/tournaments/${id}/matches/${reportingLobbyMatch.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ lobbyResults }),
            });
            const data = await res.json();
            if (data.success) {
                setReportingLobbyMatch(null);
                setLobbyResults([]);
                fetchMatches();
                fetchStandings();
                fetchTournament();
            } else {
                alert(data.message);
            }
        } catch { alert("Failed to report lobby results"); }
    };

    const fetchLobbyParticipants = useCallback(async (matchId: string) => {
        if (!token || !id) return;
        try {
            const res = await fetch(`/api/tournaments/${id}/matches/${matchId}/participants`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success) {
                setLobbyParticipants(data.participants);
                setLobbyResults(data.participants.map((p: any) => ({
                    participantId: p.participant_id,
                    rank: 1,
                    score: 0,
                    kills: 0
                })));
            }
        } catch { /* silent */ }
    }, [token, id]);

    const handleAdvancePhase = async () => {
        const currentPhase = phases.find(p => p.status === "current");
        if (!confirm(`Advance past "${currentPhase?.label}"?`)) return;
        try {
            const res = await fetch(`/api/tournaments/${id}/advance-phase`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success) fetchTournament();
            else alert(data.message);
        } catch { alert("Failed to advance phase"); }
    };

    const handleAddParticipants = async () => {
        if (selectedTeams.length === 0) return;
        try {
            const res = await fetch(`/api/tournaments/${id}/participants`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ participantIds: selectedTeams }),
            });
            const data = await res.json();
            if (data.success) {
                setSelectedTeams([]);
                setShowAddPanel(false);
                fetchTournament();
            } else {
                alert(data.message);
            }
        } catch { alert("Failed to add participants"); }
    };

    const handleReportResult = async () => {
        if (!reportingMatch || !winnerId) return;
        try {
            const res = await fetch(`/api/tournaments/${id}/matches/${reportingMatch.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ winnerId, score1, score2 }),
            });
            const data = await res.json();
            if (data.success) {
                setReportingMatch(null);
                setWinnerId("");
                setScore1(0);
                setScore2(0);
                fetchMatches();
                fetchStandings();
                fetchTournament();
            } else {
                alert(data.message);
            }
        } catch { alert("Failed to report result"); }
    };

    const toggleRound = (round: number) => {
        const next = new Set(expandedRounds);
        if (next.has(round)) next.delete(round);
        else next.add(round);
        setExpandedRounds(next);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background text-foreground">
                <Header />
                <main className="container mx-auto px-4 py-8 max-w-6xl">
                    <div className="glass rounded-xl p-12 text-center animate-pulse">
                        <div className="h-8 w-48 bg-white/10 rounded mx-auto mb-4"></div>
                        <div className="h-4 w-32 bg-white/5 rounded mx-auto"></div>
                    </div>
                </main>
            </div>
        );
    }

    if (!tournament) {
        return (
            <div className="min-h-screen bg-background text-foreground">
                <Header />
                <main className="container mx-auto px-4 py-8 max-w-6xl text-center">
                    <h2 className="text-xl font-bold">Tournament not found</h2>
                    <Button variant="ghost" onClick={() => navigate("/admin/tournaments")} className="mt-4">← Back</Button>
                </main>
            </div>
        );
    }

    const currentPhase = phases.find(p => p.status === "current");
    const completedMatches = matches.filter(m => m.status === "completed").length;
    const totalMatches = matches.length;

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Header />
            <main className="container mx-auto px-4 py-8 max-w-6xl">
                {/* Back */}
                <button
                    onClick={() => navigate("/admin/tournaments")}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
                >
                    <ArrowLeft size={16} /> Back to Tournaments
                </button>

                {/* Tournament Header */}
                <div className="glass rounded-2xl border border-white/[0.06] p-6 mb-6">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="text-2xl font-black tracking-tight">{tournament.name}</h1>
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${statusColors[tournament.status]}`}>
                                    {tournament.status}
                                </span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1"><Swords size={14} />{tournament.format.replace(/-/g, " ")}</span>
                                <span className="flex items-center gap-1"><Users size={14} />{participants.length} participants</span>
                                <span className="flex items-center gap-1"><LayoutGrid size={14} />{completedMatches}/{totalMatches} matches</span>
                                {currentPhase && <span className="flex items-center gap-1"><Clock size={14} />{currentPhase.label}</span>}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                            {tournament.status === "draft" && (
                                <Button variant="outline" size="sm" onClick={() => handleStatusChange("registration")} className="gap-1.5 text-xs">
                                    <Play size={12} /> Open Registration
                                </Button>
                            )}
                            {(tournament.status === "draft" || tournament.status === "registration") && participants.length >= 2 && (
                                <Button size="sm" onClick={handleGenerate} className="btn-glow gap-1.5 text-xs">
                                    <Swords size={12} /> Generate Bracket
                                </Button>
                            )}
                            {tournament.status === "active" && currentPhase && (
                                <Button variant="outline" size="sm" onClick={handleAdvancePhase} className="gap-1.5 text-xs">
                                    <SkipForward size={12} /> Advance Phase
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Phase Tracker */}
                    {phases.length > 0 && (
                        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/[0.06]">
                            {phases.map((phase, i) => (
                                <div key={phase.id} className="flex items-center gap-2">
                                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${phase.status === "current"
                                        ? "bg-primary/10 border border-primary/30 text-primary"
                                        : phase.status === "completed"
                                            ? "bg-accent/10 border border-accent/20 text-accent"
                                            : "bg-muted/30 border border-border/30 text-muted-foreground"
                                        }`}>
                                        {phase.status === "completed"
                                            ? <CheckCircle size={12} />
                                            : phase.status === "current"
                                                ? <Play size={12} />
                                                : <Clock size={12} />
                                        }
                                        {phase.label}
                                    </div>
                                    {i < phases.length - 1 && <div className={`w-4 h-px ${phase.status === "completed" ? "bg-accent" : "bg-border"}`} />}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* LEFT: Matches */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="text-lg font-bold flex items-center gap-2">
                                <Swords size={18} className="text-primary" /> Matches
                            </h2>
                        </div>

                        {totalMatches === 0 ? (
                            <div className="glass rounded-xl p-8 border border-white/[0.06] text-center">
                                <Swords size={32} className="mx-auto text-muted-foreground/30 mb-3" />
                                <p className="text-sm text-muted-foreground">No matches yet. Add participants and generate the bracket.</p>
                            </div>
                        ) : (
                            Object.entries(rounds)
                                .sort(([a], [b]) => parseInt(a) - parseInt(b))
                                .map(([roundNum, roundMatches]) => {
                                    const rn = parseInt(roundNum);
                                    const isExpanded = expandedRounds.has(rn);
                                    const completedInRound = roundMatches.filter((m: any) => m.status === "completed").length;

                                    return (
                                        <div key={rn} className="glass rounded-xl border border-white/[0.06] overflow-hidden">
                                            <button
                                                onClick={() => toggleRound(rn)}
                                                className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                                                        {rn >= 200 ? "GF" : rn > 100 ? `LB${rn - 100}` : `R${rn}`}
                                                    </span>
                                                    <div className="text-left">
                                                        <h3 className="font-bold text-sm">
                                                            {roundMatches[0]?.match_label || (rn === 200 ? "Grand Final" : rn === 201 ? "Grand Final (Reset)" : rn > 100 ? `Losers Round ${rn - 100}` : `Winners Round ${rn}`)}
                                                        </h3>
                                                        <span className="text-xs text-muted-foreground">{completedInRound}/{roundMatches.length} completed</span>
                                                    </div>
                                                </div>
                                                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                            </button>

                                            {isExpanded && (
                                                <div className="border-t border-white/[0.06] divide-y divide-white/[0.04]">
                                                    {roundMatches.map((match: any) => (
                                                        <div key={match.id} className="px-4 py-3 flex items-center justify-between">
                                                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                                                <span className="text-[10px] text-muted-foreground font-mono w-6">#{match.match_number}</span>
                                                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                                                    <span className={`font-medium text-sm truncate ${match.winner_id === match.participant1_id ? "text-emerald-400 font-bold" : ""}`}>
                                                                        {match.participant1_name || (match.participant1_id ? "TBD" : "BYE")}
                                                                    </span>
                                                                    <span className="text-xs text-muted-foreground font-bold">vs</span>
                                                                    <span className={`font-medium text-sm truncate ${match.winner_id === match.participant2_id ? "text-emerald-400 font-bold" : ""}`}>
                                                                        {match.participant2_name || (match.participant2_id ? "TBD" : "BYE")}
                                                                    </span>
                                                                </div>
                                                                {match.status === "completed" && (
                                                                    <span className="text-xs font-bold text-muted-foreground">{match.score1}–{match.score2}</span>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-2 ml-4">
                                                                <span className={`text-[10px] font-bold uppercase ${matchStatusColors[match.status]}`}>
                                                                    {match.status}
                                                                </span>
                                                                {match.status === "pending" && match.participant1_id && match.participant2_id && (
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => {
                                                                            setReportingMatch(match);
                                                                            setScore1(0);
                                                                            setScore2(0);
                                                                            setWinnerId("");
                                                                        }}
                                                                        className="h-7 text-[10px] gap-1"
                                                                    >
                                                                        <Trophy size={10} /> Report
                                                                    </Button>
                                                                )}
                                                                {match.status === "pending" && tournament.format === 'battle-royale' && (
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => {
                                                                            setReportingLobbyMatch(match);
                                                                            fetchLobbyParticipants(match.id);
                                                                        }}
                                                                        className="h-7 text-[10px] gap-1"
                                                                    >
                                                                        <Users size={10} /> Lobby
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                        )}
                    </div>

                    {/* RIGHT: Sidebar */}
                    <div className="space-y-4">
                        {/* Participants */}
                        <div className="glass rounded-xl border border-white/[0.06] p-5">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-sm flex items-center gap-2">
                                    <Users size={14} className="text-primary" />
                                    Participants ({participants.length})
                                </h3>
                                {(tournament.status === "draft" || tournament.status === "registration") && (
                                    <button
                                        onClick={() => setShowAddPanel(!showAddPanel)}
                                        className="text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-1"
                                    >
                                        <UserPlus size={12} /> Add
                                    </button>
                                )}
                            </div>

                            {/* Add Panel */}
                            {showAddPanel && (
                                <div className="mb-4 p-3 rounded-lg bg-primary/5 border border-primary/10">
                                    <p className="text-xs text-muted-foreground mb-2">Select teams to add:</p>
                                    <div className="space-y-1 max-h-40 overflow-y-auto mb-3">
                                        {availableTeams.length === 0 ? (
                                            <p className="text-xs text-muted-foreground text-center py-2">No available teams</p>
                                        ) : availableTeams.map((team: any) => (
                                            <label key={team.id} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-white/5 cursor-pointer text-sm">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedTeams.includes(team.id)}
                                                    onChange={e => {
                                                        if (e.target.checked) setSelectedTeams([...selectedTeams, team.id]);
                                                        else setSelectedTeams(selectedTeams.filter(id => id !== team.id));
                                                    }}
                                                    className="accent-primary"
                                                />
                                                {team.name}
                                            </label>
                                        ))}
                                    </div>
                                    <Button size="sm" onClick={handleAddParticipants} disabled={selectedTeams.length === 0} className="w-full text-xs">
                                        Add {selectedTeams.length} Team{selectedTeams.length !== 1 ? "s" : ""}
                                    </Button>
                                </div>
                            )}

                            {/* Participant List */}
                            <div className="space-y-1.5">
                                {participants.length === 0 ? (
                                    <p className="text-xs text-muted-foreground text-center py-4">No participants yet</p>
                                ) : participants.map((p: any, i: number) => (
                                    <div key={p.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/[0.03] transition-colors">
                                        <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                                            {p.seed || i + 1}
                                        </span>
                                        <span className="text-sm font-medium flex-1 truncate">{p.participant_name}</span>
                                        {p.status === "eliminated" && (
                                            <span className="text-[10px] text-destructive font-bold">OUT</span>
                                        )}
                                        {p.status === "active" && (
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Round Robin Standings */}
                        {tournament.format === "round-robin" && standings.length > 0 && (
                            <div className="glass rounded-xl border border-white/[0.06] p-5">
                                <h3 className="font-bold text-sm flex items-center gap-2 mb-4">
                                    <Crown size={14} className="text-accent" />
                                    Standings
                                </h3>
                                <div className="space-y-1">
                                    {standings.map((s: any, i: number) => (
                                        <div key={s.participant_id} className="flex items-center gap-2 px-2 py-1.5 text-sm">
                                            <span className={`w-5 font-bold text-xs ${i === 0 ? "text-accent" : "text-muted-foreground"}`}>{i + 1}</span>
                                            <span className="flex-1 truncate font-medium">{s.name}</span>
                                            <span className="text-xs text-muted-foreground">{s.played}P</span>
                                            {tournament.format === 'battle-royale' ? (
                                                <>
                                                    <span className="text-xs text-emerald-400 font-bold">{s.avgRank || "N/A"}R</span>
                                                    <span className="text-xs text-primary font-bold">{s.totalKills || 0}K</span>
                                                </>
                                            ) : (
                                                <>
                                                    <span className="text-xs text-emerald-400 font-bold">{s.wins}W</span>
                                                    <span className="text-xs text-destructive font-bold">{s.losses}L</span>
                                                    <span className="text-xs font-bold text-primary">{s.points}pts</span>
                                                </>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Report Lobby Modal (Battle Royale) */}
                {reportingLobbyMatch && (
                    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setReportingLobbyMatch(null)}>
                        <div className="glass rounded-2xl border border-white/[0.06] p-6 w-full max-w-2xl" onClick={e => e.stopPropagation()}>
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <Users size={18} className="text-primary" /> Report Lobby Result
                            </h3>
                            <div className="space-y-3 max-h-[60vh] overflow-y-auto mb-6 pr-2">
                                <div className="grid grid-cols-12 gap-2 text-[10px] font-bold text-muted-foreground uppercase px-2">
                                    <div className="col-span-6">Participant</div>
                                    <div className="col-span-2 text-center">Rank</div>
                                    <div className="col-span-2 text-center">Score</div>
                                    <div className="col-span-2 text-center">Kills</div>
                                </div>
                                {lobbyParticipants.map((lp, idx) => (
                                    <div key={lp.participant_id} className="grid grid-cols-12 gap-2 items-center bg-white/[0.02] p-2 rounded-lg border border-white/[0.04]">
                                        <div className="col-span-6 text-sm font-medium truncate">{lp.participant_name}</div>
                                        <div className="col-span-2">
                                            <input
                                                type="number"
                                                min={1}
                                                value={lobbyResults[idx]?.rank}
                                                onChange={e => {
                                                    const next = [...lobbyResults];
                                                    next[idx].rank = parseInt(e.target.value) || 1;
                                                    setLobbyResults(next);
                                                }}
                                                className="w-full bg-secondary/30 border border-border/50 rounded px-2 py-1 text-center text-xs"
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <input
                                                type="number"
                                                min={0}
                                                value={lobbyResults[idx]?.score}
                                                onChange={e => {
                                                    const next = [...lobbyResults];
                                                    next[idx].score = parseInt(e.target.value) || 0;
                                                    setLobbyResults(next);
                                                }}
                                                className="w-full bg-secondary/30 border border-border/50 rounded px-2 py-1 text-center text-xs"
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <input
                                                type="number"
                                                min={0}
                                                value={lobbyResults[idx]?.kills}
                                                onChange={e => {
                                                    const next = [...lobbyResults];
                                                    next[idx].kills = parseInt(e.target.value) || 0;
                                                    setLobbyResults(next);
                                                }}
                                                className="w-full bg-secondary/30 border border-border/50 rounded px-2 py-1 text-center text-xs"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-3">
                                <Button variant="ghost" onClick={() => setReportingLobbyMatch(null)} className="flex-1">Cancel</Button>
                                <Button onClick={handleReportLobbyResult} className="flex-1 btn-glow">Submit Results</Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Report Match Modal */}
                {reportingMatch && (
                    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setReportingMatch(null)}>
                        <div className="glass rounded-2xl border border-white/[0.06] p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <Trophy size={18} className="text-primary" /> Report Match Result
                            </h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                Match #{reportingMatch.match_number} — Round {reportingMatch.round_number}
                            </p>

                            {/* Score */}
                            <div className="flex items-center gap-4 mb-6">
                                <div className="flex-1 text-center">
                                    <p className="font-bold text-sm mb-2 truncate">{reportingMatch.participant1_name}</p>
                                    <input
                                        type="number"
                                        min={0}
                                        value={score1}
                                        onChange={e => setScore1(parseInt(e.target.value) || 0)}
                                        className="w-20 mx-auto bg-secondary/50 border border-border/50 rounded-lg px-3 py-2 text-center text-lg font-black focus:outline-none focus:border-primary/50"
                                    />
                                </div>
                                <span className="text-muted-foreground font-bold text-lg">vs</span>
                                <div className="flex-1 text-center">
                                    <p className="font-bold text-sm mb-2 truncate">{reportingMatch.participant2_name}</p>
                                    <input
                                        type="number"
                                        min={0}
                                        value={score2}
                                        onChange={e => setScore2(parseInt(e.target.value) || 0)}
                                        className="w-20 mx-auto bg-secondary/50 border border-border/50 rounded-lg px-3 py-2 text-center text-lg font-black focus:outline-none focus:border-primary/50"
                                    />
                                </div>
                            </div>

                            {/* Winner Selection */}
                            <div className="mb-6">
                                <label className="text-sm font-semibold mb-2 block">Winner</label>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setWinnerId(reportingMatch.participant1_id)}
                                        className={`flex-1 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all ${winnerId === reportingMatch.participant1_id
                                            ? "border-emerald-400 bg-emerald-500/10 text-emerald-400"
                                            : "border-border/50 bg-secondary/30 text-muted-foreground hover:border-emerald-400/30"
                                            }`}
                                    >
                                        {reportingMatch.participant1_name}
                                    </button>
                                    <button
                                        onClick={() => setWinnerId(reportingMatch.participant2_id)}
                                        className={`flex-1 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all ${winnerId === reportingMatch.participant2_id
                                            ? "border-emerald-400 bg-emerald-500/10 text-emerald-400"
                                            : "border-border/50 bg-secondary/30 text-muted-foreground hover:border-emerald-400/30"
                                            }`}
                                    >
                                        {reportingMatch.participant2_name}
                                    </button>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <Button variant="ghost" onClick={() => setReportingMatch(null)} className="flex-1">Cancel</Button>
                                <Button onClick={handleReportResult} disabled={!winnerId} className="flex-1 btn-glow">
                                    Submit Result
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
