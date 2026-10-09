import { useMemo, useState } from "react";
import { ClientSelect, PageHeader, Panel, Select, StatusBadge } from "@/components/social-desk/ui";
import { CONTENT_STATUS, businessName, currentMonth, isOverdue, monthLabel, useClients, useContent } from "@/lib/socialDesk";

export default function CalendarPage() {
  const [month, setMonth] = useState(currentMonth());
  const [status, setStatus] = useState("");
  const [client, setClient] = useState("");
  const { data: content = [] } = useContent();
  const { data: clients = [] } = useClients();
  const getBusinessName = (id: string) => businessName(clients.find((c) => c.id === id));
  const selectedBusiness = client ? getBusinessName(client) : "";
  const days = useMemo(() => buildMonth(month), [month]);
  const items = content.filter((c) => (c.scheduled_date ?? c.published_date)?.startsWith(month) && (!status || c.status === status) && (!client || c.client_id === client));

  return (
    <div className="space-y-5">
      <PageHeader title="Calendar" subtitle={`Content schedule for ${selectedBusiness || "all businesses"} - ${monthLabel(month)}`} />
      <Panel>
        <div className="mb-4 grid gap-3 sm:grid-cols-[180px_260px_220px]">
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="flex h-9 rounded-md border border-input bg-card px-3 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          <ClientSelect value={client} onChange={setClient} placeholder="All businesses" />
          <Select value={status} onChange={setStatus} placeholder="All statuses" options={CONTENT_STATUS} />
        </div>
        <div className="grid grid-cols-7 border-l border-t text-xs font-medium text-muted-foreground">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="border-b border-r bg-muted/50 p-2 text-center">{d}</div>
          ))}
          {days.map((day, index) => {
            const date = day ? `${month}-${String(day).padStart(2, "0")}` : "";
            const dateItems = items.filter((c) => (c.scheduled_date ?? c.published_date) === date);
            return (
              <div key={`${date}-${index}`} className="min-h-32 border-b border-r bg-card p-2 align-top">
                {day && <div className="mb-2 font-semibold text-foreground">{day}</div>}
                <div className="space-y-1">
                  {dateItems.slice(0, 4).map((c) => (
                    <div key={c.id} className="rounded-md bg-muted p-2">
                      <div className="truncate font-medium text-foreground">{c.title}</div>
                      <div className="truncate text-muted-foreground">{getBusinessName(c.client_id)}</div>
                      <div className="mt-1"><StatusBadge status={isOverdue(c) ? "Overdue" : c.status} /></div>
                    </div>
                  ))}
                  {dateItems.length > 4 && <div className="text-muted-foreground">+{dateItems.length - 4} more</div>}
                </div>
              </div>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}

function buildMonth(month: string) {
  const first = new Date(`${month}-01T00:00:00`);
  const total = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  const cells: Array<number | null> = Array(first.getDay()).fill(null);
  for (let d = 1; d <= total; d += 1) cells.push(d);
  while (cells.length % 7) cells.push(null);
  return cells;
}


