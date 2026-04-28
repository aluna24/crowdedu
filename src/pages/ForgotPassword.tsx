import { useState } from "react";
import { Link } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, ArrowLeft, Mail } from "lucide-react";

const schema = z.object({
  email: z
    .string()
    .email("Enter a valid email")
    .refine((e) => e.toLowerCase().endsWith("@gwu.edu"), "Email must end with @gwu.edu"),
});

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const parsed = schema.safeParse({ email });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    setSubmitting(true);
    try {
      await supabase.functions.invoke("request-student-password-reset", {
        body: {
          email: parsed.data.email,
          redirectTo: `${window.location.origin}/reset-password`,
        },
      });
    } catch {
      // Swallow — UI always shows the same generic message.
    }
    setSubmitting(false);
    setSubmitted(true);
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary">
            <Activity className="h-6 w-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">Reset your password</CardTitle>
          <CardDescription>For student accounts only. Staff: contact your admin to reset your password.</CardDescription>
        </CardHeader>
        <CardContent>
          {submitted ? (
            <div className="space-y-4">
              <div className="rounded-md border border-border bg-secondary/50 p-4 text-center">
                <Mail className="mx-auto mb-2 h-6 w-6 text-primary" />
                <p className="text-sm text-foreground">
                  If a student account exists for that email, a reset link is on its way.
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Check your inbox (and spam folder).
                </p>
              </div>
              <Link to="/login">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back to sign in
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="fp-email">Student email (@gwu.edu)</Label>
                <Input
                  id="fp-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@gwu.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1"
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Sending..." : "Send reset link"}
              </Button>
              <Link to="/login" className="block text-center text-sm text-muted-foreground hover:text-foreground">
                Back to sign in
              </Link>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPassword;
