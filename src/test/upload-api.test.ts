import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { uploadAdminImage } from "@/lib/uploadApi";

const mocks = vi.hoisted(() => ({ session: vi.fn(), storage: vi.fn() }));
vi.mock("@/lib/supabase", () => ({ supabase: { auth: { getSession: mocks.session }, storage: { from: mocks.storage } } }));
const fetchMock = vi.fn();
const file = () => new File(["test-image"], "image.png", { type: "image/png" });
beforeEach(() => {
  vi.clearAllMocks(); fetchMock.mockReset(); vi.stubGlobal("fetch", fetchMock);
  vi.stubGlobal("AbortSignal", { timeout: () => new AbortController().signal });
  mocks.session.mockResolvedValue({ data: { session: { access_token: "user-session-token" } }, error: null });
});
afterEach(() => vi.unstubAllGlobals());

describe("authenticated admin uploads", () => {
  it("sends only the user session to the same-origin backend for every upload folder", async () => {
    for (const folder of ["blogs", "works", "clients", "case-studies"] as const) {
      fetchMock.mockResolvedValueOnce(Response.json({ url: `https://media.praaviconsultants.in/uploads/${folder}/image.webp` }));
      expect(await uploadAdminImage(file(), folder)).toBe(`https://media.praaviconsultants.in/uploads/${folder}/image.webp`);
      const [url, options] = fetchMock.mock.calls.at(-1)!;
      expect(url).toBe("/api/uploads/images");
      expect(options.headers).toEqual({ Authorization: "Bearer user-session-token" });
      expect(options.redirect).toBe("error"); expect(options.credentials).toBe("omit");
      expect(options.body.get("folder")).toBe(folder);
    }
    expect(mocks.storage).not.toHaveBeenCalled();
  });
  it("rejects missing sessions and sanitizes provider exceptions", async () => {
    mocks.session.mockResolvedValueOnce({ data: { session: null }, error: null });
    await expect(uploadAdminImage(file(), "blogs")).rejects.toThrow("Please sign in again");
    mocks.session.mockRejectedValueOnce(new Error("private-provider-detail"));
    await expect(uploadAdminImage(file(), "blogs")).rejects.toThrow("Please sign in again");
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("never bypasses backend denial or reflects upstream error bodies", async () => {
    for (const status of [401, 403, 500]) {
      fetchMock.mockResolvedValueOnce(new Response("private-upstream-detail", { status }));
      await expect(uploadAdminImage(file(), "blogs")).rejects.not.toThrow("private-upstream-detail");
    }
    expect(fetchMock).toHaveBeenCalledTimes(3); expect(mocks.storage).not.toHaveBeenCalled();
  });
  it("enforces size/type checks and accepts only safe backend image URLs", async () => {
    await expect(uploadAdminImage(new File(["x"], "x.html", { type: "text/html" }), "blogs")).rejects.toThrow("Use JPG");
    await expect(uploadAdminImage(new File([new Uint8Array(4 * 1024 * 1024 + 1)], "x.png", { type: "image/png" }), "blogs")).rejects.toThrow("4 MB");
    expect(fetchMock).not.toHaveBeenCalled();
    fetchMock.mockResolvedValueOnce(Response.json({ url: "javascript:alert(1)" }));
    await expect(uploadAdminImage(file(), "blogs")).rejects.toThrow("invalid image URL");
    fetchMock.mockResolvedValueOnce(Response.json({ url: "data:image/webp;base64,YWJj" }));
    await expect(uploadAdminImage(file(), "blogs")).resolves.toBe("data:image/webp;base64,YWJj");
  });
});
