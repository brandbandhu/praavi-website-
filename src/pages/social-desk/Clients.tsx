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

type BusinessReportRow = {
  "Sr No": number;
  "Business Name": string;
  Category: string;
  Status: string;
  "Assigned To": string;
  "Contact Person": string;
  Mobile: string;
  Email: string;
  "Contract Start": string;
  Instagram: string;
  Facebook: string;
  "Monthly Post Target": number;
  "Monthly Reel Target": number;
  "Monthly Group Share Target": number;
  "Ad Budget INR": number;
  "Report Month": string;
  "Posted Posts": number;
  "Posted Reels": number;
  "Group Shares Done": number;
  "Delivery Percent": string;
  "Funds Added INR": number;
  "Ad Spend INR": number;
  "Ad Balance INR": number;
  Notes: string;
};

function printReportPdf(rows: BusinessReportRow[], month: string) {
  if (!rows.length) return;
  const esc = (value: unknown) =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  const shortLink = (value: string) => {
    if (!value) return "-";
    try {
      const url = new URL(value);
      return `${url.hostname}${url.pathname}`.replace(/\/$/, "");
    } catch {
      return value;
    }
  };
  const metric = (label: string, value: unknown) => `<div class="metric"><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`;
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
    @page { size: A4; margin: 13mm; }
    * { box-sizing: border-box; }
    body { font-family: Arial, sans-serif; color: #111827; margin: 0; background: #f3f4f6; }
    .page { background: #fff; min-height: 100vh; padding: 22px; }
    .topbar { height: 7px; background: linear-gradient(90deg, #f97316, #ec4899); border-radius: 999px; margin-bottom: 18px; }
    .header { display: flex; justify-content: space-between; gap: 24px; align-items: flex-start; margin-bottom: 20px; }
    .brand { font-size: 11px; font-weight: 700; color: #f97316; letter-spacing: 1.6px; text-transform: uppercase; }
    h1 { font-size: 28px; margin: 4px 0 8px; color: #0f172a; }
    .meta { color: #64748b; font-size: 12px; line-height: 1.6; }
    .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 18px; }
    .metric { border: 1px solid #e5e7eb; border-radius: 10px; padding: 10px 12px; background: #fafafa; }
    .metric span { display: block; color: #64748b; font-size: 10px; text-transform: uppercase; letter-spacing: .6px; }
    .metric strong { display: block; margin-top: 4px; font-size: 16px; color: #111827; }
    .business-card { border: 1px solid #e5e7eb; border-radius: 14px; margin: 14px 0; overflow: hidden; page-break-inside: avoid; background: #fff; }
    .card-head { display: flex; justify-content: space-between; gap: 18px; padding: 14px 16px; background: #111827; color: #fff; }
    .card-title { font-size: 18px; font-weight: 700; }
    .tagline { color: #cbd5e1; margin-top: 3px; font-size: 12px; }
    .status { align-self: flex-start; border: 1px solid rgba(255,255,255,.25); border-radius: 999px; padding: 5px 10px; font-size: 11px; font-weight: 700; }
    .card-body { padding: 14px 16px 16px; }
    .section-title { color: #f97316; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .8px; margin-bottom: 8px; }
    .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 9px; margin-bottom: 14px; }
    .grid.three { grid-template-columns: repeat(3, 1fr); }
    .field { border: 1px solid #e5e7eb; border-radius: 9px; padding: 8px 9px; min-height: 48px; overflow-wrap: anywhere; }
    .field span { display: block; color: #64748b; font-size: 9px; text-transform: uppercase; letter-spacing: .5px; margin-bottom: 3px; }
    .field strong { font-size: 12px; color: #111827; }
    .progress { height: 8px; border-radius: 999px; background: #e5e7eb; overflow: hidden; margin-top: 8px; }
    .progress > div { height: 100%; background: linear-gradient(90deg, #f97316, #ec4899); }
    .notes { border-left: 3px solid #f97316; padding: 8px 10px; background: #fff7ed; color: #374151; font-size: 12px; margin-top: 6px; }
    .footer { margin-top: 18px; color: #64748b; font-size: 11px; text-align: right; }
  </style>
</head>
<body>
  <main class="page">
    <div class="topbar"></div>
    <div class="header">
      <div>
        <div class="brand">SocialDesk CRM</div>
        <h1>Business Performance Report</h1>
        <div class="meta">Report Month: ${esc(monthLabel(month))}<br/>Selected Businesses: ${rows.length}</div>
      </div>
      <div class="meta">Generated<br/>${esc(new Date().toLocaleString("en-IN"))}</div>
    </div>
    <div class="summary">
      ${metric("Selected Businesses", rows.length)}
      ${metric("Total Ad Budget", inr(rows.reduce((sum, row) => sum + Number(row["Ad Budget INR"] || 0), 0)))}
      ${metric("Total Ad Balance", inr(rows.reduce((sum, row) => sum + Number(row["Ad Balance INR"] || 0), 0)))}
    </div>
    ${rows
      .map((row) => {
        const pct = Number(String(row["Delivery Percent"]).replace("%", "")) || 0;
        return `<section class="business-card">
          <div class="card-head">
            <div>
              <div class="card-title">${esc(row["Business Name"])}</div>
              <div class="tagline">${esc(row.Category || "Uncategorized")} · Assigned to ${esc(row["Assigned To"] || "-")}</div>
            </div>
            <div class="status">${esc(row.Status)}</div>
          </div>
          <div class="card-body">
            <div class="section-title">Contact & Social</div>
            <div class="grid">
              <div class="field"><span>Contact Person</span><strong>${esc(row["Contact Person"] || "-")}</strong></div>
              <div class="field"><span>Mobile</span><strong>${esc(row.Mobile || "-")}</strong></div>
              <div class="field"><span>Email</span><strong>${esc(row.Email || "-")}</strong></div>
              <div class="field"><span>Contract Start</span><strong>${esc(row["Contract Start"] || "-")}</strong></div>
              <div class="field"><span>Instagram</span><strong>${esc(shortLink(row.Instagram))}</strong></div>
              <div class="field"><span>Facebook</span><strong>${esc(shortLink(row.Facebook))}</strong></div>
              <div class="field"><span>Report Month</span><strong>${esc(monthLabel(month))}</strong></div>
              <div class="field"><span>Status</span><strong>${esc(row.Status)}</strong></div>
            </div>
            <div class="section-title">Delivery</div>
            <div class="grid three">
              <div class="field"><span>Post Target / Done</span><strong>${esc(row["Monthly Post Target"])} / ${esc(row["Posted Posts"])}</strong></div>
              <div class="field"><span>Reel Target / Done</span><strong>${esc(row["Monthly Reel Target"])} / ${esc(row["Posted Reels"])}</strong></div>
              <div class="field"><span>Group Share Target / Done</span><strong>${esc(row["Monthly Group Share Target"])} / ${esc(row["Group Shares Done"])}</strong></div>
            </div>
            <div class="field">
              <span>Overall Delivery</span>
              <strong>${esc(row["Delivery Percent"])}</strong>
              <div class="progress"><div style="width:${Math.max(0, Math.min(100, pct))}%"></div></div>
            </div>
            <div class="section-title" style="margin-top:14px;">Finance</div>
            <div class="grid">
              <div class="field"><span>Ad Budget</span><strong>${esc(inr(row["Ad Budget INR"]))}</strong></div>
              <div class="field"><span>Funds Added</span><strong>${esc(inr(row["Funds Added INR"]))}</strong></div>
              <div class="field"><span>Ad Spend</span><strong>${esc(inr(row["Ad Spend INR"]))}</strong></div>
              <div class="field"><span>Ad Balance</span><strong>${esc(inr(row["Ad Balance INR"]))}</strong></div>
            </div>
            ${row.Notes ? `<div class="notes"><strong>Notes:</strong> ${esc(row.Notes)}</div>` : ""}
          </div>
        </section>`;
      })
      .join("")}
    <div class="footer">Generated from SocialDesk CRM</div>
  </main>
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



