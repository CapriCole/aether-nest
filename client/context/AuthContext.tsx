import React, { createContext, useContext, useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";

interface User {
    id: string;
    username: string;
    role: "ADMIN" | "PLAYER" | "MODERATOR" | "COMMENTATOR";
    verificationStatus?: string;
    tournamentStatus?: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (token: string, user: User) => void;
    logout: () => void;
    isAuthenticated: boolean;
    isAdmin: boolean;
    isModerator: boolean;
    isTeamLeader: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
    const navigate = useNavigate();

    useEffect(() => {
        if (token) {
            try {
                const decoded: any = jwtDecode(token);
                // Check expiry
                if (decoded.exp * 1000 < Date.now()) {
                    logout();
                } else {
                    setUser({
                        id: decoded.id,
                        username: decoded.username,
                        role: decoded.role,
                        tournamentStatus: decoded.tournamentStatus,
                    });
                }
            } catch (e) {
                logout();
            }
        }
    }, [token]);

    const login = (newToken: string, newUser: User) => {
        localStorage.setItem("token", newToken);
        setToken(newToken);
        setUser(newUser);
        navigate(newUser.role === "ADMIN" ? "/admin/dashboard" : "/dashboard");
    };

    const logout = () => {
        localStorage.removeItem("token");
        setToken(null);
        setUser(null);
        navigate("/login");
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                login,
                logout,
                isAuthenticated: !!user,
                isAdmin: user?.role === "ADMIN",
                isModerator: user?.role === "MODERATOR" || user?.role === "ADMIN",
                isTeamLeader: user?.tournamentStatus === "team_leader",
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}

