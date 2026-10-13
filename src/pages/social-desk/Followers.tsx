import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, Edit2, FileText, Plus, RefreshCw, TrendingUp } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDelete, EmptyState, PageHeader, Panel, RecordDialog, Select, StatCard, useEditor, type Field } from "@/components/social-desk/ui";
import { supabase } from "@/lib/supabase";
import {
  businessName,
  currentMonth,
  downloadExcel,
  monthLabel,
  num,
  today,
  useClients,
  useFollowerSnapshots,
  useRemove,
  useSave,
  type Client,
  type FollowerSnapshot,
} from "@/lib/socialDesk";

const snapshotFields: Field[] = [
  { name: "client_id", label: "Business", type: "client", required: true },
  { name: "snapshot_date", label: "Date", type: "date", required: true },
  { name: "instagram_followers", label: "Current Instagram followers", type: "number" },
  { name: "facebook_followers", label: "Current Facebook followers (optional)", type: "number" },
  { name: "instagram_url", label: "Instagram link", type: "url", full: true },
  { name: "facebook_url", label: "Facebook link (optional)", type: "url", full: true },
  { name: "notes", label: "Notes", type: "textarea", full: true },
];

type SnapshotWithGrowth = FollowerSnapshot & {
  instagram_growth: number;
  facebook_growth: number;
  total_growth: number;
};

type FollowerReportRow = {
  Date: string;
  Business: string;
  "Instagram Followers": number;
  "Instagram Daily Growth": number;
  "Facebook Followers": number;
  "Facebook Daily Growth": number;
  "Total Followers": number;
  "Total Daily Growth": number;
  "Instagram Link": string;
  "Facebook Link": string;
  Notes: string;
};

function esc(value: unknown) {
  return String(value ?? "").replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]!));
}

function shortLink(value: string | null | undefined) {
  if (!value) return "-";
  try {
    const url = new URL(value);
    return `${url.hostname}${url.pathname}`.replace(/\/$/, "");
  } catch {
    return value;
  }
}

function rowsWithGrowth(rows: FollowerSnapshot[]) {
  const sorted = [...rows].sort((a, b) => a.snapshot_date.localeCompare(b.snapshot_date));
  return sorted.map((row) => {
    const instagram_growth = Number(row.instagram_followers || 0) - Number(row.instagram_start_followers || 0);
    const facebook_growth = Number(row.facebook_followers || 0) - Number(row.facebook_start_followers || 0);
    return {
      ...row,
      instagram_growth,
      facebook_growth,
      total_growth: instagram_growth + facebook_growth,
    };
  });
}

function reportRows(rows: SnapshotWithGrowth[], client?: Client): FollowerReportRow[] {
  const showFacebook = Boolean(client?.facebook || rows.some((row) => row.facebook_url || Number(row.facebook_followers || 0) > 0));
  return rows.map((row) => ({
    Date: row.snapshot_date,
    Business: businessName(client),
    "Instagram Followers": Number(row.instagram_followers || 0),
    "Instagram Daily Growth": row.instagram_growth,
    "Facebook Followers": showFacebook ? Number(row.facebook_followers || 0) : 0,
    "Facebook Daily Growth": showFacebook ? row.facebook_growth : 0,
    "Total Followers": Number(row.instagram_followers || 0) + (showFacebook ? Number(row.facebook_followers || 0) : 0),
    "Total Daily Growth": row.instagram_growth + (showFacebook ? row.facebook_growth : 0),
    "Instagram Link": row.instagram_url || client?.instagram || "",
    "Facebook Link": showFacebook ? row.facebook_url || client?.facebook || "" : "",
    Notes: row.notes || "",
  }));
}

