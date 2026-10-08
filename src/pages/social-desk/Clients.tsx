import { useMemo, useState } from "react";
import { Download, Edit2, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDelete, EmptyState, PageHeader, Panel, ProgressBar, RecordDialog, Select, StatusBadge, useEditor, type Field } from "@/components/social-desk/ui";
import { CLIENT_STATUS, businessName, clientBalance, downloadCSV, inr, monthStats, currentMonth, useClients, useContent, useRemove, useSave, useTxns, type Client } from "@/lib/socialDesk";

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

export default function ClientsPage() {
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
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
        <Button variant="outline" onClick={() => downloadCSV(filtered as unknown as Record<string, unknown>[], "social_desk_clients")}>
          <Download /> Export
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



