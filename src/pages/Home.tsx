import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  X,
  Dumbbell,
  Users,
  UserPlus,
  Trophy,
  Megaphone,
  HelpCircle,
  CalendarDays,
  MapPin,
  ArrowRight,
  Clock,
  BarChart3,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useGym } from "@/context/GymContext";
import { cn } from "@/lib/utils";

const todaysClasses = [
  { name: "Yoga", time: "9:00 AM" },
  { name: "HIIT", time: "12:00 PM" },
  { name: "Spin", time: "5:00 PM" },
  { name: "Pilates", time: "7:00 PM" },
];

const features = [
  {
    to: "/capacity",
    title: "Capacity Tracker",
    desc: "See real-time occupancy by area",
    icon: BarChart3,
    badge: { label: "Live", className: "bg-capacity-low-bg text-capacity-low border-capacity-low/20" },
    iconBg: "from-emerald-500/15 to-emerald-500/5 text-emerald-600",
  },
  {
    to: "/group-fitness",
    title: "Group Fitness",
    desc: "Browse classes & reserve spots",
    icon: Dumbbell,
    badge: { label: "8 Today", className: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
    iconBg: "from-blue-500/15 to-blue-500/5 text-blue-600",
  },
  {
    to: "/intramurals",
    title: "Intramurals",
    desc: "Join leagues & manage teams",
    icon: Users,
    badge: { label: "Open", className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
    iconBg: "from-amber-500/15 to-amber-500/5 text-amber-600",
  },
  {
    to: "/events",
    title: "Events & News",
    desc: "Closures, announcements & events",
    icon: Megaphone,
    badge: { label: "New", className: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
    iconBg: "from-rose-500/15 to-rose-500/5 text-rose-600",
  },
  {
    to: "/faq",
    title: "FAQ",
    desc: "Hours, policies & support",
    icon: HelpCircle,
    iconBg: "from-slate-500/15 to-slate-500/5 text-slate-600",
  },
  {
    to: "/group-fitness",
    title: "Reservations",
    desc: "Book gym floors or spaces",
    icon: MapPin,
    iconBg: "from-indigo-500/15 to-indigo-500/5 text-indigo-600",
  },
] as const;

const Home = () => {
  const { totalCount, totalCapacity, totalPercent, totalStatus, lastUpdated, announcement, operatingHours } =
    useGym();
  const [bannerOpen, setBannerOpen] = useState(true);

  const today = new Date().toLocaleDateString("en-US", { weekday: "long" });
  const updatedAt = lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const bannerText = announcement || "Lerner Center closes early Friday at 8 PM";

  const statusChip =
    totalStatus === "Low"
      ? "bg-capacity-low-bg text-capacity-low"
      : totalStatus === "Moderate"
      ? "bg-capacity-moderate-bg text-capacity-moderate"
      : "bg-capacity-high-bg text-capacity-high";

  const barColor =
    totalStatus === "Low" ? "bg-capacity-low" : totalStatus === "Moderate" ? "bg-capacity-moderate" : "bg-capacity-high";

  const stats = [
    { label: "Students Inside", value: totalCount, icon: Users, tint: "text-blue-600 bg-blue-500/10" },
    { label: "Classes Today", value: 8, icon: Dumbbell, tint: "text-emerald-600 bg-emerald-500/10" },
    { label: "Open Courts", value: 3, icon: Trophy, tint: "text-amber-600 bg-amber-500/10" },
    { label: "Intramural Signups", value: 124, icon: UserPlus, tint: "text-indigo-600 bg-indigo-500/10" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/40 via-background to-background">
      <div className="container py-6 md:py-10">
        {/* 1. Top alert banner */}
        {bannerOpen && (
          <div
            className="animate-fade-in mb-6 flex items-start gap-3 rounded-2xl border border-amber-300/40 bg-gradient-to-r from-amber-50 to-amber-100/60 px-4 py-3 shadow-sm"
            style={{ animationDelay: "0ms" }}
          >
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <p className="flex-1 text-sm font-medium text-amber-900">{bannerText}</p>
            <button
              onClick={() => setBannerOpen(false)}
              aria-label="Dismiss announcement"
              className="rounded-md p-1 text-amber-700 transition-colors hover:bg-amber-200/60"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* 2. Hero */}
        <section className="animate-fade-in text-center" style={{ animationDelay: "60ms" }}>
          <h1 className="font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
            Recreation Center{" "}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Dashboard
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
            Live facility updates, classes, reservations, and campus wellness tools.
          </p>

          {/* Live status chips */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              Live Now
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
              <Clock className="h-3 w-3" />
              Updated {updatedAt}
            </span>
          </div>

          {/* Occupancy card */}
          <div
            className="animate-fade-in mx-auto mt-8 max-w-xl rounded-3xl border border-border/60 bg-card p-6 text-left shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:p-8"
            style={{ animationDelay: "120ms" }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Current Occupancy
              </span>
              <span className={cn("rounded-full px-3 py-1 text-xs font-semibold", statusChip)}>
                Status: {totalStatus}
              </span>
            </div>
            <div className="mt-3 flex items-end gap-2">
              <span className="font-display text-5xl font-bold leading-none text-foreground sm:text-6xl">
                {totalCount}
              </span>
              <span className="mb-1 text-lg text-muted-foreground">/ {totalCapacity} students</span>
            </div>
            <div className="mt-5">
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className={cn("h-full rounded-full transition-all duration-1000 ease-out", barColor)}
                  style={{ width: `${Math.min(totalPercent, 100)}%` }}
                />
              </div>
              <p className="mt-2 text-sm font-medium text-muted-foreground">{totalPercent}% Capacity</p>
            </div>
          </div>

          {/* CTAs */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link to="/capacity">
              <Button size="lg" className="rounded-full px-6 shadow-md hover:shadow-lg transition-all">
                View Capacity <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/group-fitness">
              <Button size="lg" variant="outline" className="rounded-full px-6">
                Reserve Space
              </Button>
            </Link>
          </div>
        </section>

        {/* 3. Quick stats */}
        <section
          className="animate-fade-in mt-12 grid grid-cols-2 gap-4 md:grid-cols-4"
          style={{ animationDelay: "180ms" }}
        >
          {stats.map(({ label, value, icon: Icon, tint }) => (
            <div
              key={label}
              className="group rounded-2xl border border-border/60 bg-card p-5 shadow-[0_4px_20px_rgb(0,0,0,0.03)] transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", tint)}>
                <Icon className="h-5 w-5" />
              </div>
              <p className="mt-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {label}
              </p>
              <p className="mt-1 font-display text-3xl font-bold text-foreground">{value}</p>
            </div>
          ))}
        </section>

        {/* 4. Feature grid */}
        <section
          className="animate-fade-in mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
          style={{ animationDelay: "240ms" }}
        >
          {features.map(({ to, title, desc, icon: Icon, badge, iconBg }) => (
            <Link key={`${to}-${title}`} to={to} className="group">
              <Card className="h-full rounded-2xl border-border/60 shadow-[0_4px_20px_rgb(0,0,0,0.03)] transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div
                      className={cn(
                        "flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br",
                        iconBg
                      )}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    {badge && (
                      <Badge variant="outline" className={cn("rounded-full px-2.5 py-0.5", badge.className)}>
                        {badge.label}
                      </Badge>
                    )}
                  </div>
                  <h3 className="mt-5 font-display text-lg font-semibold text-foreground transition-colors group-hover:text-primary">
                    {title}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
                  <div className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                    Open <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </section>

        {/* 5. Two-column secondary section */}
        <section
          className="animate-fade-in mt-12 grid gap-5 lg:grid-cols-2"
          style={{ animationDelay: "300ms" }}
        >
          {/* Today's classes */}
          <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-blue-600" />
                <h2 className="font-display text-lg font-semibold text-foreground">Today's Classes</h2>
              </div>
              <Link to="/group-fitness" className="text-xs font-medium text-primary hover:underline">
                View all
              </Link>
            </div>
            <ul className="space-y-2">
              {todaysClasses.map(({ name, time }) => (
                <li
                  key={name}
                  className="flex items-center justify-between rounded-xl border border-transparent bg-secondary/40 px-4 py-3 transition-colors hover:border-border hover:bg-secondary"
                >
                  <div className="flex items-center gap-3">
                    <span className="rounded-lg bg-blue-500/10 px-2.5 py-1 text-xs font-semibold text-blue-700">
                      {time}
                    </span>
                    <span className="font-medium text-foreground">{name}</span>
                  </div>
                  <Link
                    to="/group-fitness"
                    className="text-xs font-semibold text-primary opacity-70 transition-opacity hover:opacity-100"
                  >
                    Reserve
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Operating hours */}
          <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
            <div className="mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-indigo-600" />
              <h2 className="font-display text-lg font-semibold text-foreground">Operating Hours</h2>
            </div>
            <ul className="space-y-1.5">
              {operatingHours.map(({ day, hours }) => {
                const isToday = day === today;
                return (
                  <li
                    key={day}
                    className={cn(
                      "flex justify-between rounded-xl px-4 py-2.5 text-sm transition-colors",
                      isToday
                        ? "bg-blue-500/10 font-semibold text-foreground ring-1 ring-blue-500/20"
                        : "text-muted-foreground hover:bg-secondary/60"
                    )}
                  >
                    <span className="flex items-center gap-2">
                      {isToday && <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />}
                      {day}
                    </span>
                    <span>{hours}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        {/* 6. Footer */}
        <footer className="mt-16 border-t border-border/60 pt-6 pb-2 text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Activity className="h-4 w-4 text-primary" />
            <span>© CrowdEDU | Built for George Washington University Recreation</span>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Home;
