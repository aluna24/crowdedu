import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Pencil, X, RotateCcw, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface FitnessClass {
  id: string;
  name: string;
  instructor: string;
  day: string;
  time: string;
  location: string;
  category: string;
  max_spots: number;
  current_enrolled: number;
  status: string;
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const ClassesManager = () => {
  const [classes, setClasses] = useState<FitnessClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [dayFilter, setDayFilter] = useState<string>("all");
  const [showCancelled, setShowCancelled] = useState(false);
  const [editing, setEditing] = useState<FitnessClass | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("fitness_classes").select("*").order("day").order("time");
    setClasses((data as FitnessClass[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = classes.filter((c) => {
    if (!showCancelled && c.status === "cancelled") return false;
    if (dayFilter !== "all" && c.day !== dayFilter) return false;
    return true;
  });

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    const { error } = await supabase
      .from("fitness_classes")
      .update({
        name: editing.name,
        instructor: editing.instructor,
        day: editing.day,
        time: editing.time,
        location: editing.location,
        max_spots: editing.max_spots,
      })
      .eq("id", editing.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Class updated.");
    setEditing(null);
    load();
  };

  const handleCancel = async (id: string) => {
    const { error } = await supabase.from("fitness_classes").update({ status: "cancelled" }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Class cancelled.");
    load();
  };

  const handleRestore = async (id: string) => {
    const { error } = await supabase.from("fitness_classes").update({ status: "active" }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Class restored.");
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <Label className="text-xs">Day</Label>
          <Select value={dayFilter} onValueChange={setDayFilter}>
            <SelectTrigger className="mt-1 w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All days</SelectItem>
              {DAYS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Button
          variant={showCancelled ? "default" : "outline"}
          size="sm"
          onClick={() => setShowCancelled((s) => !s)}
        >
          {showCancelled ? "Hiding nothing" : "Show cancelled"}
        </Button>
        <span className="text-xs text-muted-foreground ml-auto">{filtered.length} classes</span>
      </div>

      {loading ? (
        <div className="flex h-32 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">Class</th>
                <th className="px-3 py-2 text-left">Instructor</th>
                <th className="px-3 py-2 text-left">When</th>
                <th className="px-3 py-2 text-left">Location</th>
                <th className="px-3 py-2 text-left">Enrolled</th>
                <th className="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-t border-border">
                  <td className="px-3 py-2">
                    <div className="font-medium text-foreground flex items-center gap-2">
                      {c.name}
                      {c.status === "cancelled" && <Badge variant="destructive" className="text-[10px]">Cancelled</Badge>}
                    </div>
                    <div className="text-xs text-muted-foreground">{c.category}</div>
                  </td>
                  <td className="px-3 py-2">{c.instructor}</td>
                  <td className="px-3 py-2">{c.day} · {c.time}</td>
                  <td className="px-3 py-2">{c.location}</td>
                  <td className="px-3 py-2">{c.current_enrolled}/{c.max_spots}</td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex justify-end gap-1.5">
                      <Button size="sm" variant="ghost" onClick={() => setEditing(c)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      {c.status === "cancelled" ? (
                        <Button size="sm" variant="ghost" onClick={() => handleRestore(c.id)}>
                          <RotateCcw className="h-3.5 w-3.5" />
                        </Button>
                      ) : (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="ghost" className="text-destructive">
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Cancel {c.name}?</AlertDialogTitle>
                              <AlertDialogDescription>
                                The class will be hidden from students. {c.current_enrolled} students are currently enrolled — please notify them separately.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Keep class</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleCancel(c.id)}>
                                Cancel class
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">No classes match.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit class</DialogTitle></DialogHeader>
          {editing && (
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label>Name</Label>
                <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
              </div>
              <div className="col-span-2">
                <Label>Instructor</Label>
                <Input value={editing.instructor} onChange={(e) => setEditing({ ...editing, instructor: e.target.value })} />
              </div>
              <div>
                <Label>Day</Label>
                <Select value={editing.day} onValueChange={(v) => setEditing({ ...editing, day: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DAYS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Time</Label>
                <Input value={editing.time} onChange={(e) => setEditing({ ...editing, time: e.target.value })} placeholder="6:00 PM" />
              </div>
              <div className="col-span-2">
                <Label>Location</Label>
                <Input value={editing.location} onChange={(e) => setEditing({ ...editing, location: e.target.value })} />
              </div>
              <div>
                <Label>Max spots</Label>
                <Input type="number" min={1} value={editing.max_spots}
                  onChange={(e) => setEditing({ ...editing, max_spots: parseInt(e.target.value || "0", 10) })} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />} Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClassesManager;
