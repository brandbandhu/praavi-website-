import { beforeEach, expect, it, vi } from "vitest";
const { from } = vi.hoisted(() => ({ from: vi.fn() }));
vi.mock("@/lib/supabase", () => ({ supabase: { from } }));
import { fetchPublicRows } from "@/lib/publicRows";

let pages: any[], builder: any;
beforeEach(() => {
  pages = [];
  builder = { select: vi.fn(), eq: vi.fn(), order: vi.fn(), range: vi.fn(), abortSignal: vi.fn() };
  for (const key of ["select", "eq", "order", "range"]) builder[key].mockReturnValue(builder);
  builder.abortSignal.mockImplementation(async () => pages.shift());
  from.mockReset().mockReturnValue(builder);
});
it("fetches complete public collections across exact-count pages with the existing ordering", async () => {
  pages.push({ data: Array.from({ length: 100 }, (_, id) => ({ id })), count: 101, error: null }, { data: [{ id: 100 }], count: 101, error: null });
  expect(await fetchPublicRows("portfolio_items", [["created_at", { ascending: false }]])).toHaveLength(101);
  expect(builder.eq).toHaveBeenCalledWith("status", "published");
  expect(builder.range.mock.calls).toEqual([[0, 99], [100, 199]]);
  expect(builder.order).toHaveBeenCalledWith("id", { ascending: true });
});
it("accepts genuinely empty public datasets and enforces active status", async () => {
  pages.push({ data: [], count: 0, error: null });
  expect(await fetchPublicRows("jobs", [])).toEqual([]);
  expect(builder.eq).toHaveBeenCalledWith("status", "active");
});
it("rejects private tables before querying", async () => {
  await expect(fetchPublicRows("job_applications", [])).rejects.toThrow("Unsupported public collection");
  expect(from).not.toHaveBeenCalled();
});
it.each([
  [{ data: [], count: 1, error: null }],
  [{ data: [{ id: 1 }, { id: 1 }], count: 2, error: null }],
  [{ data: [{ id: 1 }], count: null, error: null }],
  [{ data: null, count: null, error: { message: "PRIVATE_SENTINEL" } }],
])("fails closed on incomplete, duplicate or failed public data without logging API errors", async (...responses) => {
  pages.push(...responses);
  await expect(fetchPublicRows("clients", [])).rejects.not.toThrow("PRIVATE_SENTINEL");
});
