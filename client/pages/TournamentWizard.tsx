import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import {
    Trophy, ArrowLeft, ArrowRight, Check, Swords, LayoutGrid,
    Calendar, Users, Target, RefreshCw, Zap, Crown,
} from "lucide-react";

const FORMATS = [
    { id: "single-elimination", label: "Single Elimination", icon: "🏆", desc: "Lose once, you're out. Fast, dramatic.", available: true },
    { id: "round-robin", label: "Round Robin", icon: "🔄", desc: "Everyone plays everyone. Most fair.", available: true },
    { id: "double-elimination", label: "Double Elimination", icon: "🔁", desc: "Two brackets. Lose twice to be out.", available: true },
    { id: "swiss", label: "Swiss System", icon: "🇨🇭", desc: "Pair by record. Fixed rounds.", available: true },
    { id: "battle-royale", label: "Battle Royale", icon: "💀", desc: "Multi-lobby. Placement + kills.", available: true },
    { id: "group-knockout", label: "Group + Knockout", icon: "⚡", desc: "Groups then single elim.", available: true },
] as const;

const GAME_MODES = [
    { id: "battle-royale", label: "Battle Royale" },
    { id: "mp-tdm", label: "MP — Team Deathmatch" },
    { id: "mp-snd", label: "MP — Search & Destroy" },
    { id: "mp-dom", label: "MP — Domination" },
];

