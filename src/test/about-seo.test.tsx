import { cleanup, fireEvent, render } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useNavigate } from "react-router-dom";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import AboutPage from "@/pages/About";
import SeoHead from "@/components/SeoHead";
import { ABOUT_SEO } from "@/lib/aboutSeo.mjs";
import template from "../../index.html?raw";

vi.mock("@/components/ContactForm", () => ({ default: () => <section>Contact form</section> }));
beforeEach(() => {
  document.head.innerHTML = new DOMParser().parseFromString(template, "text/html").head.innerHTML;
  vi.stubGlobal("IntersectionObserver", class { observe() {} unobserve() {} disconnect() {} });
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
const Home = () => <><SeoHead title="Homepage fixture" description="Homepage description" canonicalPath="/" /><h1>We Build Websites, Generate Leads &amp; Scale Businesses</h1></>;
const Navigation = () => {
  const navigate = useNavigate();
  return <><button onClick={() => navigate("/about")}>About route</button><button onClick={() => navigate("/")}>Home route</button></>;
};
const app = (initial: string) => <MemoryRouter initialEntries={[initial]}><Navigation /><Routes><Route path="/" element={<Home />} /><Route path="/about" element={<AboutPage />} /></Routes></MemoryRouter>;
const canonical = () => [...document.querySelectorAll<HTMLLinkElement>('link[rel="canonical"]')].map((link) => link.href);

it("About has unique metadata and its existing single H1 without changing its content", () => {
  const view = render(app("/about"));
  expect(document.title).toBe(ABOUT_SEO.title);
  expect(document.querySelector<HTMLMetaElement>('meta[name="description"]')?.content).toBe(ABOUT_SEO.description);
  expect(canonical()).toEqual([ABOUT_SEO.canonicalUrl]);
  expect(view.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  expect(view.getByRole("heading", { level: 1 }).textContent).toBe("Promote With Us");
  expect(view.getByText("Core Values")).toBeInTheDocument();
  expect(view.getByText("Client-First")).toBeInTheDocument();
});

it("homepage/About navigation replaces canonical and metadata without stale or duplicate tags", () => {
  const view = render(app("/"));
  expect(canonical()).toEqual(["https://www.praaviconsultants.in/"]);
  fireEvent.click(view.getByText("About route"));
  expect(canonical()).toEqual([ABOUT_SEO.canonicalUrl]);
  expect(document.title).toBe(ABOUT_SEO.title);
  expect(document.querySelectorAll('meta[name="description"]')).toHaveLength(1);
  fireEvent.click(view.getByText("Home route"));
  expect(canonical()).toEqual(["https://www.praaviconsultants.in/"]);
  expect(document.title).toBe("Homepage fixture");
});
