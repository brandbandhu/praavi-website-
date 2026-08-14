# Praavi Finance API

This is the API required by the finance UI at:

- `/finance-management-system/fms/praavi-internal/admin`
- `/finance-management-system/fms/praavi-internal/finance-team`

## Local setup

Create `server/.env`:

```env
SUPABASE_URL="https://your-project-ref.supabase.co"
SUPABASE_ANON_KEY="your-publishable-anon-key"
JWT_SECRET="use-a-long-random-secret"
FMS_ADMIN_USERNAME="admin-username"
FMS_ADMIN_PASSWORD="admin-password"
FMS_FINANCE_USERNAME="finance-username"
FMS_FINANCE_PASSWORD="finance-password"
PORT=4000
```

Then run:

```bash
npm install
npm run dev
```

Run `database/supabase-finance-management-system.sql` once in Supabase SQL
Editor to create the finance tables, RLS policies, default login hashes, and
bucket defaults.

The frontend expects the API at `/api/...`. In local development with the main
site on port 8082, run this API on port 4000 and proxy `/api` to it.

## Production

Deploy this `server` folder to Render, Railway, or another Node host.

Build command:

```bash
npm install && npm run deploy:build
```

Start command:

```bash
npm start
```

After deployment, add an `/api/(.*)` rewrite in the main website to the live
backend URL.