function downloadFollowersPDF(rows: SnapshotWithGrowth[], client: Client | undefined, month: string) {
  if (!rows.length || !client) return;
  const showFacebook = Boolean(client.facebook || rows.some((row) => row.facebook_url || Number(row.facebook_followers || 0) > 0));
  const first = rows[0]!;
  const last = rows[rows.length - 1]!;
  const instagramGrowth = rows.reduce((sum, row) => sum + row.instagram_growth, 0);
  const facebookGrowth = showFacebook ? rows.reduce((sum, row) => sum + row.facebook_growth, 0) : 0;
  const totalGrowth = instagramGrowth + facebookGrowth;
  const html = `<!doctype html><html><head><title> </title><style>
    @page{size:A4;margin:0}*{box-sizing:border-box}body{font-family:Arial,sans-serif;margin:0;color:#111827;background:#fff}.page{padding:17mm}.top{height:7px;border-radius:999px;background:linear-gradient(90deg,#f97316,#ec4899);margin-bottom:18px}.head{display:flex;justify-content:space-between;gap:24px;border-bottom:1px solid #e5e7eb;padding-bottom:16px}.brand{font-size:11px;font-weight:800;letter-spacing:1.5px;color:#f97316;text-transform:uppercase}h1{margin:5px 0 8px;font-size:28px}.meta{color:#64748b;font-size:12px;line-height:1.6}.cards{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:18px 0}.card{border:1px solid #e5e7eb;border-radius:10px;padding:11px;background:#fafafa}.card span{display:block;color:#64748b;font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.6px}.card strong{display:block;margin-top:5px;font-size:17px;color:#0f172a}.links{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px}.field{border:1px solid #e5e7eb;border-radius:10px;padding:10px;overflow-wrap:anywhere}.field span{display:block;color:#64748b;font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.6px;margin-bottom:4px}.field strong{font-size:12px}table{width:100%;border-collapse:collapse;font-size:11px}th{background:#111827;color:#fff;padding:8px 7px;text-align:left;font-size:9px;text-transform:uppercase}td{border:1px solid #e5e7eb;padding:8px 7px}td.num,th.num{text-align:right}.pos{color:#15803d;font-weight:700}.neg{color:#dc2626;font-weight:700}.footer{margin-top:14px;color:#64748b;font-size:11px;text-align:right}
  </style></head><body><main class="page">
    <div class="top"></div>
    <section class="head"><div><div class="brand">SocialDesk CRM</div><h1>Follower Tracking Report</h1><div class="meta">${esc(businessName(client))}<br/>${esc(monthLabel(month))}</div></div><div class="meta">Generated<br/>${esc(new Date().toLocaleString("en-IN"))}</div></section>
    <section class="cards"><div class="card"><span>Start Total</span><strong>${esc(num(Number(first.instagram_start_followers || 0) + (showFacebook ? Number(first.facebook_start_followers || 0) : 0)))}</strong></div><div class="card"><span>End Total</span><strong>${esc(num(Number(last.instagram_followers || 0) + (showFacebook ? Number(last.facebook_followers || 0) : 0)))}</strong></div><div class="card"><span>Month Growth</span><strong>${totalGrowth >= 0 ? "+" : ""}${esc(num(totalGrowth))}</strong></div><div class="card"><span>Tracked Days</span><strong>${rows.length}</strong></div></section>
    <section class="links"><div class="field"><span>Instagram</span><strong>${esc(shortLink(client.instagram))}</strong></div>${showFacebook ? `<div class="field"><span>Facebook</span><strong>${esc(shortLink(client.facebook))}</strong></div>` : ""}</section>
    <table><thead><tr><th>Date</th><th class="num">Instagram</th><th class="num">IG Growth</th>${showFacebook ? `<th class="num">Facebook</th><th class="num">FB Growth</th>` : ""}<th class="num">Total Growth</th><th>Notes</th></tr></thead><tbody>
      ${rows
        .map(
          (row) =>
            `<tr><td>${esc(row.snapshot_date)}</td><td class="num">${esc(num(row.instagram_followers))}</td><td class="num ${row.instagram_growth < 0 ? "neg" : "pos"}">${row.instagram_growth >= 0 ? "+" : ""}${esc(num(row.instagram_growth))}</td>${showFacebook ? `<td class="num">${esc(num(row.facebook_followers))}</td><td class="num ${row.facebook_growth < 0 ? "neg" : "pos"}">${row.facebook_growth >= 0 ? "+" : ""}${esc(num(row.facebook_growth))}</td>` : ""}<td class="num ${row.instagram_growth + (showFacebook ? row.facebook_growth : 0) < 0 ? "neg" : "pos"}">${row.instagram_growth + (showFacebook ? row.facebook_growth : 0) >= 0 ? "+" : ""}${esc(num(row.instagram_growth + (showFacebook ? row.facebook_growth : 0)))}</td><td>${esc(row.notes || "")}</td></tr>`,
        )
        .join("")}
    </tbody></table><p class="footer">Generated from SocialDesk CRM</p>
  </main><script>window.onload=()=>{document.title=" ";setTimeout(()=>window.print(),150)}</script></body></html>`;
  const win = window.open("", "_blank", "width=1100,height=800");
  if (!win) {
    window.alert("Please allow popups to export the PDF report.");
    return;
  }
  win.document.write(html);
  win.document.close();
}

