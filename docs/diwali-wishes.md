# Diwali wishes on the main domain

The greeting is published with the main website at
`https://praaviconsultants.in/diwali-wishes`.

`public/diwali-wishes/` contains the standalone build of the supplied **Diwali
Greeting-Praavi** project, including its images, music, styles, and greeting-card
download code. These files are checked in so the normal main-site build needs no
additional dependencies or access to the separate greeting project.

After editing the original greeting project, regenerate its static files:

```powershell
npm run build:diwali
# Or supply another source directory (with its dependencies installed):
npm run build:diwali -- "D:/path/to/Diwali Greeting-Praavi"
npm run build
```

The default source is the sibling `../../Diwali Greeting-Praavi` relative to this
website root. The build uses that project's toolchain without changing its files.
Asset URLs are prefixed with `/diwali-wishes/` to work at both the clean URL and
the trailing-slash URL. Local Vite development/preview and Vercel serve the
standalone HTML at that route. The main React app also supports client-side
navigation to it by loading the standalone HTML.

Deploy the main website normally to publish the page on the existing domain.

## Name collection and admin list

Run `database/supabase-diwali-greetings.sql` once in the main website's Supabase
SQL Editor, then deploy the website. The existing `profiles` table must identify
the signed-in admin with `role = 'admin'`, as it does for admin login.

Valid submissions save the name (up to 36 characters) and a server timestamp.
The public can insert names; only admins can read the list. No email or phone
number is collected. A note below the name field explains collection. Saving
errors show a retry button while the greeting and PNG remain available.

Open the existing admin dashboard and choose **Diwali Wishes** to view names,
search, refresh, and page through all submissions. Dates use IST. This records
new submissions after setup; earlier greetings cannot be recovered.

The collector source is `src/diwali-wishes/collector.ts`. The normal production
build rebuilds `public/diwali-wishes/collector.js` using the same Supabase
environment configuration as the admin panel. For local development after edits,
run `npm run build:diwali-collector` before `npm run dev`.
