import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Layout } from "@/components/Layout";
import { Link } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";

export function Register() {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [pendingApproval, setPendingApproval] = useState(false);

    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [codmIGN, setCodmIGN] = useState("");
    const [codmUID, setCodmUID] = useState("");

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, email, password, codmIGN, codmUID }),
            });
            const data = await res.json();

            if (data.success) {
                setPendingApproval(true);
            } else {
                toast({ title: "Registration Failed", description: data.message, variant: "destructive" });
            }
        } catch (err) {
            toast({ title: "Error", description: "Something went wrong", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    // ── Pending Approval Screen ──
    if (pendingApproval) {
        return (
            <Layout>
                <div className="min-h-[calc(100vh-140px)] aurora-bg flex items-center justify-center py-12 px-4 relative">
                    <div className="absolute top-[20%] left-[10%] w-64 h-64 bg-primary/8 rounded-full blur-[100px] pointer-events-none"></div>
                    <div className="absolute bottom-[20%] right-[10%] w-72 h-72 bg-accent/5 rounded-full blur-[80px] pointer-events-none"></div>

                    <div className="glass-strong rounded-2xl w-full max-w-md p-10 text-center relative z-10 animate-scale-in">
                        <div className="w-16 h-16 rounded-full bg-primary/15 border border-primary/20 flex items-center justify-center mx-auto mb-5 animate-fade-in-up">
                            <CheckCircle2 size={32} className="text-primary" />
                        </div>
                        <h1 className="text-2xl font-black text-gradient mb-2 animate-fade-in-up stagger-1">
                            Application Submitted!
                        </h1>
                        <p className="text-sm text-muted-foreground leading-relaxed mb-6 animate-fade-in-up stagger-2">
                            Your account has been created and is <span className="text-yellow-400 font-semibold">pending admin verification</span> of your COD Mobile identity. You'll be able to log in once an admin approves your account.
                        </p>
                        <div className="glass rounded-lg p-4 mb-6 text-left animate-fade-in-up stagger-3">
                            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-[0.15em] mb-2">Your Details</p>
                            <div className="space-y-1 text-xs">
                                <p><span className="text-muted-foreground">Username:</span> <span className="font-semibold">{username}</span></p>
                                <p><span className="text-muted-foreground">IGN:</span> <span className="font-mono font-semibold">{codmIGN}</span></p>
                                <p><span className="text-muted-foreground">UID:</span> <span className="font-mono font-semibold">{codmUID}</span></p>
                            </div>
                        </div>
                        <Link to="/login">
                            <Button variant="outline" className="border-white/10 hover:bg-white/5 animate-fade-in-up stagger-4">
                                Go to Login
                            </Button>
                        </Link>
                    </div>
                </div>
            </Layout>
        );
    }

    // ── Registration Form ──
    return (
        <Layout>
            <div className="min-h-[calc(100vh-140px)] aurora-bg flex items-center justify-center py-12 px-4 relative">
                {/* Ambient */}
                <div className="absolute top-[20%] left-[10%] w-64 h-64 bg-primary/8 rounded-full blur-[100px] pointer-events-none"></div>
                <div className="absolute bottom-[20%] right-[10%] w-72 h-72 bg-accent/5 rounded-full blur-[80px] pointer-events-none"></div>

                <div className="glass-strong rounded-2xl w-full max-w-lg relative z-10 animate-fade-in-up">
                    <form onSubmit={handleRegister}>
                        <div className="p-8 pb-0">
                            <h1 className="text-2xl font-black text-gradient mb-1">Join AetherNEST</h1>
                            <p className="text-sm text-muted-foreground">
                                Create your account and link your COD Mobile identity.
                            </p>
                        </div>
                        <div className="p-8 space-y-5">
                            {/* Account Info */}
                            <div className="space-y-3">
                                <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
                                    Account Details
                                </h3>
                                <div className="space-y-1">
                                    <Label htmlFor="reg-username" className="text-xs">Username</Label>
                                    <Input
                                        id="reg-username"
                                        placeholder="Choose a username"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        required
                                        minLength={3}
                                        className="bg-white/[0.03] border-white/10 focus:border-primary/50 h-10"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="reg-email" className="text-xs">Email</Label>
                                    <Input
                                        id="reg-email"
                                        type="email"
                                        placeholder="your@email.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="bg-white/[0.03] border-white/10 focus:border-primary/50 h-10"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <Label htmlFor="reg-password" className="text-xs">Password</Label>
                                        <Input
                                            id="reg-password"
                                            type="password"
                                            placeholder="Min 6 chars"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            minLength={6}
                                            className="bg-white/[0.03] border-white/10 focus:border-primary/50 h-10"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="reg-confirm" className="text-xs">Confirm</Label>
                                        <Input
                                            id="reg-confirm"
                                            type="password"
                                            placeholder="Re-enter"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            required
                                            className="bg-white/[0.03] border-white/10 focus:border-primary/50 h-10"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* COD Mobile Info */}
                            <div className="space-y-3 pt-4 border-t border-white/[0.06]">
                                <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
                                    COD Mobile Identity
                                </h3>
                                <p className="text-[11px] text-muted-foreground leading-relaxed">
                                    Your in-game name and UID will be verified by an admin before you can join tournaments.
                                </p>
                                <div className="space-y-1">
                                    <Label htmlFor="reg-ign" className="text-xs">In-Game Name (IGN)</Label>
                                    <Input
                                        id="reg-ign"
                                        placeholder="Your COD Mobile username"
                                        value={codmIGN}
                                        onChange={(e) => setCodmIGN(e.target.value)}
                                        required
                                        className="bg-white/[0.03] border-white/10 focus:border-primary/50 h-10"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="reg-uid" className="text-xs">Player UID</Label>
                                    <Input
                                        id="reg-uid"
                                        placeholder="Found in your COD Mobile profile"
                                        value={codmUID}
                                        onChange={(e) => setCodmUID(e.target.value)}
                                        required
                                        className="bg-white/[0.03] border-white/10 focus:border-primary/50 h-10"
                                    />
                                    <p className="text-[10px] text-muted-foreground mt-1">
                                        COD Mobile → Profile → UID below your name
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="px-8 pb-8 space-y-3">
                            <Button type="submit" className="w-full btn-glow font-bold h-11" disabled={isLoading}>
                                {isLoading ? "Creating Account..." : "Create Account"}
                            </Button>
                            <p className="text-xs text-muted-foreground text-center">
                                Already have an account?{" "}
                                <Link to="/login" className="text-primary hover:underline font-medium">
                                    Login
                                </Link>
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </Layout>
    );
}
