import { useState } from "react";
import { useGym, FLOOR_DB_MAP } from "@/context/GymContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle } from "lucide-react";

const Employee = () => {
  const { floors } = useGym();
  const [selectedFloor, setSelectedFloor] = useState(floors[0].id);
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const floor = floors.find((f) => f.id === selectedFloor)!;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    const num = parseInt(value, 10);
    if (isNaN(num) || num < 0) {
      setError("Please enter a valid non-negative number.");
      return;
    }
    if (num > floor.maxCapacity) {
      setError(`Count cannot exceed max capacity (${floor.maxCapacity}) for ${floor.name}.`);
      return;
    }

    setSubmitting(true);

    // Build the row with all current counts, updating only the selected floor
    const now = new Date();
    const dateStr = now.toISOString().split("T")[0];
    const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });

    const row: Record<string, unknown> = {
      Date: dateStr,
      Time: timeStr,
    };

    for (const f of floors) {
      const col = FLOOR_DB_MAP[f.id];
      if (col) {
        row[col] = f.id === selectedFloor ? num : f.currentCount;
      }
    }

    const { error: insertError } = await supabase.from("facility_count").insert(row as any);

    setSubmitting(false);

    if (insertError) {
      setError("Failed to submit headcount. Please try again.");
      console.error("Insert error:", insertError);
      return;
    }

    setSuccess(true);
    setValue("");
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <div className="container max-w-md py-6">
      <h1 className="font-display text-2xl font-bold text-foreground">Headcount Entry</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Select an area and submit the current headcount.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <Label>Area</Label>
          <Select value={selectedFloor} onValueChange={setSelectedFloor}>
            <SelectTrigger className="mt-1.5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {floors.map((f) => (
                <SelectItem key={f.id} value={f.id}>
                  {f.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="headcount">
            Current Headcount{" "}
            <span className="text-muted-foreground font-normal">(max {floor.maxCapacity})</span>
          </Label>
          <Input
            id="headcount"
            type="number"
            min={0}
            max={floor.maxCapacity}
            placeholder={`e.g. ${floor.currentCount}`}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="mt-1.5"
          />
          {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
        </div>

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? "Submitting…" : "Submit Headcount"}
        </Button>

        {success && (
          <div className="flex items-center gap-2 rounded-md bg-capacity-low-bg p-3 text-sm font-medium text-capacity-low">
            <CheckCircle className="h-4 w-4" />
            {floor.name} headcount updated!
          </div>
        )}
      </form>
    </div>
  );
};

export default Employee;
