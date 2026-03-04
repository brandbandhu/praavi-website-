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
  "https://script.google.com/macros/s/AKfycbwc-j-1gEGjGQO_80I_NYxDT2zOBSs34oDiUXsMYls4abSdxtA4OhRa32mcGsj1-nMIcQ/exec";
const DEFAULT_GOOGLE_SHEETS_API_KEY = "optional-shared-secret";
const GOOGLE_SHEETS_WEBHOOK_URL =
  (import.meta.env.VITE_GOOGLE_SHEETS_WEBHOOK_URL as string | undefined)?.trim() ||
  DEFAULT_GOOGLE_SHEETS_WEBHOOK_URL;
const GOOGLE_SHEETS_API_KEY =
  (import.meta.env.VITE_GOOGLE_SHEETS_API_KEY as string | undefined)?.trim() ||
  DEFAULT_GOOGLE_SHEETS_API_KEY;

const clean = (value?: string) => value?.trim() || "";

type LeadRequestBody = {
  name: string;
  email: string;
  phone: string;
  service: string;
  message: string;
  source_form: LeadPayload["sourceForm"];
  source_website: string;
  source_page: string;
  submitted_at: string;
};

const createLeadBody = (payload: LeadPayload): LeadRequestBody => {
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
  return body;
};

async function sendLeadToGoogleSheets(body: LeadRequestBody): Promise<boolean> {
  if (!GOOGLE_SHEETS_WEBHOOK_URL) return false;

  const payload = GOOGLE_SHEETS_API_KEY ? { ...body, api_key: GOOGLE_SHEETS_API_KEY } : body;
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
    if (res.ok) return true;
  } catch {
    // Try additional modes below.
  }

  try {
    const res = await fetch(GOOGLE_SHEETS_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
      body: formEncodedPayload,
      keepalive: true,
    });
    if (res.ok) return true;
  } catch {
    // Try no-cors below.
  }

  try {
    await fetch(GOOGLE_SHEETS_WEBHOOK_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=UTF-8" },
      body: JSON.stringify(payload),
      keepalive: true,
    });
    return true;
  } catch {
    return false;
  }
}

async function sendLeadToPrivyrWebhook(body: LeadRequestBody): Promise<boolean> {
  try {
    const res = await fetch(PRIVYR_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      keepalive: true,
    });

    if (res.ok) return true;
  } catch {
    // Fall through to no-cors fallback.
  }

  try {
    await fetch(PRIVYR_WEBHOOK_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=UTF-8" },
      body: JSON.stringify(body),
      keepalive: true,
    });
    return true;
  } catch {
    return false;
  }
}

export async function sendLeadToPrivyr(payload: LeadPayload): Promise<void> {
  const body = createLeadBody(payload);
  const [googleSheetsResult, privyrResult] = await Promise.allSettled([
    sendLeadToGoogleSheets(body),
    sendLeadToPrivyrWebhook(body),
  ]);

  const googleSheetsSuccess =
    googleSheetsResult.status === "fulfilled" ? googleSheetsResult.value : false;
  const privyrSuccess = privyrResult.status === "fulfilled" ? privyrResult.value : false;

  if (!googleSheetsSuccess && !privyrSuccess) {
    throw new Error("Lead submission failed for both Google Sheets and Privyr.");
  }
}
