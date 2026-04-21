import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Calendar, Trophy, Plus, CheckCircle, Trash2, LogIn, Mail, Loader2, Eye, ChevronDown, Clock } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { z } from "zod";

const DIVISIONS = ["Men's", "Women's", "Co-ed"] as const;
type Division = typeof DIVISIONS[number];

interface SportSchedule {
  division: Division;
  day: string;
  times: string[];
}

interface Sport {
  id: string;
  name: string;
  season: string;
  seasonStart: string;
  registrationDeadline: string;
  teamsRegistered: number;
  maxTeams: number;
  type: "league" | "tournament";
  schedules: SportSchedule[];
}

const STANDARD_LEAGUE_SCHEDULES: SportSchedule[] = [
  { division: "Women's", day: "Sunday", times: ["5:00 PM", "6:00 PM"] },
  { division: "Men's", day: "Monday", times: ["6:00 PM", "7:00 PM", "8:00 PM", "9:00 PM"] },
  { division: "Men's", day: "Wednesday", times: ["6:00 PM", "7:00 PM", "8:00 PM", "9:00 PM"] },
  { division: "Men's", day: "Thursday", times: ["6:00 PM", "7:00 PM", "8:00 PM", "9:00 PM"] },
  { division: "Co-ed", day: "Sunday", times: ["7:00 PM"] },
  { division: "Co-ed", day: "Tuesday", times: ["6:00 PM", "7:00 PM", "8:00 PM", "9:00 PM"] },
];

const mockSports: Sport[] = [
  { id: "bb", name: "Basketball (5v5)", season: "Spring 2026", seasonStart: "2026-04-06", registrationDeadline: "Apr 1", teamsRegistered: 8, maxTeams: 12, type: "league", schedules: STANDARD_LEAGUE_SCHEDULES },
  { id: "vb", name: "Volleyball (6v6)", season: "Spring 2026", seasonStart: "2026-04-12", registrationDeadline: "Apr 5", teamsRegistered: 6, maxTeams: 8, type: "league", schedules: STANDARD_LEAGUE_SCHEDULES },
  { id: "sc", name: "Indoor Soccer", season: "Spring 2026", seasonStart: "2026-04-13", registrationDeadline: "Apr 10", teamsRegistered: 10, maxTeams: 16, type: "league", schedules: STANDARD_LEAGUE_SCHEDULES },
  { id: "bd", name: "Badminton Doubles", season: "Spring 2026", seasonStart: "2026-04-04", registrationDeadline: "Mar 28", teamsRegistered: 12, maxTeams: 12, type: "tournament", schedules: [
    { division: "Co-ed", day: "Saturday", times: ["10:00 AM"] },
  ]},
  { id: "dg", name: "Dodgeball", season: "Spring 2026", seasonStart: "2026-04-19", registrationDeadline: "Apr 15", teamsRegistered: 4, maxTeams: 10, type: "tournament", schedules: [
    { division: "Co-ed", day: "Sunday", times: ["1:00 PM"] },
  ]},
];

const dayShort = (d: string) => ({ Sunday: "Sun", Monday: "Mon", Tuesday: "Tue", Wednesday: "Wed", Thursday: "Thu", Friday: "Fri", Saturday: "Sat" } as Record<string, string>)[d] ?? d;

const formatDate = (iso: string) =>
  new Date(iso + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });

