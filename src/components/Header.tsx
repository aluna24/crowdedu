import { Link, useLocation } from "react-router-dom";
import { Activity, ClipboardList, Shield } from "lucide-react";

const Header = () => {
  const { pathname } = useLocation();

  const links = [
    { to: "/", label: "Dashboard", icon: Activity },
    { to: "/employee", label: "Employee", icon: ClipboardList },
    { to: "/admin", label: "Admin", icon: Shield },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md">
      <div className="container flex h-14 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <Activity className="h-6 w-6 text-primary" />
          <span className="font-display text-lg font-bold text-foreground">
            RecTrack
          </span>
        </Link>
        <nav className="flex gap-1">
          {links.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                pathname === to
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
};

export default Header;
