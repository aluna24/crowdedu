import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle, Wrench } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const STATUS_OPTIONS = [
  "Broken",
  "Malfunctioning",
  "Damaged",
  "Worn / Needs replacement",
  "Routine maintenance",
  "Safety concern",
];

interface Props {
  onSubmitted?: () => void;
}

const EquipmentTicketForm = ({ onSubmitted }: Props) => {
  const { user } = useAuth();
  const today = new Date().toISOString().split("T")[0];

  const [employeeName, setEmployeeName] = useState(user?.name ?? "");
  const [reportDate, setReportDate] = useState(today);
  const [equipmentName, setEquipmentName] = useState("");
  const [equipmentNumber, setEquipmentNumber] = useState("");
  const [reportedStatus, setReportedStatus] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeName.trim() || !equipmentName.trim() || !equipmentNumber.trim() || !reportedStatus) {
      toast({ title: "Missing fields", description: "Please fill out all required fields.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("equipment_tickets").insert({
      employee_name: employeeName.trim().slice(0, 100),
      report_date: reportDate,
      equipment_name: equipmentName.trim().slice(0, 100),
      equipment_number: equipmentNumber.trim().slice(0, 50),
      reported_status: reportedStatus,
      note: note.trim().slice(0, 1000) || null,
      submitted_by_user_id: user?.id ?? null,
    });
    setSubmitting(false);
    if (error) {
      toast({ title: "Submission failed", description: error.message, variant: "destructive" });
      return;
    }
    setSuccess(true);
    setEquipmentName("");
    setEquipmentNumber("");
    setReportedStatus("");
    setNote("");
    onSubmitted?.();
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-2">
        <Wrench className="h-5 w-5 text-primary" />
        <h2 className="font-display text-lg font-semibold">Report equipment issue</h2>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="emp-name">Employee name</Label>
          <Input id="emp-name" value={employeeName} onChange={(e) => setEmployeeName(e.target.value)} maxLength={100} required className="mt-1.5" />
        </div>
        <div>
          <Label htmlFor="report-date">Date</Label>
          <Input id="report-date" type="date" value={reportDate} onChange={(e) => setReportDate(e.target.value)} required className="mt-1.5" />
        </div>
        <div>
          <Label htmlFor="eq-name">Equipment name</Label>
          <Input id="eq-name" placeholder="e.g. Treadmill" value={equipmentName} onChange={(e) => setEquipmentName(e.target.value)} maxLength={100} required className="mt-1.5" />
        </div>
        <div>
          <Label htmlFor="eq-num">Equipment number</Label>
          <Input id="eq-num" placeholder="e.g. TM-04" value={equipmentNumber} onChange={(e) => setEquipmentNumber(e.target.value)} maxLength={50} required className="mt-1.5" />
        </div>
      </div>

      <div>
        <Label>Status</Label>
        <Select value={reportedStatus} onValueChange={setReportedStatus}>
          <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select a status" /></SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="note">Note</Label>
        <Textarea id="note" rows={3} value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} placeholder="Describe the issue..." className="mt-1.5" />
      </div>

      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? "Submitting…" : "Submit ticket"}
      </Button>

      {success && (
        <div className="flex items-center gap-2 rounded-md bg-capacity-low-bg p-3 text-sm font-medium text-capacity-low">
          <CheckCircle className="h-4 w-4" /> Ticket submitted!
        </div>
      )}
    </form>
  );
};

export default EquipmentTicketForm;
