import "dotenv/config";
import express from "express";
import cors from "cors";
import { authRouter } from "./routes/auth.js";
import { bucketConfigRouter } from "./routes/bucketConfig.js";
import { employeesRouter } from "./routes/employees.js";
import { subscriptionsRouter } from "./routes/subscriptions.js";
import { receivablesRouter } from "./routes/receivables.js";
import { paymentsRouter } from "./routes/payments.js";
import { dashboardRouter } from "./routes/dashboard.js";
import { reportCardRouter } from "./routes/reportCard.js";
import { quotationsRouter } from "./routes/quotations.js";
import { deliverableTypesRouter, quotationPackagesRouter } from "./routes/dmCatalog.js";

const app = express();
app.use(cors());
app.use(express.json());

function wrapAsyncRouter(router: express.Router): express.Router {
  for (const layer of (router as any).stack ?? []) {
    const stack = layer.route?.stack ?? (layer.handle?.stack as any[] | undefined);
    if (!stack) continue;
    for (const routeLayer of stack) {
      const original = routeLayer.handle;
      if (typeof original !== "function" || original.length > 3 || original.__wrappedAsync) continue;
      routeLayer.handle = function wrappedAsync(req: express.Request, res: express.Response, next: express.NextFunction) {
        Promise.resolve(original(req, res, next)).catch(next);
      };
      routeLayer.handle.__wrappedAsync = true;
    }
  }
  return router;
}

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  "";
const databaseConfigured =
  supabaseUrl.length > 0 &&
  supabaseKey.length > 0 &&
  !supabaseUrl.includes("YOUR_SUPABASE") &&
  !supabaseKey.includes("YOUR_SUPABASE");

app.get("/", (_req, res) => {
  res.json({ ok: true, service: "Praavi Finance API", health: "/api/health" });
});

app.get("/api/health", (_req, res) => res.json({ ok: true, databaseConfigured }));

app.use("/api", (_req, res, next) => {
  if (!databaseConfigured) {
    res.status(503).json({
      error: "Finance API database is not configured. Put SUPABASE_URL and SUPABASE_ANON_KEY in server/.env.",
    });
    return;
  }
  next();
});

app.use("/api/auth", wrapAsyncRouter(authRouter));
app.use("/api/bucket-config", wrapAsyncRouter(bucketConfigRouter));
app.use("/api/employees", wrapAsyncRouter(employeesRouter));
app.use("/api/subscriptions", wrapAsyncRouter(subscriptionsRouter));
app.use("/api/receivables", wrapAsyncRouter(receivablesRouter));
app.use("/api/payments", wrapAsyncRouter(paymentsRouter));
app.use("/api/dashboard", wrapAsyncRouter(dashboardRouter));
app.use("/api/report-card", wrapAsyncRouter(reportCardRouter));
app.use("/api/quotations", wrapAsyncRouter(quotationsRouter));
app.use("/api/deliverable-types", wrapAsyncRouter(deliverableTypesRouter));
app.use("/api/quotation-packages", wrapAsyncRouter(quotationPackagesRouter));

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  const message = typeof err?.message === "string" ? err.message : "Internal server error";
  res.status(500).json({ error: message });
});

const port = Number(process.env.PORT) || 4000;

if (!process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`Praavi finance API listening on http://localhost:${port}`);
  });
}

export default app;
