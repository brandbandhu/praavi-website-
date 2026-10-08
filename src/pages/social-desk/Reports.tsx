import { useMemo, useState } from "react";
import { Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, Panel, ProgressBar, Select } from "@/components/social-desk/ui";
import { businessName, clientBalance, currentMonth, downloadExcel, inr, monthLabel, monthStats, useBoosts, useClients, useContent, useTxns } from "@/lib/socialDesk";
import type { Boost, Client, Content, Txn } from "@/lib/socialDesk";

type ReportRow = {
  "Business Name": string;
  Status: string;
  Owner: string;
  "Monthly Post Target": number;
  "Posts Done": number;
  "Monthly Reel Target": number;
  "Reels Done": number;
  "Group Share Target": number;
  "Group Shares Done": number;
  "Delivery %": string;
  "Boost Spend": number;
  "Ad Balance": number;
};

function esc(value: unknown) {
  return String(value ?? "").replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]!));
}

function downloadMonthlyReportPDF(rows: ReportRow[], name: string, month: string) {
  if (!rows.length) return;
  const totalSpend = rows.reduce((sum, row) => sum + row["Boost Spend"], 0);
  const totalBalance = rows.reduce((sum, row) => sum + row["Ad Balance"], 0);
  const avgDelivery = Math.round(rows.reduce((sum, row) => sum + Number(row["Delivery %"].replace("%", "")), 0) / rows.length);
  const html = `<!doctype html><html><head><title> </title><style>
    @page{size:A4 landscape;margin:0}*{box-sizing:border-box}body{font-family:Arial,sans-serif;color:#111827;margin:0;background:#fff;font-size:11px;padding:12mm}.head{display:flex;justify-content:space-between;gap:24px;border-bottom:3px solid #ff6b18;padding-bottom:14px;margin-bottom:14px}.brand h1{margin:0;color:#111827;font-size:24px}.brand p,.meta p{margin:4px 0;color:#667085}.meta{text-align:right}.cards{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:14px}.card{border:1px solid #dde3ee;padding:10px;background:#f8fafc}.card span{display:block;color:#667085;text-transform:uppercase;font-size:9px;font-weight:700}.card strong{display:block;margin-top:5px;font-size:16px;color:#143b73}table{width:100%;border-collapse:collapse;table-layout:fixed}th{background:#111827;color:#fff;text-align:left;font-size:9px;padding:7px 6px}td{border:1px solid #dde3ee;padding:7px 6px;vertical-align:top;word-break:break-word}td:first-child,strong{color:#000}td.num,th.num{text-align:right}.footer{margin-top:14px;color:#667085;border-top:1px solid #dde3ee;padding-top:8px}
  </style></head><body>
    <section class="head"><div class="brand"><h1>SocialDesk Monthly Report</h1><p>${esc(monthLabel(month))}</p><p>Praavi Consultants</p></div><div class="meta"><p><strong>Generated:</strong> ${new Date().toLocaleString("en-IN")}</p><p><strong>Selected Businesses:</strong> ${rows.length}</p></div></section>
    <section class="cards"><div class="card"><span>Businesses</span><strong>${rows.length}</strong></div><div class="card"><span>Average Delivery</span><strong>${avgDelivery}%</strong></div><div class="card"><span>Boost Spend</span><strong>${esc(inr(totalSpend))}</strong></div><div class="card"><span>Ad Balance</span><strong>${esc(inr(totalBalance))}</strong></div></section>
    <table><thead><tr><th>Business Name</th><th>Status</th><th>Owner</th><th class="num">Post Target</th><th class="num">Posts Done</th><th class="num">Reel Target</th><th class="num">Reels Done</th><th class="num">Group Target</th><th class="num">Group Done</th><th class="num">Delivery</th><th class="num">Boost Spend</th><th class="num">Ad Balance</th></tr></thead><tbody>
      ${rows.map((row) => `<tr><td><strong>${esc(row["Business Name"])}</strong></td><td>${esc(row.Status)}</td><td>${esc(row.Owner)}</td><td class="num">${row["Monthly Post Target"]}</td><td class="num">${row["Posts Done"]}</td><td class="num">${row["Monthly Reel Target"]}</td><td class="num">${row["Reels Done"]}</td><td class="num">${row["Group Share Target"]}</td><td class="num">${row["Group Shares Done"]}</td><td class="num">${esc(row["Delivery %"])}</td><td class="num">${esc(inr(row["Boost Spend"]))}</td><td class="num">${esc(inr(row["Ad Balance"]))}</td></tr>`).join("")}
    </tbody></table><p class="footer">Generated from SocialDesk CRM</p><script>window.onload=()=>{document.title=" ";setTimeout(()=>window.print(),150)}</script></body></html>`;
  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(html);
  win.document.close();
}

