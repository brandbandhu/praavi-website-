import { useMemo, useState } from "react";
import { Download, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, Panel, ProgressBar, Select } from "@/components/social-desk/ui";
import { businessName, clientBalance, currentMonth, downloadCSV, downloadExcel, inr, monthLabel, monthStats, useBoosts, useClients, useContent, useTxns } from "@/lib/socialDesk";

export default function ReportsPage() {
  const [month, setMonth] = useState(currentMonth());
  const [client, setClient] = useState("");
  const { data: clients = [] } = useClients();
  const { data: content = [] } = useContent();
  const { data: boosts = [] } = useBoosts();
  const { data: txns = [] } = useTxns();

  const rows = useMemo(() => {
    return clients
      .filter((c) => !client || c.id === client)
      .map((c) => {
        const stats = monthStats(c, content, month);
        const funds = clientBalance(txns, c.id);
        const clientBoosts = boosts.filter((b) => b.client_id === c.id && (b.start_date?.startsWith(month) || b.end_date?.startsWith(month)));
        return {
          Business: businessName(c),
          Status: c.status,
          Posts: stats.posts,
          Reels: stats.reels,
          "Group Shares": stats.groups,
          Progress: `${stats.pct}%`,
          "Boost Spend": clientBoosts.reduce((sum, b) => sum + b.spent, 0),
          "Ad Balance": funds.balance,
        };
      });
  }, [boosts, client, clients, content, month, txns]);

  return (
    <div className="space-y-5">
      <PageHeader title="Reports" subtitle={`Monthly delivery and fund summary for ${monthLabel(month)}`}>
        <Button variant="outline" onClick={() => downloadCSV(rows, `report-${month}`)}>
          <Download /> CSV
        </Button>
        <Button onClick={() => downloadExcel({ Summary: rows }, `socialdesk-report-${month}`)}>
          <FileSpreadsheet /> Excel
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
                <tr key={r.Business}>
                  <td className="py-3 pr-4 font-semibold">{r.Business}</td>
                  <td className="w-48 py-3 pr-4">
                    <ProgressBar value={Number(String(r.Progress).replace("%", ""))} />
                    <div className="mt-1 text-xs text-muted-foreground">{r.Progress}</div>
                  </td>
                  <td className="py-3 pr-4">{r.Posts}</td>
                  <td className="py-3 pr-4">{r.Reels}</td>
                  <td className="py-3 pr-4">{r["Group Shares"]}</td>
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


