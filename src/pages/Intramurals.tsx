import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Calendar, Trophy, Plus, Trash2, LogIn, Mail, Loader2, ArrowLeft, Clock } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { z } from "zod";

type LeagueId = "womens" | "mens" | "coed";

interface Sport {
  id: string;
  name: string;
  season: string;
  registrationDeadline: string;
}

interface SlotDef {
  day: string; // e.g. "Sunday"
  times: string[]; // e.g. ["5:00 PM"]
}

const SPORTS: Sport[] = [
  { id: "bb", name: "Basketball (5v5)", season: "Spring 2026", registrationDeadline: "Apr 1" },
  { id: "vb", name: "Volleyball (6v6)", season: "Spring 2026", registrationDeadline: "Apr 5" },
  { id: "sc", name: "Indoor Soccer", season: "Spring 2026", registrationDeadline: "Apr 10" },
  { id: "bd", name: "Badminton Doubles", season: "Spring 2026", registrationDeadline: "Mar 28" },
  { id: "dg", name: "Dodgeball", season: "Spring 2026", registrationDeadline: "Apr 15" },
];

const LEAGUES: { id: LeagueId; name: string; slots: SlotDef[] }[] = [
  {
    id: "womens",
    name: "Women's",
    slots: [{ day: "Sunday", times: ["5:00 PM", "6:00 PM"] }],
  },
  {
    id: "mens",
    name: "Men's",
    slots: [
      { day: "Monday", times: ["6:00 PM", "7:00 PM", "8:00 PM", "9:00 PM"] },
      { day: "Wednesday", times: ["6:00 PM", "7:00 PM", "8:00 PM", "9:00 PM"] },
      { day: "Thursday", times: ["6:00 PM", "7:00 PM", "8:00 PM", "9:00 PM"] },
    ],
  },
  {
    id: "coed",
    name: "Co-Ed",
    slots: [
      { day: "Sunday", times: ["7:00 PM"] },
      { day: "Tuesday", times: ["6:00 PM", "7:00 PM", "8:00 PM", "9:00 PM"] },
    ],
  },
];

// Encode/decode the composite sport_id stored in DB.
// Format: "<sportId>:<leagueId>:<day>:<time>"
const encodeSlotId = (sportId: string, league: LeagueId, day: string, time: string) =>
  `${sportId}:${league}:${day}:${time}`;

interface ParsedSlot {
  sportId: string;
  league: LeagueId;
  day: string;
  time: string;
}

const parseSlotId = (raw: string): ParsedSlot | null => {
  const parts = raw.split(":");
  if (parts.length < 4) return null;
  const [sportId, league, day, ...rest] = parts;
  return { sportId, league: league as LeagueId, day, time: rest.join(":") };
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
  captainName: z.string().trim().min(1, "Captain name required").max(100),
  captainEmail: z.string().trim().email("Invalid email").max(255),
  members: z.array(memberSchema).min(1, "Add at least one member"),
});

const emptyMember = (): Member => ({ name: "", email: "" });

const sportName = (id: string) => SPORTS.find((s) => s.id === id)?.name ?? id;
const leagueName = (id: LeagueId) => LEAGUES.find((l) => l.id === id)?.name ?? id;

