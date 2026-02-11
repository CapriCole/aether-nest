import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Layout } from "@/components/Layout";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Shield, UserPlus, X, Crown, Users, Swords, Trophy } from "lucide-react";

interface User {
    id: string;
    username: string;
    email: string;
    role: string;
    must_change_password: number;
    codm_ign: string | null;
    codm_uid: string | null;
    codm_rank: string | null;
    verification_status: string;
    verification_notes: string | null;
    tournament_status: string;
    is_active: number;
    created_at: string;
}

export function AdminUsers() {
    const { token } = useAuth();
    const { toast } = useToast();
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [filter, setFilter] = useState<string>("all");

    const [newUsername, setNewUsername] = useState("");
    const [newEmail, setNewEmail] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [newRole, setNewRole] = useState("PLAYER");
    const [isCreating, setIsCreating] = useState(false);

    const fetchUsers = async () => {
        try {
            const res = await fetch("/api/auth/admin/users", {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success) {
                setUsers(data.users);
            }
        } catch (err) {
            toast({ title: "Error", description: "Failed to load users", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsCreating(true);
        try {
            const res = await fetch("/api/auth/admin/create-user", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    username: newUsername,
                    email: newEmail || undefined,
                    password: newPassword,
                    role: newRole,
                }),
            });
            const data = await res.json();
            if (data.success) {
                toast({ title: "User Created", description: `${newUsername} has been created as ${newRole}` });
                setNewUsername("");
                setNewEmail("");
                setNewPassword("");
                setNewRole("PLAYER");
                setShowCreateForm(false);
                fetchUsers();
            } else {
                toast({ title: "Error", description: data.message, variant: "destructive" });
            }
        } catch (err) {
            toast({ title: "Error", description: "Failed to create user", variant: "destructive" });
        } finally {
            setIsCreating(false);
        }
    };

    const handleVerify = async (userId: string, action: "approve" | "reject") => {
        try {
            const res = await fetch(`/api/auth/admin/verify-player/${userId}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ action }),
            });
            const data = await res.json();
            if (data.success) {
                toast({ title: "Success", description: data.message });
                fetchUsers();
            }
        } catch (err) {
            toast({ title: "Error", description: "Failed to verify player", variant: "destructive" });
        }
    };

    const handleRoleChange = async (userId: string, role: string) => {
        try {
            const res = await fetch(`/api/auth/admin/users/${userId}/role`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ role }),
            });
            const data = await res.json();
            if (data.success) {
                toast({ title: "Role Updated", description: `User role changed to ${role}` });
                fetchUsers();
            }
        } catch (err) {
            toast({ title: "Error", description: "Failed to update role", variant: "destructive" });
        }
    };

    const handleToggleActive = async (userId: string, currentlyActive: boolean) => {
        try {
            const res = await fetch(`/api/auth/admin/users/${userId}/status`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ isActive: !currentlyActive }),
            });
            const data = await res.json();
            if (data.success) {
                toast({ title: "Success", description: data.message });
                fetchUsers();
            }
        } catch (err) {
            toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
        }
    };

    const handleTournamentStatusChange = async (userId: string, tournamentStatus: string) => {
        try {
            const res = await fetch(`/api/auth/admin/users/${userId}/tournament-status`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ tournamentStatus }),
            });
            const data = await res.json();
            if (data.success) {
                toast({ title: "Tournament Status Updated", description: data.message });
                fetchUsers();
            }
        } catch (err) {
            toast({ title: "Error", description: "Failed to update tournament status", variant: "destructive" });
        }
    };

    const filteredUsers = users.filter((u) => {
        if (filter === "all") return true;
        if (filter === "pending") return u.verification_status === "pending";
        if (filter === "verified") return u.verification_status === "verified";
        if (filter === "admins") return u.role === "ADMIN";
        if (filter === "moderators") return u.role === "MODERATOR";
        if (filter === "inactive") return !u.is_active;
        if (filter === "leaders") return u.tournament_status === "team_leader";
        if (filter === "members") return u.tournament_status === "team_member";
        return true;
    });

    const pendingCount = users.filter((u) => u.verification_status === "pending").length;
    const leaderCount = users.filter((u) => u.tournament_status === "team_leader").length;

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            verified: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
            pending: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
            rejected: "bg-red-500/15 text-red-400 border-red-500/20",
            unverified: "bg-zinc-500/15 text-zinc-400 border-zinc-500/20",
        };
        return (
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${styles[status] || styles.unverified}`}>
                {status}
            </span>
        );
    };

    const getTournamentBadge = (status: string) => {
        const config: Record<string, { style: string; icon: React.ReactNode; label: string }> = {
            none: { style: "bg-zinc-500/10 text-zinc-500 border-zinc-500/15", icon: null, label: "—" },
            qualified: { style: "bg-blue-500/15 text-blue-400 border-blue-500/20", icon: <Trophy size={10} />, label: "Qualified" },
            team_leader: { style: "bg-amber-500/15 text-amber-400 border-amber-500/20", icon: <Crown size={10} />, label: "Leader" },
            team_member: { style: "bg-purple-500/15 text-purple-400 border-purple-500/20", icon: <Users size={10} />, label: "Member" },
            eliminated: { style: "bg-red-500/15 text-red-400 border-red-500/20", icon: <Swords size={10} />, label: "Eliminated" },
        };
        const c = config[status] || config.none;
        if (status === "none") return <span className="text-xs text-zinc-600">—</span>;
        return (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${c.style}`}>
                {c.icon} {c.label}
            </span>
        );
    };

    if (isLoading) {
        return (
            <Layout>
                <div className="flex items-center justify-center min-h-[50vh]">
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-8 h-8 skeleton-shimmer rounded-full"></div>
                        <p className="text-sm text-muted-foreground">Loading users...</p>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="max-w-7xl mx-auto px-4 py-10 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between animate-fade-in-up">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Shield size={18} className="text-primary" />
                            <h1 className="text-2xl font-black tracking-tight">User Management</h1>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            <span className="text-foreground font-semibold">{users.length}</span> total users ·{" "}
                            {pendingCount > 0 && (
                                <span className="text-yellow-400 font-semibold">{pendingCount} pending</span>
                            )}
                            {pendingCount === 0 && <span>0 pending</span>}
                            {" · "}
                            <span className="text-amber-400 font-semibold">{leaderCount} leaders</span>
                        </p>
                    </div>
                    <Button
                        onClick={() => setShowCreateForm(!showCreateForm)}
                        className={showCreateForm ? "bg-destructive/20 text-destructive hover:bg-destructive/30 border border-destructive/20" : "btn-glow"}
                    >
                        {showCreateForm ? (
                            <><X size={14} className="mr-1.5" /> Cancel</>
                        ) : (
                            <><UserPlus size={14} className="mr-1.5" /> Create User</>
                        )}
                    </Button>
                </div>

                {/* Create User Form */}
                {showCreateForm && (
                    <div className="glass-card rounded-xl p-6 animate-scale-in">
                        <h3 className="text-sm font-bold mb-1">Create New User</h3>
                        <p className="text-xs text-muted-foreground mb-4">
                            Account holder will be required to change password on first login.
                        </p>
                        <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label className="text-xs">Username</Label>
                                <Input
                                    value={newUsername}
                                    onChange={(e) => setNewUsername(e.target.value)}
                                    placeholder="username"
                                    required
                                    minLength={3}
                                    className="bg-white/[0.03] border-white/10 focus:border-primary/50 h-9"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Email (optional)</Label>
                                <Input
                                    type="email"
                                    value={newEmail}
                                    onChange={(e) => setNewEmail(e.target.value)}
                                    placeholder="email@example.com"
                                    className="bg-white/[0.03] border-white/10 focus:border-primary/50 h-9"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Password</Label>
                                <Input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Temporary password"
                                    required
                                    minLength={6}
                                    className="bg-white/[0.03] border-white/10 focus:border-primary/50 h-9"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Role</Label>
                                <Select value={newRole} onValueChange={setNewRole}>
                                    <SelectTrigger className="bg-white/[0.03] border-white/10 h-9">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="PLAYER">Player</SelectItem>
                                        <SelectItem value="MODERATOR">Moderator</SelectItem>
                                        <SelectItem value="COMMENTATOR">Commentator</SelectItem>
                                        <SelectItem value="ADMIN">Admin</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="md:col-span-2">
                                <Button type="submit" disabled={isCreating} className="btn-glow">
                                    {isCreating ? "Creating..." : "Create User"}
                                </Button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Filter Pills */}
                <div className="flex gap-2 flex-wrap animate-fade-in-up stagger-2">
                    {[
                        { key: "all", label: "All" },
                        { key: "pending", label: `Pending (${pendingCount})` },
                        { key: "verified", label: "Verified" },
                        { key: "leaders", label: `Leaders (${leaderCount})` },
                        { key: "members", label: "Members" },
                        { key: "admins", label: "Admins" },
                        { key: "moderators", label: "Moderators" },
                        { key: "inactive", label: "Inactive" },
                    ].map(({ key, label }) => (
                        <button
                            key={key}
                            onClick={() => setFilter(key)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${filter === key
                                    ? "bg-primary/20 text-primary border border-primary/30"
                                    : "glass text-muted-foreground hover:text-foreground hover:border-white/15"
                                }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                {/* Users Table */}
                <div className="glass-card rounded-xl overflow-hidden animate-fade-in-up stagger-3">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-white/[0.06]">
                                    <th className="p-4 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em]">User</th>
                                    <th className="p-4 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em]">COD Mobile</th>
                                    <th className="p-4 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em]">Role</th>
                                    <th className="p-4 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em]">Verification</th>
                                    <th className="p-4 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em]">Tournament</th>
                                    <th className="p-4 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em]">Joined</th>
                                    <th className="p-4 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em]">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.map((user) => (
                                    <tr
                                        key={user.id}
                                        className={`border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors ${!user.is_active ? "opacity-40" : ""}`}
                                    >
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="relative">
                                                    <div className="w-8 h-8 rounded-full glass flex items-center justify-center text-xs font-bold text-primary">
                                                        {user.username.charAt(0).toUpperCase()}
                                                    </div>
                                                    {user.tournament_status === "team_leader" && (
                                                        <Crown size={10} className="absolute -top-1 -right-1 text-amber-400" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-sm">{user.username}</p>
                                                    <p className="text-[11px] text-muted-foreground">{user.email || "—"}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            {user.codm_ign ? (
                                                <div>
                                                    <p className="font-mono text-xs font-semibold">{user.codm_ign}</p>
                                                    <p className="text-[10px] text-muted-foreground">UID: {user.codm_uid}</p>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-muted-foreground">—</span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <Select
                                                value={user.role}
                                                onValueChange={(role) => handleRoleChange(user.id, role)}
                                            >
                                                <SelectTrigger className="w-[120px] h-7 text-[11px] bg-white/[0.03] border-white/10">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="PLAYER">Player</SelectItem>
                                                    <SelectItem value="MODERATOR">Moderator</SelectItem>
                                                    <SelectItem value="COMMENTATOR">Commentator</SelectItem>
                                                    <SelectItem value="ADMIN">Admin</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </td>
                                        <td className="p-4">{getStatusBadge(user.verification_status)}</td>
                                        <td className="p-4">
                                            {user.role === "PLAYER" && user.verification_status === "verified" ? (
                                                <Select
                                                    value={user.tournament_status || "none"}
                                                    onValueChange={(ts) => handleTournamentStatusChange(user.id, ts)}
                                                >
                                                    <SelectTrigger className="w-[130px] h-7 text-[11px] bg-white/[0.03] border-white/10">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="none">None</SelectItem>
                                                        <SelectItem value="qualified">Qualified</SelectItem>
                                                        <SelectItem value="team_leader">Team Leader</SelectItem>
                                                        <SelectItem value="team_member">Team Member</SelectItem>
                                                        <SelectItem value="eliminated">Eliminated</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            ) : (
                                                getTournamentBadge(user.tournament_status || "none")
                                            )}
                                        </td>
                                        <td className="p-4 text-[11px] text-muted-foreground">
                                            {new Date(user.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex gap-1.5">
                                                {user.verification_status === "pending" && (
                                                    <>
                                                        <button
                                                            className="px-2 py-1 rounded-md text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
                                                            onClick={() => handleVerify(user.id, "approve")}
                                                        >
                                                            ✓ Verify
                                                        </button>
                                                        <button
                                                            className="px-2 py-1 rounded-md text-[10px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-colors"
                                                            onClick={() => handleVerify(user.id, "reject")}
                                                        >
                                                            ✗ Reject
                                                        </button>
                                                    </>
                                                )}
                                                <button
                                                    className="px-2 py-1 rounded-md text-[10px] font-medium text-muted-foreground bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] transition-colors"
                                                    onClick={() => handleToggleActive(user.id, !!user.is_active)}
                                                >
                                                    {user.is_active ? "Deactivate" : "Activate"}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredUsers.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="p-12 text-center text-muted-foreground text-sm">
                                            No users found for this filter.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
