import { createClient } from "@supabase/supabase-js";
import { resolveSupabaseConfig } from "./supabaseConfig.mjs";

const { url: SUPABASE_URL, key: SUPABASE_ANON_KEY } = resolveSupabaseConfig(import.meta.env);

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const checkSupabaseConnection = async () => {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/health`, {
      method: "GET",
      signal: controller.signal,
    });
    return response.ok;
  } catch {
    return false;
  } finally {
    window.clearTimeout(timeoutId);
  }
};
