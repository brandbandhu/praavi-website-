import { BUCKET_NAMES } from "./types.js";

// Keep the existing Express JSON parser's 100 KiB decoded-body ceiling explicit.
export const FINANCE_JSON_BODY_LIMIT_BYTES = 100 * 1024;

// An upper bound on how many valid records can fit in the existing JSON budget.
// Each record also needs a comma (apart from the last); the surrounding JSON
// costs more than that last comma. Ignoring envelope bytes makes the cap generous,
// so valid requests accepted by the existing byte limit remain accepted.
const maxRecordsInJsonBody = (smallestValidRecord: object): number =>
  Math.floor(FINANCE_JSON_BODY_LIMIT_BYTES / (Buffer.byteLength(JSON.stringify(smallestValidRecord), "utf8") + 1));

export const FINANCE_COLLECTION_LIMITS = {
  items: maxRecordsInJsonBody({ deliverableTypeId: "", included: true, quantity: 0 }),
  lineItems: maxRecordsInJsonBody({ description: "a", amountPaise: 1 }),
  deliverables: maxRecordsInJsonBody({ deliverableTypeId: "", included: true, quantity: 0 }),
  entries: BUCKET_NAMES.length,
} as const;

type CollectionField = keyof typeof FINANCE_COLLECTION_LIMITS;

// Inspect only array metadata, never elements. Zod 3's .max()/.length() still
// validate every element after a length error (GHSA-mrhx-c7xc-m3w5).
// Let existing schemas handle missing fields and non-array values unchanged.
export function financeCollectionLimitError(body: unknown, fields: readonly CollectionField[]): string | undefined {
  if (!body || typeof body !== "object" || Array.isArray(body)) return;
  const values = body as Record<string, unknown>;
  for (const field of fields) {
    const value = values[field];
    if (Array.isArray(value) && value.length > FINANCE_COLLECTION_LIMITS[field]) {
      return field === "entries"
        ? `Array must contain exactly ${FINANCE_COLLECTION_LIMITS.entries} element(s)`
        : `Array must contain at most ${FINANCE_COLLECTION_LIMITS[field]} element(s)`;
    }
  }
}
