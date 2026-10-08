import { useMemo, useState } from "react";
import { Edit2, FileSpreadsheet, FileText, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDelete, EmptyState, PageHeader, Panel, ProgressBar, RecordDialog, Select, StatusBadge, useEditor, type Field } from "@/components/social-desk/ui";
import { CLIENT_STATUS, businessName, clientBalance, downloadExcel, inr, monthStats, currentMonth, monthLabel, useClients, useContent, useRemove, useSave, useTxns, type Client } from "@/lib/socialDesk";

const clientFields: Field[] = [
  { name: "business_name", label: "Business name", required: true },
  { name: "category", label: "Category" },
  { name: "status", label: "Status", type: "select", options: CLIENT_STATUS },
  { name: "contact_person", label: "Contact person" },
  { name: "mobile", label: "Mobile", type: "tel" },
  { name: "email", label: "Email", type: "email" },
  { name: "assigned_to", label: "Assigned to" },
  { name: "post_target", label: "Monthly posts", type: "number" },
  { name: "reel_target", label: "Monthly reels", type: "number" },
  { name: "group_target", label: "Group shares", type: "number" },
  { name: "ad_budget", label: "Ad budget", type: "number" },
  { name: "contract_start", label: "Contract start", type: "date" },
  { name: "instagram", label: "Instagram", type: "url" },
  { name: "facebook", label: "Facebook", type: "url" },
  { name: "notes", label: "Notes", type: "textarea", full: true },
];

function printReportPdf(rows: Record<string, unknown>[], month: string) {
  if (!rows.length) return;
  const esc = (value: unknown) =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  const keys = Object.keys(rows[0]!);
  const popup = window.open("", "_blank", "width=1200,height=800");
  if (!popup) {
    window.alert("Please allow popups to export the PDF report.");
    return;
  }

  popup.document.write(`<!doctype html>
<html>
<head>
  <title>Business Report - ${esc(month)}</title>
  <style>
    @page { size: A4 landscape; margin: 12mm; }
    * { box-sizing: border-box; }
    body { font-family: Arial, sans-serif; color: #111827; margin: 0; }
    .header { display: flex; justify-content: space-between; gap: 24px; align-items: flex-start; border-bottom: 2px solid #f97316; padding-bottom: 12px; margin-bottom: 16px; }
    h1 { font-size: 22px; margin: 0 0 6px; }
    .meta { color: #6b7280; font-size: 12px; line-height: 1.5; }
    table { width: 100%; border-collapse: collapse; font-size: 9px; }
    th { background: #111827; color: #ffffff; padding: 7px 6px; text-align: left; white-space: nowrap; }
    td { border: 1px solid #e5e7eb; padding: 6px; vertical-align: top; }
    tr:nth-child(even) td { background: #f9fafb; }
    .footer { margin-top: 14px; color: #6b7280; font-size: 11px; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>SocialDesk Business Report</h1>
      <div class="meta">Report Month: ${esc(monthLabel(month))}<br/>Selected Businesses: ${rows.length}</div>
    </div>
    <div class="meta">Generated: ${esc(new Date().toLocaleString("en-IN"))}</div>
  </div>
  <table>
    <thead><tr>${keys.map((key) => `<th>${esc(key)}</th>`).join("")}</tr></thead>
    <tbody>${rows
      .map((row) => `<tr>${keys.map((key) => `<td>${esc(row[key])}</td>`).join("")}</tr>`)
      .join("")}</tbody>
  </table>
  <div class="footer">Generated from SocialDesk CRM</div>
  <script>window.onload = () => { window.print(); };</script>
</body>
</html>`);
  popup.document.close();
}

