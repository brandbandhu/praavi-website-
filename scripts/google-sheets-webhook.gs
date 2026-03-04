const SHEET_ID = "1_Kk5gldyCswCwout81G9qrBIXU-aXLX22qGQoHyWhMU";
const SHEET_NAME = "Leads";
const API_KEY = "optional-shared-secret";

function doPost(e) {
  try {
    let data = {};

    if (e && e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (jsonErr) {
        data = e.parameter || {};
      }
    } else {
      data = e && e.parameter ? e.parameter : {};
    }

    if (API_KEY && (data.api_key || "") !== API_KEY) {
      return ContentService.createTextOutput(
        JSON.stringify({ ok: false, error: "unauthorized" }),
      ).setMimeType(ContentService.MimeType.JSON);
    }

    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);

    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "submitted_at",
        "source_form",
        "name",
        "email",
        "phone",
        "service",
        "message",
        "source_website",
        "source_page",
      ]);
    }

    sheet.appendRow([
      data.submitted_at || new Date().toISOString(),
      data.source_form || "",
      data.name || "",
      data.email || "",
      data.phone || "",
      data.service || "",
      data.message || "",
      data.source_website || "",
      data.source_page || "",
    ]);

    return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(
      ContentService.MimeType.JSON,
    );
  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({ ok: false, error: String(err) }),
    ).setMimeType(ContentService.MimeType.JSON);
  }
}
