import { useEffect, useState, type ReactNode } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { AppShell } from "@/components/social-desk/AppShell";
import SocialDeskLogin from "./Login";
import SocialDeskResetPassword from "./ResetPassword";
import Dashboard from "./Dashboard";
import Clients from "./Clients";
import Content from "./Content";
import Calendar from "./Calendar";
import Boosts from "./Boosts";
import Funds from "./Funds";
import Reports from "./Reports";
import Settings from "./Settings";

function SocialDeskProtected({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [state, setState] = useState<"checking" | "authed" | "guest">("checking");

  useEffect(() => {
    let alive = true;
    supabase.auth.getUser().then(({ data, error }) => {
      if (!alive) return;
      setState(error || !data.user ? "guest" : "authed");
    });
    return () => {
      alive = false;
    };
  }, []);

  if (state === "checking") {
    return (
      <div className="grid min-h-screen place-items-center bg-background text-sm text-muted-foreground">
        Loading SocialDesk...
      </div>
    );
  }

  if (state === "guest") {
    return <Navigate to="/social_desk/login" replace state={{ from: location }} />;
  }

  return <AppShell>{children}</AppShell>;
}

export default function SocialDeskRoutes() {
  return (
    <Routes>
      <Route index element={<Navigate to="/social_desk/dashboard" replace />} />
      <Route path="login" element={<SocialDeskLogin />} />
      <Route path="reset-password" element={<SocialDeskResetPassword />} />
      <Route
        path="dashboard"
        element={
          <SocialDeskProtected>
            <Dashboard />
          </SocialDeskProtected>
        }
      />
      <Route
        path="clients"
        element={
          <SocialDeskProtected>
            <Clients />
          </SocialDeskProtected>
        }
      />
      <Route
        path="content"
        element={
          <SocialDeskProtected>
            <Content />
          </SocialDeskProtected>
        }
      />
      <Route
        path="calendar"
        element={
          <SocialDeskProtected>
            <Calendar />
          </SocialDeskProtected>
        }
      />
      <Route
        path="boosts"
        element={
          <SocialDeskProtected>
            <Boosts />
          </SocialDeskProtected>
        }
      />
      <Route
        path="funds"
        element={
          <SocialDeskProtected>
            <Funds />
          </SocialDeskProtected>
        }
      />
      <Route
        path="reports"
        element={
          <SocialDeskProtected>
            <Reports />
          </SocialDeskProtected>
        }
      />
      <Route
        path="settings"
        element={
          <SocialDeskProtected>
            <Settings />
          </SocialDeskProtected>
        }
      />
      <Route path="*" element={<Navigate to="/social_desk/dashboard" replace />} />
    </Routes>
  );
}

