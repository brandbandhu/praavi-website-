import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import DiwaliCelebration from "@/components/diwali/DiwaliCelebration";
import { DIWALI_CONFIG } from "@/components/diwali/config";

vi.mock("@/components/diwali/FireworksCanvas", () => ({
  default: () => <canvas data-testid="fireworks" />,
}));
let notifyIntersection: (entries: { isIntersecting: boolean }[]) => void;
const disconnect = vi.fn();
const setHeroVisible = (visible: boolean) => act(() => {
  notifyIntersection([{ isIntersecting: visible }]);
});
const start = () => {
  setHeroVisible(true);
  act(() => vi.advanceTimersByTime(400));
};
beforeEach(() => {
  vi.useFakeTimers();
  disconnect.mockClear();
  vi.stubGlobal("IntersectionObserver", class {
    constructor(callback: typeof notifyIntersection) { notifyIntersection = callback; }
    observe() {}
    disconnect = disconnect;
  });
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  DIWALI_CONFIG.enabled = true;
});
describe("Diwali hero visibility", () => {
  it("loops while visible, including small scrolls, and restarts on return", () => {
    render(<DiwaliCelebration />);
    start();
    const firstCanvas = screen.getByTestId("fireworks");
    act(() => vi.advanceTimersByTime(5000));
    expect(screen.getByTestId("fireworks")).not.toBe(firstCanvas);
    fireEvent.scroll(window);
    expect(screen.getByTestId("fireworks")).toBeInTheDocument();
    setHeroVisible(false);
    expect(screen.queryByTestId("fireworks")).not.toBeInTheDocument();
    act(() => vi.advanceTimersByTime(10000));
    expect(screen.queryByTestId("fireworks")).not.toBeInTheDocument();
    start();
    expect(screen.getByTestId("fireworks")).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
  it("starts again after navigating away from and returning to the homepage", () => {
    const first = render(<DiwaliCelebration />);
    start();
    first.unmount();
    expect(disconnect).toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
    render(<DiwaliCelebration />);
    start();
    expect(screen.getByTestId("fireworks")).toBeInTheDocument();
  });
  it("pauses in a hidden tab and resumes when the visible hero returns", () => {
    render(<DiwaliCelebration />);
    start();
    const hidden = vi.spyOn(document, "hidden", "get").mockReturnValue(true);
    fireEvent(document, new Event("visibilitychange"));
    expect(screen.queryByTestId("fireworks")).not.toBeInTheDocument();
    hidden.mockReturnValue(false);
    fireEvent(document, new Event("visibilitychange"));
    act(() => vi.advanceTimersByTime(400));
    expect(screen.getByTestId("fireworks")).toBeInTheDocument();
  });
  it("waits for load and cancels pending playback when the hero leaves view", () => {
    const ready = vi.spyOn(document, "readyState", "get").mockReturnValue("loading");
    render(<DiwaliCelebration />);
    start();
    expect(screen.queryByTestId("fireworks")).not.toBeInTheDocument();
    ready.mockReturnValue("complete");
    fireEvent(window, new Event("load"));
    setHeroVisible(false);
    act(() => vi.advanceTimersByTime(1000));
    expect(screen.queryByTestId("fireworks")).not.toBeInTheDocument();
    start();
    expect(screen.getByTestId("fireworks")).toBeInTheDocument();
  });
  it("suppresses fireworks for reduced motion, including manual replay", () => {
    vi.spyOn(window, "matchMedia").mockReturnValue({
      matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn(),
    } as unknown as MediaQueryList);
    render(<DiwaliCelebration />);
    start();
    fireEvent.click(screen.getByRole("button"));
    act(() => vi.advanceTimersByTime(5000));
    expect(screen.queryByTestId("fireworks")).not.toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.getByRole("button")).toBeEnabled();
  });
  it("removes decorations and controls when disabled", () => {
    DIWALI_CONFIG.enabled = false;
    render(<DiwaliCelebration />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByTestId("fireworks")).not.toBeInTheDocument();
  });
});
