import { FormEvent, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";

const AdminLoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const redirectPath = (() => {
    const fromPath = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;
    if (fromPath && fromPath !== "/admin/login") return fromPath;
    return "/admin/dashboard";
  })();

  useEffect(() => {
    const verifySession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) return;

        const { data } = await supabase.from("profiles").select("role").eq("id", session.user.id).maybeSingle();

        if (data?.role === "admin") {
          navigate(redirectPath, { replace: true });
        }
      } catch {
        setError("Unable to connect to Supabase. Check Vercel env vars and network access.");
      }
    };

    void verifySession();
  }, [navigate, redirectPath]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        const isNetworkError = signInError.message?.toLowerCase().includes("failed to fetch");
        setError(
          isNetworkError
            ? "Cannot reach Supabase. Verify VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel."
            : signInError.message || "Invalid email or password."
        );
        setSubmitting(false);
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setError("Login failed. Please try again.");
        setSubmitting(false);
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .maybeSingle();

      if (profileError || !profile || profile.role !== "admin") {
        await supabase.auth.signOut();
        setError("Access denied. This user is not an admin.");
        setSubmitting(false);
        return;
      }

      setSubmitting(false);
      navigate(redirectPath, { replace: true });
    } catch {
      setError("Cannot reach Supabase. Verify Vercel env vars and network access.");
      setSubmitting(false);
    }
  };

  return (
    <section className="section-padding">
      <div className="container-max max-w-md">
        <div className="service-card">
          <h1 className="font-display text-3xl font-bold mb-2">Admin Login</h1>
          <p className="text-sm text-muted-foreground mb-6">Login to publish and manage daily blogs.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm mb-2">Admin Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm"
                placeholder="Enter admin email"
              />
            </div>

            <div>
              <label className="block text-sm mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm"
                placeholder="Enter password"
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full gradient-bg px-5 py-2.5 rounded-lg text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
            >
              {submitting ? "Logging in..." : "Login"}
            </button>
          </form>

          <p className="text-xs text-muted-foreground mt-5">Use your Supabase Auth admin account credentials.</p>
        </div>
      </div>
    </section>
  );
};

export default AdminLoginPage;
