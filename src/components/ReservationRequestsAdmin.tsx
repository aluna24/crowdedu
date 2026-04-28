import { useState } from "react";
import { Check, X, MessageCircleQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useReservationRequests } from "@/context/ReservationRequestsContext";
import { toast } from "sonner";

type ActionMode = "deny" | "info";

const ReservationRequestsAdmin = () => {
  const { requests, approveRequest, denyRequest, requestInfo } = useReservationRequests();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [mode, setMode] = useState<ActionMode>("deny");
  const [message, setMessage] = useState("");

  const sorted = [...requests].sort((a, b) => {
    const order = { pending: 0, info_requested: 1, approved: 2, denied: 3 } as const;
    return order[a.status] - order[b.status];
  });

  const openDialog = (id: string, m: ActionMode, prefill = "") => {
    setActiveId(id);
    setMode(m);
    setMessage(prefill);
  };

  const submit = () => {
    if (!activeId) return;
    if (!message.trim()) {
      toast.error(mode === "deny" ? "Please provide a reason for denial." : "Please specify what info is needed.");
      return;
    }
    const trimmed = message.trim().slice(0, 500);
    if (mode === "deny") {
      denyRequest(activeId, trimmed);
      toast.success("Request denied.");
    } else {
      requestInfo(activeId, trimmed);
      toast.success("Info request sent.");
    }
    setActiveId(null);
    setMessage("");
  };

  if (sorted.length === 0) {
    return <p className="text-sm text-muted-foreground">No reservation requests yet.</p>;
  }

  return (
    <>
      <ul className="space-y-3">
        {sorted.map((r) => {
          const actionable = r.status === "pending" || r.status === "info_requested";
          return (
            <li key={r.id} className="rounded-lg border border-border p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-foreground">{r.space}</span>
                    {r.status === "pending" && <Badge variant="secondary">Pending</Badge>}
                    {r.status === "info_requested" && (
                      <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 gap-1">
                        <MessageCircleQuestion className="h-3 w-3" /> Info Requested
                      </Badge>
                    )}
                    {r.status === "approved" && <Badge className="bg-capacity-low text-capacity-low-bg">Approved</Badge>}
                    {r.status === "denied" && <Badge variant="destructive">Denied</Badge>}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {r.date} • {r.startTime}–{r.endTime} • {r.expectedOccupancy} people
                  </p>
                  <p className="mt-1 text-sm"><span className="font-medium">Requested by:</span> {r.name} <span className="text-muted-foreground">({r.email})</span></p>
                  <p className="mt-1 text-sm"><span className="font-medium">Purpose:</span> {r.purpose}</p>
                  {r.specialRequest && (
                    <p className="mt-1 text-sm"><span className="font-medium">Special:</span> {r.specialRequest}</p>
                  )}
                  {r.status === "info_requested" && r.infoRequest && (
                    <p className="mt-1 text-sm text-amber-700 dark:text-amber-400"><span className="font-medium">Info needed:</span> {r.infoRequest}</p>
                  )}
                  {r.status === "denied" && r.denialReason && (
                    <p className="mt-1 text-sm text-destructive"><span className="font-medium">Reason:</span> {r.denialReason}</p>
                  )}
                </div>
                {actionable && (
                  <div className="flex gap-2 flex-wrap">
                    <Button size="sm" onClick={() => { approveRequest(r.id); toast.success("Request approved."); }}>
                      <Check className="h-4 w-4 mr-1" /> Approve
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => openDialog(r.id, "info", r.infoRequest ?? "")}>
                      <MessageCircleQuestion className="h-4 w-4 mr-1" /> {r.status === "info_requested" ? "Update Info Request" : "Request Info"}
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => openDialog(r.id, "deny")}>
                      <X className="h-4 w-4 mr-1" /> Deny
                    </Button>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <Dialog open={!!activeId} onOpenChange={(o) => { if (!o) { setActiveId(null); setMessage(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{mode === "deny" ? "Deny Reservation Request" : "Request More Information"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="msg">
              {mode === "deny" ? "Reason for denial *" : "What information do you need from the requester? *"}
            </Label>
            <Textarea
              id="msg"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder={mode === "info" ? "e.g. Please confirm exact attendee count and whether you'll need A/V equipment." : ""}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActiveId(null)}>Cancel</Button>
            <Button variant={mode === "deny" ? "destructive" : "default"} onClick={submit}>
              {mode === "deny" ? "Confirm Denial" : "Send Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ReservationRequestsAdmin;
