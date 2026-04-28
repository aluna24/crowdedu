import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { CalendarIcon, Plus, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { SPACES } from "@/data/reservationsSeed";
import { useReservationRequests } from "@/context/ReservationRequestsContext";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ReserveSpaceDialog = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { addRequest } = useReservationRequests();
  const [open, setOpen] = useState(false);

  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [date, setDate] = useState<Date | undefined>();
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [space, setSpace] = useState("");
  const [occupancy, setOccupancy] = useState("");
  const [purpose, setPurpose] = useState("");
  const [special, setSpecial] = useState("");

  const reset = () => {
    setName(user?.name ?? "");
    setEmail(user?.email ?? "");
    setDate(undefined);
    setStartTime("");
    setEndTime("");
    setSpace("");
    setOccupancy("");
    setPurpose("");
    setSpecial("");
  };

  // Not signed in → show login CTA instead of opening the form
  if (!isAuthenticated || !user) {
    return (
      <Button
        size="sm"
        variant="outline"
        className="gap-1.5"
        onClick={() => {
          toast.info("Please sign in to reserve a space.");
          navigate("/login");
        }}
      >
        <LogIn className="h-4 w-4" /> Sign in to Reserve
      </Button>
    );
  }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !date || !startTime || !endTime || !space || !occupancy || !purpose.trim()) {
      toast.error("Please fill out all required fields.");
      return;
    }
    if (!EMAIL_RE.test(email.trim())) {
      toast.error("Please enter a valid email address.");
      return;
    }
    if (endTime <= startTime) {
      toast.error("End time must be after start time.");
      return;
    }
    const occ = parseInt(occupancy, 10);
    if (isNaN(occ) || occ < 1) {
      toast.error("Expected occupancy must be at least 1.");
      return;
    }

    const result = addRequest({
      userId: user.id,
      name: name.trim().slice(0, 100),
      email: email.trim().slice(0, 255),
      date: format(date, "yyyy-MM-dd"),
      startTime,
      endTime,
      space,
      expectedOccupancy: occ,
      purpose: purpose.trim().slice(0, 500),
      specialRequest: special.trim().slice(0, 500) || undefined,
    });

    if (!result.ok) {
      toast.error(result.error ?? "Could not submit request.");
      return;
    }

    toast.success("Reservation request submitted!");
    setOpen(false);
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" /> Reserve a Space
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Request a Reservation</DialogTitle>
          <DialogDescription>
            Submit a request to reserve a space. An admin will review it and approve, deny, or ask for more info.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="name">Name *</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email *</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={255} required />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="start">Start time *</Label>
              <Input id="start" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="end">End time *</Label>
              <Input id="end" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Space *</Label>
            <Select value={space} onValueChange={setSpace}>
              <SelectTrigger><SelectValue placeholder="Select a space" /></SelectTrigger>
              <SelectContent className="max-h-64">
                {SPACES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="occ">Expected occupancy *</Label>
            <Input id="occ" type="number" min={1} max={500} value={occupancy} onChange={(e) => setOccupancy(e.target.value)} required />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="purpose">What is the reservation for? *</Label>
            <Textarea id="purpose" value={purpose} onChange={(e) => setPurpose(e.target.value)} maxLength={500} rows={2} required />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="special">Special requests (tables, chairs, etc.)</Label>
            <Textarea id="special" value={special} onChange={(e) => setSpecial(e.target.value)} maxLength={500} rows={2} placeholder="Optional" />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit">Submit Request</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ReserveSpaceDialog;
