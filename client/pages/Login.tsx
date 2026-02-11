import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Layout } from "@/components/Layout";
import { useNavigate, Link } from "react-router-dom";

export function Login() {
    const { login } = useAuth();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });
            const data = await res.json();

            if (data.success) {
                if (data.user.mustChangePassword) {
                    login(data.token, data.user);
                    toast({ title: "Action Required", description: "Please change your password." });
                    navigate("/change-password");
                } else {
                    login(data.token, data.user);
                    toast({ title: "Welcome back!", description: `Logged in as ${data.user.username}` });
                }
            } else {
                toast({ title: "Login Failed", description: data.message, variant: "destructive" });
            }
        } catch (err) {
            toast({ title: "Error", description: "Something went wrong", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Layout>
            <div className="min-h-[calc(100vh-140px)] aurora-bg flex items-center justify-center py-12 px-4 relative">
                {/* Ambient */}
                <div className="absolute top-[30%] right-[15%] w-56 h-56 bg-primary/8 rounded-full blur-[100px] pointer-events-none"></div>
                <div className="absolute bottom-[25%] left-[10%] w-64 h-64 bg-accent/5 rounded-full blur-[80px] pointer-events-none"></div>

                <div className="glass-strong rounded-2xl w-full max-w-md relative z-10 animate-fade-in-up">
                    <form onSubmit={handleLogin}>
                        <div className="p-8 pb-0">
                            <h1 className="text-2xl font-black text-gradient mb-1">Welcome Back</h1>
                            <p className="text-sm text-muted-foreground">
                                Enter your credentials to continue.
                            </p>
                        </div>
                        <div className="p-8 space-y-4">
                            <div className="space-y-1">
                                <Label htmlFor="login-username" className="text-xs">Username</Label>
                                <Input
                                    id="login-username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                    className="bg-white/[0.03] border-white/10 focus:border-primary/50 h-11"
                                    placeholder="Enter your username"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="login-password" className="text-xs">Password</Label>
                                <Input
                                    id="login-password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="bg-white/[0.03] border-white/10 focus:border-primary/50 h-11"
                                    placeholder="Enter your password"
                                />
                            </div>
                        </div>
                        <div className="px-8 pb-8 space-y-3">
                            <Button type="submit" className="w-full btn-glow font-bold h-11" disabled={isLoading}>
                                {isLoading ? "Logging in..." : "Login"}
                            </Button>
                            <p className="text-xs text-muted-foreground text-center">
                                Don't have an account?{" "}
                                <Link to="/register" className="text-primary hover:underline font-medium">
                                    Sign Up
                                </Link>
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </Layout>
    );
}
