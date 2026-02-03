# Nuno Jorge — Landing Page

## Project Overview

Landing page for Nuno Jorge, an Exercise Physiologist specializing in clinical contexts (surgery prep, oncology, rehabilitation). The goal is to establish online presence and generate home-visit consultation bookings in Porto, Portugal. Current consultation volume is zero.

Read `nuno-jorge-landing-page-structure.md` for the full strategic brief, copy directions, page structure, and acquisition strategy. That document is the source of truth for content hierarchy and messaging.

## Architecture

### Static Site with Build Step + Inline Content Editing

```
src/
  template.html          # Page layout with {{placeholders}}
  content.json           # All editable text content (source of truth)
  styles.css             # All styles
  main.js                # Interactions, animations, scroll behavior
  editor.js              # Inline editing system (contenteditable + GitHub API)
  build.js               # Node.js script: merges template + content.json → dist/index.html

dist/                    # Build output (deployed to GitHub Pages)
  index.html             # Final static HTML (SEO-perfect, no JS required for content)
  styles.css
  main.js
  editor.js
  assets/
    images/
    fonts/

.github/
  workflows/
    deploy.yml           # GitHub Action: build + deploy to GitHub Pages on push
```

### Why This Architecture

- **SEO**: All content is in static HTML. No client-side rendering. Google and LLMs read everything.
- **Editing**: Nuno opens `?edit=true`, edits text inline, clicks "Publicar", content.json gets committed via GitHub API, Action rebuilds and deploys.
- **Zero dependencies in production**: The final site is plain HTML/CSS/JS. No framework, no runtime.
- **Build step**: `build.js` is a simple Node.js script (no npm dependencies). It reads `template.html`, replaces `{{placeholders}}` with values from `content.json`, and outputs `dist/index.html`.

## Tech Stack

- **HTML5** semantic markup
- **CSS** with custom properties (design tokens). No preprocessors. No Tailwind (vanilla project).
- **Vanilla JavaScript** ES modules. No framework, no build tools for JS.
- **Node.js** for the build script only (template → static HTML).
- **GitHub Pages** for hosting.
- **GitHub Actions** for build + deploy pipeline.

### What NOT to Use

- No React, no TypeScript, no Tailwind, no npm packages in production
- No CSS-in-JS, no preprocessors
- No client-side rendering of content (content must be in the HTML source)
- No external CDN dependencies (self-host everything including fonts)

## Design System

Follow Dieter Rams principles: useful, aesthetic, minimal, honest. Less is better.
This is a healthcare/clinical site for a vulnerable audience (patients, caregivers, 45-75 years old). Design must feel safe, trustworthy, and calm.

### Color Palette

Use OKLCH. Build a 12-step neutral scale plus one accent color (to be defined, suggest a calming clinical blue-green or similar). Keep it restrained: grays + one accent.

| Step | Role |
|------|------|
| 1 | Page background |
| 2 | Subtle background (cards, sections) |
| 3 | UI element background |
| 6 | Borders, separators |
| 7 | Focus rings |
| 11 | Secondary text |
| 12 | Primary text |
| Accent 9 | CTA buttons, links |
| Accent 10 | CTA hover |

Define all colors as CSS custom properties on `:root`.

### Typography

- **Font**: Inter variable, self-hosted. `font-feature-settings: 'cv11' 1` for single-story a.
- **Base size**: 1rem (16px). This audience may have vision difficulties. Never go below 1rem for body text.
- **Scale**: Use a limited set: 0.875rem, 1rem, 1.125rem, 1.25rem, 1.5rem, 2rem, 2.5rem, 3rem
- **Weights**: Regular (400) and Semibold (600) only.
- **Line-height**: Body 1.6 (generous for readability), headings 1.2
- **Letter-spacing**: Headings 2rem+ get -0.01em to -0.02em

### Spacing

4px base grid. Use CSS custom properties:
```css
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
--space-20: 5rem;     /* 80px */
--space-24: 6rem;     /* 96px */
```

Section spacing should be generous (80-120px between sections). This is a marketing page, not an app.

### Layout

- **Max content width**: 720px for text-heavy sections (optimal reading width), 1100px for wider layouts
- **Mobile-first**: Default styles are mobile. Use `min-width` media queries.
- **Breakpoints**: 640px (tablet), 1024px (desktop)
- **CSS Grid** for page layout, **Flexbox** for component internals
- **Use `gap`** for spacing between elements, not margin on children

### Buttons and CTAs

- Large touch targets: minimum 48px height on mobile
- Primary CTA (WhatsApp/Call): solid accent color, prominent, impossible to miss
- Secondary CTA: outline style
- Active state: `scale(0.97)` for tactile feedback
- Border radius: 8px for buttons, 12px for cards

### Shadows and Borders

- Avoid shadows. Use subtle borders (color step 6) for separation.
- If a shadow is absolutely needed, keep it minimal: `0 1px 3px oklch(0% 0 0 / 0.08)`

### Animation