export function TournamentWizard() {
    const { token } = useAuth();
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [creating, setCreating] = useState(false);

    // Step 1: Basic Info
    const [name, setName] = useState("");
    const [gameMode, setGameMode] = useState("battle-royale");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    // Step 2: Format
    const [format, setFormat] = useState("single-elimination");

    // Step 3: Config
    const [participantType, setParticipantType] = useState<"team" | "player">("team");
    const [maxParticipants, setMaxParticipants] = useState(16);
    const [bestOf, setBestOf] = useState(1);
    const [seedingMethod, setSeedingMethod] = useState("random");
    const [maxParticipantsPerLobby, setMaxParticipantsPerLobby] = useState(20);
    const [swissRounds, setSwissRounds] = useState(5);
    const [playersPerGroup, setPlayersPerGroup] = useState(4);
    const [doubleRoundRobin, setDoubleRoundRobin] = useState(false);
    const [setSize, setSetSize] = useState(100);
    const [qualificationCount, setQualificationCount] = useState(2);
    const [groupLabels, setGroupLabels] = useState<string[]>([]);

    // Step 4: Phases
    const [phases, setPhases] = useState([
        { label: "Registration & Team Formation", route: "/leadership" },
        { label: "Qualification Round", route: "/phase-1" },
        { label: "Main Tournament", route: "/phase-2" },
        { label: "Finals", route: "/phase-3" },
    ]);

    // Available teams/players for display
    const [availableTeams, setAvailableTeams] = useState<any[]>([]);

    const fetchTeams = useCallback(async () => {
        if (!token) return;
        try {
            const res = await fetch("/api/teams", {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success) setAvailableTeams(data.teams || []);
        } catch { /* silent */ }
    }, [token]);

    useEffect(() => {
        fetchTeams();
    }, [fetchTeams]);

    const canProceed = () => {
        switch (step) {
            case 1: return name.trim().length >= 2;
            case 2: return !!format;
            case 3: return maxParticipants >= 2;
            case 4: return true;
            default: return false;
        }
    };

    const handleCreate = async () => {
        if (creating) return;
        setCreating(true);

        try {
            const body = {
                name: name.trim(),
                gameMode,
                format,
                participantType,
                maxParticipants,
                startDate: startDate || undefined,
                endDate: endDate || undefined,
                formatConfig: {
                    bestOf,
                    seedingMethod,
                    maxParticipantsPerLobby,
                    swissRounds,
                    playersPerGroup,
                    doubleRoundRobin,
                    setSize,
                    qualificationCount,
                    groupLabels
                },
                phases: phases.filter(p => p.label.trim()),
            };

            const res = await fetch("/api/tournaments", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(body),
            });

            const data = await res.json();
            if (data.success) {
                navigate(`/admin/tournaments/${data.tournament.id}`);
            } else {
                alert(data.message || "Failed to create tournament");
            }
        } catch (err) {
            console.error("Create tournament error:", err);
            alert("Failed to create tournament");
        } finally {
            setCreating(false);
        }
    };

    const addPhase = () => {
        setPhases([...phases, { label: "", route: "" }]);
    };

    const removePhase = (index: number) => {
        setPhases(phases.filter((_, i) => i !== index));
    };

    const updatePhase = (index: number, field: "label" | "route", value: string) => {
        const updated = [...phases];
        updated[index] = { ...updated[index], [field]: value };
        setPhases(updated);
    };

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Header />
            <main className="container mx-auto px-4 py-8 max-w-3xl">
                {/* Back */}
                <button
                    onClick={() => navigate("/admin/tournaments")}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
                >
                    <ArrowLeft size={16} /> Back to Tournaments
                </button>

                {/* Progress Steps */}
                <div className="flex items-center justify-center gap-2 mb-8">
                    {["Info", "Format", "Config", "Review"].map((label, i) => (
                        <div key={label} className="flex items-center gap-2">
                            <button
                                onClick={() => i + 1 < step && setStep(i + 1)}
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${i + 1 === step
                                    ? "bg-primary text-primary-foreground scale-110"
                                    : i + 1 < step
                                        ? "bg-accent text-accent-foreground"
                                        : "bg-muted text-muted-foreground"
                                    }`}
                            >
                                {i + 1 < step ? <Check size={14} /> : i + 1}
                            </button>
                            <span className={`text-xs font-medium hidden sm:block ${i + 1 === step ? "text-primary" : "text-muted-foreground"}`}>{label}</span>
                            {i < 3 && <div className={`w-8 h-px ${i + 1 < step ? "bg-accent" : "bg-border"}`} />}
                        </div>
                    ))}
                </div>

                {/* Card */}
                <div className="glass rounded-2xl border border-white/[0.06] p-8">
                    {/* Step 1: Basic Info */}
                    {step === 1 && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 mb-2">
                                <Trophy size={20} className="text-primary" />
                                <h2 className="text-xl font-bold">Basic Information</h2>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-2">Tournament Name *</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder="AetherNEST Championship Season 1"
                                    className="w-full bg-secondary/50 border border-border/50 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-2">Game Mode</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {GAME_MODES.map(mode => (
                                        <button
                                            key={mode.id}
                                            onClick={() => setGameMode(mode.id)}
                                            className={`px-4 py-3 rounded-lg border text-sm font-medium transition-all ${gameMode === mode.id
                                                ? "border-primary bg-primary/10 text-primary"
                                                : "border-border/50 bg-secondary/30 text-muted-foreground hover:border-primary/30"
                                                }`}
                                        >
                                            {mode.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold mb-2">Start Date</label>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={e => setStartDate(e.target.value)}
                                        className="w-full bg-secondary/50 border border-border/50 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary/50 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-2">End Date</label>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={e => setEndDate(e.target.value)}
                                        className="w-full bg-secondary/50 border border-border/50 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary/50 transition-all"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Format Selection */}
                    {step === 2 && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 mb-2">
                                <LayoutGrid size={20} className="text-primary" />
                                <h2 className="text-xl font-bold">Tournament Format</h2>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {FORMATS.map(f => (
                                    <button
                                        key={f.id}
                                        onClick={() => f.available && setFormat(f.id)}
                                        disabled={!f.available}
                                        className={`relative p-4 rounded-xl border text-left transition-all ${format === f.id
                                            ? "border-primary bg-primary/10 ring-1 ring-primary/20"
                                            : f.available
                                                ? "border-border/50 bg-secondary/30 hover:border-primary/30"
                                                : "border-border/30 bg-secondary/10 opacity-50 cursor-not-allowed"
                                            }`}
                                    >
                                        <div className="text-2xl mb-2">{f.icon}</div>
                                        <h3 className="font-bold text-sm mb-1">{f.label}</h3>
                                        <p className="text-[11px] text-muted-foreground leading-tight">{f.desc}</p>
                                        {!f.available && (
                                            <span className="absolute top-2 right-2 text-[9px] font-bold text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
                                                SOON
                                            </span>
                                        )}
                                        {format === f.id && (
                                            <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                                                <Check size={12} className="text-primary-foreground" />
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 3: Configuration */}
                    {step === 3 && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 mb-2">
                                <Target size={20} className="text-primary" />
                                <h2 className="text-xl font-bold">Configuration</h2>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-2">Participant Type</label>
                                <div className="flex gap-3">
                                    {(["team", "player"] as const).map(type => (
                                        <button
                                            key={type}
                                            onClick={() => setParticipantType(type)}
                                            className={`flex-1 px-4 py-3 rounded-lg border text-sm font-medium capitalize transition-all ${participantType === type
                                                ? "border-primary bg-primary/10 text-primary"
                                                : "border-border/50 bg-secondary/30 text-muted-foreground hover:border-primary/30"
                                                }`}
                                        >
                                            {type === "team" ? "Teams" : "Individual Players"}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-2">
                                    Max Participants
                                    <span className="text-muted-foreground font-normal ml-1">
                                        ({availableTeams.length} teams available)
                                    </span>
                                </label>
                                <input
                                    type="number"
                                    value={maxParticipants}
                                    onChange={e => setMaxParticipants(parseInt(e.target.value) || 0)}
                                    min={2}
                                    className="w-full bg-secondary/50 border border-border/50 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary/50 transition-all"
                                />
                            </div>



                            {format === "double-elimination" && (
                                <div>
                                    <label className="block text-sm font-semibold mb-2">Best Of (WB/LB)</label>
                                    <div className="flex gap-3">
                                        {[1, 3, 5].map(n => (
                                            <button
                                                key={n}
                                                onClick={() => setBestOf(n)}
                                                className={`flex-1 px-4 py-3 rounded-lg border text-sm font-bold transition-all ${bestOf === n
                                                    ? "border-primary bg-primary/10 text-primary"
                                                    : "border-border/50 bg-secondary/30 text-muted-foreground hover:border-primary/30"
                                                    }`}
                                            >
                                                BO{n}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {format === "round-robin" && (
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="doubleRR"
                                        checked={doubleRoundRobin}
                                        onChange={e => setDoubleRoundRobin(e.target.checked)}
                                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                    />
                                    <label htmlFor="doubleRR" className="text-sm font-semibold">Double Round Robin (Home/Away)</label>
                                </div>
                            )}

                            {format === "swiss" && (
                                <div>
                                    <label className="block text-sm font-semibold mb-2">Number of Rounds</label>
                                    <input
                                        type="number"
                                        value={swissRounds}
                                        onChange={e => setSwissRounds(parseInt(e.target.value))}
                                        className="w-full bg-secondary/50 border border-border/50 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary/50 transition-all"
                                    />
                                </div>
                            )}

                            {format === "battle-royale" && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold mb-2">Max per Lobby</label>
                                            <input
                                                type="number"
                                                value={maxParticipantsPerLobby}
                                                onChange={e => setMaxParticipantsPerLobby(parseInt(e.target.value) || 0)}
                                                min={2}
                                                className="w-full bg-secondary/50 border border-border/50 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary/50 transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold mb-2">Set Size (Optional)</label>
                                            <input
                                                type="number"
                                                value={setSize}
                                                onChange={e => setSetSize(parseInt(e.target.value) || 0)}
                                                placeholder="e.g. 100"
                                                className="w-full bg-secondary/50 border border-border/50 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary/50 transition-all"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold mb-2">Custom Set/Lobby Titles (Optional, comma separated)</label>
                                        <input
                                            type="text"
                                            placeholder="Alpha Set, Beta Set, Gamma Set..."
                                            value={groupLabels.join(", ")}
                                            onChange={e => setGroupLabels(e.target.value.split(",").map(s => s.trim()))}
                                            className="w-full bg-secondary/50 border border-border/50 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary/50 transition-all"
                                        />
                                    </div>
                                </div>
                            )}

                            {format === "group-knockout" && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold mb-2">Participants per Group</label>
                                            <input
                                                type="number"
                                                value={playersPerGroup}
                                                onChange={e => setPlayersPerGroup(parseInt(e.target.value) || 0)}
                                                min={2}
                                                className="w-full bg-secondary/50 border border-border/50 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary/50 transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold mb-2">Top N Qualify (per group)</label>
                                            <input
                                                type="number"
                                                value={qualificationCount}
                                                onChange={e => setQualificationCount(parseInt(e.target.value) || 0)}
                                                min={1}
                                                className="w-full bg-secondary/50 border border-border/50 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary/50 transition-all"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold mb-2">Conference/Group Names (Optional, e.g. East, West)</label>
                                        <input
                                            type="text"
                                            placeholder="East Conference, West Conference"
                                            value={groupLabels.join(", ")}
                                            onChange={e => setGroupLabels(e.target.value.split(",").map(s => s.trim()))}
                                            className="w-full bg-secondary/50 border border-border/50 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary/50 transition-all"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Auto-calculated stats */}
                            <div className="glass rounded-xl p-4 border border-primary/10 bg-primary/5">
                                <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-3">Auto-calculated</h4>
                                <div className="grid grid-cols-3 gap-4 text-center">
                                    {format === "single-elimination" && (
                                        <>
                                            <div>
                                                <p className="text-lg font-black">{Math.ceil(Math.log2(maxParticipants))}</p>
                                                <p className="text-[10px] text-muted-foreground uppercase">Rounds</p>
                                            </div>
                                            <div>
                                                <p className="text-lg font-black">{maxParticipants - 1}</p>
                                                <p className="text-[10px] text-muted-foreground uppercase">Matches</p>
                                            </div>
                                            <div>
                                                <p className="text-lg font-black">{Math.max(0, (function () { let p = 1; while (p < maxParticipants) p *= 2; return p; })() - maxParticipants)}</p>
                                                <p className="text-[10px] text-muted-foreground uppercase">Byes</p>
                                            </div>
                                        </>
                                    )}
                                    {format === "double-elimination" && (
                                        <>
                                            <div>
                                                <p className="text-lg font-black">{Math.ceil(Math.log2(maxParticipants)) * 2}</p>
                                                <p className="text-[10px] text-muted-foreground uppercase">Total Rounds</p>
                                            </div>
                                            <div>
                                                <p className="text-lg font-black">{(maxParticipants - 1) * 2}</p>
                                                <p className="text-[10px] text-muted-foreground uppercase">Matches</p>
                                            </div>
                                            <div>
                                                <p className="text-lg font-black">2</p>
                                                <p className="text-[10px] text-muted-foreground uppercase">Brackets</p>
                                            </div>
                                        </>
                                    )}
                                    {format === "round-robin" && (
                                        <>
                                            <div>
                                                <p className="text-lg font-black">{doubleRoundRobin ? (maxParticipants % 2 === 0 ? maxParticipants - 1 : maxParticipants) * 2 : (maxParticipants % 2 === 0 ? maxParticipants - 1 : maxParticipants)}</p>
                                                <p className="text-[10px] text-muted-foreground uppercase">Rounds</p>
                                            </div>
                                            <div>
                                                <p className="text-lg font-black">{doubleRoundRobin ? maxParticipants * (maxParticipants - 1) : (maxParticipants * (maxParticipants - 1)) / 2}</p>
                                                <p className="text-[10px] text-muted-foreground uppercase">Matches</p>
                                            </div>
                                            <div>
                                                <p className="text-lg font-black">{Math.floor(maxParticipants / 2)}</p>
                                                <p className="text-[10px] text-muted-foreground uppercase">Per Round</p>
                                            </div>
                                        </>
                                    )}
                                    {format === "swiss" && (
                                        <>
                                            <div>
                                                <p className="text-lg font-black">{swissRounds}</p>
                                                <p className="text-[10px] text-muted-foreground uppercase">Rounds</p>
                                            </div>
                                            <div>
                                                <p className="text-lg font-black">{Math.floor(maxParticipants / 2) * swissRounds}</p>
                                                <p className="text-[10px] text-muted-foreground uppercase">Matches</p>
                                            </div>
                                            <div>
                                                <p className="text-lg font-black">{Math.floor(maxParticipants / 2)}</p>
                                                <p className="text-[10px] text-muted-foreground uppercase">Per Round</p>
                                            </div>
                                        </>
                                    )}
                                    {format === "battle-royale" && (
                                        <>
                                            <div>
                                                <p className="text-lg font-black">{Math.ceil(maxParticipants / maxParticipantsPerLobby)}</p>
                                                <p className="text-[10px] text-muted-foreground uppercase">Lobbies</p>
                                            </div>
                                            <div>
                                                <p className="text-lg font-black">{maxParticipants}</p>
                                                <p className="text-[10px] text-muted-foreground uppercase">Players</p>
                                            </div>
                                            <div>
                                                <p className="text-lg font-black">{maxParticipantsPerLobby}</p>
                                                <p className="text-[10px] text-muted-foreground uppercase">Max/Lobby</p>
                                            </div>
                                        </>
                                    )}
                                    {format === "group-knockout" && (
                                        <>
                                            <div>
                                                <p className="text-lg font-black">{Math.ceil(maxParticipants / playersPerGroup)}</p>
                                                <p className="text-[10px] text-muted-foreground uppercase">Groups</p>
                                            </div>
                                            <div>
                                                <p className="text-lg font-black">2</p>
                                                <p className="text-[10px] text-muted-foreground uppercase">Stages</p>
                                            </div>
                                            <div>
                                                <p className="text-lg font-black">{playersPerGroup}</p>
                                                <p className="text-[10px] text-muted-foreground uppercase">Per Group</p>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Review & Phases */}
                    {step === 4 && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 mb-2">
                                <Crown size={20} className="text-primary" />
                                <h2 className="text-xl font-bold">Review & Create</h2>
                            </div>

                            {/* Summary */}
                            <div className="glass rounded-xl p-5 border border-white/[0.06] space-y-3">
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div>
                                        <span className="text-muted-foreground">Name:</span>
                                        <span className="ml-2 font-bold">{name}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Format:</span>
                                        <span className="ml-2 font-bold">{FORMATS.find(f => f.id === format)?.label}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Game Mode:</span>
                                        <span className="ml-2 font-bold">{GAME_MODES.find(m => m.id === gameMode)?.label}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Participants:</span>
                                        <span className="ml-2 font-bold">{maxParticipants} {participantType}s</span>
                                    </div>
                                    {format === "single-elimination" && (
                                        <>
                                            <div>
                                                <span className="text-muted-foreground">Best Of:</span>
                                                <span className="ml-2 font-bold">{bestOf}</span>
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground">Seeding:</span>
                                                <span className="ml-2 font-bold capitalize">{seedingMethod}</span>
                                            </div>
                                        </>
                                    )}
                                    {startDate && (
                                        <div>
                                            <span className="text-muted-foreground">Start:</span>
                                            <span className="ml-2 font-bold">{startDate}</span>
                                        </div>
                                    )}
                                    {endDate && (
                                        <div>
                                            <span className="text-muted-foreground">End:</span>
                                            <span className="ml-2 font-bold">{endDate}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Phases */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <label className="text-sm font-semibold">Tournament Phases</label>
                                    <button onClick={addPhase} className="text-xs text-primary hover:text-primary/80 font-medium">
                                        + Add Phase
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {phases.map((phase, i) => (
                                        <div key={i} className="flex items-center gap-2">
                                            <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                                                {i + 1}
                                            </div>
                                            <input
                                                type="text"
                                                value={phase.label}
                                                onChange={e => updatePhase(i, "label", e.target.value)}
                                                placeholder="Phase name"
                                                className="flex-1 bg-secondary/50 border border-border/50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary/50 transition-all"
                                            />
                                            <input
                                                type="text"
                                                value={phase.route}
                                                onChange={e => updatePhase(i, "route", e.target.value)}
                                                placeholder="/route"
                                                className="w-32 bg-secondary/50 border border-border/50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary/50 transition-all font-mono"
                                            />
                                            {phases.length > 1 && (
                                                <button onClick={() => removePhase(i)} className="text-muted-foreground hover:text-destructive text-sm p-1">✕</button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/[0.06]">
                        <Button
                            variant="ghost"
                            onClick={() => step > 1 && setStep(step - 1)}
                            disabled={step === 1}
                            className="gap-2"
                        >
                            <ArrowLeft size={16} /> Back
                        </Button>

                        {step < 4 ? (
                            <Button
                                onClick={() => setStep(step + 1)}
                                disabled={!canProceed()}
                                className="btn-glow gap-2"
                            >
                                Next <ArrowRight size={16} />
                            </Button>
                        ) : (
                            <Button
                                onClick={handleCreate}
                                disabled={creating || !canProceed()}
                                className="btn-glow gap-2"
                            >
                                {creating ? (
                                    <>Creating...</>
                                ) : (
                                    <>
                                        <Zap size={16} /> Create Tournament
                                    </>
                                )}
                            </Button>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
