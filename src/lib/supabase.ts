import { createClient } from "@supabase/supabase-js";

const DEFAULT_SUPABASE_URL = "https://dcnfmxzppqighroqtzgm.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjbmZteHpwcHFpZ2hyb3F0emdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0MjE5OTAsImV4cCI6MjA4Nzk5Nzk5MH0.QmGwOvb7DbvUwgBx-ShBx-31p5qGCdNvB8I3qa0-Kis";

const normalizeEnvValue = (value: string | undefined) => {
  if (!value) return undefined;
  return value.trim().replace(/^['"]|['"]$/g, "");
};

const rawUrl = normalizeEnvValue(import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? DEFAULT_SUPABASE_URL;
const rawAnonKey = normalizeEnvValue(
  (import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY) as
    | string
    | undefined
) ?? DEFAULT_SUPABASE_ANON_KEY;

const SUPABASE_URL = rawUrl?.replace(/\/+$/, "");
const SUPABASE_ANON_KEY = rawAnonKey;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    "Missing Supabase env vars: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (or VITE_SUPABASE_PUBLISHABLE_KEY)"
  );
}

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
