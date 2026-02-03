# Changelog: Initial Implementation

**Date:** 2026-02-03
**Authors:** André Furt, Claude Opus 4.5
**Commits:** `9035b13..b1330c5` (7 commits, 12 files, 1986 lines)

---

## Summary

Complete implementation of a static landing page for Nuno Jorge, an Exercise Physiologist operating in Porto, Portugal. The site is a zero-dependency static build with an inline content editing system that publishes via GitHub API, deployed to GitHub Pages through Actions.

Production URL: https://andrefurt.github.io/nuno-jorge/

---

## Architecture

```
src/
  content.json        # All editable text (source of truth)
  template.html       # Semantic HTML with {{placeholders}}
  styles.css          # Design system + all styles
  build.js            # Template engine (Node.js, zero deps)
  main.js             # Scroll reveal (IntersectionObserver)
  editor.js           # Inline CMS (contenteditable + GitHub API)
  assets/fonts/       # Inter Variable (self-hosted, 344KB)

robots.txt            # Allow all crawlers
sitemap.xml           # Single-page sitemap
llms.txt              # Plain-text summary for LLM indexing

.github/workflows/
  deploy.yml          # Build + deploy to GitHub Pages

dist/                 # Build output (gitignored)
```

### Design Decisions

**Why a custom template engine instead of an existing SSG?**
The project requires zero npm dependencies and a build script that Nuno (a non-developer) never needs to touch. The template engine is 60 lines of code supporting `{{key.path}}`, `{{#each array}}`, `{{this}}`, `{{this.prop}}`, and `{{@index}}`. Adding Eleventy or Astro would introduce a package.json, node_modules, and upgrade maintenance for no benefit on a single-page site.

**Why contenteditable instead of a CMS?**
The client edits text directly on the live page and sees the result in real-time. No admin panel, no login page, no database. The GitHub API is the "backend": the editor commits content.json, the Action rebuilds, and the site updates in ~60 seconds. The PAT lives in the client's browser localStorage, never in the repo.

**Why GitHub Pages instead of Netlify/Vercel?**
Zero config, zero cost, zero vendor lock-in. The site is static HTML; any host works. GitHub Pages was chosen because the repo is already on GitHub and the deploy pipeline is a single workflow file.

---

## Files Created

### `src/content.json` (242 lines)

All page copy in pt-PT, structured by section. 13 top-level keys: `meta`, `hero`, `differentiation`, `target_audience`, `process`, `services`, `about`, `testimonials`, `pricing`, `faq`, `cta_final`, `footer`, `contact`.

Content was extracted from the strategic brief (`nuno-jorge-landing-page-structure.md`) and adapted to a JSON structure that supports both template rendering and inline editing. Arrays use object items with named fields (not positional) so the editor can map DOM elements back to JSON paths via `data-content` attributes.

Key structural decisions:
- `differentiation.paragraphs` is an array (not a single string with `\n\n`) for clean template iteration, consistent with `about.paragraphs`
- `differentiation.comparison_labels` stores the table headers as editable content, not hardcoded in the template
- `services.items[].seo_terms` stores technical SEO synonyms as metadata; they're used in JSON-LD Service schemas but not rendered visually (the target audience is 45-75 year old patients who would be confused by clinical jargon)
- `contact` is a separate top-level key from `footer` because contact data is referenced in multiple places (hero CTAs, pricing CTAs, final CTA, footer)

### `src/build.js` (214 lines)

Node.js build script. Zero npm dependencies. Reads `template.html` + `content.json`, outputs `dist/index.html`, copies static assets.

Template engine features:
- `{{key.nested.path}}` resolves dot-separated paths against the content object
- `{{#each key.array}} ... {{/each}}` iterates arrays, supports nesting (inner-most blocks resolve first via repeated regex passes with a safety limit of 20)
- `{{this}}` for simple values (strings, numbers) inside each blocks
- `{{this.property}}` for object properties inside each blocks
- `{{@index}}` for zero-based iteration index (used in `data-content` attribute paths for the editor)

Computed values are injected before template processing:
- `computed.whatsapp_url`: full WhatsApp API URL with `encodeURIComponent` on the message text

