import { useMemo, useState } from "react";
import { Download, Edit2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDelete, EmptyState, PageHeader, Panel, ProgressBar, RecordDialog, Select, StatusBadge, useEditor, type Field } from "@/components/social-desk/ui";
import { BOOST_STATUS, PLATFORMS, downloadCSV, inr, num, useBoosts, useClients, useRemove, useSave, type Boost } from "@/lib/socialDesk";

const boostFields: Field[] = [
  { name: "client_id", label: "Client", type: "client", required: true },
  { name: "campaign_name", label: "Campaign name", required: true },
  { name: "objective", label: "Objective" },
  { name: "platform", label: "Platform", type: "multiselect", options: PLATFORMS },
  { name: "status", label: "Status", type: "select", options: BOOST_STATUS },
  { name: "start_date", label: "Start date", type: "date" },
  { name: "end_date", label: "End date", type: "date" },
  { name: "budget", label: "Budget", type: "number" },
  { name: "spent", label: "Spent", type: "number" },
  { name: "reach", label: "Reach", type: "number" },
  { name: "impressions", label: "Impressions", type: "number" },
  { name: "engagements", label: "Engagements", type: "number" },
  { name: "link_clicks", label: "Link clicks", type: "number" },
  { name: "profile_visits", label: "Profile visits", type: "number" },
  { name: "followers_before", label: "Followers before", type: "number" },
  { name: "followers_after", label: "Followers after", type: "number" },
  { name: "post_url", label: "Post URL", type: "url", full: true },
  { name: "remarks", label: "Remarks", type: "textarea", full: true },
];

export default function BoostsPage() {
  const [client, setClient] = useState("");
  const [status, setStatus] = useState("");
  const editor = useEditor<Boost>();
  const save = useSave("social_desk_boosts");
  const remove = useRemove("social_desk_boosts");
  const { data: boosts = [] } = useBoosts();
  const { data: clients = [] } = useClients();
  const clientName = (id: string) => clients.find((c) => c.id === id)?.name ?? "Unknown client";

  const filtered = useMemo(() => boosts.filter((b) => (!client || b.client_id === client) && (!status || b.status === status)), [boosts, client, status]);
  const initial = { status: "Draft", platform: "Instagram", budget: 0, spent: 0, reach: 0, impressions: 0, engagements: 0, link_clicks: 0, profile_visits: 0, ...editor.row };

  return (
    <div className="space-y-5">
      <PageHeader title="Boosts & Ads" subtitle="Track campaign budgets, spend, and performance.">
        <Button variant="outline" onClick={() => downloadCSV(filtered as unknown as Record<string, unknown>[], "social_desk_boosts")}>
          <Download /> Export
        </Button>
        <Button onClick={() => editor.edit({ client_id: client || undefined })}>
          <Plus /> Add boost
        </Button>
      </PageHeader>

      <Panel>
        <div className="mb-4 grid gap-3 md:grid-cols-2">
          <Select value={client} onChange={setClient} placeholder="All clients" options={clients.map((c) => ({ value: c.id, label: c.name }))} />
          <Select value={status} onChange={setStatus} placeholder="All statuses" options={BOOST_STATUS} />
        </div>

        {filtered.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-sm">
              <thead className="border-b text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="py-3 pr-4">Campaign</th>
                  <th className="py-3 pr-4">Client</th>
                  <th className="py-3 pr-4">Spend</th>
                  <th className="py-3 pr-4">Performance</th>
                  <th className="py-3 pr-4">Dates</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((b) => {
                  const pct = b.budget ? Math.round((b.spent / b.budget) * 100) : 0;
                  return (
                    <tr key={b.id}>
                      <td className="py-3 pr-4">
                        <div className="font-semibold">{b.campaign_name}</div>
                        <div className="text-xs text-muted-foreground">{b.platform ?? b.objective ?? "Boost"}</div>
                      </td>
                      <td className="py-3 pr-4">{clientName(b.client_id)}</td>
                      <td className="w-48 py-3 pr-4">
                        <ProgressBar value={pct} />
                        <div className="mt-1 text-xs text-muted-foreground">{inr(b.spent)} / {inr(b.budget)}</div>
                      </td>
                      <td className="py-3 pr-4 text-xs text-muted-foreground">
                        {num(b.reach)} reach, {num(b.engagements)} engagements
                      </td>
                      <td className="py-3 pr-4">{b.start_date ?? "-"} to {b.end_date ?? "-"}</td>
                      <td className="py-3 pr-4"><StatusBadge status={b.status} /></td>
                      <td className="py-3">
                        <div className="flex justify-end gap-1">
                          <Button size="icon" variant="ghost" aria-label="Edit" onClick={() => editor.edit(b)}>
                            <Edit2 />
                          </Button>
                          <ConfirmDelete label={b.campaign_name} onConfirm={() => remove.mutate(b.id)} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="No boosts found" text="Add a campaign or adjust your filters." />
        )}
      </Panel>

      <RecordDialog
        open={editor.open}
        onOpenChange={editor.setOpen}
        title={editor.row.id ? "Edit boost" : "Add boost"}
        fields={boostFields}
        initial={initial}
        saving={save.isPending}
        onSubmit={(row) => save.mutate(row, { onSuccess: () => editor.setOpen(false) })}
      />
    </div>
  );
}