const playoffStart = (iso: string) => {
  const d = new Date(iso + "T12:00:00");
  d.setDate(d.getDate() + 21);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

interface Member {
  name: string;
  email: string;
}

interface DbTeam {
  id: string;
  sport_id: string;
  team_name: string;
  captain_name: string;
  intramural_team_members: { id: string; member_name: string; member_email: string; status: string }[];
}

const memberSchema = z.object({
  name: z.string().trim().min(1, "Name required").max(100),
  email: z.string().trim().email("Invalid email").max(255),
});

const teamSchema = z.object({
  teamName: z.string().trim().min(1, "Team name required").max(100),
  division: z.enum(DIVISIONS, { errorMap: () => ({ message: "Select a league division" }) }),
  day: z.string().min(1, "Pick a day"),
  time: z.string().min(1, "Pick a time slot"),
  captainName: z.string().trim().min(1, "Captain name required").max(100),
  captainEmail: z.string().trim().email("Invalid email").max(255),
  members: z.array(memberSchema).min(1, "Add at least one member"),
});

const emptyMember = (): Member => ({ name: "", email: "" });

const statusBadgeVariant = (s: string) =>
  s === "accepted" ? "secondary" : s === "declined" ? "destructive" : "outline";

const encodeTeamName = (division: Division, day: string, time: string, name: string) =>
  `[${division} · ${dayShort(day)} ${time}] ${name}`;

const parseTeamName = (raw: string): { division: Division | null; day: string | null; time: string | null; name: string } => {
  const m = raw.match(/^\[(Men's|Women's|Co-ed)(?:\s*·\s*([A-Za-z]{3})\s+([0-9: APM]+))?\]\s*(.*)$/);
  if (!m) return { division: null, day: null, time: null, name: raw };
  const dayMap: Record<string, string> = { Sun: "Sunday", Mon: "Monday", Tue: "Tuesday", Wed: "Wednesday", Thu: "Thursday", Fri: "Friday", Sat: "Saturday" };
  return {
    division: m[1] as Division,
    day: m[2] ? dayMap[m[2]] ?? m[2] : null,
    time: m[3]?.trim() ?? null,
    name: m[4],
  };
};

const Intramurals = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [teams, setTeams] = useState<DbTeam[]>([]);
  const [selectedSport, setSelectedSport] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [division, setDivision] = useState<Division>("Co-ed");
  const [chosenDay, setChosenDay] = useState<string>("");
  const [chosenTime, setChosenTime] = useState<string>("");
  const [captainName, setCaptainName] = useState(user?.name ?? "");
  const [captainEmail, setCaptainEmail] = useState(user?.email ?? "");
  const [members, setMembers] = useState<Member[]>([emptyMember()]);

  const [leagueSportId, setLeagueSportId] = useState<string | null>(null);
  const [leagueTeams, setLeagueTeams] = useState<DbTeam[]>([]);
  const [leagueLoading, setLeagueLoading] = useState(false);
  const [expandedTeamId, setExpandedTeamId] = useState<string | null>(null);
  const [leagueDivisionFilter, setLeagueDivisionFilter] = useState<"all" | Division>("all");
  const [leagueDayFilter, setLeagueDayFilter] = useState<string>("all");
  const [leagueTimeFilter, setLeagueTimeFilter] = useState<string>("all");

  const fetchTeams = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("intramural_teams")
      .select("id, sport_id, team_name, captain_name, intramural_team_members(id, member_name, member_email, status)")
      .eq("captain_user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Couldn't load teams", description: error.message, variant: "destructive" });
      return;
    }
    setTeams((data as DbTeam[]) || []);
  }, [user]);

  useEffect(() => { fetchTeams(); }, [fetchTeams]);

  useEffect(() => {
    if (user) {
      setCaptainName((prev) => prev || user.name);
      setCaptainEmail((prev) => prev || user.email);
    }
  }, [user]);

  const sportForRegister = mockSports.find((s) => s.id === selectedSport);
  const availableDivisions = useMemo<Division[]>(
    () => sportForRegister ? Array.from(new Set(sportForRegister.schedules.map((s) => s.division))) as Division[] : [],
    [sportForRegister]
  );
  const availableDays = useMemo(
    () => sportForRegister ? Array.from(new Set(sportForRegister.schedules.filter((s) => s.division === division).map((s) => s.day))) : [],
    [sportForRegister, division]
  );
  const availableTimes = useMemo(
    () => sportForRegister
      ? (sportForRegister.schedules.find((s) => s.division === division && s.day === chosenDay)?.times ?? [])
      : [],
    [sportForRegister, division, chosenDay]
  );

  useEffect(() => {
    if (!sportForRegister) return;
    if (!availableDivisions.includes(division)) {
      setDivision(availableDivisions[0] ?? "Co-ed");
    }
  }, [sportForRegister, availableDivisions, division]);

  useEffect(() => {
    if (availableDays.length > 0 && !availableDays.includes(chosenDay)) {
      setChosenDay(availableDays[0]);
    }
  }, [availableDays, chosenDay]);

  useEffect(() => {
    if (availableTimes.length > 0 && !availableTimes.includes(chosenTime)) {
      setChosenTime(availableTimes[0]);
    }
  }, [availableTimes, chosenTime]);

  const openRegister = (sportId: string) => {
    if (!isAuthenticated) {
      toast({ title: "Please log in", description: "You must be logged in to register a team." });
      navigate("/login");
      return;
    }
    const sport = mockSports.find((s) => s.id === sportId);
    setSelectedSport(sportId);
    setTeamName("");
    const firstDiv = (sport?.schedules[0]?.division ?? "Co-ed") as Division;
    setDivision(firstDiv);
    const firstSlot = sport?.schedules.find((s) => s.division === firstDiv);
    setChosenDay(firstSlot?.day ?? "");
    setChosenTime(firstSlot?.times[0] ?? "");
    setMembers([emptyMember()]);
    setDialogOpen(true);
  };

  const openLeague = async (sportId: string) => {
    setLeagueSportId(sportId);
    setExpandedTeamId(null);
    setLeagueDivisionFilter("all");
    setLeagueDayFilter("all");
    setLeagueTimeFilter("all");
    setLeagueLoading(true);
    const { data, error } = await supabase
      .from("intramural_teams")
      .select("id, sport_id, team_name, captain_name, intramural_team_members(id, member_name, member_email, status)")
      .eq("sport_id", sportId)
      .order("created_at", { ascending: false });
    setLeagueLoading(false);
    if (error) {
      toast({ title: "Couldn't load league", description: error.message, variant: "destructive" });
      return;
    }
    setLeagueTeams((data as DbTeam[]) || []);
  };

  const updateMember = (i: number, field: keyof Member, value: string) => {
    setMembers((prev) => prev.map((m, j) => (j === i ? { ...m, [field]: value } : m)));
  };

  const addMemberRow = () => setMembers((prev) => [...prev, emptyMember()]);
  const addTenRows = () => setMembers((prev) => [...prev, ...Array.from({ length: 10 }, emptyMember)]);
  const removeMember = (i: number) => setMembers((prev) => prev.filter((_, j) => j !== i));

  const handleRegister = async () => {
    if (!user || !selectedSport) return;

    const cleanedMembers = members.map((m) => ({ name: m.name.trim(), email: m.email.trim() })).filter((m) => m.name || m.email);
    const parsed = teamSchema.safeParse({
      teamName: teamName.trim(),
      division,
      day: chosenDay,
      time: chosenTime,
      captainName: captainName.trim(),
      captainEmail: captainEmail.trim(),
      members: cleanedMembers,
    });
    if (!parsed.success) {
      toast({ title: "Check your form", description: parsed.error.errors[0]?.message, variant: "destructive" });
      return;
    }

    const emails = new Set<string>();
    for (const m of parsed.data.members) {
      const e = m.email.toLowerCase();
      if (emails.has(e)) {
        toast({ title: "Duplicate email", description: `${m.email} appears more than once.`, variant: "destructive" });
        return;
      }
      emails.add(e);
    }

    setSubmitting(true);

    const { data: team, error: teamErr } = await supabase
      .from("intramural_teams")
      .insert({
        sport_id: selectedSport,
        team_name: encodeTeamName(parsed.data.division, parsed.data.day, parsed.data.time, parsed.data.teamName),
        captain_user_id: user.id,
        captain_name: parsed.data.captainName,
        captain_email: parsed.data.captainEmail,
      })
      .select("id")
      .single();

    if (teamErr || !team) {
      setSubmitting(false);
      toast({ title: "Registration failed", description: teamErr?.message, variant: "destructive" });
      return;
    }

    const { data: insertedMembers, error: memErr } = await supabase
      .from("intramural_team_members")
      .insert(parsed.data.members.map((m) => ({ team_id: team.id, member_name: m.name, member_email: m.email })))
      .select("id, member_name, member_email, invite_token");

    if (memErr) {
      setSubmitting(false);
      toast({ title: "Couldn't add members", description: memErr.message, variant: "destructive" });
      return;
    }

    const sportName = mockSports.find((s) => s.id === selectedSport)?.name ?? "";
    let emailsSent = 0;
    let emailsFailed = 0;

    await Promise.all(
      (insertedMembers || []).map(async (m) => {
        const acceptUrl = `${window.location.origin}/intramurals/accept?token=${m.invite_token}`;
        const { error } = await supabase.functions.invoke("send-transactional-email", {
          body: {
            templateName: "intramural-invite",
            recipientEmail: m.member_email,
            idempotencyKey: `intramural-invite-${m.id}`,
            templateData: {
              memberName: m.member_name,
              captainName: parsed.data.captainName,
              teamName: parsed.data.teamName,
              sportName,
              acceptUrl,
            },
          },
        });
        if (error) emailsFailed++; else emailsSent++;
      })
    );

    setSubmitting(false);
    setDialogOpen(false);

    if (emailsFailed > 0 && emailsSent === 0) {
      toast({
        title: "Team registered, invites pending",
        description: "Email isn't set up yet, so invitations weren't sent. Members can still be invited later.",
      });
    } else {
      toast({
        title: "Team registered!",
        description: `${emailsSent} invitation${emailsSent === 1 ? "" : "s"} sent.`,
      });
    }

    fetchTeams();
  };

  const registeredSportIds = new Set(teams.map((t) => t.sport_id));
  const leagueSport = mockSports.find((s) => s.id === leagueSportId);

  return (
    <div className="container py-6">
      <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">Intramural Sports</h1>
      <p className="mt-1 text-sm text-muted-foreground">Browse leagues, sign up your team, and manage rosters.</p>

      {teams.length > 0 && (
        <section className="mt-6">
          <h2 className="font-display text-xl font-bold text-foreground">My Teams</h2>
          <div className="mt-4 space-y-3">
            {teams.map((team) => {
              const sport = mockSports.find((s) => s.id === team.sport_id);
              const accepted = team.intramural_team_members.filter((m) => m.status === "accepted").length;
              const pending = team.intramural_team_members.filter((m) => m.status === "pending").length;
              const declined = team.intramural_team_members.filter((m) => m.status === "declined").length;
              const { division: tDiv, day: tDay, time: tTime, name: tName } = parseTeamName(team.team_name);
              return (
                <Card key={team.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <CardTitle className="text-base">{tName}</CardTitle>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                          {tDiv && <Badge variant="outline" className="text-xs">{tDiv}</Badge>}
                          {tDay && tTime && (
                            <Badge variant="secondary" className="text-xs">
                              {tDay}s · {tTime} · weekly
                            </Badge>
                          )}
                        </div>
                      </div>
                      {sport && (
                        <Button size="sm" variant="ghost" onClick={() => openLeague(sport.id)}>
                          <Eye className="h-4 w-4" /> League
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground space-y-2">
                    <p><span className="font-medium text-foreground">Sport:</span> {sport?.name}</p>
                    <p><span className="font-medium text-foreground">Captain:</span> {team.captain_name}</p>
                    {team.intramural_team_members.length > 0 && (
                      <div>
                        <p className="font-medium text-foreground mb-1.5">
                          Roster ({team.intramural_team_members.length}) — {accepted} accepted · {pending} pending · {declined} declined
                        </p>
                        <div className="space-y-1">
                          {team.intramural_team_members.map((mem) => (
                            <div key={mem.id} className="flex items-center justify-between gap-2 rounded-md border bg-card px-3 py-1.5">
                              <div className="min-w-0">
                                <p className="text-foreground truncate">{mem.member_name}</p>
                                <p className="text-xs text-muted-foreground truncate">{mem.member_email}</p>
                              </div>
                              <Badge variant={statusBadgeVariant(mem.status)} className="capitalize shrink-0">
                                {mem.status}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {!isAuthenticated && (
        <Card className="mt-4 border-primary/30 bg-primary/5">
          <CardContent className="flex items-center justify-between gap-3 p-4">
            <p className="text-sm text-foreground">Log in to register a team.</p>
            <Button size="sm" onClick={() => navigate("/login")}><LogIn className="h-4 w-4" /> Log in</Button>
          </CardContent>
        </Card>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {mockSports.map((sport) => {
          const full = sport.teamsRegistered >= sport.maxTeams;
          const registered = registeredSportIds.has(sport.id);
          return (
            <Card key={sport.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-display text-base font-semibold text-foreground">{sport.name}</h3>
                    <div className="mt-1.5 space-y-1 text-sm text-muted-foreground">
                      <p className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />{sport.season}</p>
                      <p className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" />{sport.teamsRegistered}/{sport.maxTeams} teams</p>
                      <p className="flex items-center gap-1.5"><Trophy className="h-3.5 w-3.5" />{sport.type === "league" ? "League" : "Tournament"}</p>
                    </div>
                  </div>
                  <Badge variant={full ? "destructive" : "secondary"} className="text-xs">
                    {full ? "Full" : `Deadline: ${sport.registrationDeadline}`}
                  </Badge>
                </div>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => openLeague(sport.id)}>
                    <Eye className="h-4 w-4" /> View league
                  </Button>
                  {registered ? (
                    <Button size="sm" variant="outline" disabled className="gap-1.5 flex-1">
                      <CheckCircle className="h-4 w-4 text-capacity-low" /> Registered
                    </Button>
                  ) : (
                    <Button size="sm" className="flex-1" disabled={full} onClick={() => openRegister(sport.id)}>
                      {full ? "Closed" : isAuthenticated ? "Register" : "Log in"}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Registration dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Register for {sportForRegister?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label htmlFor="teamName">Team Name</Label>
              <Input id="teamName" value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="e.g. The Dunkers" className="mt-1" />
            </div>

            <div>
              <Label>League Division</Label>
              <RadioGroup
                value={division}
                onValueChange={(v) => setDivision(v as Division)}
                className="mt-2 grid grid-cols-3 gap-2"
              >
                {DIVISIONS.map((d) => {
                  const enabled = availableDivisions.includes(d);
                  return (
                    <Label
                      key={d}
                      htmlFor={`div-${d}`}
                      className={`flex items-center gap-2 rounded-md border bg-card p-3 text-sm font-medium ${enabled ? "cursor-pointer hover:bg-accent has-[:checked]:border-primary has-[:checked]:bg-primary/5" : "opacity-50 cursor-not-allowed"}`}
                    >
                      <RadioGroupItem id={`div-${d}`} value={d} disabled={!enabled} />
                      {d}
                    </Label>
                  );
                })}
              </RadioGroup>
            </div>

            <div>
              <Label>Day</Label>
              <RadioGroup
                value={chosenDay}
                onValueChange={setChosenDay}
                className="mt-2 flex flex-wrap gap-2"
              >
                {availableDays.map((d) => (
                  <Label
                    key={d}
                    htmlFor={`day-${d}`}
                    className="flex cursor-pointer items-center gap-2 rounded-md border bg-card px-3 py-2 text-sm font-medium hover:bg-accent has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                  >
                    <RadioGroupItem id={`day-${d}`} value={d} className="sr-only" />
                    <Calendar className="h-3.5 w-3.5" />
                    {d}
                  </Label>
                ))}
              </RadioGroup>
            </div>

            <div>
              <Label>Time slot</Label>
              <RadioGroup
                value={chosenTime}
                onValueChange={setChosenTime}
                className="mt-2 flex flex-wrap gap-2"
              >
                {availableTimes.map((t) => (
                  <Label
                    key={t}
                    htmlFor={`time-${t}`}
                    className="flex cursor-pointer items-center gap-2 rounded-md border bg-card px-3 py-2 text-sm font-medium hover:bg-accent has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                  >
                    <RadioGroupItem id={`time-${t}`} value={t} className="sr-only" />
                    <Clock className="h-3.5 w-3.5" />
                    {t}
                  </Label>
                ))}
              </RadioGroup>
              {sportForRegister && chosenDay && chosenTime && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Plays weekly on {chosenDay}s at {chosenTime}. Playoffs begin {playoffStart(sportForRegister.seasonStart)}.
                </p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="captainName">Captain Name</Label>
                <Input id="captainName" value={captainName} onChange={(e) => setCaptainName(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="captainEmail">Captain Email</Label>
                <Input id="captainEmail" type="email" value={captainEmail} onChange={(e) => setCaptainEmail(e.target.value)} className="mt-1" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label>Team Members ({members.length})</Label>
                <div className="flex gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={addMemberRow}>
                    <Plus className="h-4 w-4" /> Add member
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={addTenRows}>
                    +10 rows
                  </Button>
                </div>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">No cap on team size — add as many as you need. Each member receives an email invitation to accept.</p>
              <div className="mt-2 space-y-2">
                {members.map((m, i) => (
                  <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-start">
                    <Input
                      value={m.name}
                      onChange={(e) => updateMember(i, "name", e.target.value)}
                      placeholder={`Member ${i + 1} name`}
                    />
                    <Input
                      type="email"
                      value={m.email}
                      onChange={(e) => updateMember(i, "email", e.target.value)}
                      placeholder="email@school.edu"
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => removeMember(i)}
                      disabled={members.length === 1}
                      aria-label="Remove member"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <Button className="w-full" onClick={handleRegister} disabled={submitting}>
              {submitting ? (<><Loader2 className="h-4 w-4 animate-spin" /> Registering…</>) : (<><Mail className="h-4 w-4" /> Submit & send invitations</>)}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* League details dialog */}
      <Dialog open={!!leagueSportId} onOpenChange={(o) => !o && setLeagueSportId(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{leagueSport?.name}</DialogTitle>
          </DialogHeader>
          {leagueSport && (() => {
            const allDays = Array.from(new Set(leagueSport.schedules.map((s) => s.day)));
            const timesForDay = leagueDayFilter === "all"
              ? Array.from(new Set(leagueSport.schedules.flatMap((s) => s.times)))
              : Array.from(new Set(leagueSport.schedules.filter((s) => s.day === leagueDayFilter).flatMap((s) => s.times)));

            const flatSlots = leagueSport.schedules.flatMap((s) => s.times.map((t) => ({ division: s.division, day: s.day, time: t })));
            const visibleSlots = flatSlots.filter((s) =>
              (leagueDivisionFilter === "all" || s.division === leagueDivisionFilter) &&
              (leagueDayFilter === "all" || s.day === leagueDayFilter) &&
              (leagueTimeFilter === "all" || s.time === leagueTimeFilter)
            );

            const filteredTeams = leagueTeams.filter((t) => {
              const { division: d, day, time } = parseTeamName(t.team_name);
              if (leagueDivisionFilter !== "all" && d !== leagueDivisionFilter) return false;
              if (leagueDayFilter !== "all" && day !== leagueDayFilter) return false;
              if (leagueTimeFilter !== "all" && time !== leagueTimeFilter) return false;
              return true;
            });

            return (
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-md border bg-card p-3">
                    <p className="text-xs text-muted-foreground">Season</p>
                    <p className="font-medium text-foreground">{leagueSport.season}</p>
                  </div>
                  <div className="rounded-md border bg-card p-3">
                    <p className="text-xs text-muted-foreground">Format</p>
                    <p className="font-medium text-foreground capitalize">{leagueSport.type}</p>
                  </div>
                  <div className="rounded-md border bg-card p-3">
                    <p className="text-xs text-muted-foreground">Registration deadline</p>
                    <p className="font-medium text-foreground">{leagueSport.registrationDeadline}</p>
                  </div>
                  <div className="rounded-md border bg-card p-3">
                    <p className="text-xs text-muted-foreground">Capacity</p>
                    <p className="font-medium text-foreground">{leagueSport.teamsRegistered}/{leagueSport.maxTeams} teams</p>
                  </div>
                </div>

                <div className="rounded-md border bg-primary/5 p-3 text-sm">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Season timeline</p>
                  <p className="mt-1 text-foreground">
                    Starts <span className="font-medium">{formatDate(leagueSport.seasonStart)}</span> · weekly regular season ·
                    {" "}playoffs begin <span className="font-medium">{playoffStart(leagueSport.seasonStart)}</span>
                  </p>
                </div>

                <div>
                  <h3 className="font-display text-sm font-semibold text-foreground">Schedule</h3>
                  <div className="mt-2 space-y-1.5">
                    {visibleSlots.length === 0 ? (
                      <p className="rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground">No slots match this filter.</p>
                    ) : (
                      visibleSlots.map((s, i) => (
                        <div key={i} className="flex items-center justify-between gap-3 rounded-md border bg-card px-3 py-2 text-sm">
                          <Badge variant="outline" className="text-xs">{s.division}</Badge>
                          <div className="flex items-center gap-3 text-muted-foreground">
                            <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />{s.day}</span>
                            <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />{s.time}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">League</Label>
                    <Select value={leagueDivisionFilter} onValueChange={(v) => setLeagueDivisionFilter(v as "all" | Division)}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All leagues</SelectItem>
                        {DIVISIONS.map((d) => (<SelectItem key={d} value={d}>{d}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Day</Label>
                    <Select value={leagueDayFilter} onValueChange={(v) => { setLeagueDayFilter(v); setLeagueTimeFilter("all"); }}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All days</SelectItem>
                        {allDays.map((d) => (<SelectItem key={d} value={d}>{d}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Time</Label>
                    <Select value={leagueTimeFilter} onValueChange={setLeagueTimeFilter}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All times</SelectItem>
                        {timesForDay.map((t) => (<SelectItem key={t} value={t}>{t}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <h3 className="font-display text-sm font-semibold text-foreground">Registered teams ({filteredTeams.length})</h3>
                  <p className="text-xs text-muted-foreground">Click a team to view its roster.</p>
                  <div className="mt-2 space-y-2">
                    {leagueLoading ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" /> Loading teams…
                      </div>
                    ) : filteredTeams.length === 0 ? (
                      <p className="rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground">No teams match these filters.</p>
                    ) : (
                      filteredTeams.map((t) => {
                        const accepted = t.intramural_team_members.filter((m) => m.status === "accepted").length;
                        const pending = t.intramural_team_members.filter((m) => m.status === "pending").length;
                        const declined = t.intramural_team_members.filter((m) => m.status === "declined").length;
                        const open = expandedTeamId === t.id;
                        const { division: tDiv, day: tDay, time: tTime, name: tName } = parseTeamName(t.team_name);
                        return (
                          <Collapsible key={t.id} open={open} onOpenChange={(o) => setExpandedTeamId(o ? t.id : null)}>
                            <div className="rounded-md border bg-card">
                              <CollapsibleTrigger className="flex w-full items-center justify-between gap-3 p-3 text-left hover:bg-muted/40 transition-colors">
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    {tDiv && <Badge variant="outline" className="text-xs shrink-0">{tDiv}</Badge>}
                                    {tDay && tTime && (
                                      <Badge variant="secondary" className="text-xs shrink-0">{dayShort(tDay)} {tTime}</Badge>
                                    )}
                                    <p className="font-medium text-foreground truncate">{tName}</p>
                                  </div>
                                  <p className="mt-0.5 text-xs text-muted-foreground truncate">
                                    Captain: {t.captain_name} · {t.intramural_team_members.length} member{t.intramural_team_members.length === 1 ? "" : "s"}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <Badge variant="secondary" className="text-xs">{accepted} ✓</Badge>
                                  {pending > 0 && <Badge variant="outline" className="text-xs">{pending} pending</Badge>}
                                  <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
                                </div>
                              </CollapsibleTrigger>
                              <CollapsibleContent>
                                <div className="border-t p-3 space-y-1.5">
                                  {t.intramural_team_members.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">No members yet.</p>
                                  ) : (
                                    t.intramural_team_members.map((mem) => (
                                      <div key={mem.id} className="flex items-center justify-between gap-2 rounded-md bg-muted/30 px-3 py-1.5">
                                        <p className="text-sm text-foreground truncate">{mem.member_name}</p>
                                        <Badge variant={statusBadgeVariant(mem.status)} className="capitalize text-xs shrink-0">
                                          {mem.status}
                                        </Badge>
                                      </div>
                                    ))
                                  )}
                                  {(accepted + pending + declined) > 0 && (
                                    <p className="pt-1 text-xs text-muted-foreground">
                                      {accepted} accepted · {pending} pending · {declined} declined
                                    </p>
                                  )}
                                </div>
                              </CollapsibleContent>
                            </div>
                          </Collapsible>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Intramurals;
