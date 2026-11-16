const DEFAULT_SUPABASE_URL = "https://dcnfmxzppqighroqtzgm.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjbmZteHpwcHFpZ2hyb3F0emdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0MjE5OTAsImV4cCI6MjA4Nzk5Nzk5MH0.QmGwOvb7DbvUwgBx-ShBx-31p5qGCdNvB8I3qa0-Kis";

const normalizeEnvValue = (value) => {
  if (!value) return undefined;
  return value.trim().replace(/^['"]|['"]$/g, "");
};

// Shared by the SPA and sitemap build so both query the same public dataset.
export const resolveSupabaseConfig = (env = {}) => {
  const url = normalizeEnvValue(env.VITE_SUPABASE_URL) ?? DEFAULT_SUPABASE_URL;
  const key = normalizeEnvValue(env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_PUBLISHABLE_KEY) ?? DEFAULT_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Missing Supabase env vars: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (or VITE_SUPABASE_PUBLISHABLE_KEY)");
  return { url: url.replace(/\/+$/, ""), key };
};
