import { supabase } from "./supabase";

export interface DiwaliGreeting {
  id: string;
  name: string;
  created_at: string;
}

export const DIWALI_PAGE_SIZE = 50;

export function sanitizeDiwaliName(value: string): string {
  return Array.from(value.normalize("NFC")
    .replace(/[\p{Cc}\p{Cf}]/gu, "")
    .replace(/[^\p{L}\p{M}\p{N} .’'\-]/gu, " ")
    .replace(/\s+/gu, " ").trim())
    .slice(0, 36).join("").normalize("NFC");
}

export async function saveDiwaliGreeting(payload: { id: string; name: string }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const { error } = await supabase.from("diwali_greetings")
      .insert(payload).abortSignal(controller.signal);
    // A retry after an interrupted response keeps the same id.
    if (error && error.code !== "23505") throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchDiwaliGreetings(page = 0, search = "") {
  let query = supabase.from("diwali_greetings")
    .select("id, name, created_at", { count: "exact" });
  const term = search.trim().replace(/[\\%_]/g, "\\$&");
  if (term) query = query.ilike("name", `%${term}%`);
  const { data, count, error } = await query
    .order("created_at", { ascending: false }).order("id", { ascending: false })
    .range(page * DIWALI_PAGE_SIZE, (page + 1) * DIWALI_PAGE_SIZE - 1);
  if (error) throw error;
  return { rows: (data ?? []) as DiwaliGreeting[], count: count ?? 0 };
}
