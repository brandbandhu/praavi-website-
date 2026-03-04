export interface LeadPayload {
  sourceForm: "contact-form" | "lead-popup";
  name: string;
  email?: string;
  phone?: string;
  service?: string;
  message?: string;
}

const GOOGLE_SHEETS_WEBHOOK_URL =
  (import.meta.env.VITE_GOOGLE_SHEETS_WEBHOOK_URL as string | undefined)?.trim() || "";
const GOOGLE_SHEETS_API_KEY =
  (import.meta.env.VITE_GOOGLE_SHEETS_API_KEY as string | undefined)?.trim() || "";

const clean = (value?: string) => value?.trim() || "";
const redactApiKey = (value: string) => (value ? `${value.slice(0, 4)}***${value.slice(-4)}` : "");
const isCrossOrigin = (url: string) => {
  if (typeof window === "undefined") return false;
  try {
    return new URL(url, window.location.origin).origin !== window.location.origin;
  } catch {
    return false;
  }
};

// async function sendLeadToGoogleSheets(body: Record<string, string>): Promise<void> {
//   if (!GOOGLE_SHEETS_WEBHOOK_URL) return;

//   const payload = {
//     ...body,
//     api_key: GOOGLE_SHEETS_API_KEY,
//   };
//   const formEncodedPayload = new URLSearchParams(
//     Object.entries(payload).map(([key, value]) => [key, value ?? ""]),
//   ).toString();
//   const debugContext = {
//     webhookUrl: GOOGLE_SHEETS_WEBHOOK_URL,
//     payload: { ...body, api_key: redactApiKey(GOOGLE_SHEETS_API_KEY) },
//   };
//   const crossOrigin = isCrossOrigin(GOOGLE_SHEETS_WEBHOOK_URL);

//   if (crossOrigin) {
//     // Apps Script usually does not expose CORS headers, so send as fire-and-forget.
//     try {
//       await fetch(GOOGLE_SHEETS_WEBHOOK_URL, {
//         method: "POST",
//         mode: "no-cors",
//         headers: { "Content-Type": "text/plain;charset=UTF-8" },
//         body: JSON.stringify(payload),
//         keepalive: true,
//       });
//       return;
//     } catch (error) {
//       console.error("Google Sheets webhook no-cors request threw:", error);
//       console.error("Google Sheets webhook no-cors request context:", debugContext);
//       return;
//     }
//   }

//   try {
//     const res = await fetch(GOOGLE_SHEETS_WEBHOOK_URL, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(payload),
//       keepalive: true,
//     });
//     if (res.ok) return;

//     let errorBody = "";
//     try {
//       errorBody = await res.text();
//     } catch {
//       // Ignore response body read failures.
//     }
//     console.error("Google Sheets webhook JSON request failed:", res.status, errorBody);
//     console.error("Google Sheets webhook JSON request context:", debugContext);
//   } catch (error) {
//     console.error("Google Sheets webhook JSON request threw:", error);
//     console.error("Google Sheets webhook JSON request context:", debugContext);
//   }

//   try {
//     const res = await fetch(GOOGLE_SHEETS_WEBHOOK_URL, {
//       method: "POST",
//       headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
//       body: formEncodedPayload,
//       keepalive: true,
//     });
//     if (res.ok) return;

//     let errorBody = "";
//     try {
//       errorBody = await res.text();
//     } catch {
//       // Ignore response body read failures.
//     }
//     console.error("Google Sheets webhook form request failed:", res.status, errorBody);
//     console.error("Google Sheets webhook form request context:", debugContext);
//   } catch (error) {
//     console.error("Google Sheets webhook form request threw:", error);
//     console.error("Google Sheets webhook form request context:", debugContext);
//   }

//   try {
//     await fetch(GOOGLE_SHEETS_WEBHOOK_URL, {
//       method: "POST",
//       mode: "no-cors",
//       headers: { "Content-Type": "text/plain;charset=UTF-8" },
//       body: JSON.stringify(payload),
//       keepalive: true,
//     });
//   } catch (error) {
//     console.error("Google Sheets webhook request failed in all modes:", error);
//     console.error("Google Sheets webhook no-cors request context:", debugContext);
//   }
// }

async function sendLeadToGoogleSheets(body: Record<string, string>): Promise<void> {

  if (!GOOGLE_SHEETS_WEBHOOK_URL) return;

  const payload = {
    ...body,
    api_key: GOOGLE_SHEETS_API_KEY,
    submitted_at: new Date().toISOString()
  };

  try {
    await fetch(GOOGLE_SHEETS_WEBHOOK_URL, {
      method: "POST",
      // headers: {
      //   "Content-Type": "application/json"
      // },
      mode: "no-cors",
      headers: {
        "Content-Type": "text/plain;charset=UTF-8"
      },
      body: JSON.stringify(payload),
      keepalive: true,
      redirect: "follow"
    });

  } catch (err) {
    console.error("Google Sheets webhook error:", err);
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

  // Keep current integration path limited to Apps Script webhook only.
  await sendLeadToGoogleSheets(body);
}