JSON-LD structured data is generated programmatically from content.json and injected before `</head>`:
- `MedicalBusiness` (extends LocalBusiness): name, address, telephone, areaServed
- `Person`: name, jobTitle, alumniOf, worksFor, knowsAbout
- `FAQPage`: all FAQ items as Question/Answer pairs
- `Service`: one per area of intervention with provider and areaServed

Asset copying: `src/assets/` to `dist/assets/`, static files (styles.css, main.js, editor.js) to dist root, root-level files (robots.txt, sitemap.xml, llms.txt) to dist.

### `src/template.html` (227 lines)

Semantic HTML5. Single `<main>` with 10 `<section>` elements + `<footer>`. 106 `data-content` attributes mapping editable elements to content.json paths.

Structure:
1. **Hero**: h1 headline, subheadline, dual CTA (WhatsApp + phone), trust badges bar
2. **Differentiation**: lead text, two paragraphs, comparison table (`<table>` for semantics and accessibility)
3. **Target audience**: scenario list with bold lead + description per item
4. **Process**: ordered list with CSS counter-based step numbers, title + description per step
5. **Services**: article cards in a responsive grid (1 col mobile, 2 tablet, 3 desktop)
6. **About**: paragraphs + credential badges
7. **Testimonials**: blockquote with cite and context
8. **Pricing**: definition list (`<dl>`) with label/value pairs, note, dual CTA
9. **FAQ**: native `<details>/<summary>` elements (accessible accordion without JS)
10. **CTA final**: dark background section with inverted button styles
11. **Footer**: name, title, coverage, contact links

Accessibility:
- `<a class="skip-link">` for keyboard users
- `aria-label` on every `<section>` and `<nav>`
- Proper heading hierarchy: 1x `<h1>`, 9x `<h2>`, 11x `<h3>`, no skipping
- `lang="pt-PT"` on `<html>`
- Font preload for Inter Variable

Editor integration:
- `<script>` at the bottom conditionally loads `editor.js` only when `?edit=true` is in the URL
- Every editable text element has `data-content="path.to.value"` matching the content.json structure
- Array items use `data-content="faq.items.0.question"` (index resolved at build time from `{{@index}}`)

### `src/styles.css` (870 lines)

Mobile-first CSS with custom properties. No preprocessors, no Tailwind, no px units.

**Design tokens** (`:root`):
- 12-step neutral scale in OKLCH (warm gray, hue 90, chroma 0.002-0.010)
- 7-step accent scale in OKLCH (clinical teal, hue 195, chroma 0.010-0.115)
- Accent-9 at lightness 0.47 provides ~5:1 contrast ratio against white (WCAG AA for normal text)
- 12-step spacing scale on a 4px grid (0.25rem to 6rem)
- Typography: Inter variable, weights 400/600, line-heights 1.6 body / 1.2 headings
- Layout: 45rem max-width for text, 68.75rem for wide sections

**Color rationale:**
The neutral scale has a very slight warm tint (hue 90, chroma 0.003-0.010) to avoid the clinical coldness of pure gray. The accent is a muted teal (hue 195) that reads as trustworthy and calm, appropriate for healthcare. The CTA final section inverts to dark background (neutral-12) with white/outline buttons for strong visual contrast at the conversion point.

**Components** (BEM naming):
- `.hero`: fluid type scale via `clamp()`, generous padding
- `.trust-bar`: horizontal badge list with subtle background
- `.comparison`: table with dimmed conventional column vs emphasized clinical column
- `.scenarios`: bullet list with accent-colored dot pseudo-elements
- `.process`: CSS counters (`counter-reset`/`counter-increment`) for step numbers in accent-colored circles, no hardcoded numbers in HTML
- `.services`: CSS Grid with responsive column count
- `.testimonials`: blockquote with typographic quotes via `::before`/`::after`
- `.pricing`: definition list styled as cards
- `.faq`: native details/summary with +/- indicator via `::after`, no JS
- `.section--cta`: dark background with inverted button color scheme

**Responsive breakpoints:**
- Default: mobile (single column, 1.25rem content padding)
- 40rem (640px): tablet (2-column services grid, increased padding)
- 64rem (1024px): desktop (3-column services, about section with side-by-side text + credentials)

