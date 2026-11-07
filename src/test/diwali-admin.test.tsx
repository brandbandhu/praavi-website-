import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import DiwaliGreetingsPanel from "@/components/admin/DiwaliGreetingsPanel";
import { fetchDiwaliGreetings } from "@/lib/diwaliGreetingApi";

vi.mock("@/lib/diwaliGreetingApi", () => ({ DIWALI_PAGE_SIZE: 50, fetchDiwaliGreetings: vi.fn() }));
const fetchNames = vi.mocked(fetchDiwaliGreetings);
beforeEach(() => {
  fetchNames.mockReset().mockResolvedValue({
    rows: [{ id: "id", name: "Asha Patil", created_at: "2026-11-07T10:00:00Z" }], count: 51,
  });
});
afterEach(cleanup);

describe("Diwali admin list", () => {
  it("shows names, supports pagination, search, and refreshing", async () => {
    render(<DiwaliGreetingsPanel />);
    expect(await screen.findByText("Asha Patil")).toBeInTheDocument();
    expect(screen.getByText("51 total submissions")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    await waitFor(() => expect(fetchNames).toHaveBeenLastCalledWith(1, ""));
    await screen.findByText("Page 2 of 2");
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Asha" } });
    fireEvent.click(screen.getByRole("button", { name: "Search" }));
    await waitFor(() => expect(fetchNames).toHaveBeenLastCalledWith(0, "Asha"));
    await screen.findByText("51 matching submissions");
    const calls = fetchNames.mock.calls.length;
    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));
    await waitFor(() => expect(fetchNames.mock.calls.length).toBe(calls + 1));
  });
  it("shows setup and connection errors without displaying stale names", async () => {
    fetchNames.mockRejectedValue(new Error("missing table"));
    render(<DiwaliGreetingsPanel />);
    expect(await screen.findByRole("alert")).toHaveTextContent("supabase-diwali-greetings.sql");
    expect(screen.queryByText("Asha Patil")).not.toBeInTheDocument();
  });
});
