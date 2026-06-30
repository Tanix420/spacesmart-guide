# SpaceSmart Guide - Static Site Engine

**Smart Gear for Small Spaces** — Expert-tested dorm, apartment, and tiny kitchen essentials.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Development (watch mode)
npm run dev

# Production build
npm run build

# Validate build (links, images, schema, HTML)
npm run validate

# Full audit (GSC + performance)
npm run audit
```

## 📁 Project Structure

```
spacesmart-guide/
├── config.yaml                 # Site configuration (niche, voice, SEO, design)
├── package.json                # Build scripts + dependencies
├── vercel.json                 # Vercel deployment config
├── netlify.toml                # Netlify deployment config
├── .github/workflows/deploy.yml # CI/CD pipeline
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
│   │   └── partials/
│   │       └── product-card.njk
│   ├── assets/
│   │   ├── css/
│   │   │   ├── design-tokens.css
│   │   │   └── components.css
│   │   └── js/
│   │       ├── main.js
│   │       └── article.js
├── scripts/
│   ├── build.js                # Static site generator
│   ├── validate.js             # Link/image/schema validator
│   └── audit-gsc.js            # GSC audit (monthly cron)
└── public/                     # Generated output (gitignored)
```

## ⚙️ Configuration

Edit `config.yaml` to customize:
- Site name, URL, branding
- Amazon Associates tag (`matnix-20`)
- OneLink countries (US, CA, UK, DE, JP, AU)
- Voice/tone guidelines
- Content categories & article types
- Design tokens (colors, typography, spacing)
- SEO defaults

## 📝 Adding Articles

1. Add article data to `src/articles/{category}.json`
2. Follow the article schema (see existing articles)
3. Run `npm run build` to generate HTML

### Article Schema

```json
{
  "slug": "unique-slug",
  "category": "dorm-essentials",
  "title": "Article Title",
  "excerpt": "160-char description for SEO/social",
  "date": "2026-07-01",
  "updated": "2026-07-15",
  "readTime": 15,
  "featured": true,
  "tags": ["tag1", "tag2"],
  "ogImage": "/assets/images/og-image.jpg",
  "quickPicks": [...],
  "comparisonTable": [...],
  "sections": [...],
  "buyingGuide": [...],
  "faq": [...],
  "products": [...]
}
```

## 🎨 Design System

- **Colors**: Primary `#1a3c5e`, Accent `#e8a838`
- **Typography**: Inter (headings + body), JetBrains Mono (code)
- **Spacing**: 8px base unit
- **Border Radius**: 8px default
- **Shadows**: 3 levels (sm, md, lg)

CSS files:
- `design-tokens.css` — Reset, base, layout, utilities
- `components.css` — Cards, tables, forms, article layout

## 🔧 Build Process

`scripts/build.js`:
1. Loads config + article data
2. Renders templates via Nunjucks
3. Generates JSON-LD schemas (Article, Product, Review, FAQ, Breadcrumb, HowTo)
4. Builds affiliate URLs with OneLink support
5. Outputs static HTML to `public/`
6. Generates `sitemap.xml`, `robots.txt`
6. Copies assets

## ✅ Validation

`scripts/validate.js` checks:
- Internal links (404 detection)
- Images (existence, alt attributes)
- JSON-LD schema validity
- HTML basics (DOCTYPE, lang, title, h1)
- Performance hints (CSS/JS count)

Run after build: `npm run validate` (auto-runs via `postbuild`)

## 📊 Monthly GSC Audit

`scripts/audit-gsc.js` (run monthly via cron):
- Fetches GSC data via API
- Identifies traffic drops, new keywords, 404s
- Outputs prioritized fix list

Add to cron: `0 9 1 * * cd /path/to/repo && npm run audit`

## 🚀 Deployment

### Netlify (Recommended)
1. Connect GitHub repo to Netlify
2. Build command: `npm run build`
3. Publish directory: `public`
4. Add environment variables in Netlify dashboard:
   - `GA4_ID`, `SEARCH_CONSOLE_ID`, `GENIUSLINK_API_KEY`, `LEVANTA_API_KEY`

### Vercel
1. Import repo in Vercel
2. Framework preset: Other
3. Build command: `npm run build`
4. Output directory: `public`

### GitHub Pages
1. Enable Pages in repo settings
2. Source: GitHub Actions
3. Workflow included (`.github/workflows/deploy.yml`)

## 🔐 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GA4_ID` | No | Google Analytics 4 Measurement ID |
| `SEARCH_CONSOLE_ID` | No | Search Console verification token |
| `GENIUSLINK_API_KEY` | No | Geniuslink API for Choice Pages |
| `LEVANTA_API_KEY` | No | Levanta seller network API |

## 📈 Scaling to Multiple Sites

This engine is designed for multi-site deployment:

1. Duplicate repo for each niche
2. Update `config.yaml` with new niche config
3. Add category-specific articles
4. Deploy to separate subdomain (e.g., `dorm.spacesmartguide.com`)
5. Cross-link between sites for authority

## 📄 License

MIT — Use freely for your own affiliate sites.

---

**Built with:** Node.js, Nunjucks, Cheerio, CSS Custom Properties
**Affiliate:** Amazon Associates (`matnix-20`) + OneLink + Geniuslink + Levanta ready