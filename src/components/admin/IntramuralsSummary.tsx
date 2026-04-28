import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Trophy } from "lucide-react";
import { mockSports } from "@/pages/Intramurals";

interface Team {
  id: string;
  sport_id: string;
  approval_status: string | null;
}

const IntramuralsSummary = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("intramural_teams").select("id, sport_id, approval_status");
      setTeams((data as Team[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const pending = teams.filter((t) => t.approval_status === "pending").length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Quick summary of intramural teams. Full management lives on the Intramurals page.
        </p>
        <Link to="/intramurals">
          <Button size="sm" variant="outline">
            Open Intramurals <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Total teams</div>
            <div className="mt-2 font-display text-2xl font-bold">{loading ? "—" : teams.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Pending approval</div>
            <div className="mt-2 font-display text-2xl font-bold">{loading ? "—" : pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Active sports</div>
            <div className="mt-2 font-display text-2xl font-bold">{mockSports.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Trophy className="h-4 w-4 text-primary" /> Teams per sport
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="divide-y divide-border">
            {mockSports.map((s) => {
              const count = teams.filter((t) => t.sport_id === s.id).length;
              return (
                <li key={s.id} className="flex items-center justify-between py-2 text-sm">
                  <span className="font-medium text-foreground">{s.name}</span>
                  <Badge variant="secondary">{count} {count === 1 ? "team" : "teams"}</Badge>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default IntramuralsSummary;
