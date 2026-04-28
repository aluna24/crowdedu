import { useState } from "react";
import { Check, X } from "lucide-react";
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

const ReservationRequestsAdmin = () => {
  const { requests, approveRequest, denyRequest } = useReservationRequests();
  const [denyId, setDenyId] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  const sorted = [...requests].sort((a, b) => {
    const order = { pending: 0, approved: 1, denied: 2 } as const;
    return order[a.status] - order[b.status];
  });

  const submitDeny = () => {
    if (!denyId) return;
    if (!reason.trim()) {
      toast.error("Please provide a reason for denial.");
      return;
    }
    denyRequest(denyId, reason.trim().slice(0, 500));
    toast.success("Request denied.");
    setDenyId(null);
    setReason("");
  };

  if (sorted.length === 0) {
    return <p className="text-sm text-muted-foreground">No reservation requests yet.</p>;
  }

  return (
    <>
      <ul className="space-y-3">
        {sorted.map((r) => (
          <li key={r.id} className="rounded-lg border border-border p-4">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-foreground">{r.space}</span>
                  {r.status === "pending" && <Badge variant="secondary">Pending</Badge>}
                  {r.status === "approved" && <Badge className="bg-capacity-low text-capacity-low-bg">Approved</Badge>}
                  {r.status === "denied" && <Badge variant="destructive">Denied</Badge>}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {r.date} • {r.startTime}–{r.endTime} • {r.expectedOccupancy} people
                </p>
                <p className="mt-1 text-sm"><span className="font-medium">Requested by:</span> {r.name}</p>
                <p className="mt-1 text-sm"><span className="font-medium">Purpose:</span> {r.purpose}</p>
                {r.specialRequest && (
                  <p className="mt-1 text-sm"><span className="font-medium">Special:</span> {r.specialRequest}</p>
                )}
                {r.status === "denied" && r.denialReason && (
                  <p className="mt-1 text-sm text-destructive"><span className="font-medium">Reason:</span> {r.denialReason}</p>
                )}
              </div>
              {r.status === "pending" && (
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => { approveRequest(r.id); toast.success("Request approved."); }}>
                    <Check className="h-4 w-4 mr-1" /> Approve
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => { setDenyId(r.id); setReason(""); }}>
                    <X className="h-4 w-4 mr-1" /> Deny
                  </Button>
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>

      <Dialog open={!!denyId} onOpenChange={(o) => { if (!o) { setDenyId(null); setReason(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deny Reservation Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for denial *</Label>
            <Textarea id="reason" value={reason} onChange={(e) => setReason(e.target.value)} rows={3} maxLength={500} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDenyId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={submitDeny}>Confirm Denial</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ReservationRequestsAdmin;
