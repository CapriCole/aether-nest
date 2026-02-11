import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, User, LogOut, Shield, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const { user, logout, isAuthenticated, isAdmin } = useAuth();

  return (
    <header className="sticky top-0 z-50 glass border-b border-white/[0.06]">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-1.5 group">
          <div className="text-xl font-black text-gradient tracking-tight group-hover:text-glow transition-all">
            AETHER
          </div>
          <span className="text-[10px] font-bold text-accent uppercase tracking-[0.2em] mt-0.5">NEST</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-2">
          {isAuthenticated ? (
            <>
              <Link to={isAdmin ? "/admin/dashboard" : "/dashboard"}>
                <Button variant="ghost" className={`text-sm gap-1.5 ${(location.pathname === '/dashboard' || location.pathname === '/admin/dashboard') ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                  {isAdmin && <Shield size={14} />}
                  Dashboard
                </Button>
              </Link>
              {isAdmin && (
                <>
                  <Link to="/admin/users">
                    <Button variant="ghost" className={`text-sm ${location.pathname === '/admin/users' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                      Users
                    </Button>
                  </Link>
                  <Link to="/admin/teams">
                    <Button variant="ghost" className={`text-sm ${location.pathname === '/admin/teams' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                      Teams
                    </Button>
                  </Link>
                  <Link to="/admin/tournaments">
                    <Button variant="ghost" className={`text-sm gap-1.5 ${location.pathname.startsWith('/admin/tournaments') ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                      <Trophy size={14} />
                      Tournaments
                    </Button>
                  </Link>
                </>
              )}
              <div className="w-px h-6 bg-border mx-1"></div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-7 h-7 rounded-full glass flex items-center justify-center">
                  <User size={14} className="text-primary" />
                </div>
                <span className="text-muted-foreground font-medium">{user?.username}</span>
                {isAdmin && (
                  <span className="text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded-full uppercase tracking-wider">Admin</span>
                )}
                <Button variant="ghost" size="icon" onClick={logout} title="Logout" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                  <LogOut size={14} />
                </Button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login">
                <Button variant="ghost" className="text-muted-foreground hover:text-foreground text-sm">Login</Button>
              </Link>
              <Link to="/register">
                <Button className="btn-glow text-sm h-9 px-4">Register</Button>
              </Link>
            </div>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg glass"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMenuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <nav className="md:hidden border-t border-white/[0.06] glass animate-fade-in-down">
          <div className="container mx-auto px-4 py-4 flex flex-col gap-2">
            {isAuthenticated ? (
              <>
                <div className="px-3 py-2 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full glass flex items-center justify-center">
                    <User size={14} className="text-primary" />
                  </div>
                  <div>
                    <span className="font-bold text-sm">{user?.username}</span>
                    {isAdmin && <span className="ml-2 text-[10px] text-primary font-bold">ADMIN</span>}
                  </div>
                </div>
                <Link to={isAdmin ? "/admin/dashboard" : "/dashboard"} className="px-3 py-2 hover:bg-white/5 rounded-lg text-sm transition-colors flex items-center gap-2" onClick={() => setIsMenuOpen(false)}>
                  {isAdmin ? (
                    <>
                      <Shield size={14} className="text-primary" />
                      Dashboard
                    </>
                  ) : (
                    "Dashboard"
                  )}
                </Link>
                {isAdmin && (
                  <>
                    <Link to="/admin/users" className="px-3 py-2 hover:bg-white/5 rounded-lg text-sm transition-colors" onClick={() => setIsMenuOpen(false)}>
                      Users
                    </Link>
                    <Link to="/admin/teams" className="px-3 py-2 hover:bg-white/5 rounded-lg text-sm transition-colors" onClick={() => setIsMenuOpen(false)}>
                      Teams
                    </Link>
                    <Link to="/admin/tournaments" className="px-3 py-2 hover:bg-white/5 rounded-lg text-sm transition-colors flex items-center gap-2" onClick={() => setIsMenuOpen(false)}>
                      <Trophy size={14} className="text-primary" />
                      Tournaments
                    </Link>
                  </>
                )}
                <button className="text-left px-3 py-2 hover:bg-destructive/10 rounded-lg text-sm text-destructive transition-colors" onClick={() => { logout(); setIsMenuOpen(false); }}>
                  Logout
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-2">
                <Link to="/login" className="px-3 py-2 hover:bg-white/5 rounded-lg text-sm text-center transition-colors" onClick={() => setIsMenuOpen(false)}>
                  Login
                </Link>
                <Link to="/register" className="px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm text-center font-medium" onClick={() => setIsMenuOpen(false)}>
                  Register
                </Link>
              </div>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
