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
