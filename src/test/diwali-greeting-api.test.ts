import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchDiwaliGreetings, sanitizeDiwaliName, saveDiwaliGreeting } from "@/lib/diwaliGreetingApi";

const mocks = vi.hoisted(() => ({ from: vi.fn(), insert: vi.fn(), abortSignal: vi.fn(), select: vi.fn(), ilike: vi.fn(), order: vi.fn(), range: vi.fn() }));
vi.mock("@/lib/supabase", () => ({ supabase: { from: mocks.from } }));
beforeEach(() => {
  Object.values(mocks).forEach((mock) => mock.mockReset());
  mocks.from.mockReturnValue(mocks);
  mocks.insert.mockReturnValue(mocks);
  mocks.select.mockReturnValue(mocks);
  mocks.ilike.mockReturnValue(mocks);
  mocks.order.mockReturnValue(mocks);
  mocks.abortSignal.mockResolvedValue({ error: null });
  mocks.range.mockResolvedValue({ data: [], count: 0, error: null });
});

describe("Diwali submission storage", () => {
  it("keeps Indian names, removes control characters, and limits names to 36 code points", () => {
    expect(sanitizeDiwaliName("  आरती  पाटील \u0000🎉 ")).toBe("आरती पाटील");
    expect(Array.from(sanitizeDiwaliName("अ".repeat(50)))).toHaveLength(36);
    expect(sanitizeDiwaliName(" ✨ ")).toBe("");
  });
  it("inserts without requesting the private rows and treats a retry collision as success", async () => {
    mocks.abortSignal.mockResolvedValue({ error: { code: "23505" } });
    await expect(saveDiwaliGreeting({ id: "existing-id", name: "Asha" })).resolves.toBeUndefined();
    expect(mocks.from).toHaveBeenCalledWith("diwali_greetings");
    expect(mocks.select).not.toHaveBeenCalled();
  });
  it("propagates storage errors so visitors can retry", async () => {
    mocks.abortSignal.mockResolvedValue({ error: { code: "42501", message: "Permission denied" } });
    await expect(saveDiwaliGreeting({ id: "id", name: "Asha" })).rejects.toMatchObject({ code: "42501" });
  });
  it("paginates all names, counts results, and escapes wildcard searches", async () => {
    await fetchDiwaliGreetings(1, "Asha_%");
    expect(mocks.select).toHaveBeenCalledWith("id, name, created_at", { count: "exact" });
    expect(mocks.range).toHaveBeenCalledWith(50, 99);
    expect(mocks.ilike).toHaveBeenCalledWith("name", "%Asha\\_\\%%");
  });
});
