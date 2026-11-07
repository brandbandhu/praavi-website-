import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { installDiwaliCollector } from "@/diwali-wishes/collector";
import { saveDiwaliGreeting } from "@/lib/diwaliGreetingApi";

vi.mock("@/lib/diwaliGreetingApi", async (original) => ({
  ...await original<typeof import("@/lib/diwaliGreetingApi")>(),
  saveDiwaliGreeting: vi.fn(),
}));

let dispose: () => void;
const save = vi.mocked(saveDiwaliGreeting);
beforeEach(() => {
  vi.spyOn(crypto, "randomUUID").mockReturnValue("11111111-1111-4111-8111-111111111111");
  save.mockReset().mockResolvedValue(undefined);
  document.body.innerHTML = '<form class="name-form"><input id="client-name" name="name" /></form>';
  dispose = installDiwaliCollector();
});
afterEach(() => {
  dispose();
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

function submit(name: string) {
  (document.querySelector("input") as HTMLInputElement).value = name;
  fireEvent.submit(document.querySelector("form")!);
}

describe("Diwali name collection", () => {
  it("explains collection and saves a valid normalized name without preventing greeting creation", async () => {
    expect(screen.getByText(/Your name and submission time/)).toBeInTheDocument();
    const originalHandler = vi.fn();
    document.querySelector("form")!.addEventListener("submit", originalHandler);
    submit("  आरती   पाटील  ");
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Your name has been saved"));
    expect(save).toHaveBeenCalledWith({ id: expect.any(String), name: "आरती पाटील" });
    expect(originalHandler).toHaveBeenCalledOnce();
    expect(originalHandler.mock.calls[0][0].defaultPrevented).toBe(false);
  });

  it("ignores invalid names and unrelated forms", () => {
    submit("   ✨🎉   ");
    const other = document.createElement("form");
    document.body.append(other);
    fireEvent.submit(other);
    expect(save).not.toHaveBeenCalled();
  });

  it("retries a failed save with the same id", async () => {
    save.mockRejectedValueOnce(new Error("offline"));
    submit("Asha");
    const retry = await screen.findByRole("button", { name: "Retry saving" });
    fireEvent.click(retry);
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Your name has been saved"));
    expect(save).toHaveBeenCalledTimes(2);
    expect(save.mock.calls[1][0]).toEqual(save.mock.calls[0][0]);
  });

  it("avoids duplicate saves while the same name is pending", async () => {
    let finish: () => void;
    save.mockImplementation(() => new Promise<void>((resolve) => { finish = resolve; }));
    submit("Asha");
    submit("Asha");
    expect(save).toHaveBeenCalledOnce();
    finish!();
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("saved"));
  });
});
