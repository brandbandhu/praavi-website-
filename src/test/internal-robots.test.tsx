import { StrictMode } from "react";
import { cleanup, fireEvent, render } from "@testing-library/react";
import { MemoryRouter, useNavigate } from "react-router-dom";
import { afterEach, beforeEach, expect, it } from "vitest";
import InternalRobots from "@/components/InternalRobots";

beforeEach(() => { document.head.innerHTML = ""; });
afterEach(cleanup);
const Navigation = () => {
  const navigate = useNavigate();
  return <><button onClick={() => navigate("/social_desk/dashboard")}>Internal</button><button onClick={() => navigate("/about")}>Public</button></>;
};

it("adds one internal directive and removes it when navigating back to public pages", () => {
  const view = render(<StrictMode><MemoryRouter initialEntries={["/about"]}><InternalRobots /><Navigation /></MemoryRouter></StrictMode>);
  expect(document.querySelector('meta[name="robots"]')).toBeNull();
  fireEvent.click(view.getByText("Internal"));
  expect(document.querySelectorAll('meta[name="robots"]')).toHaveLength(1);
  expect(document.querySelector<HTMLMetaElement>('meta[name="robots"]')?.content).toBe("noindex, nofollow");
  fireEvent.click(view.getByText("Public"));
  expect(document.querySelector('meta[name="robots"]')).toBeNull();
});

it("reuses initial crawler-visible markup without leaving stale noindex on public navigation", () => {
  document.head.innerHTML = '<meta name="robots" content="noindex, nofollow" data-internal-robots="true">';
  const view = render(<StrictMode><MemoryRouter initialEntries={["/finance-management-system/fms/login"]}><InternalRobots /><Navigation /></MemoryRouter></StrictMode>);
  expect(document.querySelectorAll('meta[name="robots"]')).toHaveLength(1);
  fireEvent.click(view.getByText("Public"));
  expect(document.querySelector('meta[name="robots"]')).toBeNull();
});
