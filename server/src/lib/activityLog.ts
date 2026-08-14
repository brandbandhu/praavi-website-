import { prisma } from "./db.js";

// Fire-and-forget by design — logging a mistake should never fail the
// underlying action (a payment must still save even if the audit write hiccups).
export async function logActivity(
  userId: string | undefined,
  action: string,
  summary: string,
  entityType?: string,
  entityId?: string
): Promise<void> {
  if (!userId) return;
  try {
    await prisma.activityLog.create({ data: { userId, action, summary, entityType, entityId } });
  } catch (err) {
    console.error("Failed to write activity log:", err);
  }
}
