import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import Layout from "./components/Layout";
import AboutPage from "./pages/About";

// Build-time public content only. Existing client rendering, events and motion
// remain unchanged; no authenticated pages or records are prerendered.
export const renderAbout = () => renderToString(
  <StaticRouter location="/about">
    <Layout><AboutPage /></Layout>
  </StaticRouter>,
);
