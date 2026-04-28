import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown, Loader2, AlertTriangle, PartyPopper, Megaphone } from "lucide-react";
import { toast } from "sonner";

interface EventRow {
  id: string;
  title: string;
  description: string;
  date_label: string;
  type: "event" | "closure" | "news";
  priority: number;
}

const TYPES = [
  { value: "event", label: "Event", icon: PartyPopper },
  { value: "closure", label: "Closure", icon: AlertTriangle },
  { value: "news", label: "News", icon: Megaphone },
] as const;

const empty = (): Omit<EventRow, "id"> => ({
  title: "",
  description: "",
  date_label: "",
  type: "event",
  priority: 100,
});

const EventsManager = () => {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<(EventRow | (Omit<EventRow, "id"> & { id?: string })) | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("events").select("*").order("priority").order("created_at");
    setEvents((data as EventRow[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editing) return;
    if (!editing.title.trim()) {
      toast.error("Title required");
      return;
    }
    setSaving(true);
    if ("id" in editing && editing.id) {
      const { error } = await supabase.from("events").update({
        title: editing.title.trim(),
        description: editing.description,
        date_label: editing.date_label,
        type: editing.type,
        priority: editing.priority,
      }).eq("id", editing.id);
      setSaving(false);
      if (error) return toast.error(error.message);
      toast.success("Event updated");
    } else {
      const maxPriority = events.length ? Math.max(...events.map((e) => e.priority)) : 0;
      const { error } = await supabase.from("events").insert({
        title: editing.title.trim(),
        description: editing.description,
        date_label: editing.date_label,
        type: editing.type,
        priority: editing.priority || maxPriority + 10,
      });
      setSaving(false);
      if (error) return toast.error(error.message);
      toast.success("Event added");
    }
    setEditing(null);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this event?")) return;
    const { error } = await supabase.from("events").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Event deleted");
    load();
  };

  const move = async (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= events.length) return;
    const a = events[idx];
    const b = events[target];
    // Swap priorities
    const { error: e1 } = await supabase.from("events").update({ priority: b.priority }).eq("id", a.id);
    const { error: e2 } = await supabase.from("events").update({ priority: a.priority }).eq("id", b.id);
    if (e1 || e2) return toast.error("Reorder failed");
    load();
  };

  const typeMeta = (t: string) => TYPES.find((x) => x.value === t) ?? TYPES[0];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Drag-free reordering: use the arrows to prioritize.</p>
        <Button size="sm" onClick={() => setEditing(empty())}>
          <Plus className="mr-1.5 h-4 w-4" /> Add event
        </Button>
      </div>

      {loading ? (
        <div className="h-32 animate-pulse rounded-md bg-muted" />
      ) : events.length === 0 ? (
        <p className="text-sm text-muted-foreground">No events yet.</p>
      ) : (
        <ul className="space-y-2">
          {events.map((e, i) => {
            const meta = typeMeta(e.type);
            const Icon = meta.icon;
            return (
              <li key={e.id} className="flex items-start gap-3 rounded-lg border border-border p-3">
                <div className="flex flex-col gap-1">
                  <Button size="icon" variant="ghost" className="h-6 w-6" disabled={i === 0} onClick={() => move(i, -1)}>
                    <ArrowUp className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-6 w-6" disabled={i === events.length - 1} onClick={() => move(i, 1)}>
                    <ArrowDown className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-display text-sm font-semibold text-foreground">{e.title}</h4>
                    <Badge variant="outline" className="text-[10px]">{meta.label}</Badge>
                    {e.date_label && <span className="text-xs text-muted-foreground">{e.date_label}</span>}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{e.description}</p>
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditing(e)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => remove(e.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing && "id" in editing && editing.id ? "Edit event" : "Add event"}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div>
                <Label>Title *</Label>
                <Input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Type</Label>
                  <Select value={editing.type} onValueChange={(v) => setEditing({ ...editing, type: v as EventRow["type"] })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Date label</Label>
                  <Input
                    value={editing.date_label}
                    placeholder="e.g. Apr 18 or May 1 – May 8"
                    onChange={(e) => setEditing({ ...editing, date_label: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  rows={3}
                  value={editing.description}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>
              {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />} Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EventsManager;
