import { Link } from "react-router-dom";
import { AlertTriangle, CalendarClock, CheckCircle2, Clapperboard, Megaphone, Users, Wallet, type LucideIcon } from "lucide-react";
import { PageHeader, Panel, ProgressBar, StatCard, StatusBadge } from "@/components/social-desk/ui";
import { clientBalance, currentMonth, inMonth, inr, isOverdue, monthLabel, num, useBoosts, useClients, useContent, useTxns } from "@/lib/socialDesk";

export default function DashboardPage() {
  const month = currentMonth();
  const { data: clients = [] } = useClients();
  const { data: content = [] } = useContent();
  const { data: boosts = [] } = useBoosts();
  const { data: txns = [] } = useTxns();

  const activeClients = clients.filter((c) => c.status === "Active");
  const monthContent = content.filter((c) => inMonth(c.scheduled_date ?? c.published_date, month));
  const posted = monthContent.filter((c) => c.status === "Posted");
  const overdue = content.filter(isOverdue);
  const activeBoosts = boosts.filter((b) => ["Scheduled", "Active"].includes(b.status));
  const funds = clientBalance(txns);
  const targetTotal = activeClients.reduce((sum, c) => sum + c.post_target + c.reel_target + c.group_target, 0);
  const doneTotal = posted.length + posted.reduce((sum, c) => sum + (c.group_share_count ?? 0), 0);
  const progress = targetTotal ? Math.round((doneTotal / targetTotal) * 100) : 0;

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" subtitle={`Overview for ${monthLabel(month)}`} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active clients" value={activeClients.length} icon={Users} color="primary" hint={`${clients.length} total accounts`} />
        <StatCard label="Content posted" value={posted.length} icon={CheckCircle2} color="success" hint={`${monthContent.length} scheduled this month`} />
        <StatCard label="Overdue items" value={overdue.length} icon={AlertTriangle} color={overdue.length ? "destructive" : "info"} hint="Needs attention" />
        <StatCard label="Ad balance" value={inr(funds.balance)} icon={Wallet} color={funds.balance < 0 ? "destructive" : "violet"} hint={`${inr(funds.spent)} spent`} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Panel title="Monthly delivery">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <div className="font-display text-3xl font-bold">{progress}%</div>
              <p className="text-sm text-muted-foreground">
                {num(doneTotal)} delivered against {num(targetTotal)} planned units
              </p>
            </div>
            <Link to="/social_desk/reports" className="text-sm font-medium text-primary hover:underline">
              View reports
            </Link>
          </div>
          <ProgressBar value={progress} />
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <MiniMetric label="Posts" value={posted.filter((c) => c.content_type !== "Reel").length} />
            <MiniMetric label="Reels" value={posted.filter((c) => c.content_type === "Reel").length} />
            <MiniMetric label="Group shares" value={posted.reduce((sum, c) => sum + (c.group_share_count ?? 0), 0)} />
          </div>
        </Panel>

        <Panel title="Ad activity">
          <div className="space-y-3">
            {activeBoosts.slice(0, 5).map((b) => (
              <Link key={b.id} to="/social_desk/boosts" className="flex items-center justify-between gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/60">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{b.campaign_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {inr(b.spent)} of {inr(b.budget)}
                  </p>
                </div>
                <StatusBadge status={b.status} />
              </Link>
            ))}
            {!activeBoosts.length && <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">No scheduled or active boosts.</p>}
          </div>
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Upcoming content">
          <div className="space-y-3">
            {content
              .filter((c) => c.scheduled_date && !["Posted", "Cancelled"].includes(c.status))
              .slice(0, 6)
              .map((c) => (
                <Link key={c.id} to="/social_desk/content" className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/60">
                  <CalendarClock className="size-4 text-primary" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{c.title}</p>
                    <p className="text-xs text-muted-foreground">{c.scheduled_date ?? "No date"}</p>
                  </div>
                  <StatusBadge status={isOverdue(c) ? "Overdue" : c.status} />
                </Link>
              ))}
            {!content.length && <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">No content planned yet.</p>}
          </div>
        </Panel>

        <Panel title="Quick links">
          <div className="grid gap-3 sm:grid-cols-2">
            <QuickLink to="/social_desk/clients" icon={Users} label="Manage clients" />
            <QuickLink to="/social_desk/content" icon={Clapperboard} label="Plan content" />
            <QuickLink to="/social_desk/boosts" icon={Megaphone} label="Track boosts" />
            <QuickLink to="/social_desk/funds" icon={Wallet} label="Update funds" />
          </div>
        </Panel>
      </div>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-muted p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-xl font-bold">{num(value)}</div>
    </div>
  );
}

function QuickLink({ to, icon: Icon, label }: { to: string; icon: LucideIcon; label: string }) {
  return (
    <Link to={to} className="flex items-center gap-3 rounded-lg border p-4 font-medium transition-colors hover:bg-muted/60">
      <span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">
        <Icon className="size-4" />
      </span>
      {label}
    </Link>
  );
}


