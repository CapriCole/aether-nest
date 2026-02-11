import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

interface ProtectedRouteProps {
    roles?: ("ADMIN" | "PLAYER" | "MODERATOR" | "COMMENTATOR")[];
}

export const ProtectedRoute = ({ roles }: ProtectedRouteProps) => {
    const { user, isAuthenticated } = useAuth();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (roles && user && !roles.includes(user.role)) {
        // Redirect based on role if unauthorized for this specific route
        return <Navigate to={user.role === "ADMIN" ? "/admin/dashboard" : "/dashboard"} replace />;
    }

    return <Outlet />;
};
