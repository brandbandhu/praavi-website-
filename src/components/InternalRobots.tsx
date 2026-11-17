import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { isInternalRoute } from "@/lib/internalRoutes.mjs";

// Static HTML protects initial loads; this handles React route navigation.
export default function InternalRobots() {
  const { pathname } = useLocation();
  useEffect(() => {
    const existing = document.head.querySelector<HTMLMetaElement>('meta[data-internal-robots]');
    if (!isInternalRoute(pathname)) {
      existing?.remove();
      return;
    }
    const meta = existing ?? document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, nofollow";
    meta.setAttribute("data-internal-robots", "true");
    if (!existing) document.head.appendChild(meta);
    return () => meta.remove();
  }, [pathname]);
  return null;
}
