import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import DiwaliCelebration from "@/components/diwali/DiwaliCelebration";
import { DIWALI_CONFIG } from "@/components/diwali/config";

vi.mock("@/components/diwali/FireworksCanvas", () => ({
  default: () => <canvas data-testid="fireworks" />,
}));

beforeEach(() => {
  vi.useFakeTimers();
  // Exercise the production session behavior, independent of Vite's test mode.
  DIWALI_CONFIG.previewOnReload = false;
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
  DIWALI_CONFIG.enabled = true;
});

describe("Diwali celebration lifecycle", () => {
  it("does not consume the automatic celebration while hidden or still loading", () => {
    sessionStorage.clear();
    const hidden = vi.spyOn(document, "hidden", "get").mockReturnValue(true);
    vi.spyOn(document, "readyState", "get").mockReturnValue("loading");
    const view = render(<DiwaliCelebration />);
    act(() => vi.advanceTimersByTime(6000));
    expect(sessionStorage.getItem(DIWALI_CONFIG.sessionKey)).toBeNull();
    hidden.mockReturnValue(false);
    fireEvent(document, new Event("visibilitychange"));
    act(() => vi.advanceTimersByTime(6000));
    expect(sessionStorage.getItem(DIWALI_CONFIG.sessionKey)).toBeNull();
    expect(screen.queryByTestId("fireworks")).not.toBeInTheDocument();
    view.unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("loops until scroll without a floating wish and supports replay without automatic route replays", () => {
    sessionStorage.clear();
    const first = render(<DiwaliCelebration />);
    expect(screen.queryByTestId("fireworks")).not.toBeInTheDocument();
    expect(sessionStorage.getItem(DIWALI_CONFIG.sessionKey)).toBeNull();
    act(() => vi.advanceTimersByTime(400));
    expect(screen.getByTestId("fireworks")).toBeInTheDocument();
    expect(sessionStorage.getItem(DIWALI_CONFIG.sessionKey)).toBe("true");
    expect(screen.getByRole("button")).toBeDisabled();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    const originalCanvas = screen.getByTestId("fireworks");
    act(() => vi.advanceTimersByTime(5000));
    expect(screen.getByTestId("fireworks")).not.toBe(originalCanvas);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    act(() => vi.advanceTimersByTime(15000));
    expect(screen.getByTestId("fireworks")).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    fireEvent.scroll(window, { target: { scrollY: 100 } });
    expect(screen.queryByTestId("fireworks")).not.toBeInTheDocument();
    act(() => vi.advanceTimersByTime(5000));
    expect(screen.queryByTestId("fireworks")).not.toBeInTheDocument();
    first.unmount();

    render(<DiwaliCelebration />);
    expect(screen.queryByTestId("fireworks")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Replay Diwali celebration" }));
    expect(screen.getByTestId("fireworks")).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(5000));
    expect(screen.getByTestId("fireworks")).toBeInTheDocument();
    fireEvent.scroll(window);
    expect(screen.queryByTestId("fireworks")).not.toBeInTheDocument();
  });

  it("suppresses fireworks and the floating wish for reduced motion", () => {
    vi.spyOn(window, "matchMedia").mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as MediaQueryList);
    render(<DiwaliCelebration />);
    fireEvent.click(screen.getByRole("button"));
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.queryByTestId("fireworks")).not.toBeInTheDocument();
    act(() => vi.advanceTimersByTime(5000));
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.getByRole("button")).toBeEnabled();
  });

  it("removes the whole experience when the festival flag is disabled", () => {
    DIWALI_CONFIG.enabled = false;
    render(<DiwaliCelebration />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.queryByTestId("fireworks")).not.toBeInTheDocument();
  });

  it("cancels playback when the visitor leaves the tab and cleans up its timer", () => {
    const view = render(<DiwaliCelebration />);
    fireEvent.click(screen.getByRole("button"));
    vi.spyOn(document, "hidden", "get").mockReturnValue(true);
    fireEvent(document, new Event("visibilitychange"));
    expect(screen.queryByTestId("fireworks")).not.toBeInTheDocument();
    view.unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
