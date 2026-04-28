import { CheckCircle2, Clock, X, Trash2, MessageCircleQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useReservationRequests } from "@/context/ReservationRequestsContext";
import { useAuth } from "@/context/AuthContext";

const MyReservationRequests = () => {
  const { user } = useAuth();
  const { requests, clearRequest } = useReservationRequests();
  const mine = requests.filter((r) => r.userId === (user?.id ?? "guest"));

  if (mine.length === 0) return null;

  return (
    <section className="mb-6 rounded-lg border border-border bg-card p-4">
      <h2 className="font-display text-lg font-semibold mb-3">My Reservation Requests</h2>
      <ul className="space-y-2">
        {mine.map((r) => (
          <li key={r.id} className="flex flex-wrap items-start gap-3 rounded-md border border-border p-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-foreground">{r.space}</span>
                <span className="text-xs text-muted-foreground">
                  {r.date} • {r.startTime}–{r.endTime}
                </span>
                {r.status === "pending" && (
                  <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" /> Pending</Badge>
                )}
                {r.status === "approved" && (
                  <Badge className="bg-capacity-low text-capacity-low-bg gap-1"><CheckCircle2 className="h-3 w-3" /> Approved</Badge>
                )}
                {r.status === "denied" && (
                  <Badge variant="destructive" className="gap-1"><X className="h-3 w-3" /> Denied</Badge>
                )}
                {r.status === "info_requested" && (
                  <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 gap-1">
                    <MessageCircleQuestion className="h-3 w-3" /> Info Requested
                  </Badge>
                )}
              </div>
              <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{r.purpose}</p>
              {r.specialRequest && (
                <p className="mt-0.5 text-xs text-muted-foreground"><span className="font-medium">Special:</span> {r.specialRequest}</p>
              )}
              {r.status === "info_requested" && r.infoRequest && (
                <p className="mt-1 text-xs text-amber-700 dark:text-amber-400"><span className="font-medium">Admin needs:</span> {r.infoRequest}</p>
              )}
              {r.status === "denied" && r.denialReason && (
                <p className="mt-1 text-xs text-destructive"><span className="font-medium">Reason:</span> {r.denialReason}</p>
              )}
            </div>
            {(r.status === "denied" || r.status === "info_requested") && (
              <Button variant="ghost" size="sm" onClick={() => clearRequest(r.id)}>
                <Trash2 className="h-4 w-4 mr-1" /> Clear
              </Button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
};

export default MyReservationRequests;
