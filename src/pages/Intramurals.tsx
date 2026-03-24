import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Users, Calendar, Trophy, Plus, CheckCircle } from "lucide-react";

interface Sport {
  id: string;
  name: string;
  season: string;
  registrationDeadline: string;
  teamsRegistered: number;
  maxTeams: number;
  type: "league" | "tournament";
}

interface Team {
  id: string;
  sportId: string;
  name: string;
  members: string[];
  captain: string;
}

const mockSports: Sport[] = [
  { id: "bb", name: "Basketball (5v5)", season: "Spring 2026", registrationDeadline: "Apr 1", teamsRegistered: 8, maxTeams: 12, type: "league" },
  { id: "vb", name: "Volleyball (6v6)", season: "Spring 2026", registrationDeadline: "Apr 5", teamsRegistered: 6, maxTeams: 8, type: "league" },
  { id: "sc", name: "Indoor Soccer", season: "Spring 2026", registrationDeadline: "Apr 10", teamsRegistered: 10, maxTeams: 16, type: "league" },
  { id: "bd", name: "Badminton Doubles", season: "Spring 2026", registrationDeadline: "Mar 28", teamsRegistered: 12, maxTeams: 12, type: "tournament" },
  { id: "dg", name: "Dodgeball", season: "Spring 2026", registrationDeadline: "Apr 15", teamsRegistered: 4, maxTeams: 10, type: "tournament" },
];

const Intramurals = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedSport, setSelectedSport] = useState<string | null>(null);
  const [teamName, setTeamName] = useState("");
  const [captainName, setCaptainName] = useState("");
  const [memberInput, setMemberInput] = useState("");
  const [members, setMembers] = useState<string[]>([]);
  const [signedUp, setSignedUp] = useState<Set<string>>(new Set());

  const addMember = () => {
    const name = memberInput.trim();
    if (name && !members.includes(name)) {
      setMembers([...members, name]);
      setMemberInput("");
    }
  };

  const handleRegister = () => {
    if (!selectedSport || !teamName.trim() || !captainName.trim()) return;
    const newTeam: Team = {
      id: crypto.randomUUID(),
      sportId: selectedSport,
      name: teamName.trim(),
      captain: captainName.trim(),
      members: [...members],
    };
    setTeams([...teams, newTeam]);
    setSignedUp(new Set(signedUp).add(selectedSport));
    setTeamName("");
    setCaptainName("");
    setMembers([]);
    setSelectedSport(null);
  };

  return (
    <div className="container py-6">
      <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">Intramural Sports</h1>
      <p className="mt-1 text-sm text-muted-foreground">Browse leagues, sign up your team, and manage rosters.</p>

      {/* Sports list */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {mockSports.map((sport) => {
          const full = sport.teamsRegistered >= sport.maxTeams;
          const registered = signedUp.has(sport.id);
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
                <div className="mt-3">
                  {registered ? (
                    <Button size="sm" variant="outline" disabled className="gap-1.5 w-full">
                      <CheckCircle className="h-4 w-4 text-capacity-low" /> Registered
                    </Button>
                  ) : (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" className="w-full" disabled={full} onClick={() => setSelectedSport(sport.id)}>
                          {full ? "Registration Closed" : "Register Team"}
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Register for {sport.name}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 pt-2">
                          <div>
                            <Label>Team Name</Label>
                            <Input value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="e.g. The Dunkers" className="mt-1" />
                          </div>
                          <div>
                            <Label>Captain Name</Label>
                            <Input value={captainName} onChange={(e) => setCaptainName(e.target.value)} placeholder="Your name" className="mt-1" />
                          </div>
                          <div>
                            <Label>Team Members</Label>
                            <div className="mt-1 flex gap-2">
                              <Input value={memberInput} onChange={(e) => setMemberInput(e.target.value)} placeholder="Member name" onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addMember())} />
                              <Button type="button" size="icon" variant="outline" onClick={addMember}><Plus className="h-4 w-4" /></Button>
                            </div>
                            {members.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                {members.map((m, i) => (
                                  <Badge key={i} variant="secondary" className="gap-1">
                                    {m}
                                    <button className="ml-1 text-xs text-muted-foreground hover:text-destructive" onClick={() => setMembers(members.filter((_, j) => j !== i))}>×</button>
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                          <Button className="w-full" onClick={handleRegister} disabled={!teamName.trim() || !captainName.trim()}>
                            Submit Registration
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* My Teams */}
      {teams.length > 0 && (
        <section className="mt-8">
          <h2 className="font-display text-xl font-bold text-foreground">My Teams</h2>
          <div className="mt-4 space-y-3">
            {teams.map((team) => {
              const sport = mockSports.find((s) => s.id === team.sportId);
              return (
                <Card key={team.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{team.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    <p><span className="font-medium text-foreground">Sport:</span> {sport?.name}</p>
                    <p><span className="font-medium text-foreground">Captain:</span> {team.captain}</p>
                    {team.members.length > 0 && (
                      <p><span className="font-medium text-foreground">Members:</span> {team.members.join(", ")}</p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
};

export default Intramurals;
