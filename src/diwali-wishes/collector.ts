import { sanitizeDiwaliName, saveDiwaliGreeting } from "../lib/diwaliGreetingApi";

// This module runs alongside the isolated greeting app, without changing its artwork.
export function installDiwaliCollector(root: Document = document) {
  const pending = new Map<HTMLFormElement, { id: string; name: string }>();
  const statuses = new WeakMap<HTMLFormElement, HTMLParagraphElement>();

  const decorate = () => {
    root.querySelectorAll<HTMLFormElement>("form.name-form").forEach((form) => {
      if (statuses.has(form)) return;
      const notice = root.createElement("p");
      notice.textContent = "Your name and submission time will be saved by Praavi Consultants when you create a greeting.";
      notice.style.cssText = "font-size:12px;line-height:1.6;margin-top:12px;opacity:.8";
      const status = root.createElement("p");
      status.setAttribute("role", "status");
      status.setAttribute("aria-live", "polite");
      status.style.cssText = "font-size:13px;line-height:1.6;margin-top:8px";
      form.append(notice, status);
      statuses.set(form, status);
    });
  };

  async function persist(form: HTMLFormElement, payload: { id: string; name: string }) {
    pending.set(form, payload);
    const status = statuses.get(form)!;
    status.textContent = "Saving your name…";
    try {
      await saveDiwaliGreeting(payload);
      if (pending.get(form) !== payload) return;
      status.textContent = "Your name has been saved. Happy Diwali!";
      pending.delete(form);
    } catch {
      if (pending.get(form) !== payload) return;
      pending.delete(form);
      status.textContent = "Your greeting is available, but your name could not be saved. ";
      const retry = root.createElement("button");
      retry.type = "button";
      retry.textContent = "Retry saving";
      retry.style.textDecoration = "underline";
      retry.addEventListener("click", () => void persist(form, payload), { once: true });
      status.append(retry);
    }
  }

  const onSubmit = (event: Event) => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement) || !form.matches("form.name-form")) return;
    const input = form.querySelector<HTMLInputElement>("#client-name");
    if (!input) return;
    const name = sanitizeDiwaliName(input.value);
    if (!name || pending.get(form)?.name === name) return;
    decorate();
    void persist(form, { id: crypto.randomUUID(), name });
  };

  decorate();
  const observer = new MutationObserver(decorate);
  observer.observe(root.body, { childList: true, subtree: true });
  root.addEventListener("submit", onSubmit, true);
  return () => {
    observer.disconnect();
    root.removeEventListener("submit", onSubmit, true);
  };
}

if (typeof document !== "undefined" && import.meta.env.MODE !== "test") {
  installDiwaliCollector();
}
