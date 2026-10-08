import { useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Bell, CalendarDays, ChevronsLeft, FileBarChart, LayoutDashboard, LogOut, Megaphone, Menu, Search, Settings, Users, Wallet, Clapperboard } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isOverdue, useContent } from "@/lib/socialDesk";

const nav = [
  { to: "/social_desk/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/social_desk/clients", label: "Businesses", icon: Users },
  { to: "/social_desk/content", label: "Content", icon: Clapperboard },
  { to: "/social_desk/calendar", label: "Calendar", icon: CalendarDays },
  { to: "/social_desk/boosts", label: "Boosts & Ads", icon: Megaphone },
  { to: "/social_desk/funds", label: "Funds", icon: Wallet },
  { to: "/social_desk/reports", label: "Reports", icon: FileBarChart },
  { to: "/social_desk/settings", label: "Settings", icon: Settings },
] as const;

function NavList({ collapsed, onNav }: { collapsed?: boolean; onNav?: () => void }) {
  const { pathname } = useLocation();
  return (
    <nav className="flex flex-1 flex-col gap-1 px-3">
      {nav.map(({ to, label, icon: Icon }) => {
        const active = pathname.startsWith(to);
        return (
            <Link key={to} to={to} onClick={onNav} title={label} className={cn("flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors", active ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg" : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground", collapsed && "justify-center px-0")}>
            <Icon className="size-4 shrink-0" />
            {!collapsed && label}
          </Link>
        );
      })}
    </nav>
  );
}

function Brand({ collapsed }: { collapsed?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2.5 px-6 py-6", collapsed && "justify-center px-0")}>
      <div className="grid size-9 place-items-center rounded-xl bg-brand font-display text-sm font-bold text-primary-foreground">S</div>
      {!collapsed && <span className="font-display text-lg font-bold text-sidebar-accent-foreground">SocialDesk</span>}
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [q, setQ] = useState("");
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: content = [] } = useContent();
  const overdue = content.filter(isOverdue).length;

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate("/social_desk/login", { replace: true });
  }

  return (
    <div className="flex min-h-screen">
      <aside className={cn("sticky top-0 hidden h-screen shrink-0 flex-col bg-sidebar transition-all lg:flex", collapsed ? "w-20" : "w-64")}>
        <Brand collapsed={collapsed} />
        <NavList collapsed={collapsed} />
        <div className="space-y-1 p-3">
          <button onClick={() => setCollapsed(!collapsed)} className="flex w-full items-center justify-center gap-2 rounded-lg py-2 text-xs text-sidebar-foreground hover:bg-sidebar-accent">
            <ChevronsLeft className={cn("size-4 transition-transform", collapsed && "rotate-180")} />
            {!collapsed && "Collapse"}
          </button>
          <button onClick={signOut} className={cn("flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground hover:bg-sidebar-accent", collapsed && "justify-center")}>
            <LogOut className="size-4" />
            {!collapsed && "Log out"}
          </button>
        </div>
      </aside>

      <Sheet open={mobile} onOpenChange={setMobile}>
        <SheetContent side="left" className="w-64 border-none bg-sidebar p-0">
          <Brand />
          <NavList onNav={() => setMobile(false)} />
          <button onClick={signOut} className="m-3 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground hover:bg-sidebar-accent">
            <LogOut className="size-4" /> Log out
          </button>
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-card/80 px-4 backdrop-blur md:px-8">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobile(true)} aria-label="Menu">
            <Menu className="size-5" />
          </Button>
          <form
            className="relative max-w-md flex-1"
            onSubmit={(e) => {
              e.preventDefault();
              navigate("/social_desk/clients");
            }}
          >
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search businesses..." className="bg-background pl-9" />
          </form>
          <div className="ml-auto flex items-center gap-2">
            <Link to="/social_desk/content" className="relative grid size-9 place-items-center rounded-lg hover:bg-muted" aria-label="Overdue content">
              <Bell className="size-5 text-muted-foreground" />
              {overdue > 0 && <span className="absolute -right-0.5 -top-0.5 grid size-5 place-items-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">{overdue}</span>}
            </Link>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
