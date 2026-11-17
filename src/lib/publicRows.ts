import { supabase } from "./supabase";

// Public content only. Exact counts and stable ordering prevent truncated builds.
const statuses: Record<string, string> = { blog_posts: "published", portfolio_items: "published", clients: "active", case_studies: "published", jobs: "active" };
export const fetchPublicRows = async (table: string, orders: Array<[string, Record<string, boolean>]>): Promise<any[]> => {
  if (!Object.prototype.hasOwnProperty.call(statuses, table)) throw new Error("Unsupported public collection");
  const rows: any[] = [];
  const ids = new Set();
  let total: number | undefined;
  do {
    let query = supabase.from(table).select("*", { count: "exact" }).eq("status", statuses[table]);
    for (const [column, options] of orders) query = query.order(column, options);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    let result;
    try { result = await query.order("id", { ascending: true }).range(rows.length, rows.length + 99).abortSignal(controller.signal); }
    finally { clearTimeout(timeout); }
    const { data, error, count } = result;
    if (error) throw new Error(`Unable to load public ${table}`);
    if (!Number.isInteger(count) || count! < 0 || !Array.isArray(data) || (total !== undefined && total !== count) || data.length !== Math.min(100, count! - rows.length)) throw new Error(`Incomplete public ${table}`);
    total = count!;
    for (const row of data) {
      if (row.id == null || ids.has(row.id)) throw new Error(`Duplicate public ${table} record`);
      ids.add(row.id); rows.push(row);
    }
  } while (rows.length < total!);
  return rows;
};