const Intramurals = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [allTeams, setAllTeams] = useState<DbTeam[]>([]);
  const [myTeams, setMyTeams] = useState<DbTeam[]>([]);

  // View state: browsing league rosters
  const [browse, setBrowse] = useState<{ sportId: string; league: LeagueId } | null>(null);

  // Registration dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [regSportId, setRegSportId] = useState<string>("");
  const [regLeague, setRegLeague] = useState<LeagueId | "">("");
  const [regSlot, setRegSlot] = useState<string>(""); // "Day|Time"
  const [teamName, setTeamName] = useState("");
  const [captainName, setCaptainName] = useState(user?.name ?? "");
  const [captainEmail, setCaptainEmail] = useState(user?.email ?? "");
  const [members, setMembers] = useState<Member[]>([emptyMember()]);

  const fetchTeams = useCallback(async () => {
    const { data, error } = await supabase
      .from("intramural_teams")
      .select("id, sport_id, team_name, captain_name, captain_user_id, intramural_team_members(id, member_name, member_email, status)")
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Couldn't load teams", description: error.message, variant: "destructive" });
      return;
    }
    const all = (data as (DbTeam & { captain_user_id: string })[]) || [];
    setAllTeams(all);
    setMyTeams(user ? all.filter((t) => t.captain_user_id === user.id) : []);
  }, [user]);

  useEffect(() => { fetchTeams(); }, [fetchTeams]);

  useEffect(() => {
    if (user) {
      setCaptainName((prev) => prev || user.name);
      setCaptainEmail((prev) => prev || user.email);
    }
  }, [user]);

  const openRegister = () => {
    if (!isAuthenticated) {
      toast({ title: "Please log in", description: "You must be logged in to register a team." });
      navigate("/login");
      return;
    }
    setRegSportId("");
    setRegLeague("");
    setRegSlot("");
    setTeamName("");
    setMembers([emptyMember()]);
    setDialogOpen(true);
  };

  const updateMember = (i: number, field: keyof Member, value: string) => {
    setMembers((prev) => prev.map((m, j) => (j === i ? { ...m, [field]: value } : m)));
  };
  const addMemberRow = () => setMembers((prev) => [...prev, emptyMember()]);
  const addTenRows = () => setMembers((prev) => [...prev, ...Array.from({ length: 10 }, emptyMember)]);
  const removeMember = (i: number) => setMembers((prev) => prev.filter((_, j) => j !== i));

  const slotOptions = useMemo(() => {
    if (!regLeague) return [];
    const league = LEAGUES.find((l) => l.id === regLeague);
    if (!league) return [];
    return league.slots.flatMap((s) => s.times.map((t) => ({ day: s.day, time: t, value: `${s.day}|${t}` })));
  }, [regLeague]);

  const handleRegister = async () => {
    if (!user) return;
    if (!regSportId || !regLeague || !regSlot) {
      toast({ title: "Choose sport, league & time", variant: "destructive" });
      return;
    }
    const [day, time] = regSlot.split("|");

    const cleanedMembers = members.map((m) => ({ name: m.name.trim(), email: m.email.trim() })).filter((m) => m.name || m.email);
    const parsed = teamSchema.safeParse({
      teamName: teamName.trim(),
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
    const composite = encodeSlotId(regSportId, regLeague as LeagueId, day, time);

    const { data: team, error: teamErr } = await supabase
      .from("intramural_teams")
      .insert({
        sport_id: composite,
        team_name: parsed.data.teamName,
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

    const sName = sportName(regSportId);
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
              sportName: `${sName} — ${leagueName(regLeague as LeagueId)} (${day} ${time})`,
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
      toast({ title: "Team registered, invites pending", description: "Email isn't set up yet, so invitations weren't sent." });
    } else {
      toast({ title: "Team registered!", description: `${emailsSent} invitation${emailsSent === 1 ? "" : "s"} sent.` });
    }

    fetchTeams();
  };

  // Browse view: list teams for a sport+league
  if (browse) {
    const teamsInLeague = allTeams.filter((t) => {
      const p = parseSlotId(t.sport_id);
      return p && p.sportId === browse.sportId && p.league === browse.league;
    });
    const league = LEAGUES.find((l) => l.id === browse.league)!;
    return (
      <div className="container py-6">
        <Button variant="ghost" size="sm" onClick={() => setBrowse(null)} className="mb-3">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
          {sportName(browse.sportId)} — {league.name} League
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Regular season runs weekly; playoffs begin 3 weeks after the season starts.
        </p>

        <div className="mt-6 space-y-6">
          {league.slots.map((slot) =>
            slot.times.map((time) => {
              const slotTeams = teamsInLeague.filter((t) => {
                const p = parseSlotId(t.sport_id);
                return p?.day === slot.day && p?.time === time;
              });
              return (
                <div key={`${slot.day}-${time}`}>
                  <h3 className="font-display text-base font-semibold text-foreground flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" /> {slot.day} · {time}
                    <Badge variant="secondary" className="ml-1">{slotTeams.length} team{slotTeams.length === 1 ? "" : "s"}</Badge>
                  </h3>
                  {slotTeams.length === 0 ? (
                    <p className="mt-1 text-sm text-muted-foreground">No teams registered yet.</p>
                  ) : (
                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      {slotTeams.map((t) => (
                        <Card key={t.id}>
                          <CardContent className="p-3">
                            <p className="font-medium text-foreground">{t.team_name}</p>
                            <p className="text-xs text-muted-foreground">
                              Captain: {t.captain_name} · {t.intramural_team_members.length} member{t.intramural_team_members.length === 1 ? "" : "s"}
                            </p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="container py-6">
      <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">Intramural Sports</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Pick a sport, league, and time slot. Regular season is weekly; playoffs begin 3 weeks after the season starts.
      </p>

      {/* My Teams (top of page) */}
      {isAuthenticated && myTeams.length > 0 && (
        <section className="mt-5">
          <h2 className="font-display text-lg font-bold text-foreground">My Teams</h2>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            {myTeams.map((team) => {
              const p = parseSlotId(team.sport_id);
              return (
                <Card key={team.id} className="border-primary/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{team.team_name}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground space-y-1">
                    {p && (
                      <>
                        <p><span className="font-medium text-foreground">{sportName(p.sportId)}</span> · {leagueName(p.league)} League</p>
                        <p className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />{p.day} · {p.time}</p>
                      </>
                    )}
                    <p>{team.intramural_team_members.length} member{team.intramural_team_members.length === 1 ? "" : "s"}</p>
                    {p && (
                      <Button size="sm" variant="outline" className="mt-2" onClick={() => setBrowse({ sportId: p.sportId, league: p.league })}>
                        View league
                      </Button>
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

      <div className="mt-6 flex items-center justify-between">
        <h2 className="font-display text-lg font-bold text-foreground">Sports & Leagues</h2>
        <Button size="sm" onClick={openRegister}><Plus className="h-4 w-4" /> Register Team</Button>
      </div>

      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        {SPORTS.map((sport) => (
          <Card key={sport.id}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-display text-base font-semibold text-foreground">{sport.name}</h3>
                  <div className="mt-1.5 space-y-1 text-sm text-muted-foreground">
                    <p className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />{sport.season}</p>
                    <p className="flex items-center gap-1.5"><Trophy className="h-3.5 w-3.5" />Reg deadline: {sport.registrationDeadline}</p>
                  </div>
                </div>
                <Users className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {LEAGUES.map((l) => {
                  const count = allTeams.filter((t) => {
                    const p = parseSlotId(t.sport_id);
                    return p?.sportId === sport.id && p?.league === l.id;
                  }).length;
                  return (
                    <Button
                      key={l.id}
                      size="sm"
                      variant="outline"
                      className="flex-col h-auto py-2"
                      onClick={() => setBrowse({ sportId: sport.id, league: l.id })}
                    >
                      <span className="text-xs font-medium">{l.name}</span>
                      <span className="text-[10px] text-muted-foreground">{count} team{count === 1 ? "" : "s"}</span>
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Register a Team</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label>Sport</Label>
                <Select value={regSportId} onValueChange={setRegSportId}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select sport" /></SelectTrigger>
                  <SelectContent>
                    {SPORTS.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>League</Label>
                <Select value={regLeague} onValueChange={(v) => { setRegLeague(v as LeagueId); setRegSlot(""); }}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select league" /></SelectTrigger>
                  <SelectContent>
                    {LEAGUES.map((l) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Day & Time</Label>
                <Select value={regSlot} onValueChange={setRegSlot} disabled={!regLeague}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder={regLeague ? "Select slot" : "Pick league first"} /></SelectTrigger>
                  <SelectContent>
                    {slotOptions.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.day} · {s.time}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="teamName">Team Name</Label>
              <Input id="teamName" value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="e.g. The Dunkers" className="mt-1" />
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
                  <Button type="button" size="sm" variant="outline" onClick={addTenRows}>+10 rows</Button>
                </div>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">No cap on team size. Each member receives an email invitation.</p>
              <div className="mt-2 space-y-2">
                {members.map((m, i) => (
                  <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-start">
                    <Input value={m.name} onChange={(e) => updateMember(i, "name", e.target.value)} placeholder={`Member ${i + 1} name`} />
                    <Input type="email" value={m.email} onChange={(e) => updateMember(i, "email", e.target.value)} placeholder="email@school.edu" />
                    <Button type="button" size="icon" variant="ghost" onClick={() => removeMember(i)} disabled={members.length === 1} aria-label="Remove member">
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
    </div>
  );
};

export default Intramurals;
