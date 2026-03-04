export interface LeadSheetRow {
  submitted_at?: string;
  source_form?: string;
  name?: string;
  email?: string;
  phone?: string;
  service?: string;
  message?: string;
  source_website?: string;
  source_page?: string;
  [key: string]: string | undefined;
}

const GOOGLE_SHEETS_WEBHOOK_URL =
  (import.meta.env.VITE_GOOGLE_SHEETS_WEBHOOK_URL as string | undefined)?.trim() || "";
const GOOGLE_SHEETS_API_KEY =
  (import.meta.env.VITE_GOOGLE_SHEETS_API_KEY as string | undefined)?.trim() || "";

interface LeadsApiResponse {
  ok?: boolean;
  error?: string;
  data?: LeadSheetRow[];
}

const buildLeadsEndpoint = (limit: number) => {
  if (!GOOGLE_SHEETS_WEBHOOK_URL) return "";

  const endpoint = new URL(GOOGLE_SHEETS_WEBHOOK_URL);
  endpoint.searchParams.set("limit", String(limit));

  if (GOOGLE_SHEETS_API_KEY) {
    endpoint.searchParams.set("api_key", GOOGLE_SHEETS_API_KEY);
  }

  return endpoint.toString();
};

const isBrowserRuntime = () =>
  typeof window !== "undefined" && typeof document !== "undefined";

const fetchLeadRowsByJsonp = (endpoint: string): Promise<LeadsApiResponse> =>
  new Promise((resolve, reject) => {
    const callbackName = `__praaviLeadsCb_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const callbackUrl = new URL(endpoint);
    callbackUrl.searchParams.set("callback", callbackName);

    const script = document.createElement("script");
    const windowRef = window as unknown as Record<string, unknown>;
    let completed = false;

    const cleanup = () => {
      script.remove();
      delete windowRef[callbackName];
    };

    const timeoutId = window.setTimeout(() => {
      if (completed) return;
      completed = true;
      cleanup();
      reject(new Error("Request timeout while loading lead details."));
    }, 15000);

    windowRef[callbackName] = (payload: LeadsApiResponse) => {
      if (completed) return;
      completed = true;
      window.clearTimeout(timeoutId);
      cleanup();
      resolve(payload);
    };

    script.async = true;
    script.src = callbackUrl.toString();
    script.onerror = () => {
      if (completed) return;
      completed = true;
      window.clearTimeout(timeoutId);
      cleanup();
      reject(new Error("Failed to load lead details from Google Sheets."));
    };

    document.body.appendChild(script);
  });

export async function fetchLeadSheetRows(limit = 500): Promise<LeadSheetRow[]> {
  const endpoint = buildLeadsEndpoint(limit);
  if (!endpoint) {
    throw new Error("VITE_GOOGLE_SHEETS_WEBHOOK_URL is not configured.");
  }

  let payload: LeadsApiResponse;
  if (isBrowserRuntime()) {
    payload = await fetchLeadRowsByJsonp(endpoint);
  } else {
    const response = await fetch(endpoint, {
      method: "GET",
      cache: "no-store",
    });
    payload = (await response.json()) as LeadsApiResponse;
    if (!response.ok) {
      throw new Error(payload?.error || `Failed to fetch leads (${response.status})`);
    }
  }

  if (!payload?.ok) {
    throw new Error(payload?.error || "Google Sheets API returned an error.");
  }

  if (!Array.isArray(payload.data)) {
    return [];
  }

  return payload.data;
}
