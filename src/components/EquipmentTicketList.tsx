import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { AlertCircle, Eye, Loader2 } from "lucide-react";

export interface EquipmentTicket {
  id: string;
  employee_name: string;
  report_date: string;
  equipment_name: string;
  equipment_number: string;
  reported_status: string;
  note: string | null;
  review_status: string;
  resolution_status: string | null;
  admin_notes: string | null;
  submitted_by_user_id: string | null;
  created_at: string;
  updated_at: string;
}

const RESOLUTION_OPTIONS = [
  { value: "being_addressed", label: "Being addressed" },
  { value: "being_replaced", label: "Being replaced" },
  { value: "being_removed", label: "Being removed" },
  { value: "fixed", label: "Fixed" },
];

const resolutionLabel = (v: string | null) =>
  RESOLUTION_OPTIONS.find((o) => o.value === v)?.label ?? null;

const resolutionVariant = (v: string | null): "default" | "secondary" | "destructive" | "outline" => {
  switch (v) {
    case "fixed": return "default";
    case "being_addressed": return "secondary";
    case "being_replaced": return "outline";
    case "being_removed": return "destructive";
    default: return "outline";
  }
};

interface Props {
  /** admin: full controls, employee: view-only filtered to own user */
  mode: "admin" | "employee";
  userId?: string;
  refreshKey?: number;
}

const EquipmentTicketList = ({ mode, userId, refreshKey }: Props) => {
  const [tickets, setTickets] = useState<EquipmentTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState<Record<string, { resolution_status: string; admin_notes: string }>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const fetchTickets = async () => {
    setLoading(true);
    let q = supabase.from("equipment_tickets").select("*").order("created_at", { ascending: false });
    if (mode === "employee" && userId) q = q.eq("submitted_by_user_id", userId);
    const { data, error } = await q;
    if (error) {
      toast({ title: "Failed to load tickets", description: error.message, variant: "destructive" });
    } else {
      setTickets((data ?? []) as EquipmentTicket[]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchTickets(); /* eslint-disable-next-line */ }, [mode, userId, refreshKey]);

  const markRead = async (id: string) => {
    const { error } = await supabase.from("equipment_tickets").update({ review_status: "read" }).eq("id", id);
    if (error) {
      toast({ title: "Failed", description: error.message, variant: "destructive" });
      return;
    }
    setTickets((prev) => prev.map((t) => (t.id === id ? { ...t, review_status: "read" } : t)));
  };

  const saveResolution = async (id: string) => {
    const draft = drafts[id];
    if (!draft?.resolution_status) {
      toast({ title: "Pick a status", variant: "destructive" });
      return;
    }
    setSavingId(id);
    const { error } = await supabase.from("equipment_tickets").update({
      resolution_status: draft.resolution_status,
      admin_notes: (draft.admin_notes || "").slice(0, 1000) || null,
      review_status: "read",
    }).eq("id", id);
    setSavingId(null);
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Ticket updated" });
    setTickets((prev) => prev.map((t) => (t.id === id ? {
      ...t,
      resolution_status: draft.resolution_status,
      admin_notes: draft.admin_notes || null,
      review_status: "read",
    } : t)));
  };

  const setDraft = (id: string, patch: Partial<{ resolution_status: string; admin_notes: string }>) => {
    setDrafts((prev) => ({
      ...prev,
      [id]: { resolution_status: prev[id]?.resolution_status ?? "", admin_notes: prev[id]?.admin_notes ?? "", ...patch },
    }));
  };

  if (loading) {
    return <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading tickets…</div>;
  }

  if (tickets.length === 0) {
    return <p className="text-sm text-muted-foreground">No equipment tickets {mode === "employee" ? "submitted yet." : "to review."}</p>;
  }

  return (
    <div className="space-y-3">
      {tickets.map((t) => {
        const draft = drafts[t.id] ?? {
          resolution_status: t.resolution_status ?? "",
          admin_notes: t.admin_notes ?? "",
        };
        return (
          <Card key={t.id}>
            <CardContent className="space-y-3 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-foreground">
                    {t.equipment_name} <span className="text-muted-foreground font-normal">#{t.equipment_number}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t.employee_name} · {t.report_date}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {t.review_status === "needs_attention" ? (
                    <Badge variant="destructive" className="gap-1"><AlertCircle className="h-3 w-3" /> Needs attention</Badge>
                  ) : (
                    <Badge variant="secondary" className="gap-1"><Eye className="h-3 w-3" /> Read</Badge>
                  )}
                  {t.resolution_status && (
                    <Badge variant={resolutionVariant(t.resolution_status)}>{resolutionLabel(t.resolution_status)}</Badge>
                  )}
                </div>
              </div>

              <div className="text-sm">
                <span className="font-medium">Reported status:</span> {t.reported_status}
              </div>
              {t.note && (
                <div className="rounded-md bg-secondary/50 p-2 text-sm">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Employee note</p>
                  <p className="mt-1 text-foreground">{t.note}</p>
                </div>
              )}

              {mode === "admin" ? (
                <div className="space-y-3 border-t border-border pt-3">
                  {t.review_status === "needs_attention" && (
                    <Button type="button" variant="outline" size="sm" onClick={() => markRead(t.id)}>
                      <Eye className="mr-1.5 h-4 w-4" /> Mark as read
                    </Button>
                  )}
                  <div>
                    <Label>Resolution status</Label>
                    <Select value={draft.resolution_status} onValueChange={(v) => setDraft(t.id, { resolution_status: v })}>
                      <SelectTrigger className="mt-1.5"><SelectValue placeholder="Pick a status" /></SelectTrigger>
                      <SelectContent>
                        {RESOLUTION_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor={`notes-${t.id}`}>Admin notes</Label>
                    <Textarea
                      id={`notes-${t.id}`}
                      rows={2}
                      maxLength={1000}
                      value={draft.admin_notes}
                      onChange={(e) => setDraft(t.id, { admin_notes: e.target.value })}
                      placeholder="Details for the employee..."
                      className="mt-1.5"
                    />
                  </div>
                  <Button size="sm" onClick={() => saveResolution(t.id)} disabled={savingId === t.id}>
                    {savingId === t.id ? "Saving…" : "Save update"}
                  </Button>
                </div>
              ) : (
                t.admin_notes && (
                  <div className="rounded-md border border-primary/30 bg-primary/5 p-2 text-sm">
                    <p className="text-xs font-medium uppercase tracking-wider text-primary">Admin update</p>
                    <p className="mt-1 text-foreground">{t.admin_notes}</p>
                  </div>
                )
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default EquipmentTicketList;
