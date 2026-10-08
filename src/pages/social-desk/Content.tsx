import { useMemo, useState } from "react";
import { Download, Edit2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDelete, EmptyState, PageHeader, Panel, RecordDialog, Select, StatusBadge, useEditor, type Field } from "@/components/social-desk/ui";
import { CONTENT_STATUS, CONTENT_TYPES, PLATFORMS, businessName, currentMonth, downloadCSV, isOverdue, useClients, useContent, useRemove, useSave, type Content } from "@/lib/socialDesk";

const contentFields: Field[] = [
  { name: "client_id", label: "Business name", type: "client", required: true },
  { name: "title", label: "Title", required: true },
  { name: "content_type", label: "Type", type: "select", options: CONTENT_TYPES },
  { name: "platform", label: "Platform", type: "multiselect", options: PLATFORMS },
  { name: "status", label: "Status", type: "select", options: CONTENT_STATUS },
  { name: "scheduled_date", label: "Scheduled date", type: "date" },
  { name: "published_date", label: "Published date", type: "date" },
  { name: "assigned_to", label: "Assigned to" },
  { name: "group_share_count", label: "Group shares", type: "number" },
  { name: "url", label: "Published URL", type: "url" },
  { name: "description", label: "Description", type: "textarea", full: true },
  { name: "remarks", label: "Remarks", type: "textarea", full: true },
];

export default function ContentPage() {
  const [client, setClient] = useState("");
  const [status, setStatus] = useState("");
  const editor = useEditor<Content>();
  const save = useSave("social_desk_content_items");
  const remove = useRemove("social_desk_content_items");
  const { data: content = [] } = useContent();
  const { data: clients = [] } = useClients();
  const getBusinessName = (id: string) => businessName(clients.find((c) => c.id === id));

  const filtered = useMemo(() => {
    return content.filter((c) => (!client || c.client_id === client) && (!status || (status === "Overdue" ? isOverdue(c) : c.status === status)));
  }, [client, content, status]);

  const initial = {
    content_type: "Post",
    platform: "Instagram",
    status: "Planned",
    scheduled_date: new Date().toISOString().slice(0, 10),
    group_share_count: 0,
    ...editor.row,
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Content" subtitle="Plan, approve, publish, and track every deliverable.">
        <Button variant="outline" onClick={() => downloadCSV(filtered as unknown as Record<string, unknown>[], `content-${currentMonth()}`)}>
          <Download /> Export
        </Button>
        <Button onClick={() => editor.edit({ client_id: client || undefined })}>
          <Plus /> Add content
        </Button>
      </PageHeader>

      <Panel>
        <div className="mb-4 grid gap-3 md:grid-cols-2">
          <Select value={client} onChange={setClient} placeholder="All businesses" options={clients.map((c) => ({ value: c.id, label: businessName(c) }))} />
          <Select value={status} onChange={setStatus} placeholder="All statuses" options={["Overdue", ...CONTENT_STATUS]} />
        </div>

        {filtered.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="border-b text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="py-3 pr-4">Content</th>
                  <th className="py-3 pr-4">Business</th>
                  <th className="py-3 pr-4">Date</th>
                  <th className="py-3 pr-4">Platform</th>
                  <th className="py-3 pr-4">Owner</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((c) => (
                  <tr key={c.id}>
                    <td className="py-3 pr-4">
                      <div className="font-semibold">{c.title}</div>
                      <div className="text-xs text-muted-foreground">{c.content_type}</div>
                    </td>
                    <td className="py-3 pr-4">{getBusinessName(c.client_id)}</td>
                    <td className="py-3 pr-4">{c.scheduled_date ?? c.published_date ?? "-"}</td>
                    <td className="py-3 pr-4">{c.platform ?? "-"}</td>
                    <td className="py-3 pr-4">{c.assigned_to ?? "-"}</td>
                    <td className="py-3 pr-4"><StatusBadge status={isOverdue(c) ? "Overdue" : c.status} /></td>
                    <td className="py-3">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" aria-label="Edit" onClick={() => editor.edit(c)}>
                          <Edit2 />
                        </Button>
                        <ConfirmDelete label={c.title} onConfirm={() => remove.mutate(c.id)} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="No content found" text="Add content or adjust your filters." />
        )}
      </Panel>

      <RecordDialog
        open={editor.open}
        onOpenChange={editor.setOpen}
        title={editor.row.id ? "Edit content" : "Add content"}
        fields={contentFields}
        initial={initial}
        saving={save.isPending}
        onSubmit={(row) => save.mutate(row, { onSuccess: () => editor.setOpen(false) })}
      />
    </div>
  );
}



