import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  BarChart3,
  CalendarDays,
  Clapperboard,
  Download,
  Eye,
  EyeOff,
  FileBarChart,
  History,
  LayoutDashboard,
  LogOut,
  Palette,
  Pencil,
  Plus,
  Trash2,
  UserRound,
  Users,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ProgressBar, StatCard } from "@/components/social-desk/ui";

type TeamMember = {
  id: string;
  full_name: string;
  username: string;
  role: "super_admin" | "graphic_designer" | "video_editor";
  department: "graphics" | "video" | null;
  active: boolean;
};

type MonthlySummary = {
  client_id: string;
  client_name: string;
  target_month: string | null;
  graphic_target: number;
  completed_creatives: number;
  remaining_creatives: number;
  overdelivered_creatives?: number;
  reel_target: number;
  completed_reels: number;
  remaining_reels: number;
  overdelivered_reels?: number;
  completed_shoots: number;
  pending_graphic_group_shares: number;
  pending_reel_group_shares: number;
};

type ClientOption = {
  id: string;
  business_name?: string | null;
  name?: string | null;
  status?: string | null;
};

type GraphicWorkEntry = {
  id: string;
  work_date: string;
  client_id: string;
  client_name?: string;
  designer_id?: string | null;
  assignee_name?: string;
  creative_title: string;
  creative_type: string;
  quantity: number;
  status: string;
  group_shared: "Yes" | "No";
  group_shared_date?: string | null;
  creative_link?: string | null;
  remarks?: string | null;
};

type VideoShootEntry = {
  id: string;
  shoot_date: string;
  shoot_time?: string | null;
  client_id: string;
  client_name?: string;
  assigned_videographer_id?: string | null;
  assignee_name?: string;
  shoot_type?: string | null;
  shoot_location?: string | null;
  videos_shot_count: number;
  shoot_status: string;
  raw_video_uploaded: "Yes" | "No";
  raw_video_folder_link?: string | null;
  remarks?: string | null;
};

type VideoReelEntry = {
  id: string;
  client_id: string;
  client_name?: string;
  assigned_editor_id?: string | null;
  assignee_name?: string;
  reel_title: string;
  reel_status: string;
  reels_completed_count: number;
  final_reel_uploaded: "Yes" | "No";
  final_reel_link?: string | null;
  group_shared: "Yes" | "No";
  reel_completion_date?: string | null;
  remarks?: string | null;
};

type DmtWorkspaceData = {
  clients: ClientOption[];
  members: TeamMember[];
  summary: MonthlySummary[];
  graphics: GraphicWorkEntry[];
  shoots: VideoShootEntry[];
  reels: VideoReelEntry[];
};

const nav = [
  { to: "/digital_marketing_team/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/digital_marketing_team/graphics", label: "Graphics", icon: Palette },
  { to: "/digital_marketing_team/videos", label: "Videos", icon: Clapperboard },
  { to: "/digital_marketing_team/daily-work", label: "Daily Work", icon: BarChart3 },
  { to: "/digital_marketing_team/calendar", label: "Calendar", icon: CalendarDays },
  { to: "/digital_marketing_team/reports", label: "Reports", icon: FileBarChart },
  { to: "/digital_marketing_team/history", label: "History", icon: History },
] as const;

const roleLabel: Record<TeamMember["role"], string> = {
  super_admin: "Super Admin",
  graphic_designer: "Graphic Designer",
  video_editor: "Video Editor",
};

const emptyWorkspace: DmtWorkspaceData = {
  clients: [],
  members: [],
  summary: [],
  graphics: [],
  shoots: [],
  reels: [],
};

function clientName(clients: ClientOption[], clientId: string) {
  const client = clients.find((item) => item.id === clientId);
  return client?.business_name || client?.name || "Client";
}

function memberName(members: TeamMember[], memberId?: string | null) {
  const member = members.find((item) => item.id === memberId);
  return member?.full_name || "-";
}

function monthStart(month: string) {
  return `${month}-01`;
}

