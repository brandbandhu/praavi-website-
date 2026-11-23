# Praavi Consultants mobile performance audit

Audit date 2026-11-23, Asia/Calcutta. Baseline GitHub main commit `9c98843`. The optimized changes are local. No deployment or remote push was made.

## Results

The supplied PageSpeed Insights scores were 59 Performance, 94 Accessibility, 100 Best Practices and 100 SEO. The table compares three cold local Lighthouse runs per version using equivalent production-mode conditions. Each column reports the median for that metric.

| Mobile metric | Before | After | Change |
| --- | ---: | ---: | ---: |
| Performance | 61 | **97** | +36 points |
| Accessibility | 95 | **100** | +5 points |
| Best Practices | 100 | **100** | 0 |
| SEO | 100 | **100** | 0 |
| Largest Contentful Paint | 8.58 s | **2.33 s** | −6.24 s |
| First Contentful Paint | 3.09 s | **2.01 s** | −1.08 s |
| Speed Index | 3.16 s | **2.01 s** | −1.15 s |
| Total Blocking Time | 337 ms | **38 ms** | −299 ms |
| Cumulative Layout Shift | 0.015 | **0.015** | 0.000, rounded |
| Startup JavaScript, minified | 1,074.96 kB | **311.97 kB** | −71% |
| Startup JavaScript, gzip | 294.48 kB | **93.58 kB** | −68% |
| Total transferred bytes, median | 1,424.1 kB | **434.6 kB** | −69% |
| Network requests, median | 35 | **18** | −49% |

Performance score runs were 61, 63, 61 before and 96, 97, 97 after. Lighthouse measured TBT on navigation. Field INP requires visitor interaction data and was unavailable for the local candidate. No production PSI score is claimed for the candidate.

## Method and artifacts

Lighthouse 12.8.2 in Chromium ran against output from `npm run build` on both sides. Both builds used the same loopback static server and gzip for text. Each run used a fresh browser profile and the mobile preset, with 412 × 823 CSS px at 1.75 DPR, 150 ms simulated RTT, 1,638.4 Kbps throughput and 4× CPU slowdown. Google Analytics collection URLs were blocked in both sets while the tag script remained eligible to load. This preserves its network and script cost without sending analytics collection events from the audit.

Raw reports, traces, DevTools network logs, request CSVs and HTML reports are in the local `praavi-performance-audit` folder. The HTML network waterfall compares run `matched-before-1` to run `matched-after-2` on the raw browser network clock. Lighthouse metric values use simulated throttling, so the raw request timestamps and simulated LCP phase durations use different time scales.

| Waterfall checkpoint | Before, run 1 | After, run 2 |
| --- | ---: | ---: |
| Hero request start, raw | 265 ms | 42 ms |
| Hero request end, raw | 275 ms | 48 ms |
| Hero response body | 522.38 kB | 41.45 kB |
| Simulated LCP resource load delay | 4,895 ms | 177 ms |
| Simulated LCP render delay | 3,032 ms | 1,629 ms |
| Startup JS transfer with headers | 294.72 kB | 93.81 kB |
| Font Awesome stylesheet and brand font transfer | 136.89 kB | 0.00 kB |
| Google tag script transfer | 183.31 kB | 183.31 kB |

## Findings and changes

1. The homepage background image was the actual LCP element on both versions. The old browser waterfall discovered the image after JavaScript. A shared responsive source definition now drives the HTML preload and the React picture. The preload runs only at the homepage path. The image uses high fetch priority, intrinsic dimensions, AVIF candidates and the existing WebP fallback. The mobile crop is centered on the same artwork. A Chromium check confirmed the preload and image share one request.
2. All ordinary non-home routes now load through React.lazy with Suspense feedback. The main entry bundle also excludes the unused Radix toast and tooltip mounts. Existing Sonner notifications stay available. Homepage form markup stays available to keyboards and assistive technology while its network modules load on submit. Package manifests and lockfiles were kept intact so existing features keep their dependency resolution.
3. The 16 logo files use dimensioned WebP, lazy loading and asynchronous decoding. About and Team photos use resized WebP. About goes from 683 kB to 55 kB, the founder image from 2,183 kB to 78 kB and the CEO image from 3,335 kB to 122 kB. The lower CEO image is lazy-loaded.
4. The existing local SVG replaces the remote Font Awesome CSS and icon font for WhatsApp. The contact and WhatsApp destinations and measurement configuration were preserved. The website has no separate chat widget script on this path.
5. Self-hosted WOFF2 serves Poppins 400, 500, 600 and 700 plus one variable Space Grotesk file. All use font-display swap. The Inter fallback download and Google Fonts stylesheet request are gone. The only explicit homepage preload is the selected LCP image.
6. CSS transform and opacity replace homepage and shared contact-form Framer Motion work. Desktop reveals and the desktop marquee start in view, and the marquee pauses offscreen, on hover and on focus. Mobile devices and reduced-motion users can scroll through the logos manually. The mobile glass treatment skips backdrop blur.
7. The form now exposes accessible field names, and the heading order passes Lighthouse. The old LCP-discovery, unsized-image, offscreen-image and forced-reflow findings pass in the representative after run.