**Scroll animations:**
- Sections start with `opacity: 0; transform: translateY(1rem)`
- `.section--visible` class added by IntersectionObserver in main.js
- Hero is exempt (immediate render, no transition)
- `prefers-reduced-motion: reduce` disables all animations and transitions

**Editor mode:**
- `[data-content]` elements get transparent dashed outline by default
- `.is-editing [data-content]:hover` shows neutral-7 dashed outline
- `.is-editing [data-content]:focus` shows accent-9 solid outline

### `src/main.js` (28 lines)

Scroll reveal via IntersectionObserver. Adds `--visible` class when sections enter viewport (threshold 0.1, rootMargin -40px bottom). Respects `prefers-reduced-motion` by applying visible classes immediately without animation.

### `src/editor.js` (322 lines)

Inline content editing system. Only loaded when `?edit=true` is in the URL.

**Flow:**
1. Creates a fixed toolbar at the top ("Modo de Edição" / "Publicar" / "Cancelar")
2. Injects toolbar CSS (self-contained, no dependency on styles.css)
3. Prompts for GitHub PAT on first use (stored in localStorage as `nj-editor-token`)
4. Prompts for repo owner/name if defaults are placeholders (stored as `nj-editor-repo`)
5. Fetches current content.json from GitHub API to get the SHA (required for commits)
6. Adds `contenteditable` to all `[data-content]` elements
7. Adds `is-editing` class to body (activates editor CSS in styles.css)

**Editing guards:**
- Enter key is prevented (avoids `<div>` insertion in contenteditable)
- Paste is intercepted and sanitized to plain text only
- spellcheck is enabled

**Publishing:**
1. Re-fetches SHA to detect concurrent edits
2. Collects text content from all `[data-content]` elements
3. Rebuilds content.json structure using dot-path resolution (supports nested objects and arrays with numeric indices)
4. Base64-encodes the JSON with proper UTF-8 handling
5. PUTs to GitHub API with the message "Atualizar conteúdo via editor"
6. Shows status messages: "A publicar...", "Publicado com sucesso!", or error detail

**Offline mode:** If no token is provided, the editor still enables contenteditable for visual preview but warns that changes won't be published.

### `robots.txt` (4 lines)

Allows all user-agents. References sitemap at the GitHub Pages URL.

### `sitemap.xml` (8 lines)

Single URL entry for the landing page. Monthly change frequency, priority 1.0.

### `llms.txt` (25 lines)

Plain-text summary following the llms.txt convention. Includes: who Nuno is, credentials, full service list with SEO terms, and contact information. Designed to be easily parsed by LLM crawlers for knowledge indexing.

### `.github/workflows/deploy.yml` (44 lines)

GitHub Actions workflow. Triggers on push to main (paths: src/**, root config files, the workflow itself) and on manual dispatch.

Uses the native GitHub Pages deployment method (`actions/upload-pages-artifact` + `actions/deploy-pages`) instead of third-party actions. This avoids permission issues with `GITHUB_TOKEN` and doesn't require any repo secrets configuration.

Permissions: `contents: read`, `pages: write`, `id-token: write`. Concurrency group prevents parallel deploys.

### `.gitignore` (2 lines)

Excludes `dist/` (build output) and `.DS_Store`.

---

## What's Not Done (Intentional)

| Item | Reason |
|------|--------|
| Photos (hero, about, og-image) | Waiting on client photography |
| Real pricing values | Waiting on client confirmation |
| Additional testimonials | Waiting on patient/doctor quotes |
| Clinical recommendations | Waiting on doctor authorization |
| Custom domain | Using GitHub Pages default URL for now |
| Google Analytics / Search Console | Out of scope for initial build |
| Medical referral PDF/flyer | Separate deliverable, not part of the website |

---

## How to Develop

```bash
# Edit content
vim src/content.json

# Edit layout/design
vim src/template.html src/styles.css

# Build
node src/build.js

# Preview
cd dist && python3 -m http.server 8080

# Test editor
# Open http://localhost:8080?edit=true
```

## How to Deploy

Push to `main` with changes in `src/**`. The GitHub Action runs `node src/build.js` and deploys `dist/` to GitHub Pages automatically.

Manual trigger: go to Actions > Build and Deploy > Run workflow.
