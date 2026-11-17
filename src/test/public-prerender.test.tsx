import { cleanup, fireEvent, render, renderHook } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useNavigate } from "react-router-dom";
import { afterEach, beforeEach, expect, it } from "vitest";
import SeoHead from "@/components/SeoHead";
import { PublicRenderContext, usePublicData } from "@/lib/publicPrerender";

beforeEach(() => { document.head.innerHTML = ""; window.history.replaceState({}, "", "/clients"); });
afterEach(() => { cleanup(); window.history.replaceState({}, "", "/"); });
const snapshot = (pathname: string, data: unknown) => {
  const s = document.createElement("script"); s.id = "public-prerender-data"; s.type = "application/json"; s.textContent = JSON.stringify({ pathname, data }); document.head.appendChild(s); return s;
};
it("uses only the matching public route snapshot", () => {
  const data = { clients: [{ id: "public", name: "Published client" }] };
  snapshot("/clients", data);
  expect(renderHook(usePublicData).result.current).toEqual(data);
  window.history.replaceState({}, "", "/portfolio");
  expect(renderHook(usePublicData).result.current).toEqual({});
});
it("ignores malformed snapshots and accepts the homepage and trailing-slash URL forms", () => {
  const s = snapshot("/clients", { clients: [] });
  s.textContent = "malformed";
  expect(renderHook(usePublicData).result.current).toEqual({});
  s.textContent = JSON.stringify({ pathname: "/clients", data: { clients: [] } });
  window.history.replaceState({}, "", "/clients/");
  expect(renderHook(usePublicData).result.current).toEqual({ clients: [] });
  window.history.replaceState({}, "", "/");
  s.textContent = JSON.stringify({ pathname: "/", data: {} });
  expect(renderHook(usePublicData).result.current).toEqual({});
});
it("SSR public data remains scoped to its render context", () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => <PublicRenderContext.Provider value={{ data: { jobs: [] } }}>{children}</PublicRenderContext.Provider>;
  expect(renderHook(usePublicData, { wrapper }).result.current).toEqual({ jobs: [] });
});
it("public client navigation replaces initial metadata and removes stale article schema and duplicates", () => {
  document.head.innerHTML = '<link rel="canonical" href="https://wrong.example"><link rel="canonical" href="https://duplicate.example"><meta property="og:type" content="article"><meta name="twitter:site" content="@wrong"><script id="seo-json-ld" type="application/ld+json">{"@type":"BlogPosting"}</script><script id="seo-default-social" type="application/json">{"og:type":"website","twitter:card":"summary"}</script>';
  const Navigation = () => { const navigate = useNavigate(); return <button onClick={() => navigate("/services")}>Services route</button>; };
  const view = render(<MemoryRouter initialEntries={["/clients"]}><Navigation /><Routes><Route path="/clients" element={<SeoHead title="Clients title" description="Clients description" canonicalPath="/clients" />} /><Route path="/services" element={<SeoHead title="Services title" description="Services description" canonicalPath="/services" />} /></Routes></MemoryRouter>);
  fireEvent.click(view.getByText("Services route"));
  expect(document.title).toBe("Services title");
  expect(document.querySelectorAll('link[rel="canonical"]')).toHaveLength(1);
  expect(document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href).toBe("https://www.praaviconsultants.in/services");
  expect(document.querySelector('meta[name="twitter:site"]')).toBeNull();
  expect(document.getElementById("seo-json-ld")).toBeNull();
  for (const key of ["og:type", "og:title", "og:description", "og:url", "twitter:card"]) expect(document.querySelectorAll(`meta[property="${key}"],meta[name="${key}"]`)).toHaveLength(1);
  expect(document.querySelector<HTMLMetaElement>('meta[property="og:type"]')?.content).toBe("website");
});