## Verification and remaining costs

- The final production command built the client and compiled the finance server. All 31 Vitest tests, all 11 sitemap tests and ESLint on changed TypeScript passed.
- Production-mode Chromium checks covered desktop and mobile hero sizing, menu and SPA navigation, About and Contact lazy routes, Services and Contact canonicals, service-tab interactions, WhatsApp icon, logo scrolling and reduced-motion behavior. Contact form success, failure and all four delivery calls were verified against mocked endpoints with delivery hosts blocked.
- Built robots.txt, sitemap.xml, Diwali HTML and collector, landing HTML and June Offer HTML were byte-identical between baseline and candidate. The Vercel routing config, metadata logic, finance/auth rules, upload paths and environment settings were outside the patch.
- Live Vercel returned `public, max-age=0, must-revalidate` for HTML, JS, the existing hero and checked SEO files. The local cold comparison used matching headers for both runs. No Vercel header change was included. Actual edge caching and visitor CWV remain unmeasured for the local candidate.
- The representative after run still reports unused JavaScript of about 106 KiB, unused CSS of about 13 KiB and additional image savings of about 42 KiB. The Google tag remains the largest individual request. Global CSS remains render-blocking, and the CSR render delay accounts for the largest portion of final LCP. Further reductions would involve server-rendering or targeted design and analytics changes.
- The median CLS changed from 0.015 to 0.015. The trace shows a small shift in the hero text during font swap. Both medians remain in the good range and round to the same value. Mobile marquee motion is intentionally replaced by manual scrolling. The baseline About page lacked route-specific canonical metadata, which remains outside this performance patch.
- The legacy browser WebP fallback still weighs 522 kB. Modern browsers select responsive AVIF and received 41.45 kB on the Lighthouse device.

## Modified files

- `docs/mobile-performance-audit.md`
- `index.html`
- `public/assets/client-logos/RealTrips-C0YTP2sd.webp`
- `public/assets/client-logos/Transvolt-CkBpN8z8.webp`
- `public/assets/client-logos/Vishvanirmal-Ayurveda-CtiqTuU5.webp`
- `public/assets/client-logos/abk-CdGf5VGA.webp`
- `public/assets/client-logos/aiems-R3CvcNqc.webp`
- `public/assets/client-logos/creo-DOaj1ts3.webp`
- `public/assets/client-logos/dadhchi-YDEcEBl5.webp`
- `public/assets/client-logos/impactinfra-BMopwPl3.webp`
- `public/assets/client-logos/insiderview-CjarhEse.webp`
- `public/assets/client-logos/jkscuk-BbX_ttjn.webp`
- `public/assets/client-logos/kalidas-hDkP2ZMv.webp`
- `public/assets/client-logos/krayons-BLCOAATw.webp`
- `public/assets/client-logos/mediport-BlzfapUd.webp`
- `public/assets/client-logos/samratholidays-6rTTv7j-.webp`
- `public/assets/client-logos/skincity-DKkG2hQT.webp`
- `public/assets/client-logos/watsoft-BF1YD8YW.webp`
- `public/assets/home-hero/banner-2-mobile-480.avif`
- `public/assets/home-hero/banner-2-mobile-900.avif`
- `public/assets/home-hero/banner-2-wide-1440.avif`
- `public/assets/home-hero/banner-2-wide-1920.avif`
- `public/assets/home-hero/banner-2-wide-960.avif`
- `src/App.tsx`
- `src/assets/about.webp`
- `src/assets/fonts/poppins-400.woff2`
- `src/assets/fonts/poppins-500.woff2`
- `src/assets/fonts/poppins-600.woff2`
- `src/assets/fonts/poppins-700.woff2`
- `src/assets/fonts/poppins-OFL.txt`
- `src/assets/fonts/space-grotesk-400-700.woff2`
- `src/assets/fonts/spacegrotesk-OFL.txt`
- `src/assets/founders/CEO.webp`
- `src/assets/founders/founder.webp`
- `src/assets/whatsapp.svg`
- `src/components/ContactForm.tsx`
- `src/components/FloatingButtons.tsx`
- `src/components/Footer.tsx`
- `src/components/Navbar.tsx`
- `src/hooks/use-section-reveal.ts`
- `src/index.css`
- `src/lib/homeClientLogos.ts`
- `src/lib/homeHeroAssets.ts`
- `src/pages/About.tsx`
- `src/pages/Index.tsx`
- `src/pages/Team.tsx`
- `vite.config.ts`
