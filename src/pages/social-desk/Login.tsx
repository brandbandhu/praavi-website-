import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, MailCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SocialDeskLogin() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up" | "forgot">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setNeedsConfirmation(false);
    try {
      if (mode === "in") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate("/social_desk/dashboard");
      } else if (mode === "up") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/social_desk/dashboard` },
        });
        if (error) throw error;
        toast.success("Check your email to confirm your account.");
        setMode("in");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/social_desk/reset-password`,
        });
        if (error) throw error;
        toast.success("Password reset link sent.");
        setMode("in");
      }
    } catch (err) {
      const message = (err as Error).message;
      if (message.toLowerCase().includes("email not confirmed")) setNeedsConfirmation(true);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  async function resendConfirmation() {
    if (!email) {
      toast.error("Enter your email first.");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: { emailRedirectTo: `${window.location.origin}/social_desk/dashboard` },
      });
      if (error) throw error;
      toast.success("Confirmation email sent. Check your inbox and spam folder.");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-sidebar p-12 lg:flex">
        <div className="absolute -right-24 -top-24 size-96 rounded-full bg-brand opacity-30 blur-3xl" />
        <div className="relative flex items-center gap-2.5">
          <div className="grid size-10 place-items-center rounded-xl bg-brand font-display font-bold text-primary-foreground">S</div>
          <span className="font-display text-xl font-bold text-sidebar-accent-foreground">SocialDesk</span>
        </div>
        <div className="relative">
          <h1 className="text-4xl font-bold leading-tight text-sidebar-accent-foreground">
            Every business. Every post.
            <br />
            Every rupee - tracked.
          </h1>
          <p className="mt-4 max-w-md text-sidebar-foreground">
            Content targets, calendars, boosts, ad funds and monthly reports for your whole agency.
          </p>
        </div>
        <p className="relative text-xs text-sidebar-foreground">Authorized team members only.</p>
      </div>
      <div className="flex items-center justify-center p-6">
        <form onSubmit={submit} className="w-full max-w-sm space-y-5">
          <div>
            <h2 className="text-2xl font-bold">{mode === "in" ? "Welcome back" : mode === "up" ? "Create admin account" : "Reset password"}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {mode === "in"
                ? "Sign in to your agency CRM."
                : mode === "up"
                  ? "The first account becomes the admin."
                  : "We'll email you a reset link."}
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          {mode !== "forgot" && (
            <div className="space-y-1.5">
              <Label htmlFor="pw">Password</Label>
              <div className="relative">
                <Input
                  id="pw"
                  type={show ? "text" : "password"}
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground"
                  aria-label="Show password"
                >
                  {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
          )}
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Please wait..." : mode === "in" ? "Log in" : mode === "up" ? "Create account" : "Send reset link"}
          </Button>
          {needsConfirmation && mode === "in" && (
            <Button type="button" variant="outline" className="w-full" disabled={busy} onClick={resendConfirmation}>
              <MailCheck /> Resend confirmation email
            </Button>
          )}
          <div className="flex justify-between text-sm">
            {mode === "in" ? (
              <>
                <button type="button" className="text-primary hover:underline" onClick={() => setMode("forgot")}>
                  Forgot password?
                </button>
                <button type="button" className="text-muted-foreground hover:underline" onClick={() => setMode("up")}>
                  Create account
                </button>
              </>
            ) : (
              <button type="button" className="text-primary hover:underline" onClick={() => setMode("in")}>
                Back to sign in
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

