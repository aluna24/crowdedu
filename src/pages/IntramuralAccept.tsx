import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Loader2, AlertCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const mockSports: Record<string, string> = {
  bb: "Basketball (5v5)",
  vb: "Volleyball (6v6)",
  sc: "Indoor Soccer",
  bd: "Badminton Doubles",
  dg: "Dodgeball",
};

interface InviteData {
  id: string;
  member_name: string;
  member_email: string;
  status: string;
  team: {
    team_name: string;
    sport_id: string;
    captain_name: string;
  } | null;
}

const IntramuralAccept = () => {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [invite, setInvite] = useState<InviteData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError("Missing invitation token.");
      setLoading(false);
      return;
    }
    (async () => {
      const { data, error } = await supabase
        .rpc("get_invite_by_token", { p_token: token })
        .maybeSingle();
      if (error || !data) {
        setError("Invitation not found or invalid.");
      } else {
        const row = data as {
          id: string;
          member_name: string;
          member_email: string;
          status: string;
          team_name: string;
          sport_id: string;
          captain_name: string;
        };
        setInvite({
          id: row.id,
          member_name: row.member_name,
          member_email: row.member_email,
          status: row.status,
          team: {
            team_name: row.team_name,
            sport_id: row.sport_id,
            captain_name: row.captain_name,
          },
        });
      }
      setLoading(false);
    })();
  }, [token]);

  const respond = async (response: "accepted" | "declined") => {
    if (!token) return;
    setSubmitting(true);
    const { data, error } = await supabase.rpc("respond_to_invite", { p_token: token, p_response: response });
    setSubmitting(false);
    const result = data as { success: boolean; error?: string; status?: string } | null;
    if (error || !result?.success) {
      toast({ title: "Could not respond", description: result?.error || error?.message, variant: "destructive" });
      return;
    }
    setInvite((prev) => (prev ? { ...prev, status: response } : prev));
    toast({ title: response === "accepted" ? "Invitation accepted" : "Invitation declined" });
  };

  return (
    <div className="container max-w-xl py-10">
      <Card>
        <CardHeader>
          <CardTitle className="font-display">Team Invitation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading invitation…</div>
          ) : error ? (
            <div className="flex items-start gap-2 text-destructive"><AlertCircle className="h-4 w-4 mt-0.5" /><span>{error}</span></div>
          ) : invite && invite.team ? (
            <>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Hi <span className="font-medium text-foreground">{invite.member_name}</span>,</p>
                <p className="text-sm text-foreground">
                  <span className="font-medium">{invite.team.captain_name}</span> has invited you to join
                  <span className="font-medium"> {invite.team.team_name}</span> for
                  <span className="font-medium"> {mockSports[invite.team.sport_id] || invite.team.sport_id}</span>.
                </p>
              </div>

              {invite.status === "pending" ? (
                <div className="flex gap-2 pt-2">
                  <Button onClick={() => respond("accepted")} disabled={submitting} className="flex-1">
                    <CheckCircle className="h-4 w-4" /> Accept
                  </Button>
                  <Button onClick={() => respond("declined")} disabled={submitting} variant="outline" className="flex-1">
                    <XCircle className="h-4 w-4" /> Decline
                  </Button>
                </div>
              ) : (
                <div className="pt-2">
                  <Badge variant={invite.status === "accepted" ? "secondary" : "destructive"} className="capitalize">
                    {invite.status === "accepted" ? "You've accepted this invitation" : "You've declined this invitation"}
                  </Badge>
                </div>
              )}

              <div className="pt-4 border-t">
                <Link to="/intramurals" className="text-sm text-primary hover:underline">← Browse intramurals</Link>
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
};

export default IntramuralAccept;
