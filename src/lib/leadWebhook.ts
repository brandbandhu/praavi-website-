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
const DEFAULT_GOOGLE_SHEETS_WEBHOOK_URL =
  "https://script.google.com/macros/s/AKfycbxBrissgDFZIN89qBgjYJhEzuyMYE83CfFqKiDmKD4WA4wJTh6PcoCV3wnv5uFBzMNS/exec";
const DEFAULT_GOOGLE_SHEETS_API_KEY = "praavi_sheets_key_2026_ak47_secure";
const GOOGLE_SHEETS_WEBHOOK_URL =
  (import.meta.env.VITE_GOOGLE_SHEETS_WEBHOOK_URL as string | undefined)?.trim() ||
  DEFAULT_GOOGLE_SHEETS_WEBHOOK_URL;
const GOOGLE_SHEETS_API_KEY =
  (import.meta.env.VITE_GOOGLE_SHEETS_API_KEY as string | undefined)?.trim() ||
  DEFAULT_GOOGLE_SHEETS_API_KEY;

const clean = (value?: string) => value?.trim() || "";

async function sendLeadToGoogleSheets(body: Record<string, string>): Promise<void> {
  if (!GOOGLE_SHEETS_WEBHOOK_URL) return;

  const sheetPayload = {
    ...body,
    api_key: GOOGLE_SHEETS_API_KEY,
  };

  try {
    await fetch(GOOGLE_SHEETS_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sheetPayload),
      keepalive: true,
    });
  } catch {
    // Fall through to no-cors fallback.
  }

  try {
    await fetch(GOOGLE_SHEETS_WEBHOOK_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=UTF-8" },
      body: JSON.stringify(sheetPayload),
      keepalive: true,
    });
  } catch {
    // Ignore sheet errors so main lead flow is not blocked.
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
