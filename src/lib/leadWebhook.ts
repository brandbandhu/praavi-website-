export interface LeadPayload {
  sourceForm: "contact-form" | "lead-popup";
  name: string;
  email?: string;
  phone?: string;
  service?: string;
  message?: string;
}

const PRIVYR_WEBHOOK_URL =
  (import.meta.env.VITE_PRIVYR_WEBHOOK_URL as string | undefined)?.trim() ||
  "https://www.privyr.com/api/v1/incoming-leads/0vZfjMQw/cgVVSiYW";
const GOOGLE_SHEETS_WEBHOOK_URL =
  (import.meta.env.VITE_GOOGLE_SHEETS_WEBHOOK_URL as string | undefined)?.trim() || "";
const GOOGLE_SHEETS_API_KEY =
  (import.meta.env.VITE_GOOGLE_SHEETS_API_KEY as string | undefined)?.trim() || "";

const clean = (value?: string) => value?.trim() || "";

async function sendLeadToGoogleSheets(body: Record<string, string>): Promise<void> {
  if (!GOOGLE_SHEETS_WEBHOOK_URL) return;

  const payload = {
    ...body,
    api_key: GOOGLE_SHEETS_API_KEY,
  };
  const formEncodedPayload = new URLSearchParams(
    Object.entries(payload).map(([key, value]) => [key, value ?? ""]),
  ).toString();

  try {
    const res = await fetch(GOOGLE_SHEETS_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    });
    if (res.ok) return;

    let errorBody = "";
    try {
      errorBody = await res.text();
    } catch {
      // Ignore response body read failures.
    }
    console.error("Google Sheets webhook JSON request failed:", res.status, errorBody);
  } catch {
    // Fall through to no-cors fallback.
  }

  try {
    const res = await fetch(GOOGLE_SHEETS_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
      body: formEncodedPayload,
      keepalive: true,
    });
    if (res.ok) return;
  } catch {
    // Fall through to no-cors fallback.
  }

  try {
    await fetch(GOOGLE_SHEETS_WEBHOOK_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=UTF-8" },
      body: JSON.stringify(payload),
      keepalive: true,
    });
  } catch {
    console.error("Google Sheets webhook request failed in all modes.");
  }
}

export async function sendLeadToPrivyr(payload: LeadPayload): Promise<void> {
  const body = {
    name: clean(payload.name),
    email: clean(payload.email),
    phone: clean(payload.phone),
    service: clean(payload.service),
    message: clean(payload.message),
    source_form: payload.sourceForm,
    source_website: window.location.origin,
    source_page: window.location.href,
    submitted_at: new Date().toISOString(),
  };

  await sendLeadToGoogleSheets(body);

  try {
    const res = await fetch(PRIVYR_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      keepalive: true,
    });

    if (res.ok) return;
  } catch {
    // Fall through to no-cors fallback.
  }

  await fetch(PRIVYR_WEBHOOK_URL, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "text/plain;charset=UTF-8" },
    body: JSON.stringify(body),
    keepalive: true,
  });
}
