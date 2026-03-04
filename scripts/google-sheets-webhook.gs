const SHEET_ID = "1_Kk5gldyCswCwout81G9qrBIXU-aXLX22qGQoHyWhMU";
const SHEET_NAME = "Leads"; // change if your tab name is different
const API_KEY = "optional-shared-secret";
const DEFAULT_LIMIT = 200;
const MAX_LIMIT = 2000;

const LEAD_HEADERS = [
  "submitted_at",
  "source_form",
  "name",
  "email",
  "phone",
  "service",
  "message",
  "source_website",
  "source_page",
];

function doGet(e) {
  const params = (e && e.parameter) || {};
  const callback = sanitizeCallback_(params.callback || "");

  try {
    if (!isAuthorized_(params.api_key || "")) {
      return toOutput_({ ok: false, error: "unauthorized" }, callback);
    }

    const limit = normalizeLimit_(params.limit);
    const sheet = getLeadsSheet_();
    ensureHeaderRow_(sheet);

    const values = sheet.getDataRange().getValues();
    if (values.length <= 1) {
      return toOutput_({ ok: true, data: [], count: 0 }, callback);
    }

    const headers = values[0].map((header, index) =>
      String(header || LEAD_HEADERS[index] || `column_${index + 1}`)
    );

    const rows = values
      .slice(1)
      .filter((row) => row.some((cell) => String(cell).trim() !== ""));

    const data = rows
      .slice(-limit)
      .reverse()
      .map((row) => rowToObject_(headers, row));

    return toOutput_({ ok: true, data, count: data.length }, callback);
  } catch (err) {
    return toOutput_({ ok: false, error: String(err) }, callback);
  }
}

function doPost(e) {
  try {
    const data = parseRequestBody_(e);
    const requestApiKey = data.api_key || ((e && e.parameter && e.parameter.api_key) || "");
    if (!isAuthorized_(requestApiKey)) {
      return toJsonOutput_({ ok: false, error: "unauthorized" });
    }

    const sheet = getLeadsSheet_();
    ensureHeaderRow_(sheet);
    sheet.appendRow(buildLeadRow_(data));

    return toJsonOutput_({ ok: true });
  } catch (err) {
    return toJsonOutput_({ ok: false, error: String(err) });
  }
}

function normalizeLimit_(rawLimit) {
  const parsed = Number(rawLimit);
  if (!parsed || parsed <= 0) return DEFAULT_LIMIT;
  return Math.min(MAX_LIMIT, Math.floor(parsed));
}

function parseRequestBody_(e) {
  if (e && e.postData && e.postData.contents) {
    try {
      return JSON.parse(e.postData.contents);
    } catch (jsonErr) {
      return e.parameter || {};
    }
  }
  return (e && e.parameter) || {};
}

function getLeadsSheet_() {
  const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
  return spreadsheet.getSheetByName(SHEET_NAME) || spreadsheet.insertSheet(SHEET_NAME);
}

function ensureHeaderRow_(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(LEAD_HEADERS);
    return;
  }

  const headerRange = sheet.getRange(1, 1, 1, LEAD_HEADERS.length);
  const currentHeaders = headerRange.getValues()[0].map((value) => String(value || ""));
  if (currentHeaders.every((value) => value === "")) {
    headerRange.setValues([LEAD_HEADERS]);
  }
}

function buildLeadRow_(data) {
  return [
    data.submitted_at || new Date().toISOString(),
    data.source_form || "",
    data.name || "",
    data.email || "",
    data.phone || "",
    data