function useCurrentMember(enabled: boolean) {
  return useQuery({
    queryKey: ["dmt_current_member"],
    enabled,
    queryFn: async () => {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) throw userError || new Error("Not signed in");
      const { data, error } = await supabase
        .from("digital_marketing_team_members")
        .select("*")
        .eq("auth_user_id", userData.user.id)
        .eq("active", true)
        .maybeSingle();
      if (error) throw error;
      return data as TeamMember | null;
    },
  });
}

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      const username = email.trim();
      const loginEmail = username.includes("@") ? username : `${username}@praavi.local`;
      const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password });
      if (error) {
        throw error;
      }
      if (remember) window.localStorage.setItem("dmt_last_login", username);
      navigate("/digital_marketing_team/dashboard", { replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Login failed");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    setEmail(window.localStorage.getItem("dmt_last_login") || "");
  }, []);

  return (
    <div className="grid min-h-screen bg-[#f8fafc] lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative hidden overflow-hidden bg-[#07111f] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(124,58,237,.32),transparent_34%),radial-gradient(circle_at_80%_20%,rgba(14,165,233,.28),transparent_32%)]" />
        <div className="relative flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-xl bg-violet-500 font-bold">DM</div>
          <div>
            <div className="font-display text-xl font-bold">Digital Marketing Team</div>
            <div className="text-xs text-slate-300">Praavi Operations CRM</div>
          </div>
        </div>
        <div className="relative max-w-xl">
          <h1 className="font-display text-5xl font-bold leading-tight">Daily work, targets, shoots, reels, and reports in one command center.</h1>
          <p className="mt-5 text-base text-slate-300">Built for graphics and video teams with client-wise monthly accountability.</p>
        </div>
        <p className="relative text-xs text-slate-400">Authorized team members only.</p>
      </section>
      <main className="flex items-center justify-center bg-slate-100 p-6">
        <form onSubmit={submit} className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-950">Team Login</h2>
            <p className="mt-1 text-sm text-slate-600">Use your assigned team email and password.</p>
          </div>
          <div className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="dmt-email" className="text-slate-800">Username / Email</Label>
              <Input id="dmt-email" type="text" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" className="bg-white text-slate-950" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dmt-password" className="text-slate-800">Password</Label>
              <div className="relative">
                <Input id="dmt-password" type={show ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} className="bg-white pr-10 text-slate-950" autoComplete="current-password" />
                <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-500" onClick={() => setShow((value) => !value)} aria-label="Show password">
                  {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="size-4 rounded border-input accent-violet-600" />
              Remember me
            </label>
            <Button type="submit" size="lg" className="mt-2 h-11 w-full bg-blue-600 text-white shadow-md hover:bg-blue-700" disabled={busy}>
              {busy ? "Signing in..." : "Login"}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}

function Shell({ member, children }: { member: TeamMember; children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  async function signOut() {
    await supabase.auth.signOut();
    navigate("/digital_marketing_team/login", { replace: true });
  }
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 lg:flex">
      <aside className="hidden w-72 shrink-0 flex-col bg-[#07111f] text-white lg:flex">
        <div className="p-6">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-violet-500 font-bold">DM</div>
            <div>
              <div className="font-display text-lg font-bold">Team Ops</div>
              <div className="text-xs text-slate-400">{roleLabel[member.role]}</div>
            </div>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-3">
          {nav.map(({ to, label, icon: Icon }) => {
            const active = location.pathname.startsWith(to);
            return (
              <button key={to} onClick={() => navigate(to)} className={cn("flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors", active ? "bg-violet-600 text-white" : "text-slate-300 hover:bg-white/10 hover:text-white")}>
                <Icon className="size-4" />
                {label}
              </button>
            );
          })}
        </nav>
        <div className="border-t border-white/10 p-4">
          <div className="mb-3 flex items-center gap-3 rounded-xl bg-white/5 p-3">
            <UserRound className="size-5 text-slate-300" />
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold">{member.full_name}</div>
              <div className="truncate text-xs text-slate-400">{member.username}</div>
            </div>
          </div>
          <Button variant="ghost" className="w-full justify-start text-slate-300 hover:bg-white/10 hover:text-white" onClick={signOut}>
            <LogOut /> Logout
          </Button>
        </div>
      </aside>
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b bg-white/95 px-4 py-3 shadow-sm backdrop-blur lg:hidden">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-blue-600 text-sm font-bold text-white">DM</div>
            <div className="min-w-0">
              <div className="truncate font-display text-base font-bold text-slate-950">Team Ops</div>
              <div className="truncate text-xs text-slate-500">{roleLabel[member.role]}</div>
            </div>
          </div>
          <button type="button" onClick={signOut} className="grid size-10 place-items-center rounded-full text-slate-600 hover:bg-slate-100" aria-label="Logout">
            <LogOut className="size-5" />
          </button>
        </header>
        <main className="min-w-0 flex-1 p-4 pb-24 md:p-8 lg:pb-8">{children}</main>
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-white px-2 py-2 shadow-[0_-8px_24px_rgba(15,23,42,0.12)] lg:hidden" aria-label="Mobile digital marketing navigation">
        <div className="flex gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {nav.map(({ to, label, icon: Icon }) => {
            const active = location.pathname.startsWith(to);
            return (
              <button
                key={to}
                type="button"
                onClick={() => navigate(to)}
                className={cn(
                  "flex min-w-[74px] flex-col items-center justify-center gap-1 rounded-lg px-2 py-2 text-[11px] font-semibold transition-colors",
                  active ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
                )}
              >
                <Icon className="size-4" />
                <span className="max-w-[68px] truncate">{label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

function Protected({ children }: { children: (member: TeamMember) => ReactNode }) {
  const [authed, setAuthed] = useState<"checking" | "yes" | "no">("checking");
  const location = useLocation();
  const member = useCurrentMember(authed === "yes");

  useEffect(() => {
    let alive = true;
    supabase.auth.getUser().then(({ data }) => {
      if (alive) setAuthed(data.user ? "yes" : "no");
    });
    return () => {
      alive = false;
    };
  }, []);

  if (authed === "checking" || member.isLoading) return <div className="grid min-h-screen place-items-center bg-slate-50 text-sm text-muted-foreground">Loading team module...</div>;
  if (authed === "no") return <Navigate to="/digital_marketing_team/login" replace state={{ from: location }} />;
  if (!member.data) return <Navigate to="/digital_marketing_team/login" replace />;
  return <Shell member={member.data}>{children(member.data)}</Shell>;
}

function useDmtData(month: string) {
  return useQuery({
    queryKey: ["dmt_dashboard", month],
    queryFn: async () => {
      try {
        const [{ count: clients }, { data: members }, { data: summary }] = await Promise.all([
          supabase.from("social_desk_clients").select("id", { count: "exact", head: true }).neq("status", "Archived"),
          supabase.from("digital_marketing_team_members").select("*").eq("active", true),
          supabase.from("digital_marketing_client_monthly_summary").select("*").eq("target_month", `${month}-01`),
        ]);
        return {
          clients: clients ?? 0,
          members: (members ?? []) as TeamMember[],
          summary: (summary ?? []) as MonthlySummary[],
        };
      } catch {
        return {
          clients: 0,
          members: [],
          summary: [],
        };
      }
    },
  });
}

function useDmtWorkspace(month: string) {
  return useQuery({
    queryKey: ["dmt_workspace", month],
    queryFn: async (): Promise<DmtWorkspaceData> => {
      try {
        const [{ data: clients }, { data: members }, { data: summary }, { data: graphics }, { data: shoots }, { data: reels }] = await Promise.all([
          supabase.from("social_desk_clients").select("id,business_name,name,status").neq("status", "Archived").order("business_name", { ascending: true }),
          supabase.from("digital_marketing_team_members").select("*").eq("active", true),
          supabase.from("digital_marketing_client_monthly_summary").select("*").eq("target_month", monthStart(month)),
          supabase.from("graphic_work_entries").select("*").order("work_date", { ascending: false }),
          supabase.from("video_shoots").select("*").order("shoot_date", { ascending: false }),
          supabase.from("video_reel_entries").select("*").order("created_at", { ascending: false }),
        ]);
        const clientRows = (clients ?? []) as ClientOption[];
        return {
          clients: clientRows,
          members: (members ?? []) as TeamMember[],
          summary: (summary ?? []) as MonthlySummary[],
          graphics: ((graphics ?? []) as GraphicWorkEntry[]).map((row) => ({ ...row, client_name: clientName(clientRows, row.client_id), assignee_name: memberName((members ?? []) as TeamMember[], row.designer_id) })),
          shoots: ((shoots ?? []) as VideoShootEntry[]).map((row) => ({ ...row, client_name: clientName(clientRows, row.client_id), assignee_name: memberName((members ?? []) as TeamMember[], row.assigned_videographer_id) })),
          reels: ((reels ?? []) as VideoReelEntry[]).map((row) => ({ ...row, client_name: clientName(clientRows, row.client_id), assignee_name: memberName((members ?? []) as TeamMember[], row.assigned_editor_id) })),
        };
      } catch {
        return emptyWorkspace;
      }
    },
  });
}

function buildLocalSummary(data: DmtWorkspaceData, month: string): MonthlySummary[] {
  return data.clients.map((client) => {
    const target = data.summary.find((row) => row.client_id === client.id);
    const graphics = data.graphics.filter((row) => row.client_id === client.id && row.work_date?.startsWith(month));
    const reels = data.reels.filter((row) => row.client_id === client.id && (row.reel_completion_date || "").startsWith(month));
    const shoots = data.shoots.filter((row) => row.client_id === client.id && row.shoot_date?.startsWith(month));
    const completedCreatives = graphics.filter((row) => row.status === "Completed").reduce((sum, row) => sum + Number(row.quantity || 0), 0);
    const completedReels = reels.filter((row) => row.reel_status === "Completed").reduce((sum, row) => sum + Number(row.reels_completed_count || 0), 0);
    const graphicTarget = Number(target?.graphic_target || 0);
    const reelTarget = Number(target?.reel_target || 0);
    return {
      client_id: client.id,
      client_name: clientName(data.clients, client.id),
      target_month: monthStart(month),
      graphic_target: graphicTarget,
      completed_creatives: completedCreatives,
      remaining_creatives: Math.max(graphicTarget - completedCreatives, 0),
      overdelivered_creatives: Math.max(completedCreatives - graphicTarget, 0),
      reel_target: reelTarget,
      completed_reels: completedReels,
      remaining_reels: Math.max(reelTarget - completedReels, 0),
      overdelivered_reels: Math.max(completedReels - reelTarget, 0),
      completed_shoots: shoots.filter((row) => row.shoot_status === "Completed").length,
      pending_graphic_group_shares: graphics.filter((row) => row.status === "Completed" && row.group_shared === "No").length,
      pending_reel_group_shares: reels.filter((row) => row.reel_status === "Completed" && row.group_shared === "No").length,
    };
  });
}

function Dashboard() {
  const month = new Date().toISOString().slice(0, 7);
  const { data = emptyWorkspace } = useDmtWorkspace(month);
  const rows = buildLocalSummary(data, month);
  const graphicTarget = rows.reduce((sum, row) => sum + Number(row.graphic_target || 0), 0);
  const creatives = rows.reduce((sum, row) => sum + Number(row.completed_creatives || 0), 0);
  const reelTarget = rows.reduce((sum, row) => sum + Number(row.reel_target || 0), 0);
  const reels = rows.reduce((sum, row) => sum + Number(row.completed_reels || 0), 0);
  return (
    <section className="space-y-6">
      <Header title="Digital Marketing Dashboard" subtitle="Graphics and video team performance from live CRM records." />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active Clients" value={data.clients.length} icon={Users} color="info" />
        <StatCard label="Graphic Members" value={data.members.filter((m) => m.department === "graphics").length} icon={Palette} color="violet" />
        <StatCard label="Video Members" value={data.members.filter((m) => m.department === "video").length} icon={Clapperboard} color="primary" />
        <StatCard label="Completed Shoots" value={rows.reduce((sum, row) => sum + Number(row.completed_shoots || 0), 0)} icon={CalendarDays} color="success" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <ProgressPanel title="Monthly Creative Target" done={creatives} target={graphicTarget} accent="bg-violet-600" />
        <ProgressPanel title="Monthly Reel Target" done={reels} target={reelTarget} accent="bg-sky-500" />
      </div>
      <MonthlyTargetsPanel month={month} data={data} />
      <ClientProgressTable rows={rows} />
    </section>
  );
}

function Header({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
    </div>
  );
}

function ProgressPanel({ title, done, target, accent }: { title: string; done: number; target: number; accent: string }) {
  const pct = target ? Math.min(100, Math.round((done / target) * 100)) : 0;
  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">{title}</h2>
        <span className="text-sm text-slate-500">{done}/{target}</span>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
        <div className={cn("h-full rounded-full", accent)} style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-2 text-xs text-slate-500">{pct}% completed</div>
    </div>
  );
}

function MonthlyTargetsPanel({ month, data }: { month: string; data: DmtWorkspaceData }) {
  const queryClient = useQueryClient();
  const [clientId, setClientId] = useState("");
  const [graphicTarget, setGraphicTarget] = useState("0");
  const [reelTarget, setReelTarget] = useState("0");

  useEffect(() => {
    const firstClient = data.clients[0]?.id || "";
    if (!clientId && firstClient) setClientId(firstClient);
  }, [clientId, data.clients]);

  useEffect(() => {
    const current = data.summary.find((row) => row.client_id === clientId);
    setGraphicTarget(String(current?.graphic_target ?? 0));
    setReelTarget(String(current?.reel_target ?? 0));
  }, [clientId, data.summary]);

  async function saveTargets(event: React.FormEvent) {
    event.preventDefault();
    if (!clientId) return toast.error("Select client first");
    const { error } = await supabase.from("digital_marketing_monthly_targets").upsert(
      {
        client_id: clientId,
        target_month: monthStart(month),
        graphic_target: Number(graphicTarget || 0),
        reel_target: Number(reelTarget || 0),
      },
      { onConflict: "client_id,target_month" }
    );
    if (error) return toast.error(error.message);
    await queryClient.invalidateQueries({ queryKey: ["dmt_workspace"] });
    await queryClient.invalidateQueries({ queryKey: ["dmt_dashboard"] });
    toast.success("Monthly target saved");
  }

  return (
    <Panel title="Set Monthly Client Targets">
      <form onSubmit={saveTargets} className="grid gap-4 md:grid-cols-[1fr_180px_180px_140px]">
        <Field label="Client">
          <select className={selectClassName()} value={clientId} onChange={(event) => setClientId(event.target.value)}>
            {data.clients.map((client) => <option key={client.id} value={client.id}>{clientName(data.clients, client.id)}</option>)}
          </select>
        </Field>
        <Field label="Creative/Post Target">
          <Input type="number" min="0" value={graphicTarget} onChange={(event) => setGraphicTarget(event.target.value)} />
        </Field>
        <Field label="Reel Target">
          <Input type="number" min="0" value={reelTarget} onChange={(event) => setReelTarget(event.target.value)} />
        </Field>
        <div className="flex items-end">
          <Button className="w-full bg-blue-600 text-white hover:bg-blue-700">Save Target</Button>
        </div>
      </form>
    </Panel>
  );
}

function ClientProgressTable({ rows }: { rows: MonthlySummary[] }) {
  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm">
      <h2 className="mb-1 font-semibold">Client-Wise Monthly Target vs Completed</h2>
      <p className="mb-4 text-sm text-slate-500">Client la kiti creative/post ani reel target ahe, tyapeki completed/remaining kiti ahe te comparison.</p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1040px] text-sm">
          <thead className="border-b text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="py-3 pr-4">Client</th>
              <th className="py-3 pr-4">Creative/Post Target</th>
              <th className="py-3 pr-4">Creative Completed</th>
              <th className="py-3 pr-4">Creative Remaining</th>
              <th className="py-3 pr-4">Reel Target</th>
              <th className="py-3 pr-4">Reel Completed</th>
              <th className="py-3 pr-4">Reel Remaining</th>
              <th className="py-3 pr-4">Shoots</th>
              <th className="py-3 pr-4">Pending Group Shares</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.length ? rows.map((row) => (
              <tr key={row.client_id}>
                <td className="py-3 pr-4 font-medium">{row.client_name}</td>
                <td className="w-56 py-3 pr-4">
                  <ProgressBar value={row.graphic_target ? Math.round((row.completed_creatives / row.graphic_target) * 100) : 0} />
                  <div className="mt-1 text-xs text-slate-500">Target {row.graphic_target}</div>
                </td>
                <td className="py-3 pr-4 font-semibold text-emerald-700">{row.completed_creatives}</td>
                <td className="py-3 pr-4">
                  <span className={cn("rounded-full px-2 py-1 text-xs font-semibold", row.remaining_creatives > 0 ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700")}>
                    {row.remaining_creatives > 0 ? row.remaining_creatives : row.overdelivered_creatives ? `+${row.overdelivered_creatives}` : "Done"}
                  </span>
                </td>
                <td className="w-56 py-3 pr-4">
                  <ProgressBar value={row.reel_target ? Math.round((row.completed_reels / row.reel_target) * 100) : 0} />
                  <div className="mt-1 text-xs text-slate-500">Target {row.reel_target}</div>
                </td>
                <td className="py-3 pr-4 font-semibold text-emerald-700">{row.completed_reels}</td>
                <td className="py-3 pr-4">
                  <span className={cn("rounded-full px-2 py-1 text-xs font-semibold", row.remaining_reels > 0 ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700")}>
                    {row.remaining_reels > 0 ? row.remaining_reels : row.overdelivered_reels ? `+${row.overdelivered_reels}` : "Done"}
                  </span>
                </td>
                <td className="py-3 pr-4">{row.completed_shoots}</td>
                <td className="py-3 pr-4">{Number(row.pending_graphic_group_shares || 0) + Number(row.pending_reel_group_shares || 0)}</td>
              </tr>
            )) : (
              <tr>
                <td className="py-8 text-center text-slate-500" colSpan={9}>No client records yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold uppercase text-slate-500">{label}</Label>
      {children}
    </div>
  );
}

function selectClassName() {
  return "h-10 w-full rounded-md border border-input bg-white px-3 text-sm text-slate-950";
}

function Panel({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <div className="rounded-xl border bg-white p-5 text-slate-950 shadow-sm [&_input]:bg-white [&_input]:text-slate-950 [&_select]:bg-white [&_select]:text-slate-950 [&_textarea]:bg-white [&_textarea]:text-slate-950">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-semibold">{title}</h2>
        {action}
      </div>
      {children}
    </div>
  );
}

function saveCsv(filename: string, rows: Record<string, unknown>[]) {
  if (!rows.length) {
    toast.info("No records to export");
    return;
  }
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => `"${String(row[header] ?? "").replace(/"/g, '""')}"`).join(",")),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function esc(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function reportRows(rows: Record<string, unknown>[], columns: string[]) {
  return rows.map((row) => {
    const mapped = rowToDisplay(row);
    return Object.fromEntries(columns.map((column) => [column, mapped[column] ?? "-"]));
  });
}

function rowToDisplay(row: Record<string, unknown>) {
  return {
    date: row.work_date || row.shoot_date || row.reel_completion_date,
    client: row.client_name,
    assignee: row.assignee_name,
    title: row.creative_title || row.reel_title || row.shoot_type,
    type: row.creative_type || row.shoot_type,
    qty: row.quantity,
    count: row.videos_shot_count || row.reels_completed_count,
    status: row.status || row.shoot_status || row.reel_status,
    shared: row.group_shared,
    link: row.creative_link || row.final_reel_link || row.raw_video_folder_link,
    location: row.shoot_location,
  } as Record<string, unknown>;
}

function statusBadgeClass(status: unknown) {
  const value = String(status || "").toLowerCase();
  if (value === "completed") return "bg-emerald-100 text-emerald-700";
  if (value === "cancelled") return "bg-red-100 text-red-700";
  if (["pending", "scheduled"].includes(value)) return "bg-slate-200 text-slate-700";
  if (["in progress", "editing", "review"].includes(value)) return "bg-amber-100 text-amber-700";
  return "bg-blue-100 text-blue-700";
}

function openPdfReport(title: string, subtitle: string, rows: Record<string, unknown>[], columns?: string[]) {
  if (!rows.length) {
    toast.info("No records to export");
    return;
  }
  const headers = columns ?? Object.keys(rows[0]);
  const bodyRows = rows.map((row, index) => ({ sr: index + 1, ...row }));
  const reportColumns = ["sr", ...headers];
  const generatedAt = new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title><style>
    @page { size: A4 landscape; margin: 14mm; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: Arial, sans-serif; color: #111827; background: #fff; }
    .header { display: flex; justify-content: space-between; gap: 24px; border-bottom: 3px solid #2563eb; padding-bottom: 14px; margin-bottom: 18px; }
    .brand { font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: .08em; font-weight: 700; }
    h1 { margin: 5px 0 0; font-size: 24px; line-height: 1.2; }
    .meta { text-align: right; font-size: 12px; color: #475569; line-height: 1.7; white-space: nowrap; }
    .subtitle { margin: 0 0 16px; color: #475569; font-size: 13px; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    th { text-align: left; background: #eff6ff; color: #1e3a8a; border: 1px solid #bfdbfe; padding: 8px; text-transform: uppercase; font-size: 10px; }
    td { border: 1px solid #e2e8f0; padding: 7px 8px; vertical-align: top; word-break: break-word; }
    tr:nth-child(even) td { background: #f8fafc; }
    .footer { margin-top: 16px; display: flex; justify-content: space-between; color: #64748b; font-size: 11px; border-top: 1px solid #e2e8f0; padding-top: 10px; }
    @media print { button { display: none; } }
  </style></head><body>
    <div class="header">
      <div><div class="brand">Praavi Digital Marketing Team</div><h1>${esc(title)}</h1></div>
      <div class="meta"><div>Generated: ${esc(generatedAt)}</div><div>Total Records: ${rows.length}</div></div>
    </div>
    <p class="subtitle">${esc(subtitle)}</p>
    <table><thead><tr>${reportColumns.map((column) => `<th>${esc(column === "sr" ? "Sr" : column)}</th>`).join("")}</tr></thead>
    <tbody>${bodyRows.map((row) => `<tr>${reportColumns.map((column) => `<td>${esc(row[column])}</td>`).join("")}</tr>`).join("")}</tbody></table>
    <div class="footer"><span>Generated from Praavi Operations CRM</span><span>${esc(title)}</span></div>
    <script>window.onload=()=>{document.title=${JSON.stringify(title)};setTimeout(()=>window.print(),200)}</script>
  </body></html>`;
  const win = window.open("", "_blank", "width=1200,height=850");
  if (!win) {
    toast.error("Allow popups to download PDF");
    return;
  }
  win.document.write(html);
  win.document.close();
}

function GraphicsPage() {
  const month = new Date().toISOString().slice(0, 7);
  const queryClient = useQueryClient();
  const { data = emptyWorkspace } = useDmtWorkspace(month);
  const graphicMembers = data.members.filter((member) => member.department === "graphics");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    work_date: new Date().toISOString().slice(0, 10),
    client_id: data.clients[0]?.id || "",
    designer_id: graphicMembers[0]?.id || "",
    creative_title: "",
    creative_type: "Static Post",
    quantity: "1",
    status: "Pending",
    group_shared: "No" as "Yes" | "No",
    creative_link: "",
    remarks: "",
  });

  useEffect(() => {
    if (!form.client_id && data.clients[0]?.id) setForm((current) => ({ ...current, client_id: data.clients[0].id }));
    if (!form.designer_id && graphicMembers[0]?.id) setForm((current) => ({ ...current, designer_id: graphicMembers[0].id }));
  }, [data.clients, form.client_id, form.designer_id, graphicMembers]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const payload = {
      work_date: form.work_date,
      client_id: form.client_id,
      designer_id: form.designer_id || null,
      creative_title: form.creative_title,
      creative_type: form.creative_type,
      quantity: Number(form.quantity || 1),
      status: form.status,
      group_shared: form.group_shared,
      group_shared_date: form.group_shared === "Yes" ? form.work_date : null,
      creative_link: form.creative_link || null,
      remarks: form.remarks || null,
    };
    const { error } = editingId
      ? await supabase.from("graphic_work_entries").update(payload).eq("id", editingId)
      : await supabase.from("graphic_work_entries").insert(payload);
    if (error) return toast.error(error.message);
    await queryClient.invalidateQueries({ queryKey: ["dmt_workspace"] });
    await queryClient.invalidateQueries({ queryKey: ["dmt_dashboard"] });
    toast.success(editingId ? "Graphic work updated" : "Graphic work saved in database");
    setEditingId(null);
    setForm((current) => ({
      ...current,
      creative_title: "",
      creative_type: "Static Post",
      quantity: "1",
      status: "Pending",
      group_shared: "No",
      creative_link: "",
      remarks: "",
    }));
  }

  async function deleteGraphic(row: Record<string, unknown>) {
    if (!window.confirm("Delete this graphic work entry?")) return;
    const { error } = await supabase.from("graphic_work_entries").delete().eq("id", String(row.id));
    if (error) return toast.error(error.message);
    await queryClient.invalidateQueries({ queryKey: ["dmt_workspace"] });
    await queryClient.invalidateQueries({ queryKey: ["dmt_dashboard"] });
    toast.success("Graphic work deleted");
  }

  function editGraphic(row: Record<string, unknown>) {
    setEditingId(String(row.id));
    setForm({
      work_date: String(row.work_date || new Date().toISOString().slice(0, 10)),
      client_id: String(row.client_id || ""),
      designer_id: String(row.designer_id || ""),
      creative_title: String(row.creative_title || ""),
      creative_type: String(row.creative_type || "Static Post"),
      quantity: String(row.quantity || "1"),
      status: String(row.status || "Pending"),
      group_shared: (row.group_shared === "Yes" ? "Yes" : "No") as "Yes" | "No",
      creative_link: String(row.creative_link || ""),
      remarks: String(row.remarks || ""),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <section className="space-y-6">
      <Header title="Graphic Team" subtitle="Creative targets, daily design work, group sharing, and progress." />
      <Panel title={editingId ? "Edit Graphic Work" : "Add Graphic Work"} action={editingId ? <Button type="button" variant="outline" className="border-slate-200 bg-white text-slate-700" onClick={() => setEditingId(null)}>Cancel edit</Button> : null}>
        <form onSubmit={submit} className="grid gap-4 lg:grid-cols-4">
          <Field label="Date"><Input type="date" value={form.work_date} onChange={(e) => setForm({ ...form, work_date: e.target.value })} required /></Field>
          <Field label="Client"><select className={selectClassName()} value={form.client_id} onChange={(e) => setForm({ ...form, client_id: e.target.value })}>{data.clients.map((client) => <option key={client.id} value={client.id}>{clientName(data.clients, client.id)}</option>)}</select></Field>
          <Field label="Designer"><select className={selectClassName()} value={form.designer_id} onChange={(e) => setForm({ ...form, designer_id: e.target.value })}>{graphicMembers.map((member) => <option key={member.id} value={member.id}>{member.full_name}</option>)}</select></Field>
          <Field label="Creative Title"><Input value={form.creative_title} onChange={(e) => setForm({ ...form, creative_title: e.target.value })} required /></Field>
          <Field label="Type"><select className={selectClassName()} value={form.creative_type} onChange={(e) => setForm({ ...form, creative_type: e.target.value })}>{["Static Post", "Carousel", "Story", "Banner", "Other"].map((value) => <option key={value}>{value}</option>)}</select></Field>
          <Field label="Quantity"><Input type="number" min="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} /></Field>
          <Field label="Status"><select className={selectClassName()} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>{["Pending", "In Progress", "Completed"].map((value) => <option key={value}>{value}</option>)}</select></Field>
          <Field label="Group Shared"><select className={selectClassName()} value={form.group_shared} onChange={(e) => setForm({ ...form, group_shared: e.target.value as "Yes" | "No" })}><option>No</option><option>Yes</option></select></Field>
          <Field label="Creative Link"><Input value={form.creative_link} onChange={(e) => setForm({ ...form, creative_link: e.target.value })} /></Field>
          <div className="lg:col-span-3"><Field label="Remarks"><Textarea value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} /></Field></div>
          <div className="flex items-end"><Button className="w-full bg-blue-600 text-white hover:bg-blue-700"><Plus className="size-4" /> {editingId ? "Update Work" : "Add Work"}</Button></div>
        </form>
      </Panel>
      <WorkTable title="Graphic Work Entries" rows={data.graphics} columns={["date", "client", "assignee", "title", "type", "qty", "status", "shared", "link"]} onEdit={editGraphic} onDelete={deleteGraphic} />
    </section>
  );
}

function VideosPage() {
  const month = new Date().toISOString().slice(0, 7);
  const queryClient = useQueryClient();
  const { data = emptyWorkspace } = useDmtWorkspace(month);
  const videoMembers = data.members.filter((member) => member.department === "video");
  const firstClient = data.clients[0]?.id || "";
  const firstVideoMember = videoMembers[0]?.id || "";
  const [editingShootId, setEditingShootId] = useState<string | null>(null);
  const [editingReelId, setEditingReelId] = useState<string | null>(null);
  const [shoot, setShoot] = useState({ shoot_date: new Date().toISOString().slice(0, 10), shoot_time: "", client_id: firstClient, assigned_videographer_id: firstVideoMember, shoot_type: "Product", shoot_location: "", videos_shot_count: "0", shoot_status: "Scheduled", raw_video_uploaded: "No" as "Yes" | "No", raw_video_folder_link: "", remarks: "" });
  const [reel, setReel] = useState({ client_id: firstClient, assigned_editor_id: firstVideoMember, reel_title: "", reel_status: "Pending", reels_completed_count: "0", final_reel_uploaded: "No" as "Yes" | "No", final_reel_link: "", group_shared: "No" as "Yes" | "No", reel_completion_date: new Date().toISOString().slice(0, 10), remarks: "" });

  useEffect(() => {
    if (!shoot.client_id && firstClient) setShoot((current) => ({ ...current, client_id: firstClient }));
    if (!reel.client_id && firstClient) setReel((current) => ({ ...current, client_id: firstClient }));
    if (!shoot.assigned_videographer_id && firstVideoMember) setShoot((current) => ({ ...current, assigned_videographer_id: firstVideoMember }));
    if (!reel.assigned_editor_id && firstVideoMember) setReel((current) => ({ ...current, assigned_editor_id: firstVideoMember }));
  }, [firstClient, firstVideoMember, reel.assigned_editor_id, reel.client_id, shoot.assigned_videographer_id, shoot.client_id]);

  async function addShoot(event: React.FormEvent) {
    event.preventDefault();
    const payload = { ...shoot, assigned_videographer_id: shoot.assigned_videographer_id || null, videos_shot_count: Number(shoot.videos_shot_count || 0), shoot_time: shoot.shoot_time || null, raw_video_folder_link: shoot.raw_video_folder_link || null, remarks: shoot.remarks || null };
    const { error } = editingShootId
      ? await supabase.from("video_shoots").update(payload).eq("id", editingShootId)
      : await supabase.from("video_shoots").insert(payload);
    if (error) return toast.error(error.message);
    await queryClient.invalidateQueries({ queryKey: ["dmt_workspace"] });
    await queryClient.invalidateQueries({ queryKey: ["dmt_dashboard"] });
    toast.success(editingShootId ? "Shoot updated" : "Shoot saved in database");
    setEditingShootId(null);
    setShoot((current) => ({
      ...current,
      shoot_time: "",
      shoot_type: "Product",
      shoot_location: "",
      videos_shot_count: "0",
      shoot_status: "Scheduled",
      raw_video_uploaded: "No",
      raw_video_folder_link: "",
      remarks: "",
    }));
  }

  async function addReel(event: React.FormEvent) {
    event.preventDefault();
    const payload = { ...reel, assigned_editor_id: reel.assigned_editor_id || null, reels_completed_count: Number(reel.reels_completed_count || 0), final_reel_link: reel.final_reel_link || null, remarks: reel.remarks || null };
    const { error } = editingReelId
      ? await supabase.from("video_reel_entries").update(payload).eq("id", editingReelId)
      : await supabase.from("video_reel_entries").insert(payload);
    if (error) return toast.error(error.message);
    await queryClient.invalidateQueries({ queryKey: ["dmt_workspace"] });
    await queryClient.invalidateQueries({ queryKey: ["dmt_dashboard"] });
    toast.success(editingReelId ? "Reel updated" : "Reel saved in database");
    setEditingReelId(null);
    setReel((current) => ({
      ...current,
      reel_title: "",
      reel_status: "Pending",
      reels_completed_count: "0",
      final_reel_uploaded: "No",
      final_reel_link: "",
      group_shared: "No",
      remarks: "",
    }));
  }

  async function deleteShoot(row: Record<string, unknown>) {
    if (!window.confirm("Delete this shoot entry?")) return;
    const { error } = await supabase.from("video_shoots").delete().eq("id", String(row.id));
    if (error) return toast.error(error.message);
    await queryClient.invalidateQueries({ queryKey: ["dmt_workspace"] });
    await queryClient.invalidateQueries({ queryKey: ["dmt_dashboard"] });
    toast.success("Shoot deleted");
  }

  async function deleteReel(row: Record<string, unknown>) {
    if (!window.confirm("Delete this reel entry?")) return;
    const { error } = await supabase.from("video_reel_entries").delete().eq("id", String(row.id));
    if (error) return toast.error(error.message);
    await queryClient.invalidateQueries({ queryKey: ["dmt_workspace"] });
    await queryClient.invalidateQueries({ queryKey: ["dmt_dashboard"] });
    toast.success("Reel deleted");
  }

  function editShoot(row: Record<string, unknown>) {
    setEditingShootId(String(row.id));
    setShoot({
      shoot_date: String(row.shoot_date || new Date().toISOString().slice(0, 10)),
      shoot_time: String(row.shoot_time || ""),
      client_id: String(row.client_id || ""),
      assigned_videographer_id: String(row.assigned_videographer_id || ""),
      shoot_type: String(row.shoot_type || "Product"),
      shoot_location: String(row.shoot_location || ""),
      videos_shot_count: String(row.videos_shot_count || "0"),
      shoot_status: String(row.shoot_status || "Scheduled"),
      raw_video_uploaded: (row.raw_video_uploaded === "Yes" ? "Yes" : "No") as "Yes" | "No",
      raw_video_folder_link: String(row.raw_video_folder_link || ""),
      remarks: String(row.remarks || ""),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function editReel(row: Record<string, unknown>) {
    setEditingReelId(String(row.id));
    setReel({
      client_id: String(row.client_id || ""),
      assigned_editor_id: String(row.assigned_editor_id || ""),
      reel_title: String(row.reel_title || ""),
      reel_status: String(row.reel_status || "Pending"),
      reels_completed_count: String(row.reels_completed_count || "0"),
      final_reel_uploaded: (row.final_reel_uploaded === "Yes" ? "Yes" : "No") as "Yes" | "No",
      final_reel_link: String(row.final_reel_link || ""),
      group_shared: (row.group_shared === "Yes" ? "Yes" : "No") as "Yes" | "No",
      reel_completion_date: String(row.reel_completion_date || new Date().toISOString().slice(0, 10)),
      remarks: String(row.remarks || ""),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <section className="space-y-6">
      <Header title="Video Team" subtitle="Shoots, reel editing, uploads, and group sharing." />
      <div className="grid gap-5 xl:grid-cols-2">
        <Panel title={editingShootId ? "Edit Shoot" : "Add Shoot"} action={editingShootId ? <Button type="button" variant="outline" className="border-slate-200 bg-white text-slate-700" onClick={() => setEditingShootId(null)}>Cancel edit</Button> : null}>
          <form onSubmit={addShoot} className="grid gap-4 md:grid-cols-2">
            <Field label="Date"><Input type="date" value={shoot.shoot_date} onChange={(e) => setShoot({ ...shoot, shoot_date: e.target.value })} /></Field>
            <Field label="Time"><Input type="time" value={shoot.shoot_time} onChange={(e) => setShoot({ ...shoot, shoot_time: e.target.value })} /></Field>
            <Field label="Client"><select className={selectClassName()} value={shoot.client_id} onChange={(e) => setShoot({ ...shoot, client_id: e.target.value })}>{data.clients.map((client) => <option key={client.id} value={client.id}>{clientName(data.clients, client.id)}</option>)}</select></Field>
            <Field label="Videographer"><select className={selectClassName()} value={shoot.assigned_videographer_id} onChange={(e) => setShoot({ ...shoot, assigned_videographer_id: e.target.value })}>{videoMembers.map((member) => <option key={member.id} value={member.id}>{member.full_name}</option>)}</select></Field>
            <Field label="Status"><select className={selectClassName()} value={shoot.shoot_status} onChange={(e) => setShoot({ ...shoot, shoot_status: e.target.value })}>{["Scheduled", "Completed", "Cancelled"].map((value) => <option key={value}>{value}</option>)}</select></Field>
            <Field label="Shoot Type"><Input value={shoot.shoot_type} onChange={(e) => setShoot({ ...shoot, shoot_type: e.target.value })} /></Field>
            <Field label="Videos Shot"><Input type="number" min="0" value={shoot.videos_shot_count} onChange={(e) => setShoot({ ...shoot, videos_shot_count: e.target.value })} /></Field>
            <Field label="Location"><Input value={shoot.shoot_location} onChange={(e) => setShoot({ ...shoot, shoot_location: e.target.value })} /></Field>
            <Field label="Raw Uploaded"><select className={selectClassName()} value={shoot.raw_video_uploaded} onChange={(e) => setShoot({ ...shoot, raw_video_uploaded: e.target.value as "Yes" | "No" })}><option>No</option><option>Yes</option></select></Field>
            <div className="md:col-span-2"><Button className="bg-blue-600 text-white hover:bg-blue-700"><Plus className="size-4" /> {editingShootId ? "Update Shoot" : "Add Shoot"}</Button></div>
          </form>
        </Panel>
        <Panel title={editingReelId ? "Edit Reel" : "Add Reel"} action={editingReelId ? <Button type="button" variant="outline" className="border-slate-200 bg-white text-slate-700" onClick={() => setEditingReelId(null)}>Cancel edit</Button> : null}>
          <form onSubmit={addReel} className="grid gap-4 md:grid-cols-2">
            <Field label="Client"><select className={selectClassName()} value={reel.client_id} onChange={(e) => setReel({ ...reel, client_id: e.target.value })}>{data.clients.map((client) => <option key={client.id} value={client.id}>{clientName(data.clients, client.id)}</option>)}</select></Field>
            <Field label="Editor"><select className={selectClassName()} value={reel.assigned_editor_id} onChange={(e) => setReel({ ...reel, assigned_editor_id: e.target.value })}>{videoMembers.map((member) => <option key={member.id} value={member.id}>{member.full_name}</option>)}</select></Field>
            <Field label="Completion Date"><Input type="date" value={reel.reel_completion_date} onChange={(e) => setReel({ ...reel, reel_completion_date: e.target.value })} /></Field>
            <Field label="Reel Title"><Input value={reel.reel_title} onChange={(e) => setReel({ ...reel, reel_title: e.target.value })} required /></Field>
            <Field label="Status"><select className={selectClassName()} value={reel.reel_status} onChange={(e) => setReel({ ...reel, reel_status: e.target.value })}>{["Pending", "Editing", "Review", "Completed"].map((value) => <option key={value}>{value}</option>)}</select></Field>
            <Field label="Completed Count"><Input type="number" min="0" value={reel.reels_completed_count} onChange={(e) => setReel({ ...reel, reels_completed_count: e.target.value })} /></Field>
            <Field label="Group Shared"><select className={selectClassName()} value={reel.group_shared} onChange={(e) => setReel({ ...reel, group_shared: e.target.value as "Yes" | "No" })}><option>No</option><option>Yes</option></select></Field>
            <Field label="Final Link"><Input value={reel.final_reel_link} onChange={(e) => setReel({ ...reel, final_reel_link: e.target.value })} /></Field>
            <Field label="Final Uploaded"><select className={selectClassName()} value={reel.final_reel_uploaded} onChange={(e) => setReel({ ...reel, final_reel_uploaded: e.target.value as "Yes" | "No" })}><option>No</option><option>Yes</option></select></Field>
            <div className="md:col-span-2"><Button className="bg-blue-600 text-white hover:bg-blue-700"><Plus className="size-4" /> {editingReelId ? "Update Reel" : "Add Reel"}</Button></div>
          </form>
        </Panel>
      </div>
      <WorkTable title="Shoot Entries" rows={data.shoots} columns={["date", "client", "assignee", "status", "count", "location"]} onEdit={editShoot} onDelete={deleteShoot} />
      <WorkTable title="Reel Entries" rows={data.reels} columns={["client", "assignee", "title", "status", "count", "shared", "link"]} onEdit={editReel} onDelete={deleteReel} />
    </section>
  );
}

function WorkTable({
  title,
  rows,
  columns,
  onEdit,
  onDelete,
}: {
  title: string;
  rows: Array<Record<string, unknown>>;
  columns: string[];
  onEdit?: (row: Record<string, unknown>) => void;
  onDelete?: (row: Record<string, unknown>) => void;
}) {
  function value(row: Record<string, unknown>, column: string) {
    return String(rowToDisplay(row)[column] ?? "-");
  }
  return (
    <Panel title={title} action={
      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="border-blue-200 bg-white text-blue-700 hover:bg-blue-50 hover:text-blue-800" onClick={() => openPdfReport(title, "Professional work report by client and assigned team member.", reportRows(rows, columns), columns)}><Download className="size-4" /> PDF</Button>
        <Button variant="outline" size="sm" className="border-blue-200 bg-white text-blue-700 hover:bg-blue-50 hover:text-blue-800" onClick={() => saveCsv(`${title.toLowerCase().replaceAll(" ", "-")}.csv`, rows)}><Download className="size-4" /> CSV</Button>
      </div>
    }>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="border-b text-left text-xs uppercase text-slate-500">
            <tr>
              {columns.map((column) => <th key={column} className="py-3 pr-4">{column}</th>)}
              {(onEdit || onDelete) ? <th className="py-3 pr-4 text-right">Actions</th> : null}
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.length ? rows.map((row) => (
              <tr key={String(row.id)}>
                {columns.map((column) => <td key={column} className="py-3 pr-4">{value(row, column)}</td>)}
                {(onEdit || onDelete) ? (
                  <td className="py-3 pr-4">
                    <div className="flex justify-end gap-2">
                      {onEdit ? <Button type="button" size="icon" variant="outline" className="size-8 border-blue-200 bg-white text-blue-700 hover:bg-blue-50" onClick={() => onEdit(row)} aria-label="Edit"><Pencil className="size-4" /></Button> : null}
                      {onDelete ? <Button type="button" size="icon" variant="outline" className="size-8 border-red-200 bg-white text-red-600 hover:bg-red-50" onClick={() => onDelete(row)} aria-label="Delete"><Trash2 className="size-4" /></Button> : null}
                    </div>
                  </td>
                ) : null}
              </tr>
            )) : <tr><td className="py-8 text-center text-slate-500" colSpan={columns.length + (onEdit || onDelete ? 1 : 0)}>No records yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function DailyWorkPage() {
  const month = new Date().toISOString().slice(0, 7);
  const { data = emptyWorkspace } = useDmtWorkspace(month);
  const today = new Date().toISOString().slice(0, 10);
  const graphics = data.graphics.filter((row) => row.work_date === today);
  const shoots = data.shoots.filter((row) => row.shoot_date === today);
  const reels = data.reels.filter((row) => row.reel_completion_date === today);
  return (
    <section className="space-y-6">
      <Header title="Daily Work" subtitle="Combined daily completed work across graphics and video." />
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Graphics Today" value={graphics.reduce((sum, row) => sum + Number(row.quantity || 0), 0)} icon={Palette} color="violet" />
        <StatCard label="Shoots Today" value={shoots.length} icon={CalendarDays} color="info" />
        <StatCard label="Reels Today" value={reels.reduce((sum, row) => sum + Number(row.reels_completed_count || 0), 0)} icon={Clapperboard} color="primary" />
      </div>
      <WorkTable title="Today Graphic Work" rows={graphics} columns={["date", "client", "assignee", "title", "qty", "status", "shared"]} />
      <WorkTable title="Today Video Work" rows={[...shoots, ...reels]} columns={["date", "client", "assignee", "title", "status", "count"]} />
    </section>
  );
}

function CalendarPage() {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [client, setClient] = useState("");
  const [team, setTeam] = useState("");
  const [member, setMember] = useState("");
  const [status, setStatus] = useState("");
  const { data = emptyWorkspace } = useDmtWorkspace(month);
  const days = useMemo(() => buildMonth(month), [month]);
  const memberOptions = data.members.filter((item) => item.department && (!team || item.department === team));
  const events = [
    ...data.graphics.map((row) => ({ id: row.id, date: row.work_date, type: "Graphics", team: "graphics", memberId: row.designer_id, clientId: row.client_id, client: row.client_name, assignee: row.assignee_name, title: row.creative_title, status: row.status })),
    ...data.shoots.map((row) => ({ id: row.id, date: row.shoot_date, type: "Shoot", team: "video", memberId: row.assigned_videographer_id, clientId: row.client_id, client: row.client_name, assignee: row.assignee_name, title: row.shoot_type || "Video shoot", status: row.shoot_status })),
    ...data.reels.map((row) => ({ id: row.id, date: row.reel_completion_date || "", type: "Reel", team: "video", memberId: row.assigned_editor_id, clientId: row.client_id, client: row.client_name, assignee: row.assignee_name, title: row.reel_title, status: row.reel_status })),
  ].filter((event) =>
    event.date?.startsWith(month) &&
    (!client || event.clientId === client) &&
    (!team || event.team === team) &&
    (!member || event.memberId === member) &&
    (!status || event.status === status)
  ).sort((a, b) => a.date.localeCompare(b.date));
  const selectedClient = client ? clientName(data.clients, client) : "all clients";
  return (
    <section className="space-y-6">
      <Header title="Calendar" subtitle={`Graphics and video schedule for ${selectedClient}.`} />
      <Panel title="Work Calendar">
        <div className="mb-4 grid gap-3 lg:grid-cols-[180px_1fr_170px_190px_180px]">
          <Input type="month" value={month} onChange={(event) => setMonth(event.target.value)} />
          <select className={selectClassName()} value={client} onChange={(event) => setClient(event.target.value)}>
            <option value="">All clients</option>
            {data.clients.map((item) => <option key={item.id} value={item.id}>{clientName(data.clients, item.id)}</option>)}
          </select>
          <select className={selectClassName()} value={team} onChange={(event) => { setTeam(event.target.value); setMember(""); }}>
            <option value="">All teams</option>
            <option value="graphics">Graphics</option>
            <option value="video">Video</option>
          </select>
          <select className={selectClassName()} value={member} onChange={(event) => setMember(event.target.value)}>
            <option value="">All members</option>
            {memberOptions.map((item) => <option key={item.id} value={item.id}>{item.full_name}</option>)}
          </select>
          <select className={selectClassName()} value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">All statuses</option>
            {["Pending", "In Progress", "Completed", "Scheduled", "Cancelled", "Editing", "Review"].map((value) => <option key={value}>{value}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-7 border-l border-t text-xs font-medium text-slate-500">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="border-b border-r bg-slate-100 p-2 text-center">{day}</div>
          ))}
          {days.map((day, index) => {
            const date = day ? `${month}-${String(day).padStart(2, "0")}` : "";
            const dateEvents = events.filter((event) => event.date === date);
            return (
              <div key={`${date}-${index}`} className="min-h-36 border-b border-r bg-white p-2 align-top">
                {day ? <div className="mb-2 font-semibold text-slate-950">{day}</div> : null}
                <div className="space-y-1.5">
                  {dateEvents.slice(0, 4).map((event) => (
                    <div key={`${event.type}-${event.id}`} className="rounded-md bg-slate-100 p-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold uppercase", event.team === "graphics" ? "bg-violet-100 text-violet-700" : "bg-sky-100 text-sky-700")}>{event.type}</span>
                        <span className={cn("max-w-[92px] truncate rounded-full px-2 py-0.5 text-[10px] font-bold", statusBadgeClass(event.status))}>{event.status}</span>
                      </div>
                      <div className="mt-1 truncate font-semibold text-slate-950">{event.title}</div>
                      <div className="truncate text-slate-500">{event.client}</div>
                      <div className="truncate text-slate-400">{event.assignee}</div>
                    </div>
                  ))}
                  {dateEvents.length > 4 ? <div className="text-slate-500">+{dateEvents.length - 4} more</div> : null}
                </div>
            </div>
            );
          })}
        </div>
      </Panel>
    </section>
  );
}

function buildMonth(month: string) {
  const first = new Date(`${month}-01T00:00:00`);
  const total = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  const cells: Array<number | null> = Array(first.getDay()).fill(null);
  for (let day = 1; day <= total; day += 1) cells.push(day);
  while (cells.length % 7) cells.push(null);
  return cells;
}

function ReportsPage() {
  const month = new Date().toISOString().slice(0, 7);
  const { data = emptyWorkspace } = useDmtWorkspace(month);
  const rows = data.summary.length ? data.summary : buildLocalSummary(data, month);
  const summaryRows = rows.map((row) => ({
    client: row.client_name,
    graphic_target: row.graphic_target,
    completed_creatives: row.completed_creatives,
    remaining_creatives: row.remaining_creatives,
    reel_target: row.reel_target,
    completed_reels: row.completed_reels,
    remaining_reels: row.remaining_reels,
    completed_shoots: row.completed_shoots,
    pending_group_shares: Number(row.pending_graphic_group_shares || 0) + Number(row.pending_reel_group_shares || 0),
  }));
  return (
    <section className="space-y-6">
      <Header title="Reports" subtitle="Client, team, member, and combined monthly reports." />
      <Panel title="Monthly Client Report" action={
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => openPdfReport(`Monthly Client Summary - ${month}`, "Client-wise graphics, reels, shoots, and pending group share report.", summaryRows)} className="bg-blue-600 text-white hover:bg-blue-700"><Download className="size-4" /> Summary PDF</Button>
          <Button variant="outline" onClick={() => openPdfReport(`Graphics Report - ${month}`, "Separate graphics work report.", reportRows(data.graphics, ["date", "client", "assignee", "title", "type", "qty", "status", "shared", "link"]), ["date", "client", "assignee", "title", "type", "qty", "status", "shared", "link"])} className="border-blue-200 bg-white text-blue-700 hover:bg-blue-50">Graphics PDF</Button>
          <Button variant="outline" onClick={() => openPdfReport(`Shoot Report - ${month}`, "Separate video shoot report.", reportRows(data.shoots, ["date", "client", "assignee", "status", "count", "location"]), ["date", "client", "assignee", "status", "count", "location"])} className="border-blue-200 bg-white text-blue-700 hover:bg-blue-50">Shoots PDF</Button>
          <Button variant="outline" onClick={() => openPdfReport(`Reel Report - ${month}`, "Separate reel editing and upload report.", reportRows(data.reels, ["date", "client", "assignee", "title", "status", "count", "shared", "link"]), ["date", "client", "assignee", "title", "status", "count", "shared", "link"])} className="border-blue-200 bg-white text-blue-700 hover:bg-blue-50">Reels PDF</Button>
          <Button variant="outline" onClick={() => saveCsv(`digital-marketing-report-${month}.csv`, rows as unknown as Record<string, unknown>[])} className="border-blue-200 bg-white text-blue-700 hover:bg-blue-50"><Download className="size-4" /> CSV</Button>
        </div>
      }>
        <ClientProgressTable rows={rows} />
      </Panel>
    </section>
  );
}

function HistoryPage() {
  const month = new Date().toISOString().slice(0, 7);
  const { data = emptyWorkspace } = useDmtWorkspace(month);
  return (
    <section className="space-y-6">
      <Header title="History" subtitle="Permanent searchable history for previous months." />
      <WorkTable title="All Graphic History" rows={data.graphics} columns={["date", "client", "assignee", "title", "type", "qty", "status", "shared"]} />
      <WorkTable title="All Shoot History" rows={data.shoots} columns={["date", "client", "assignee", "status", "count", "location"]} />
      <WorkTable title="All Reel History" rows={data.reels} columns={["date", "client", "assignee", "title", "status", "count", "shared"]} />
    </section>
  );
}

export default function DigitalMarketingTeamRoutes() {
  return (
    <Routes>
      <Route index element={<Navigate to="/digital_marketing_team/dashboard" replace />} />
      <Route path="login" element={<Login />} />
      <Route path="dashboard" element={<Protected>{() => <Dashboard />}</Protected>} />
      <Route path="graphics" element={<Protected>{() => <GraphicsPage />}</Protected>} />
      <Route path="videos" element={<Protected>{() => <VideosPage />}</Protected>} />
      <Route path="daily-work" element={<Protected>{() => <DailyWorkPage />}</Protected>} />
      <Route path="calendar" element={<Protected>{() => <CalendarPage />}</Protected>} />
      <Route path="reports" element={<Protected>{() => <ReportsPage />}</Protected>} />
      <Route path="history" element={<Protected>{() => <HistoryPage />}</Protected>} />
      <Route path="*" element={<Navigate to="/digital_marketing_team/dashboard" replace />} />
    </Routes>
  );
}
