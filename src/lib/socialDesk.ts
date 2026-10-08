import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/socialDeskTypes";

type Tables = Database["public"]["Tables"];
export type TableName =
  | "social_desk_clients"
  | "social_desk_content_items"
  | "social_desk_boosts"
  | "social_desk_transactions";
export type Client = Tables["clients"]["Row"];
export type Content = Tables["content_items"]["Row"];
export type Boost = Tables["boosts"]["Row"];
export type Txn = Tables["transactions"]["Row"];
export type Settings = Tables["settings"]["Row"];

const orderBy: Record<TableName, string> = {
  social_desk_clients: "name",
  social_desk_content_items: "scheduled_date",
  social_desk_boosts: "start_date",
  social_desk_transactions: "txn_date",
};

export function useRows<T>(table: TableName) {
  return useQuery({
    queryKey: [table],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(table)
        .select("*")
        .order(orderBy[table], { ascending: table === "social_desk_clients", nullsFirst: false });
      if (error) throw error;
      return data as unknown as T[];
    },
  });
}

export const useClients = () => useRows<Client>("social_desk_clients");
export const useContent = () => useRows<Content>("social_desk_content_items");
export const useBoosts = () => useRows<Boost>("social_desk_boosts");
export const useTxns = () => useRows<Txn>("social_desk_transactions");

export function useSettings() {
  return useQuery({
    queryKey: ["social_desk_settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("social_desk_settings").select("*").eq("id", 1).single();
      if (error) throw error;
      return data;
    },
  });
}

export function useSave(table: TableName | "social_desk_settings") {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (row: Record<string, unknown>) => {
      const { id, ...rest } = row;
      const q = id
        ? supabase.from(table).update(rest as never).eq("id", id as never)
        : supabase.from(table).insert(rest as never);
      const { error } = await q;
      if (error) throw error;
    },
    onSuccess: (_d, row) => {
      qc.invalidateQueries();
      toast.success(row?.["id"] ? "Saved changes" : "Added successfully");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useRemove(table: TableName) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries();
      toast.success("Deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

/* ---------- helpers ---------- */
export const inr = (n: number | null | undefined) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(
    Number(n ?? 0),
  );
export const num = (n: number | null | undefined) => new Intl.NumberFormat("en-IN").format(Number(n ?? 0));

export const currentMonth = () => new Date().toISOString().slice(0, 7); // YYYY-MM
export const inMonth = (date: string | null | undefined, month: string) => !!date && date.startsWith(month);
export const today = () => new Date().toISOString().slice(0, 10);
export const monthLabel = (m: string) =>
  new Date(m + "-01T00:00:00").toLocaleDateString("en-IN", { month: "long", year: "numeric" });

export const CONTENT_TYPES = ["Post", "Reel", "Carousel", "Story", "Other"];
export const PLATFORMS = ["Instagram", "Facebook", "LinkedIn", "YouTube", "X", "Other"];
export const CONTENT_STATUS = [
  "Planned",
  "In Progress",
  "Pending Approval",
  "Approved",
  "Scheduled",
  "Posted",
  "Cancelled",
];
export const BOOST_STATUS = ["Draft", "Scheduled", "Active", "Paused", "Completed", "Cancelled"];
export const TXN_TYPES = ["Fund Added", "Ad Spend", "Refund", "Adjustment"];
export const CLIENT_STATUS = ["Active", "Paused", "Archived"];

export const isOverdue = (c: Content) =>
  !!c.scheduled_date && c.scheduled_date < today() && !["Posted", "Cancelled"].includes(c.status);

export function clientBalance(txns: Txn[], clientId?: string) {
  let added = 0,
    spent = 0;
  for (const t of txns) {
    if (clientId && t.client_id !== clientId) continue;
    const a = Number(t.amount);
    if (t.txn_type === "Fund Added") added += a;
    else if (t.txn_type === "Ad Spend") spent += a;
    else if (t.txn_type === "Refund") added -= a;
    else added += a;
  }
  return { added, spent, balance: added - spent };
}

export function monthStats(client: Client, content: Content[], month: string) {
  const items = content.filter((c) => c.client_id === client.id && inMonth(c.scheduled_date ?? c.published_date, month));
  const posted = items.filter((c) => c.status === "Posted");
  const posts = posted.filter((c) => c.content_type !== "Reel").length;
  const reels = posted.filter((c) => c.content_type === "Reel").length;
  const groups = items.reduce((s, c) => s + (c.group_share_count ?? 0), 0);
  const target = client.post_target + client.reel_target + client.group_target;
  const done = Math.min(posts, client.post_target) + Math.min(reels, client.reel_target) + Math.min(groups, client.group_target);
  return { items, posts, reels, groups, pct: target ? Math.round((done / target) * 100) : 0 };
}

/* ---------- exports ---------- */
export function downloadCSV(rows: Record<string, unknown>[], name: string) {
  if (!rows.length) {
    toast.info("Nothing to export");
    return;
  }
  const keys = Object.keys(rows[0]!);
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = [keys.join(","), ...rows.map((r) => keys.map((k) => esc(r[k])).join(","))].join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  a.download = `${name}.csv`;
  a.click();
}

export async function downloadExcel(sheets: Record<string, Record<string, unknown>[]>, name: string) {
  const esc = (value: unknown) =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  const html = Object.entries(sheets)
    .map(([sheetName, rows]) => {
      const safeRows = rows.length ? rows : [{ Note: "No data" }];
      const keys = Object.keys(safeRows[0]!);
      return `<h2>${esc(sheetName)}</h2><table><thead><tr>${keys
        .map((key) => `<th>${esc(key)}</th>`)
        .join("")}</tr></thead><tbody>${safeRows
        .map((row) => `<tr>${keys.map((key) => `<td>${esc(row[key])}</td>`).join("")}</tr>`)
        .join("")}</tbody></table>`;
    })
    .join("");
  const blob = new Blob([`<html><body>${html}</body></html>`], {
    type: "application/vnd.ms-excel;charset=utf-8",
  });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${name}.xls`;
  a.click();
  URL.revokeObjectURL(a.href);
}