- Purpose-driven only. No decorative animation.
- Subtle fade-in on scroll for sections (IntersectionObserver, `opacity` + slight `translateY`)
- Duration: 200-300ms for transitions
- Easing: `cubic-bezier(0.16, 1, 0.3, 1)` for entrances
- Respect `prefers-reduced-motion`: disable all animation

### Anti-Patterns

- No gradients on UI elements
- No heavy shadows
- No scroll hijacking
- No parallax (audience may have vestibular issues)
- No auto-playing video
- No popups or modals for CTAs
- No dark mode (unnecessary complexity for this project)
- No hamburger menu (page is single-scroll, use anchor links if needed)
- No px units in CSS (use rem)
- No arbitrary magic numbers

## Accessibility (Critical for This Audience)

- **Minimum font size**: 1rem (16px) for all body text
- **Color contrast**: WCAG AA minimum, aim for AAA on text
- **Focus states**: Visible on all interactive elements (2px ring, color step 7)
- **Keyboard navigation**: Full tab order through all interactive elements
- **Semantic HTML**: Proper heading hierarchy (h1 → h2 → h3, no skipping)
- **Alt text**: All images must have descriptive alt text
- **Link text**: Descriptive, never "click here"
- **Touch targets**: Minimum 44x44px on mobile
- **Language**: `<html lang="pt-PT">`
- **Skip to content**: Include a skip link for screen readers

## SEO and LLM Optimization

### HTML Meta

```html
<html lang="pt-PT">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Exercício Clínico ao Domicílio no Porto | Nuno Jorge — Fisiologista do Exercício</title>
  <meta name="description" content="Acompanhamento individualizado de exercício clínico ao domicílio. Preparação para cirurgia, exercício em oncologia, recuperação funcional. Porto, Grande Porto e Gaia.">
  <link rel="canonical" href="https://[domain]/">

  <!-- Open Graph -->
  <meta property="og:type" content="website">
  <meta property="og:title" content="Nuno Jorge — Exercício Clínico ao Domicílio no Porto">
  <meta property="og:description" content="...">
  <meta property="og:image" content="https://[domain]/assets/images/og-image.jpg">
  <meta property="og:url" content="https://[domain]/">
  <meta property="og:locale" content="pt_PT">

  <!-- Robots -->
  <meta name="robots" content="index, follow">
</head>
```

### Structured Data (JSON-LD)

Include in `<head>`:

1. **LocalBusiness** schema with: name, description, address (Porto area), telephone, url, geo coordinates, areaServed, priceRange
2. **MedicalBusiness** schema (subtype of LocalBusiness)
3. **Person** schema for Nuno: name, jobTitle, alumniOf, worksFor, credentials, knowsAbout
4. **FAQPage** schema: every FAQ question/answer pair
5. **Service** schema for each area of intervention

### LLM Optimization

Modern LLMs crawl and index web content. To be easily found and understood:

- **Clear, semantic HTML structure**: Proper heading hierarchy communicates content structure
- **Descriptive section landmarks**: Use `<main>`, `<section>`, `<article>`, `<nav>`, `<footer>` with `aria-label` attributes
- **Content in HTML, not images**: All text content must be in the DOM, never as images
- **FAQ in plain HTML**: Question as `<h3>`, answer as `<p>` within a `<section>`. The JSON-LD FAQ schema reinforces this
- **llms.txt file**: Create a `/llms.txt` at the root with a plain-text summary of who Nuno is, what he does, where he operates, and how to contact. Follow the llms.txt convention:
  ```
  # Nuno Jorge — Fisiologista do Exercício
  > Exercício clínico personalizado ao domicílio no Porto, Grande Porto e Vila Nova de Gaia.

  ## About
  [plain text summary]

  ## Services
  [list of services in plain language]

  ## Contact
  [phone, whatsapp, location]
  ```
- **robots.txt**: Allow all crawlers. Include sitemap reference.
- **sitemap.xml**: Simple sitemap with the single page URL.

## Content Editing System

### How It Works

1. Nuno navigates to `[site]?edit=true`
2. A floating toolbar appears at the top with: "Modo de Edição" indicator, "Publicar" button, "Cancelar" button
3. All editable text elements get a subtle dashed border on hover and become `contenteditable` on click
4. Nuno edits text directly on the page, seeing exactly how it will look
5. "Publicar" serializes all editable content back to the `content.json` structure
6. Commits `content.json` to the GitHub repo via GitHub API (using a Personal Access Token stored in localStorage)
7. GitHub Action triggers: runs `build.js`, deploys to GitHub Pages
8. Site updates in ~60 seconds

### content.json Structure

