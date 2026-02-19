import { useState } from "react";
import { useGym } from "@/context/GymContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle, Trash2 } from "lucide-react";

const Admin = () => {
  const { announcement, setAnnouncement, clearAnnouncement } = useGym();
  const [draft, setDraft] = useState(announcement);
  const [success, setSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setAnnouncement(draft.trim());
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  const handleClear = () => {
    clearAnnouncement();
    setDraft("");
  };

  return (
    <div className="container max-w-md py-6">
      <h1 className="font-display text-2xl font-bold text-foreground">
        Admin Panel
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Post closures, hour changes, and emergency announcements.
      </p>

      <form onSubmit={handleSave} className="mt-6 space-y-4">
        <div>
          <Label htmlFor="announcement">Announcement</Label>
          <Textarea
            id="announcement"
            rows={4}
            placeholder="e.g. The pool area is closed for maintenance until Friday."
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="mt-1.5"
          />
        </div>

        <div className="flex gap-3">
          <Button type="submit" className="flex-1">
            Save Announcement
          </Button>
          {announcement && (
            <Button type="button" variant="outline" onClick={handleClear}>
              <Trash2 className="mr-1.5 h-4 w-4" />
              Clear
            </Button>
          )}
        </div>

        {success && (
          <div className="flex items-center gap-2 rounded-md bg-capacity-low-bg p-3 text-sm font-medium text-capacity-low">
            <CheckCircle className="h-4 w-4" />
            Announcement saved!
          </div>
        )}
      </form>

      {announcement && (
        <div className="mt-6 rounded-lg border border-border bg-secondary/50 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Current Announcement
          </p>
          <p className="mt-2 text-sm text-foreground">{announcement}</p>
        </div>
      )}
    </div>
  );
};

export default Admin;
