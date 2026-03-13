import { Navigate } from "react-router-dom";
import { ReactNode, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const [status, setStatus] = useState<"loading" | "allowed" | "denied">("loading");

  useEffect(() => {
    let mounted = true;

    const checkAccess = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        if (mounted) setStatus("denied");
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .maybeSingle();

      if (error || !data || data.role !== "admin") {
        if (mounted) setStatus("denied");
        return;
      }

      if (mounted) setStatus("allowed");
    };

    void checkAccess();
    return () => {
      mounted = false;
    };
  }, []);

  if (status === "loading") {
    return (
      <section className="section-padding">
        <div className="container-max">
          <div className="service-card text-sm text-muted-foreground">Checking admin access...</div>
        </div>
      </section>
    );
  }

  if (status === "denied") {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