```json
{
  "meta": {
    "title": "...",
    "description": "..."
  },
  "hero": {
    "headline": "...",
    "subheadline": "...",
    "cta_primary": "...",
    "cta_secondary": "..."
  },
  "differentiation": {
    "title": "...",
    "intro": "...",
    "body": "..."
  },
  "target_audience": {
    "title": "...",
    "scenarios": [
      { "bold": "...", "text": "..." }
    ]
  },
  "process": {
    "title": "...",
    "steps": [
      { "title": "...", "description": "..." }
    ]
  },
  "services": {
    "title": "...",
    "items": [
      { "title": "...", "description": "..." }
    ]
  },
  "about": {
    "title": "...",
    "paragraphs": ["...", "..."],
    "credentials": ["...", "..."]
  },
  "testimonials": {
    "title": "...",
    "items": [
      { "quote": "...", "author": "...", "context": "..." }
    ]
  },
  "pricing": {
    "title": "...",
    "intro": "...",
    "items": [
      { "label": "...", "value": "..." }
    ],
    "note": "..."
  },
  "faq": {
    "title": "...",
    "items": [
      { "question": "...", "answer": "..." }
    ]
  },
  "cta_final": {
    "headline": "...",
    "body": "...",
    "cta_primary": "...",
    "cta_secondary": "..."
  },
  "footer": {
    "name": "...",
    "title": "...",
    "phone": "...",
    "whatsapp": "...",
    "linkedin": "...",
    "coverage": "..."
  },
  "contact": {
    "phone": "+351XXXXXXXXX",
    "whatsapp_number": "351XXXXXXXXX",
    "whatsapp_message": "Olá, gostava de saber mais sobre o acompanhamento ao domicílio.",
    "linkedin": "https://linkedin.com/in/..."
  }
}
```

### Editor Implementation Details

- `editor.js` is only loaded when `?edit=true` is in the URL
- Each editable element in `template.html` has a `data-content="hero.headline"` attribute mapping to the JSON path
- On edit mode activation: fetch current `content.json`, make mapped elements `contenteditable`
- Visual feedback: subtle dashed border (color step 7) around editable elements on hover, solid border when focused/editing
- "Publicar" button: collect all `data-content` values from the DOM, rebuild the JSON, PUT to GitHub API
- Authentication: first time asks for GitHub PAT, stores in `localStorage`. Show clear instructions for generating the token.
- Error handling: show status messages ("A publicar...", "Publicado com sucesso!", "Erro: ...") in the toolbar
- "Cancelar": reload page without `?edit=true`

### GitHub API Integration

```javascript
// Commit content.json to repo
const response = await fetch(
  `https://api.github.com/repos/${owner}/${repo}/contents/src/content.json`,
  {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message: 'Update content',
      content: btoa(unescape(encodeURIComponent(JSON.stringify(content, null, 2)))),
      sha: currentSha
    })
  }
);
```

### Build Script (build.js)

Zero npm dependencies. Pure Node.js:

```javascript
// build.js — runs via: node src/build.js
// 1. Read template.html
// 2. Read content.json
// 3. Replace all {{path.to.value}} placeholders
// 4. Handle arrays ({{#each services.items}} ... {{/each}})
// 5. Generate structured data JSON-LD from content
// 6. Write dist/index.html
// 7. Copy static assets to dist/
```

Support a simple template syntax:
- `{{key.nested}}` for simple values
- `{{#each key.array}} ... {{/each}}` for arrays
- `{{this.property}}` inside each blocks

### GitHub Action (deploy.yml)

```yaml
name: Build and Deploy
on:
  push:
    branches: [main]
    paths: ['src/**']

jobs:
  build-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: node src/build.js
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

## Content Guidelines

- **Language**: Portuguese from Portugal (pt-PT). Not Brazilian Portuguese.
- **Tone**: Warm, safe, human. Like explaining to a family member.
- **No jargon in headlines**: Use patient language. Technical terms only in body text for SEO.
- **CTAs**: Always offer both WhatsApp and phone call. This audience prefers direct contact.
- **WhatsApp link format**: `https://api.whatsapp.com/send?phone=351XXXXXXXXX&text=Olá, gostava de saber mais sobre o acompanhamento ao domicílio.`

## File Naming and Code Style

- Filenames: lowercase, hyphens for separation (`content.json`, `build.js`, `editor.js`)
- CSS: BEM-like naming for classes (`.hero__headline`, `.section--alt`)
- JS: camelCase for variables and functions
- HTML: semantic elements, proper indentation (2 spaces)
- Comments: concise, explain why not what
- No dead code, no commented-out blocks in production

## Development Workflow

1. Edit `template.html` and `styles.css` for layout/design changes
2. Edit `content.json` for text content changes
3. Run `node src/build.js` to generate `dist/index.html`
4. Open `dist/index.html` in browser to preview
5. For editor testing: serve locally (`npx serve dist`) and add `?edit=true`

## Performance Targets

- **First Contentful Paint**: < 1.5s
- **Total page weight**: < 500KB (including fonts and images)
- **No external requests** except WhatsApp API link and GitHub API (editor only)
- **Self-host fonts**: Include Inter variable woff2 in assets
- **Optimize images**: WebP format, proper sizing, lazy loading below the fold
- **Inline critical CSS** if needed for FCP
