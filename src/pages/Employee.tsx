import { useState } from "react";
import { useGym, FLOOR_DB_MAP } from "@/context/GymContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle } from "lucide-react";

const Employee = () => {
  const { floors } = useGym();
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(floors.map((f) => [f.id, ""]))
  );
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const setValue = (id: string, val: string) => {
    setValues((prev) => ({ ...prev, [id]: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    // Validate all fields
    for (const floor of floors) {
      const raw = values[floor.id]?.trim();
      if (!raw) {
        setError(`Please enter a count for ${floor.name}.`);
        return;
      }
      const num = parseInt(raw, 10);
      if (isNaN(num) || num < 0) {
        setError(`${floor.name}: please enter a valid non-negative number.`);
        return;
      }
      if (num > floor.maxCapacity) {
        setError(`${floor.name}: count cannot exceed max capacity (${floor.maxCapacity}).`);
        return;
      }
    }

    setSubmitting(true);

    const now = new Date();
    const dateStr = now.toISOString().split("T")[0];
    const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });

    const row: Record<string, unknown> = { Date: dateStr, Time: timeStr };
    for (const floor of floors) {
      const col = FLOOR_DB_MAP[floor.id];
      if (col) row[col] = parseInt(values[floor.id], 10);
    }

    const { error: insertError } = await supabase.from("facility_count").insert(row as any);
    setSubmitting(false);

    if (insertError) {
      setError("Failed to submit headcount. Please try again.");
      console.error("Insert error:", insertError);
      return;
    }

    setSuccess(true);
    setValues(Object.fromEntries(floors.map((f) => [f.id, ""])));
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <div className="container max-w-lg py-6">
      <h1 className="font-display text-2xl font-bold text-foreground">Headcount Entry</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Enter the current headcount for each area below. All fields are required.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {floors.map((floor) => (
          <div key={floor.id}>
            <Label htmlFor={`hc-${floor.id}`}>
              {floor.name}{" "}
              <span className="text-muted-foreground font-normal">(max {floor.maxCapacity})</span>
            </Label>
            <Input
              id={`hc-${floor.id}`}
              type="number"
              min={0}
              max={floor.maxCapacity}
              placeholder="0"
              value={values[floor.id]}
              onChange={(e) => setValue(floor.id, e.target.value)}
              className="mt-1.5"
              required
            />
          </div>
        ))}

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? "Submitting…" : "Submit All Headcounts"}
        </Button>

        {success && (
          <div className="flex items-center gap-2 rounded-md bg-capacity-low-bg p-3 text-sm font-medium text-capacity-low">
            <CheckCircle className="h-4 w-4" />
            All headcounts updated!
          </div>
        )}
      </form>
    </div>
  );
};

export default Employee;
