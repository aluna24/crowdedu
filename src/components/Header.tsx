import { Link, useLocation } from "react-router-dom";
import { Activity, Dumbbell, Users, Megaphone, HelpCircle, BarChart3, LogIn, LogOut, ClipboardList, Shield } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const Header = () => {
  const { pathname } = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const publicLinks = [
    { to: "/", label: "Home", icon: Activity },
    { to: "/capacity", label: "Capacity", icon: BarChart3 },
    { to: "/group-fitness", label: "Fitness", icon: Dumbbell },
    { to: "/intramurals", label: "Intramurals", icon: Users },
    { to: "/events", label: "Events", icon: Megaphone },
    { to: "/faq", label: "FAQ", icon: HelpCircle },
  ];

  const staffLinks = [
    ...(user?.role === "employee" || user?.role === "admin" ? [{ to: "/employee", label: "Headcount", icon: ClipboardList }] : []),
    ...(user?.role === "admin" ? [{ to: "/admin", label: "Admin", icon: Shield }] : []),
  ];

  const allLinks = [...publicLinks, ...staffLinks];

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md">
      <div className="container flex h-14 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <Activity className="h-6 w-6 text-primary" />
          <span className="font-display text-lg font-bold text-foreground">CrowdEDU</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {allLinks.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors ${
                pathname === to ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
          {isAuthenticated ? (
            <Button variant="ghost" size="sm" onClick={logout} className="ml-2 gap-1.5 text-muted-foreground">
              <LogOut className="h-4 w-4" />
              {user?.name?.split(" ")[0]}
            </Button>
          ) : (
            <Link to="/login">
              <Button variant="outline" size="sm" className="ml-2 gap-1.5">
                <LogIn className="h-4 w-4" /> Login
              </Button>
            </Link>
          )}
        </nav>

        {/* Mobile toggle */}
        <button className="flex flex-col gap-1 md:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)}>
          <span className={`block h-0.5 w-5 bg-foreground transition-transform ${mobileOpen ? "translate-y-1.5 rotate-45" : ""}`} />
          <span className={`block h-0.5 w-5 bg-foreground transition-opacity ${mobileOpen ? "opacity-0" : ""}`} />
          <span className={`block h-0.5 w-5 bg-foreground transition-transform ${mobileOpen ? "-translate-y-1.5 -rotate-45" : ""}`} />
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <nav className="border-t border-border bg-card p-3 md:hidden">
          <div className="flex flex-col gap-1">
            {allLinks.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  pathname === to ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
            {isAuthenticated ? (
              <button onClick={() => { logout(); setMobileOpen(false); }} className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary">
                <LogOut className="h-4 w-4" /> Sign Out ({user?.name?.split(" ")[0]})
              </button>
            ) : (
              <Link to="/login" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary">
                <LogIn className="h-4 w-4" /> Login
              </Link>
            )}
          </div>
        </nav>
      )}
    </header>
  );
};

export default Header;