export default function FollowersPage() {
  const [month, setMonth] = useState(currentMonth());
  const [clientId, setClientId] = useState("");
  const [syncing, setSyncing] = useState(false);
  const qc = useQueryClient();
  const editor = useEditor<FollowerSnapshot>();
  const save = useSave("social_desk_follower_snapshots");
  const remove = useRemove("social_desk_follower_snapshots");
  const { data: clients = [] } = useClients();
  const { data: snapshots = [] } = useFollowerSnapshots();

  const activeClients = clients.filter((client) => client.status !== "Archived");
  const selectedClient = activeClients.find((client) => client.id === clientId) || activeClients[0];
  const selectedClientId = selectedClient?.id || "";
  const monthRows = useMemo(() => {
    return rowsWithGrowth(snapshots.filter((row) => row.client_id === selectedClientId && row.snapshot_date.startsWith(month)));
  }, [month, selectedClientId, snapshots]);
  const lastRow = monthRows[monthRows.length - 1];
  const firstRow = monthRows[0];
  const monthGrowth = monthRows.reduce((sum, row) => sum + row.total_growth, 0);
  const dailyAverage = monthRows.length ? Math.round(monthGrowth / monthRows.length) : 0;
  const hasFacebook = Boolean(selectedClient?.facebook || monthRows.some((row) => row.facebook_url || Number(row.facebook_followers || 0) > 0));
  const workbookRows = reportRows(monthRows, selectedClient);

  const syncCurrentCount = useCallback(async (silent = false) => {
    if (!selectedClient) return;
    setSyncing(true);
    try {
      const { data } = await supabase.auth.getSession();
      let token = data.session?.access_token;
      if (data.session?.refresh_token) {
        const refreshed = await supabase.auth.refreshSession();
        token = refreshed.data.session?.access_token || token;
      }
      if (!token) throw new Error("Please sign in again before syncing followers.");
      const response = await fetch("/api/social-desk/followers/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ clientId: selectedClient.id, snapshotDate: today() }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || "Could not sync follower count.");
      await qc.invalidateQueries({ queryKey: ["social_desk_follower_snapshots"] });
      if (!silent) toast.success("Follower count synced");
    } catch (error) {
      if (!silent) toast.error(error instanceof Error ? error.message : "Could not sync follower count.");
    } finally {
      setSyncing(false);
    }
  }, [qc, selectedClient]);

  useEffect(() => {
    if (!selectedClient?.instagram_business_account_id) return;
    syncCurrentCount(true);
    const timer = window.setInterval(() => syncCurrentCount(true), 5 * 60 * 1000);
    return () => window.clearInterval(timer);
  }, [selectedClient?.instagram_business_account_id, syncCurrentCount]);

  const initial = {
    client_id: selectedClientId,
    snapshot_date: today(),
    instagram_followers: lastRow?.instagram_followers ?? 0,
    facebook_followers: lastRow?.facebook_followers ?? 0,
    instagram_start_followers: lastRow?.instagram_followers ?? 0,
    facebook_start_followers: lastRow?.facebook_followers ?? 0,
    instagram_url: selectedClient?.instagram || "",
    facebook_url: selectedClient?.facebook || "",
    ...editor.row,
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Followers Tracker" subtitle={`Daily follower growth for ${selectedClient ? businessName(selectedClient) : "clients"}.`}>
        <Button variant="outline" disabled={!monthRows.length || !selectedClient} onClick={() => downloadFollowersPDF(monthRows, selectedClient, month)}>
          <FileText /> PDF
        </Button>
        <Button disabled={!workbookRows.length || !selectedClient} onClick={() => downloadExcel({ "Follower Tracking": workbookRows }, `followers-${businessName(selectedClient).replace(/\s+/g, "-").toLowerCase()}-${month}`)}>
          <Download /> Excel
        </Button>
        <Button variant="outline" onClick={() => syncCurrentCount()} disabled={!selectedClient || syncing}>
          <RefreshCw className={syncing ? "animate-spin" : ""} /> {syncing ? "Syncing..." : "Sync count"}
        </Button>
        <Button onClick={() => editor.edit({})} disabled={!selectedClient}>
          <Plus /> Add daily count
        </Button>
      </PageHeader>

      <Panel>
        <div className="grid gap-3 md:grid-cols-[180px_1fr]">
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="flex h-9 rounded-md border border-input bg-card px-3 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          <Select value={selectedClientId} onChange={setClientId} options={activeClients.map((client) => ({ value: client.id, label: businessName(client) }))} />
        </div>
      </Panel>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Instagram" value={num(lastRow?.instagram_followers)} icon={TrendingUp} color="primary" hint={selectedClient ? shortLink(selectedClient.instagram) : ""} />
        {hasFacebook && <StatCard label="Facebook" value={num(lastRow?.facebook_followers)} icon={TrendingUp} color="info" hint={selectedClient ? shortLink(selectedClient.facebook) : ""} />}
        <StatCard label="Month Growth" value={`${monthGrowth >= 0 ? "+" : ""}${num(monthGrowth)}`} icon={TrendingUp} color={monthGrowth >= 0 ? "success" : "destructive"} hint={`${monthRows.length} tracked days`} />
        <StatCard label="Daily Average" value={`${dailyAverage >= 0 ? "+" : ""}${num(dailyAverage)}`} icon={TrendingUp} color="violet" hint={monthLabel(month)} />
      </div>

      <Panel title="Daily follower snapshots">
        {monthRows.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="border-b text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="py-3 pr-4">Date</th>
                  <th className="py-3 pr-4">Current Instagram</th>
                  <th className="py-3 pr-4">IG growth</th>
                  {hasFacebook && <th className="py-3 pr-4">Current Facebook</th>}
                  {hasFacebook && <th className="py-3 pr-4">FB growth</th>}
                  <th className="py-3 pr-4">Current total</th>
                  <th className="py-3 pr-4">Total growth</th>
                  <th className="py-3 pr-4">Source</th>
                  <th className="py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {monthRows.map((row) => (
                  <tr key={row.id}>
                    <td className="py-3 pr-4 font-medium">{row.snapshot_date}</td>
                    <td className="py-3 pr-4">{num(row.instagram_followers)}</td>
                    <td className={row.instagram_growth < 0 ? "py-3 pr-4 font-medium text-destructive" : "py-3 pr-4 font-medium text-success"}>
                      {row.instagram_growth >= 0 ? "+" : ""}
                      {num(row.instagram_growth)}
                    </td>
                    {hasFacebook && <td className="py-3 pr-4">{num(row.facebook_followers)}</td>}
                    {hasFacebook && (
                      <td className={row.facebook_growth < 0 ? "py-3 pr-4 font-medium text-destructive" : "py-3 pr-4 font-medium text-success"}>
                        {row.facebook_growth >= 0 ? "+" : ""}
                        {num(row.facebook_growth)}
                      </td>
                    )}
                    <td className="py-3 pr-4 font-medium">{num(Number(row.instagram_followers || 0) + (hasFacebook ? Number(row.facebook_followers || 0) : 0))}</td>
                    <td className={row.total_growth < 0 ? "py-3 pr-4 font-semibold text-destructive" : "py-3 pr-4 font-semibold text-success"}>
                      {row.total_growth >= 0 ? "+" : ""}
                      {num(row.total_growth)}
                    </td>
                    <td className="max-w-[260px] truncate py-3 pr-4 text-xs text-muted-foreground">
                      {[shortLink(row.instagram_url || selectedClient?.instagram), hasFacebook ? shortLink(row.facebook_url || selectedClient?.facebook) : "-"].filter((link) => link !== "-").join(" / ") || "-"}
                    </td>
                    <td className="py-3">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" aria-label="Edit" onClick={() => editor.edit(row)}>
                          <Edit2 />
                        </Button>
                        <ConfirmDelete label="snapshot" onConfirm={() => remove.mutate(row.id)} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="No follower snapshots found" text="Add the first daily count for this client and month." />
        )}
      </Panel>

      <RecordDialog
        open={editor.open}
        onOpenChange={editor.setOpen}
        title={editor.row.id ? "Edit follower snapshot" : "Add follower snapshot"}
        fields={snapshotFields}
        initial={initial}
        saving={save.isPending}
        onSubmit={(row) => {
          const { instagram_growth, facebook_growth, total_growth, ...snapshot } = row;
          const existingForDay = snapshots.find(
            (item) =>
              item.client_id === snapshot.client_id &&
              item.snapshot_date === snapshot.snapshot_date &&
              item.id !== snapshot.id,
          );
          const previousSnapshot = snapshots
            .filter((item) => item.client_id === snapshot.client_id && item.snapshot_date < String(snapshot.snapshot_date || ""))
            .sort((a, b) => b.snapshot_date.localeCompare(a.snapshot_date))[0];
          const existingSnapshot = snapshot.id
            ? snapshots.find((item) => item.id === snapshot.id)
            : existingForDay;
          save.mutate(
            {
              id: snapshot.id || existingForDay?.id,
              ...snapshot,
              instagram_start_followers:
                existingSnapshot?.instagram_start_followers ??
                previousSnapshot?.instagram_followers ??
                snapshot.instagram_followers ??
                0,
              facebook_start_followers:
                existingSnapshot?.facebook_start_followers ??
                previousSnapshot?.facebook_followers ??
                snapshot.facebook_followers ??
                0,
              facebook_followers: snapshot.facebook_followers ?? 0,
            },
            { onSuccess: () => editor.setOpen(false) },
          );
        }}
      />
    </div>
  );
}
