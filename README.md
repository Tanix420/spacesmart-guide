# SpaceSmart Guide - Static Site Engine

**Smart Gear for Small Spaces** — Expert-tested dorm, apartment, and tiny kitchen essentials. Real reviews, honest prices, zero fluff.

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![Validation](https://img.shields.io/badge/validation-100%25%20pass-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Development (watch mode with live reload)
npm run dev

# Production build
npm run build

# Validate build (links, images, schema, HTML, performance)
npm run validate

# Full audit (GSC + performance + content analysis)
npm run audit

# Create new article interactively
npm run new:article

# Create new category
npm run new:category
```

## ✨ What's New (v2.0)

| Feature | Status | Description |
|---------|--------|-------------|
| 🔥 **Dev Server + Live Reload** | ✅ | `npm run dev` — auto-rebuilds on file changes, serves at `localhost:3000` |
| 🎯 **Content Scaffolding** | ✅ | `npm run new:article` / `new:category` — interactive prompts, validation |
| 🔍 **Search & 404 Pages** | ✅ | Client-side search index, fuzzy matching, offline-capable |
| 📊 **GSC Audit Automation** | ✅ | Monthly traffic drops, keyword opportunities, technical SEO |
| ✅ **Validation Suite** | ✅ | Links, images, schemas, HTML, CWV, external link checking |
| 🎨 **Design System v2** | ✅ | CSS custom properties, dark mode, fluid typography, container queries |
| 📦 **PWA Ready** | ✅ | Manifest, service worker, offline fallback, install prompt |
| 📈 **Analytics Integration** | ✅ | GA4 + Search Console, privacy-first, consent management |
| 🚀 **CI/CD Pipeline** | ✅ | GitHub Actions → Netlify/Vercel/GitHub Pages |
| 🏷️ **Schema-First SEO** | ✅ | Article, Product, Review, FAQ, Breadcrumb, HowTo, Organization |

---

## 📁 Project Structure

```
spacesmart-guide/
├── config.yaml                 # Site configuration (niche, voice, SEO, design)
├── package.json                # Scripts + dependencies
├── vercel.json                 # Vercel deployment config
├── netlify.toml                # Netlify deployment config
├── .github/workflows/deploy.yml # CI/CD pipeline (Netlify/Vercel/GH Pages)
├── .gitignore
├── README.md
├── scripts/
│   ├── build.js                # Static site generator (incremental, minified)
│   ├── validate.js             # Comprehensive validator (links, images, schemas, CWV)
│   ├── audit-gsc.js            # Monthly GSC audit (API + local analysis)
│   ├── new-article.js          # Interactive article scaffolding
│   ├── new-category.js         # Category scaffolding
│   └── dev-server.js           # Live reload dev server
├── src/
│   ├── articles/               # Article data (JSON per category)
│   │   ├── dorm-essentials.json
│   │   ├── first-apartment.json
│   │   └── tiny-kitchen.json
│   ├── data/
│   │   └── articles.js         # Article index (auto-generated)
│   ├── templates/
│   │   ├── layout.njk          # Base HTML template
│   │   ├── index.njk           # Homepage
│   │   ├── category.njk        # Category pages
│   │   ├── article.njk         # Article pages
│   │   ├── 404.njk             # 404 page
│   │   ├── search.njk          # Search page
│   │   └── partials/
│   │       ├── product-card.njk
│   │       ├── header.njk
│   │       └── footer.njk
│   ├── assets/
│   │   ├── css/
│   │   │   ├── design-tokens.css   # Reset, tokens, base, utilities
│   │   │   └── components.css      # Cards, tables, forms, layout
│   │   ├── js/
│   │   │   ├── main.js             # Mobile menu, FAQ, back-to-top, newsletter
│   │   │   ├── article.js          # Table sort, reading progress, tracking
│   │   │   ├── search.js           # Client-side search
│   │   │   └── analytics.js        # GA4 + consent
│   │   ├── images/                 # SVG OG images (auto-generated)
│   │   ├── favicon.svg
│   │   ├── apple-touch-icon.png
│   │   └── manifest.json
│   └── sw.js                     # Service worker (auto-generated)
├── public/                       # Generated output (gitignored)
│   ├── index.html
│   ├── sitemap.xml
│   ├── robots.txt
│   ├── .nojekyll
│   ├── assets/
│   ├── dorm-essentials/
│   ├── first-apartment/
│   ├── tiny-kitchen/
│   ├── 404.html
│   └── search/
└── reports/                      # Audit reports (gitignored)
    └── gsc-audit-YYYY-MM-DD.{json,md}
```

---

## ⚙️ Configuration

Edit `config.yaml` to customize everything:

```yaml
site:
  name: "SpaceSmart Guide"
  tagline: "Smart Gear for Small Spaces"
  url: "https://spacesmart-guide.com"
  author: "SpaceSmart Team"

associates:
  tag: "matnix-20"
  onelink:
    enabled: true
    countries:
      - { code: "US", tag: "matnix-20", domain: "amazon.com" }
      - { code: "CA", tag: "matnix-20-ca", domain: "amazon.ca" }
      # ... UK, DE, JP, AU

geniuslink:
  enabled: false
  api_key: ""  # Set via env var

voice:
  persona: "Senior RA who's seen it all"
  tone: "practical, no-BS, money-saving"
  avoid: ["fluff", "marketing speak", "fake enthusiasm"]

design:
  colors:
    primary: "#1a3c5e"
    accent: "#e8a838"
  typography:
    font_heading: "'Inter', system-ui, sans-serif"
  spacing:
    unit: 8
    container_max: "1200px"

seo:
  default_image: "/assets/images/og-default.svg"
  twitter_handle: "@spacesmartguide"

analytics:
  ga4: ""  # Set via env var GA4_ID
  search_console: ""  # Set via env var SEARCH_CONSOLE_ID

build:
  output_dir: "public"
  clean_output: true
```

---

## 📝 Adding Articles

### Option 1: Interactive Scaffolding (Recommended)

```bash
npm run new:article
```

Interactive prompts guide you through:
- Category selection
- Article type (best-roundup, vs-comparison, single-review, buying-guide)
- Title, slug, excerpt, read time
- Quick picks (3 products with badges)
- Comparison table
- Sections (intro, headings, product cards, lists, pros/cons)
- Buying guide factors
- FAQ entries
- Product data (ASIN, price, rating, images)

### Option 2: Manual JSON

Add to `src/articles/{category}.json`:

```json
{
  "slug": "best-dorm-essentials-2026",
  "category": "dorm-essentials",
  "title": "Best Dorm Essentials 2026: 50+ Items Tested",
  "excerpt": "Moving into a dorm? We tested 50+ essentials...",
  "date": "2026-07-01",
  "updated": "2026-07-15",
  "readTime": 18,
  "featured": true,
  "tags": ["dorm essentials", "college freshman", "twin xl bedding"],
  "ogImage": "/assets/images/best-dorm-essentials-og.svg",
  "quickPicks": [
    {
      "name": "Mellanni Twin XL Sheet Set",
      "shortDesc": "120K+ reviews, deep pockets fit 16\" mattresses",
      "price": 32.99,
      "rating": 4.7,
      "reviewCount": 124000,
      "image": "https://m.media-amazon.com/images/I/71X.jpg",
      "asin": "B07X7X7X7X",
      "brand": "Mellanni",
      "badge": "best",
      "badgeLabel": "Best Overall"
    }
  ],
  "comparisonTable": [...],
  "sections": [
    { "type": "intro", "content": "I've helped three siblings move into dorms..." },
    { "type": "heading", "content": "Bedding: Start Here" },
    { "type": "paragraph", "content": "Twin XL is non-negotiable..." },
    { "type": "productCard", "product": {...}, "badge": "best" }
  ],
  "buyingGuide": [
    { "title": "Measure First", "content": "Check your dorm's mattress dimensions..." }
  ],
  "faq": [
    { "question": "What size sheets do dorm beds need?", "answer": "Twin XL (39\" x 80\")..." }
  ],
  "products": [...]
}
```

### Article Types & Templates

| Type | Template | Weight | Structure |
|------|----------|--------|-----------|
| `best-roundup` | `best-roundup.njk` | 0.5 | Intro → Quick Picks → Comparison → Reviews → Buying Guide → FAQ |
| `vs-comparison` | `vs-comparison.njk` | 0.2 | Intro → Verdict → Spec Table → Deep Dives → When to Choose → FAQ |
| `single-review` | `single-review.njk` | 0.2 | Verdict → Pros/Cons → Specs → Performance → Alternatives → FAQ |
| `buying-guide` | `buying-guide.njk` | 0.1 | Intro → Key Factors → Top Picks → What to Avoid → FAQ |

---

## 🎨 Design System

### Colors
```css
--color-primary: #1a3c5e;        /* Deep navy */
--color-primary-light: #2d5a8a;  /* Lighter navy */
--color-accent: #e8a838;         /* Gold/yellow */
--color-accent-hover: #d4942a;
--color-background: #fafafa;
--color-surface: #ffffff;
--color-text: #1a1a2e;
--color-text-muted: #6b7280;
--color-border: #e5e7eb;
--color-success: #059669;
--color-warning: #d97706;
--color-error: #dc2626;
```

### Typography
```css
--font-heading: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
--font-body: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
--font-mono: 'JetBrains Mono', monospace;
--type-scale: 1.125;  /* Major third */
```

### Spacing (8px base unit)
```css
--space-xs: 4px;   --space-sm: 6px;   --space-md: 8px;
--space-lg: 12px;  --space-xl: 16px;  --space-2xl: 24px;
--space-3xl: 32px;
--container-max: 1200px;
```

### Dark Mode (Automatic)
```css
@media (prefers-color-scheme: dark) {
  --color-background: #111827;
  --color-surface: #1f2937;
  --color-text: #f3f4f6;
  --color-text-muted: #9ca3af;
  --color-border: #374151;
}
```

---

## 🔧 Build Process

`scripts/build.js` performs:

1. **Load config** — Parses `config.yaml`
2. **Load articles** — Reads all `src/articles/*.json`
3. **Generate schemas** — Article, Product, Review, FAQ, Breadcrumb, HowTo, Organization JSON-LD
4. **Build affiliate URLs** — OneLink (6 countries), Geniuslink, Levanta support
5. **Render templates** — Nunjucks with custom filters (currency, number, truncate, markdown)
6. **Minify output** — HTML, CSS, JS (production only)
7. **Inline critical CSS** — Above-the-fold styles in `<head>`
8. **Generate sitemap.xml** — All pages with changefreq/priority
9. **Generate robots.txt** — With sitemap reference
10. **Copy assets** — CSS, JS, images, fonts
11. **Create search index** — `search-index.json` for client-side search
12. **Generate service worker** — Offline caching, stale-while-revalidate

### Build Modes

```bash
npm run dev      # Development: no minify, no cache, live reload, source maps
npm run build    # Production: minified, cached, optimized, critical CSS inlined
```

### Incremental Builds

The build script tracks file hashes and only rebuilds changed pages. Force full rebuild:

```bash
npm run clean && npm run build
```

---

## ✅ Validation

`scripts/validate.js` checks:

| Check | Description |
|-------|-------------|
| **Internal Links** | All relative links resolve to existing files |
| **External Links** | HTTP HEAD requests (configurable timeout, follow redirects) |
| **Images** | Local files exist, have alt text, proper dimensions |
| **JSON-LD Schemas** | Valid JSON, required properties present |
| **HTML Basics** | DOCTYPE, lang, title, h1, meta description |
| **Performance** | CSS/JS count, image optimization, third-party requests |
| **Accessibility** | Alt text, heading hierarchy, landmark roles, color contrast |

### Run Validation

```bash
npm run validate           # After build (auto-runs via postbuild)
npm run validate -- --external  # Include external link checking
npm run validate -- --cwv       # Include Core Web Vitals hints
```

### Validation Report

Outputs `validation-report.json` with:
- Summary counts
- Detailed broken links with file/line context
- Missing images with reason
- Schema errors with snippets
- HTML errors with location
- Performance warnings

---

## 📊 Monthly GSC Audit

`scripts/audit-gsc.js` — Run monthly via cron:

```bash
# Local run
npm run audit

# Cron (monthly 1st at 9am)
0 9 1 * * cd /path/to/repo && npm run audit >> audit.log 2>&1
```

### Features

**With GSC API Credentials** (`GSC_CREDENTIALS` env var):
- Fetches last 28 days vs previous 28 days
- Detects traffic drops >30% (page-level)
- Identifies lost keyword positions >3 spots
- Finds new ranking keywords with clicks
- Country/device breakdown

**Without Credentials (Local Analysis)**:
- Sitemap completeness
- Robots.txt validity
- Title/description length optimization
- H1 count per page
- JSON-LD schema coverage
- Word count analysis
- Image alt text coverage

### Output

- `reports/gsc-audit-YYYY-MM-DD.json` — Machine-readable
- `reports/gsc-audit-YYYY-MM-DD.md` — Human-readable markdown
- Console summary with top 3 recommendations

---

## 🚀 Deployment

### Netlify (Recommended)

1. Connect GitHub repo to Netlify
2. Build command: `npm run build`
3. Publish directory: `public`
4. Environment variables:
   ```
   GA4_ID=G-XXXXXXXXXX
   SEARCH_CONSOLE_ID=your-verification-token
   GENIUSLINK_API_KEY=sk_live_xxx
   LEVANTA_API_KEY=xxx
   GSC_CREDENTIALS={"type":"service_account",...}  # For audit
   ```

### Vercel

1. Import repo in Vercel
2. Framework preset: **Other**
3. Build command: `npm run build`
4. Output directory: `public`
5. Add same environment variables

### GitHub Pages

1. Enable Pages in repo settings → Source: GitHub Actions
2. Workflow included at `.github/workflows/deploy.yml`
3. Push to main → auto-deploys to `https://username.github.io/spacesmart-guide/`

### Custom Domain

All platforms support custom domains. Update `config.yaml` `site.url` to your domain.

---

## 🔐 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GA4_ID` | No | Google Analytics 4 Measurement ID (G-XXXXXXXXXX) |
| `SEARCH_CONSOLE_ID` | No | Search Console site verification token |
| `GENIUSLINK_API_KEY` | No | Geniuslink API for Choice Pages |
| `LEVANTA_API_KEY` | No | Levanta seller network API |
| `GSC_CREDENTIALS` | No | Service account JSON for GSC API (audit script) |

**Never commit secrets.** Use platform environment variable UI.

---

## 📈 Scaling to Multiple Sites

This engine is built for multi-site portfolios:

1. **Duplicate repo** for each niche
2. **Update `config.yaml`** — Niche name, categories, voice, colors
3. **Add category articles** — Use `npm run new:article`
4. **Deploy to subdomain** — `dorm.spacesmartguide.com`, `kitchen.spacesmartguide.com`
5. **Cross-link** — Shared header/footer with site switcher
6. **Centralize analytics** — Same GA4 property with `site_name` custom dimension

### Multi-Site Config Example

```yaml
# config.dorm.yaml
site:
  name: "DormSmart"
  url: "https://dorm.spacesmartguide.com"
content:
  categories:
    - id: "bedding"
    - id: "storage"
    - id: "study"
```

```bash
# Build specific config
cp config.dorm.yaml config.yaml && npm run build
```

---

## 🛠️ Development

### File Watching (Dev Mode)

```bash
npm run dev
# Serves at http://localhost:3000
# Watches: src/**, config.yaml, scripts/**
# Live reloads browser on change
```

### Adding a New Category

```bash
npm run new:category
# Prompts for: id, name, description, seed keywords, audience, price range
# Creates: src/articles/new-category.json + updates config.yaml
```

### Custom Templates

Add to `src/templates/` and reference in `config.yaml`:

```yaml
content:
  article_types:
    - type: "custom-type"
      template: "custom.njk"
      weight: 0.1
```

### CSS Architecture

```
design-tokens.css    # Reset, variables, base, utilities (load first)
components.css       # Cards, tables, forms, article layout (load second)
```

Both use CSS custom properties — override in browser devtools for theming.

---

## 📦 NPM Scripts Reference

| Script | Description |
|--------|-------------|
| `npm install` | Install dependencies |
| `npm run dev` | Start dev server with live reload |
| `npm run build` | Production build to `public/` |
| `npm run clean` | Remove `public/` and `reports/` |
| `npm run validate` | Validate build (links, images, schemas, HTML, CWV) |
| `npm run audit` | Monthly GSC audit |
| `npm run new:article` | Interactive article scaffolding |
| `npm run new:category` | Interactive category scaffolding |
| `npm run lint` | Lint JS/JSON/YAML (if eslint added) |
| `npm run format` | Format with Prettier (if added) |

---

## 🔧 Troubleshooting

### Build Fails
```bash
# Clear cache and rebuild
npm run clean && npm run build

# Check Node version (requires 18+)
node --version

# Reinstall dependencies
rm -rf node_modules package-lock.json && npm install
```

### Validation Errors
```bash
# See detailed report
cat validation-report.json | jq '.details'

# Fix broken links
# Fix missing images (add to src/assets/images/)
# Fix schema errors (check JSON-LD in browser DevTools)
```

### Dev Server Won't Start
```bash
# Port 3000 in use?
lsof -i :3000
# Kill process or change PORT in scripts/dev-server.js
```

### Images Not Loading
- Ensure `ogImage` paths start with `/assets/images/`
- SVGs work natively; no build step needed
- Check `public/assets/images/` after build

---

## 📄 License

MIT — Use freely for your own affiliate sites. Attribution appreciated but not required.

---

## 🙏 Credits

**Built with:**
- [Node.js](https://nodejs.org/) 18+
- [Nunjucks](https://mozilla.github.io/nunjucks/) — Templating
- [Cheerio](https://cheerio.js.org/) — HTML parsing/validation
- [date-fns](https://date-fns.org/) — Date formatting
- [slugify](https://github.com/sindresorhus/slugify) — URL slugs
- [glob](https://github.com/isaacs/node-glob) — File matching
- [yaml](https://github.com/eemeli/yaml) — Config parsing
- [googleapis](https://github.com/googleapis/google-api-nodejs-client) — GSC API

**Affiliate Ready:**
- Amazon Associates (`matnix-20`)
- OneLink (US, CA, UK, DE, JP, AU)
- Geniuslink Choice Pages
- Levanta Seller Network

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/Tanix420/spacesmart-guide/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Tanix420/spacesmart-guide/discussions)
- **Email**: team@spacesmartguide.com

---

**Built for affiliate publishers who value speed, SEO, and honest content.**