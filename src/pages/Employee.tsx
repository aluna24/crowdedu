import { useState } from "react";
import { useGym } from "@/context/GymContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle } from "lucide-react";

const Employee = () => {
  const { updateHeadcount, currentCount, maxCapacity } = useGym();
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    const num = parseInt(value, 10);
    if (isNaN(num) || num < 0) {
      setError("Please enter a valid non-negative number.");
      return;
    }
    if (num > maxCapacity) {
      setError(`Count cannot exceed max capacity (${maxCapacity}).`);
      return;
    }

    updateHeadcount(num);
    setSuccess(true);
    setValue("");
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <div className="container max-w-md py-6">
      <h1 className="font-display text-2xl font-bold text-foreground">
        Headcount Entry
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Submit the current headcount to update the dashboard in real-time.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <Label htmlFor="headcount">Current Headcount</Label>
          <Input
            id="headcount"
            type="number"
            min={0}
            max={maxCapacity}
            placeholder={`e.g. ${currentCount}`}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="mt-1.5"
          />
          {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
        </div>

        <Button type="submit" className="w-full">
          Submit Headcount
        </Button>

        {success && (
          <div className="flex items-center gap-2 rounded-md bg-capacity-low-bg p-3 text-sm font-medium text-capacity-low">
            <CheckCircle className="h-4 w-4" />
            Headcount updated successfully!
          </div>
        )}
      </form>
    </div>
  );
};

export default Employee;