export default function ClientsPage() {
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const editor = useEditor<Client>();
  const save = useSave("social_desk_clients");
  const remove = useRemove("social_desk_clients");
  const { data: clients = [] } = useClients();
  const { data: content = [] } = useContent();
  const { data: txns = [] } = useTxns();
  const month = currentMonth();

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return clients.filter((c) => {
      const text = [c.name, c.business_name, c.category, c.contact_person, c.mobile, c.email].join(" ").toLowerCase();
      return (!status || c.status === status) && (!needle || text.includes(needle));
    });
  }, [clients, q, status]);

  const selectedRows = filtered.filter((client) => selectedIds.includes(client.id));
  const allFilteredSelected = filtered.length > 0 && filtered.every((client) => selectedIds.includes(client.id));
  const toggleSelected = (id: string) => {
    setSelectedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  };
  const toggleAllFiltered = () => {
    setSelectedIds((current) => {
      const filteredIds = filtered.map((client) => client.id);
      if (allFilteredSelected) return current.filter((id) => !filteredIds.includes(id));
      return Array.from(new Set([...current, ...filteredIds]));
    });
  };
  const reportRows = selectedRows.map((client, index) => {
    const stats = monthStats(client, content, month);
    const balance = clientBalance(txns, client.id);
    return {
      "Sr No": index + 1,
      "Business Name": businessName(client),
      Category: client.category || "",
      Status: client.status,
      "Assigned To": client.assigned_to || "",
      "Contact Person": client.contact_person || "",
      Mobile: client.mobile || "",
      Email: client.email || "",
      "Contract Start": client.contract_start || "",
      Instagram: client.instagram || "",
      Facebook: client.facebook || "",
      "Monthly Post Target": client.post_target,
      "Monthly Reel Target": client.reel_target,
      "Monthly Group Share Target": client.group_target,
      "Ad Budget INR": Number(client.ad_budget || 0),
      "Report Month": month,
      "Posted Posts": stats.posts,
      "Posted Reels": stats.reels,
      "Group Shares Done": stats.groups,
      "Delivery Percent": `${stats.pct}%`,
      "Funds Added INR": balance.added,
      "Ad Spend INR": balance.spent,
      "Ad Balance INR": balance.balance,
      Notes: client.notes || "",
    };
  });

  const initial = {
    status: "Active",
    post_target: 12,
    reel_target: 4,
    group_target: 0,
    ad_budget: 0,
    ...editor.row,
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Businesses" subtitle="Keep business details, monthly targets, and ad balances in one place.">
        <Button
          variant="outline"
          disabled={!reportRows.length}
          onClick={() => printReportPdf(reportRows, month)}
        >
          <FileText /> PDF{reportRows.length ? ` (${reportRows.length})` : ""}
        </Button>
        <Button
          variant="outline"
          disabled={!reportRows.length}
          onClick={() => downloadExcel({ Businesses: reportRows }, `business-report-${month}`)}
        >
          <FileSpreadsheet /> Excel{reportRows.length ? ` (${reportRows.length})` : ""}
        </Button>
        <Button onClick={() => editor.edit({})}>
          <Plus /> Add business
        </Button>
      </PageHeader>

      <Panel>
        <div className="mb-4 grid gap-3 md:grid-cols-[1fr_180px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search business, category, contact..." className="pl-9" />
          </div>
          <Select value={status} onChange={setStatus} placeholder="All statuses" options={CLIENT_STATUS} />
        </div>

        {filtered.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="border-b text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="w-10 py-3 pr-4">
                    <input
                      type="checkbox"
                      checked={allFilteredSelected}
                      onChange={toggleAllFiltered}
                      aria-label="Select all businesses"
                      className="size-4 rounded border-input accent-primary"
                    />
                  </th>
                  <th className="py-3 pr-4">Business</th>
                  <th className="py-3 pr-4">Owner</th>
                  <th className="py-3 pr-4">Targets</th>
                  <th className="py-3 pr-4">Month</th>
                  <th className="py-3 pr-4">Ad balance</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((c) => {
                  const stats = monthStats(c, content, month);
                  const balance = clientBalance(txns, c.id);
                  return (
                    <tr key={c.id}>
                      <td className="py-3 pr-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(c.id)}
                          onChange={() => toggleSelected(c.id)}
                          aria-label={`Select ${businessName(c)}`}
                          className="size-4 rounded border-input accent-primary"
                        />
                      </td>
                      <td className="py-3 pr-4">
                        <div className="font-semibold">{businessName(c)}</div>
                        <div className="text-xs text-muted-foreground">{c.category || "No category"}</div>
                      </td>
                      <td className="py-3 pr-4">{c.assigned_to || c.contact_person || "-"}</td>
                      <td className="py-3 pr-4 text-xs text-muted-foreground">
                        {c.post_target} posts, {c.reel_target} reels, {c.group_target} shares
                      </td>
                      <td className="w-48 py-3 pr-4">
                        <ProgressBar value={stats.pct} />
                        <div className="mt-1 text-xs text-muted-foreground">{stats.pct}% delivered</div>
                      </td>
                      <td className="py-3 pr-4 font-medium">{inr(balance.balance)}</td>
                      <td className="py-3 pr-4"><StatusBadge status={c.status} /></td>
                      <td className="py-3">
                        <div className="flex justify-end gap-1">
                          <Button size="icon" variant="ghost" aria-label="Edit" onClick={() => editor.edit(c)}>
                            <Edit2 />
                          </Button>
                          <ConfirmDelete label={businessName(c)} onConfirm={() => remove.mutate(c.id)} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="No businesses found" text="Add your first business or clear the filters." />
        )}
      </Panel>

      <RecordDialog
        open={editor.open}
        onOpenChange={editor.setOpen}
        title={editor.row.id ? "Edit business" : "Add business"}
        fields={clientFields}
        initial={initial}
        saving={save.isPending}
        onSubmit={(row) =>
          save.mutate(
            {
              ...row,
              name: row.name || row.business_name,
            },
            { onSuccess: () => editor.setOpen(false) },
          )
        }
      />
    </div>
  );
}