function reportWorkbook(rows: ReportRow[], clients: Client[], content: Content[], boosts: Boost[], txns: Txn[], month: string) {
  const selectedIds = new Set(clients.map((c) => c.id));
  return {
    "Monthly Summary": rows,
    Content: content
      .filter((item) => selectedIds.has(item.client_id) && ((item.scheduled_date || item.published_date || "").startsWith(month)))
      .map((item) => ({
        Business: businessName(clients.find((c) => c.id === item.client_id)),
        Type: item.content_type,
        Title: item.title,
        Platform: item.platform,
        Status: item.status,
        "Scheduled Date": item.scheduled_date || "",
        "Published Date": item.published_date || "",
        "Group Shares": item.group_share_count,
        "Published URL": item.url || "",
        Remarks: item.remarks || "",
      })),
    Boosts: boosts
      .filter((boost) => selectedIds.has(boost.client_id) && ((boost.start_date || "").startsWith(month) || (boost.end_date || "").startsWith(month)))
      .map((boost) => ({
        Business: businessName(clients.find((c) => c.id === boost.client_id)),
        Campaign: boost.campaign_name,
        Platform: boost.platform,
        Status: boost.status,
        Objective: boost.objective || "",
        Budget: boost.budget,
        Spend: boost.spent,
        Reach: boost.reach,
        Impressions: boost.impressions,
        Engagements: boost.engagements,
        "Start Date": boost.start_date || "",
        "End Date": boost.end_date || "",
      })),
    Funds: txns
      .filter((txn) => selectedIds.has(txn.client_id) && (txn.txn_date || "").startsWith(month))
      .map((txn) => ({
        Business: businessName(clients.find((c) => c.id === txn.client_id)),
        Date: txn.txn_date,
        Type: txn.txn_type,
        Amount: txn.amount,
        Method: txn.payment_method || "",
        Reference: txn.reference || "",
        Notes: txn.notes || "",
      })),
  };
}

export default function ReportsPage() {
  const [month, setMonth] = useState(currentMonth());
  const [client, setClient] = useState("");
  const { data: clients = [] } = useClients();
  const { data: content = [] } = useContent();
  const { data: boosts = [] } = useBoosts();
  const { data: txns = [] } = useTxns();

  const selectedClients = useMemo(() => clients.filter((c) => !client || c.id === client), [client, clients]);
  const rows = useMemo<ReportRow[]>(() => {
    return selectedClients
      .map((c) => {
        const stats = monthStats(c, content, month);
        const funds = clientBalance(txns, c.id);
        const clientBoosts = boosts.filter((b) => b.client_id === c.id && (b.start_date?.startsWith(month) || b.end_date?.startsWith(month)));
        return {
          "Business Name": businessName(c),
          Status: c.status,
          Owner: c.assigned_to || "",
          "Monthly Post Target": c.post_target,
          "Posts Done": stats.posts,
          "Monthly Reel Target": c.reel_target,
          "Reels Done": stats.reels,
          "Group Share Target": c.group_target,
          "Group Shares Done": stats.groups,
          "Delivery %": `${stats.pct}%`,
          "Boost Spend": clientBoosts.reduce((sum, b) => sum + b.spent, 0),
          "Ad Balance": funds.balance,
        };
      });
  }, [boosts, content, month, selectedClients, txns]);

  return (
    <div className="space-y-5">
      <PageHeader title="Reports" subtitle={`Monthly delivery and fund summary for ${monthLabel(month)}`}>
        <Button variant="outline" onClick={() => downloadMonthlyReportPDF(rows, `socialdesk-monthly-report-${month}`, month)}>
          <FileText /> PDF
        </Button>
        <Button onClick={() => downloadExcel(reportWorkbook(rows, selectedClients, content, boosts, txns, month), `socialdesk-monthly-report-${month}`)}>
          <Download /> Excel
        </Button>
      </PageHeader>

      <Panel>
        <div className="mb-4 grid gap-3 sm:grid-cols-[180px_260px]">
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="flex h-9 rounded-md border border-input bg-card px-3 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          <Select value={client} onChange={setClient} placeholder="All businesses" options={clients.map((c) => ({ value: c.id, label: businessName(c) }))} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-sm">
            <thead className="border-b text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="py-3 pr-4">Business</th>
                <th className="py-3 pr-4">Delivery</th>
                <th className="py-3 pr-4">Posts</th>
                <th className="py-3 pr-4">Reels</th>
                <th className="py-3 pr-4">Group shares</th>
                <th className="py-3 pr-4">Boost spend</th>
                <th className="py-3 pr-4">Ad balance</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((r) => (
                <tr key={r["Business Name"]}>
                  <td className="py-3 pr-4 font-semibold">{r["Business Name"]}</td>
                  <td className="w-48 py-3 pr-4">
                    <ProgressBar value={Number(String(r["Delivery %"]).replace("%", ""))} />
                    <div className="mt-1 text-xs text-muted-foreground">{r["Delivery %"]}</div>
                  </td>
                  <td className="py-3 pr-4">{r["Posts Done"]}</td>
                  <td className="py-3 pr-4">{r["Reels Done"]}</td>
                  <td className="py-3 pr-4">{r["Group Shares Done"]}</td>
                  <td className="py-3 pr-4">{inr(Number(r["Boost Spend"]))}</td>
                  <td className="py-3 pr-4 font-medium">{inr(Number(r["Ad Balance"]))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}


