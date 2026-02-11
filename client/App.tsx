import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Landing } from "./pages/Landing";
import { Dashboard } from "./pages/Dashboard";
import { Phase1 } from "./pages/Phase1";
import { Phase2 } from "./pages/Phase2";
import { Phase3 } from "./pages/Phase3";
import { Redemption } from "./pages/Redemption";
import { Leadership } from "./pages/Leadership";
import { TeamSelection } from "./pages/TeamSelection";
import { TeamPools } from "./pages/TeamPools";
import { TeamCompetition } from "./pages/TeamCompetition";
import { IndividualFiltering } from "./pages/IndividualFiltering";
import { HighStakesTrials } from "./pages/HighStakesTrials";
import { Phase4 } from "./pages/Phase4";
import { Phase5 } from "./pages/Phase5";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

import { AuthProvider } from "@/context/AuthContext";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { ChangePassword } from "./pages/ChangePassword";
import { AdminUsers } from "./pages/AdminUsers";
import { AdminDashboard } from "./pages/AdminDashboard";
import { AdminTeams } from "./pages/AdminTeams";
import { AdminTournaments } from "./pages/AdminTournaments";
import { TournamentWizard } from "./pages/TournamentWizard";
import { AdminTournamentDetail } from "./pages/AdminTournamentDetail";
import { ProtectedRoute } from "@/components/ProtectedRoute";

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/change-password" element={<ChangePassword />} />

            {/* Protected Routes (any authenticated user) */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/phase-1" element={<Phase1 />} />
              <Route path="/phase-2" element={<Phase2 />} />
              <Route path="/phase-3" element={<Phase3 />} />
              <Route path="/redemption" element={<Redemption />} />
              <Route path="/leadership" element={<Leadership />} />
              <Route path="/team-selection" element={<TeamSelection />} />
              <Route path="/team-pools" element={<TeamPools />} />
              <Route path="/team-competition" element={<TeamCompetition />} />
              <Route
                path="/individual-filtering"
                element={<IndividualFiltering />}
              />
              <Route path="/high-stakes-trials" element={<HighStakesTrials />} />
              <Route path="/phase-4" element={<Phase4 />} />
              <Route path="/phase-5" element={<Phase5 />} />
            </Route>

            {/* Admin-Only Routes */}
            <Route element={<ProtectedRoute roles={["ADMIN"]} />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/teams" element={<AdminTeams />} />
              <Route path="/admin/tournaments" element={<AdminTournaments />} />
              <Route path="/admin/tournaments/create" element={<TournamentWizard />} />
              <Route path="/admin/tournaments/:id" element={<AdminTournamentDetail />} />
            </Route>

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
