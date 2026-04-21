import { Link } from "react-router-dom";
import { Activity, Calendar, Users, Dumbbell, HelpCircle, Megaphone } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useGym } from "@/context/GymContext";
import OperatingHours from "@/components/OperatingHours";

const features = [
  { to: "/capacity", label: "Capacity Tracker", desc: "See real-time occupancy by area", icon: Activity, color: "text-capacity-low" },
  { to: "/group-fitness", label: "Group Fitness", desc: "Browse classes & reserve spots", icon: Dumbbell, color: "text-primary" },
  { to: "/intramurals", label: "Intramurals", desc: "Sign up for leagues & manage teams", icon: Users, color: "text-capacity-moderate" },
  { to: "/events", label: "Events & News", desc: "Announcements, closures & events", icon: Megaphone, color: "text-destructive" },
  { to: "/faq", label: "FAQ", desc: "Hours, policies & common questions", icon: HelpCircle, color: "text-muted-foreground" },
];

const Home = () => {
  const { totalCount, totalCapacity, totalPercent, totalStatus } = useGym();

  const statusColor = totalStatus === "Low" ? "text-capacity-low" : totalStatus === "Moderate" ? "text-capacity-moderate" : "text-capacity-high";

  return (
    <div className="container py-8">
      {/* Hero */}
      <section className="mb-10 text-center">
        <h1 className="font-display text-4xl font-bold text-foreground sm:text-5xl">
          Recreation Center
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Your hub for fitness, sports & community
        </p>
        {/* Quick capacity badge */}
        <div className="mx-auto mt-6 inline-flex items-center gap-3 rounded-full border border-border bg-card px-5 py-2.5 shadow-sm">
          <Activity className={`h-5 w-5 ${statusColor}`} />
          <span className="text-sm font-medium text-foreground">
            Current Occupancy: <span className={`font-bold ${statusColor}`}>{totalCount}/{totalCapacity}</span> ({totalPercent}%)
          </span>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            totalStatus === "Low" ? "bg-capacity-low-bg text-capacity-low" :
            totalStatus === "Moderate" ? "bg-capacity-moderate-bg text-capacity-moderate" :
            "bg-capacity-high-bg text-capacity-high"
          }`}>{totalStatus}</span>
        </div>
      </section>

      {/* Feature grid */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map(({ to, label, desc, icon: Icon, color }) => (
          <Link key={to} to={to} className="group">
            <Card className="h-full transition-shadow hover:shadow-md">
              <CardContent className="flex items-start gap-4 p-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary">
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>
                <div>
                  <h2 className="font-display text-base font-semibold text-foreground group-hover:text-primary transition-colors">{label}</h2>
                  <p className="mt-0.5 text-sm text-muted-foreground">{desc}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </section>
    </div>
  );
};

export default Home;
