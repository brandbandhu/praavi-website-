export const BUCKET_NAMES = [
  "salary_pool",
  "kotak",
  "fuel",
  "axis",
  "marketing",
  "profit",
] as const;
export type BucketName = (typeof BUCKET_NAMES)[number];

export const BUCKET_LABELS: Record<BucketName, string> = {
  salary_pool: "Salary Pool",
  kotak: "Kotak (Rent + Car EMI)",
  fuel: "Fuel",
  axis: "Axis Savings (Subscriptions + Misc)",
  marketing: "Marketing",
  profit: "Profit (Janseva)",
};

export const BUCKET_ROUTES_TO: Record<BucketName, string> = {
  salary_pool: "Internal salary account",
  kotak: "Kotak account",
  fuel: "Separate fuel account",
  axis: "Axis Savings account",
  marketing: "Webakoof Meta Ads Card / Praavi Credit Card",
  profit: "Janseva account",
};

export const DEFAULT_BUCKET_PERCENT_BPS: Record<BucketName, number> = {
  salary_pool: 5600,
  kotak: 1900,
  fuel: 200,
  axis: 800,
  marketing: 700,
  profit: 800,
};

export const DEPARTMENTS = ["Digital Marketing", "Web Dev"] as const;
export type Department = (typeof DEPARTMENTS)[number];

export const FOLLOW_UP_METHODS = ["Call", "Email", "WhatsApp", "In Person", "Other"] as const;
export type FollowUpMethod = (typeof FOLLOW_UP_METHODS)[number];

export const GST_TYPES = ["Inclusive", "Exclusive", "None"] as const;
export type GstType = (typeof GST_TYPES)[number];

export const TRANSFER_STATUSES = ["Pending", "Transferred"] as const;
export type TransferStatus = (typeof TRANSFER_STATUSES)[number];

export const FREQUENCIES = ["Monthly", "Yearly"] as const;
export type Frequency = (typeof FREQUENCIES)[number];

export const ROLES = ["founder", "cofounder", "accountant"] as const;
export type Role = (typeof ROLES)[number];

export const RECEIVABLE_STATUSES = ["Pending", "Collected"] as const;
export type ReceivableStatus = (typeof RECEIVABLE_STATUSES)[number];

export const QUOTATION_STATUSES = ["Draft", "Sent", "Accepted", "Rejected", "Expired"] as const;
export type QuotationStatus = (typeof QUOTATION_STATUSES)[number];
