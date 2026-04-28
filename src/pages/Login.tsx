import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, LogIn, UserPlus, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

const MicrosoftIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 23 23" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <rect x="1" y="1" width="10" height="10" fill="#F25022" />
    <rect x="12" y="1" width="10" height="10" fill="#7FBA00" />
    <rect x="1" y="12" width="10" height="10" fill="#00A4EF" />
    <rect x="12" y="12" width="10" height="10" fill="#FFB900" />
  </svg>
);

const signInSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

const signUpSchema = z
  .object({
    fullName: z.string().min(2, "Enter your full name").max(100),
    email: z
      .string()
      .email("Enter a valid email")
      .refine((e) => e.toLowerCase().endsWith("@gwu.edu"), "Email must end with @gwu.edu"),
    password: z.string().min(8, "Password must be at least 8 characters").max(72),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, { message: "Passwords do not match", path: ["confirm"] });

const Login = () => {
  const { login, signUp, signInWithAzure, checkAzureSSO, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [signInData, setSignInData] = useState({ email: "", password: "" });
  const [signUpData, setSignUpData] = useState({ fullName: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) {
    navigate("/");
    return null;
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const parsed = signInSchema.safeParse(signInData);
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    setSubmitting(true);
    const res = await login(parsed.data.email, parsed.data.password);
    setSubmitting(false);
    if (res.ok) navigate("/");
    else setError(res.error || "Invalid email or password.");
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const parsed = signUpSchema.safeParse(signUpData);
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    setSubmitting(true);
    const res = await signUp(parsed.data.email, parsed.data.fullName, parsed.data.password);
    setSubmitting(false);
    if (res.ok) navigate("/");
    else setError(res.error || "Sign up failed.");
  };

  const handleAzure = async () => {
    setError("");
    setSubmitting(true);
    const res = await signInWithAzure();
    setSubmitting(false);
    if (!res.ok) setError(res.error || "Microsoft sign-in failed.");
  };

  const handleCheckSSO = async () => {
    const res = await checkAzureSSO();
    if (res.ok) {
      toast.success("Microsoft SSO is configured and reachable.");
    } else {
      toast.error("Microsoft SSO unavailable", {
        description: res.error || "Enable Azure provider in Supabase Auth settings.",
      });
    }
  };
  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary">
            <Activity className="h-6 w-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">Welcome to CrowdEDU</CardTitle>
          <CardDescription>Sign in or create your student account</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" onValueChange={() => setError("")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4 mt-2">
                <div>
                  <Label htmlFor="si-email">Email</Label>
                  <Input id="si-email" type="email" autoComplete="email" value={signInData.email}
                    onChange={(e) => setSignInData({ ...signInData, email: e.target.value })} className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="si-password">Password</Label>
                  <Input id="si-password" type="password" autoComplete="current-password" value={signInData.password}
                    onChange={(e) => setSignInData({ ...signInData, password: e.target.value })} className="mt-1" />
                </div>
                <div className="flex justify-end">
                  <Link
                    to="/forgot-password"
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Forgot password?
                  </Link>
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button type="submit" className="w-full" disabled={submitting}>
                  <LogIn className="mr-2 h-4 w-4" /> Sign In
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4 mt-2">
                <div>
                  <Label htmlFor="su-name">Full Name</Label>
                  <Input id="su-name" value={signUpData.fullName}
                    onChange={(e) => setSignUpData({ ...signUpData, fullName: e.target.value })} className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="su-email">Email (@gwu.edu)</Label>
                  <Input id="su-email" type="email" autoComplete="email" placeholder="you@gwu.edu" value={signUpData.email}
                    onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })} className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="su-password">Password</Label>
                  <Input id="su-password" type="password" autoComplete="new-password" value={signUpData.password}
                    onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })} className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="su-confirm">Confirm Password</Label>
                  <Input id="su-confirm" type="password" autoComplete="new-password" value={signUpData.confirm}
                    onChange={(e) => setSignUpData({ ...signUpData, confirm: e.target.value })} className="mt-1" />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button type="submit" className="w-full" disabled={submitting}>
                  <UserPlus className="mr-2 h-4 w-4" /> Create Account
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="mt-4 rounded-md border border-border bg-secondary/50 p-3">
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Students:</span> sign up with your <span className="font-medium">@gwu.edu</span> email.{" "}
              <span className="font-medium text-foreground">Staff:</span> use the credentials provided by your admin.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
