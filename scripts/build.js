/**
 * SpaceSmart Guide - Static Site Generator
 * Builds all HTML pages from templates + data
 */

const fs = require('fs');
const path = require('path');
const nunjucks = require('nunjucks');
const yaml = require('yaml');
const glob = require('glob');
const { slugify } = require('slugify');
const { format } = require('date-fns');

// ========================================
// CONFIG & SETUP
// ========================================

const CONFIG_PATH = path.join(__dirname, '..', 'config.yaml');
const DATA_DIR = path.join(__dirname, '..', 'src', 'data');
const TEMPLATES_DIR = path.join(__dirname, '..', 'src', 'templates');
const ARTICLES_DIR = path.join(__dirname, '..', 'src', 'articles');
const ASSETS_DIR = path.join(__dirname, '..', 'src', 'assets');
const OUTPUT_DIR = path.join(__dirname, '..', 'public');

const isDev = process.argv.includes('--dev');
const isProd = process.argv.includes('--prod') || !isDev;

console.log(`[Build] Mode: ${isDev ? 'development' : 'production'}`);
console.log(`[Build] Reading config...`);

// Load config
const config = yaml.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));

// Setup Nunjucks
const env = nunjucks.configure([TEMPLATES_DIR, path.join(TEMPLATES_DIR, 'partials')], {
  autoescape: true,
  trimBlocks: true,
  lstripBlocks: true,
  noCache: isDev
});

// Global template variables
env.addGlobal('config', config);
env.addGlobal('site', config.site);
env.addGlobal('associates', config.associates);
env.addGlobal('now', new Date());
env.addGlobal('formatDate', (date, fmt = 'MMMM d, yyyy') => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return format(d, fmt);
});
env.addGlobal('slugify', (str) => slugify(str, { lower: true, strict: true }));

// Custom filters
env.addFilter('jsonLd', (obj) => JSON.stringify(obj, null, 2));
env.addFilter('currency', (value, currency = 'USD', locale = 'en-US') => {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(value);
});

env.addFilter('number', (value) => {
  return new Intl.NumberFormat('en-US').format(value);
});

env.addFilter('truncate', (str, length = 160) => {
  if (str.length <= length) return str;
  return str.substring(0, length).trim() + '...';
});

env.addFilter('markdown', (str) => {
  // Simple markdown-like processing
  return str
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>');
});

// ========================================
// UTILITY FUNCTIONS
// ========================================

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function readDataFile(filename) {
  const filepath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filepath)) return null;
  const ext = path.extname(filepath);
  const content = fs.readFileSync(filepath, 'utf8');
  if (ext === '.yaml' || ext === '.yml') return yaml.parse(content);
  if (ext === '.json') return JSON.parse(content);
  if (ext === '.csv') return parseCSV(content);
  return content;
}

function parseCSV(content) {
  const lines = content.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim());
    const obj = {};
    headers.forEach((h, i) => obj[h] = values[i]);
    return obj;
  });
}

function getArticleData(slug) {
  // Search through all category JSON files for the article
  const files = glob.sync('*.json', { cwd: ARTICLES_DIR });
  for (const f of files) {
    const data = JSON.parse(fs.readFileSync(path.join(ARTICLES_DIR, f), 'utf8'));
    if (Array.isArray(data)) {
      const found = data.find(article => article.slug === slug);
      if (found) return found;
    } else if (data.slug === slug) {
      return data;
    }
  }
  return null;
}

function getAllArticles() {
  const files = glob.sync('*.json', { cwd: ARTICLES_DIR });
  const allArticles = [];
  for (const f of files) {
    const data = JSON.parse(fs.readFileSync(path.join(ARTICLES_DIR, f), 'utf8'));
    if (Array.isArray(data)) {
      data.forEach(article => {
        allArticles.push({ slug: article.slug, ...article });
      });
    } else {
      allArticles.push({ slug: f.replace('.json', ''), ...data });
    }
  }
  return allArticles;
}

function getArticlesByCategory(categoryId) {
  return getAllArticles().filter(a => a.category === categoryId);
}

function getRelatedArticles(currentSlug, categoryId, limit = 3) {
  return getArticlesByCategory(categoryId)
    .filter(a => a.slug !== currentSlug)
    .slice(0, limit);
}

// ========================================
// SCHEMA GENERATORS
// ========================================

function generateBreadcrumbSchema(article) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: config.site.url },
      { '@type': 'ListItem', position: 2, name: article.categoryName, item: `${config.site.url}/${article.category}/` },
      { '@type': 'ListItem', position: 3, name: article.title, item: `${config.site.url}/${article.category}/${article.slug}/` }
    ]
  };
}

function generateArticleSchema(article) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.excerpt,
    image: article.ogImage || config.seo.default_image,
    datePublished: article.date || new Date().toISOString(),
    dateModified: article.updated || article.date || new Date().toISOString(),
    author: {
      '@type': 'Organization',
      name: config.site.author,
      url: config.site.url
    },
    publisher: {
      '@type': 'Organization',
      name: config.site.name,
      logo: { '@type': 'ImageObject', url: config.seo.schema.organization.logo }
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${config.site.url}/${article.category}/${article.slug}/` }
  };
}

function generateProductSchema(product, article) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.shortDesc,
    image: product.image,
    brand: { '@type': 'Brand', name: product.brand },
    offers: {
      '@type': 'Offer',
      url: product.affiliateUrl,
      priceCurrency: 'USD',
      price: product.price,
      availability: product.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: { '@type': 'Organization', name: 'Amazon' }
    },
    aggregateRating: product.rating ? {
      '@type': 'AggregateRating',
      ratingValue: product.rating,
      reviewCount: product.reviewCount
    } : undefined
  };
}

function generateReviewSchema(article, products) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Review',
    itemReviewed: {
      '@type': 'ItemList',
      itemListElement: products.map((p, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: { '@type': 'Product', name: p.name }
      }))
    },
    reviewRating: {
      '@type': 'Rating',
      ratingValue: '4.5',
      bestRating: '5',
      worstRating: '1'
    },
    author: { '@type': 'Organization', name: config.site.author },
    datePublished: article.date || new Date().toISOString()
  };
}

function generateFAQSchema(faqs) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer }
    }))
  };
}

function generateHowToSchema(steps) {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: steps.title || 'How to Choose',
    step: steps.items.map((item, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      name: item.title,
      text: item.description,
      image: item.image
    }))
  };
}

// ========================================
// AFFILIATE LINK GENERATOR
// ========================================

function buildAffiliateUrl(asin, country = 'US') {
  const tag = config.associates.onelink.countries.find(c => c.code === country)?.tag || config.associates.tag;
  const domain = config.associates.onelink.countries.find(c => c.code === country)?.domain || 'amazon.com';
  return `https://www.${domain}/dp/${asin}?tag=${tag}&linkCode=ogi&th=1&psc=1`;
}

function buildGeniuslinkUrl(asin) {
  if (!config.geniuslink.enabled) return null;
  return `https://geni.us/${asin}`; // Placeholder
}

// ========================================
// RENDER FUNCTIONS
// ========================================

function renderTemplate(templateName, context) {
  try {
    return env.render(templateName, context);
  } catch (err) {
    console.error(`[Render Error] ${templateName}:`, err.message);
    throw err;
  }
}

function writeFile(filepath, content) {
  ensureDir(path.dirname(filepath));
  fs.writeFileSync(filepath, content);
}

function copyAssets() {
  console.log('[Build] Copying assets...');
  const srcAssets = path.join(ASSETS_DIR);
  const destAssets = path.join(OUTPUT_DIR, 'assets');

  function copyRecursive(src, dest) {
    ensureDir(dest);
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      if (entry.isDirectory()) {
        copyRecursive(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }

  if (fs.existsSync(srcAssets)) {
    copyRecursive(srcAssets, destAssets);
  }
}

// ========================================
// PAGE BUILDERS
// ========================================

function buildHomePage(articles) {
  console.log('[Build] Building home page...');

  const categories = config.content.categories.map(cat => {
    const catArticles = articles.filter(a => a.category === cat.id);
    return { ...cat, articleCount: catArticles.length, latestArticles: catArticles.slice(0, 3) };
  });

  const featuredArticles = articles
    .filter(a => a.featured)
    .slice(0, 6);

  const html = renderTemplate('index.njk', {
    page: { title: config.site.name, description: config.site.description },
    categories,
    featuredArticles,
    recentArticles: articles.slice(0, 10),
    schema: {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: config.site.name,
      url: config.site.url,
      potentialAction: {
        '@type': 'SearchAction',
        target: { '@type': 'EntryPoint', urlTemplate: `${config.site.url}/search?q={search_term_string}` },
        'query-input': 'required name=search_term_string'
      }
    }
  });

  writeFile(path.join(OUTPUT_DIR, 'index.html'), html);
}

function buildCategoryPages(articles) {
  console.log('[Build] Building category pages...');

  for (const cat of config.content.categories) {
    const catArticles = articles.filter(a => a.category === cat.id);
    if (catArticles.length === 0) continue;

    // Main category page
    const html = renderTemplate('category.njk', {
      page: { title: cat.name, description: cat.description },
      category: cat,
      articles: catArticles,
      schema: {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: cat.name,
        description: cat.description
      }
    });

    writeFile(path.join(OUTPUT_DIR, cat.id, 'index.html'), html);
  }
}

function buildArticlePages(articles) {
  console.log('[Build] Building article pages...');

  for (const article of articles) {
    const articleData = getArticleData(article.slug);
    if (!articleData) {
      console.warn(`[Build] No article data for ${article.slug}, skipping`);
      continue;
    }

    // Merge article config with data
    const fullArticle = {
      ...article,
      ...articleData,
      categoryName: config.content.categories.find(c => c.id === article.category)?.name || article.category,
      url: `${config.site.url}/${article.category}/${article.slug}/`,
      canonicalUrl: `${config.site.url}/${article.category}/${article.slug}/`,
      ogImage: articleData.ogImage || config.seo.default_image,
      twitterCard: 'summary_large_image'
    };

    // Build product objects with affiliate URLs
    const products = (articleData.products || []).map(p => ({
      ...p,
      affiliateUrl: buildAffiliateUrl(p.asin),
      geniuslinkUrl: buildGeniuslinkUrl(p.asin),
      priceDisplay: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(p.price)
    }));

    // Generate schemas
    const schemas = [
      generateBreadcrumbSchema(fullArticle),
      generateArticleSchema(fullArticle)
    ];

    if (products.length > 0) {
      schemas.push(generateReviewSchema(fullArticle, products));
      products.forEach(p => schemas.push(generateProductSchema(p, fullArticle)));
    }

    if (articleData.faqs?.length) {
      schemas.push(generateFAQSchema(articleData.faqs));
    }

    if (articleData.howTo) {
      schemas.push(generateHowToSchema(articleData.howTo));
    }

    const html = renderTemplate('article.njk', {
      page: { title: fullArticle.title, description: fullArticle.excerpt },
      article: fullArticle,
      products,
      schemas,
      relatedArticles: getRelatedArticles(article.slug, article.category)
    });

    const outputPath = path.join(OUTPUT_DIR, article.category, article.slug, 'index.html');
    writeFile(outputPath, html);
  }
}

function buildSitemap(articles) {
  console.log('[Build] Building sitemap...');

  const urls = [
    { url: config.site.url, changefreq: 'daily', priority: 1.0 },
    ...config.content.categories.map(cat => ({
      url: `${config.site.url}/${cat.id}/`,
      changefreq: 'weekly',
      priority: 0.8
    })),
    ...articles.map(a => ({
      url: `${config.site.url}/${a.category}/${a.slug}/`,
      changefreq: 'weekly',
      priority: 0.7
    }))
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${u.url}</loc>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  writeFile(path.join(OUTPUT_DIR, 'sitemap.xml'), xml);
}

function buildRobotsTxt() {
  console.log('[Build] Building robots.txt...');

  const content = `User-agent: *
Allow: /

Sitemap: ${config.site.url}/sitemap.xml

# Crawl-delay for polite crawling
Crawl-delay: 10`;

  writeFile(path.join(OUTPUT_DIR, 'robots.txt'), content);
}

// ========================================
// MAIN BUILD
// ========================================

async function build() {
  const startTime = Date.now();

  try {
    // Clean output
    if (config.build.clean_output && fs.existsSync(OUTPUT_DIR)) {
      fs.rmSync(OUTPUT_DIR, { recursive: true });
    }

    // Load all articles
    const articles = getAllArticles();
    console.log(`[Build] Loaded ${articles.length} articles`);

    // Build pages
    buildHomePage(articles);
    buildCategoryPages(articles);
    buildArticlePages(articles);
    buildSitemap(articles);
    buildRobotsTxt();

    // Copy assets
    copyAssets();

    // Create .nojekyll for GitHub Pages
    writeFile(path.join(OUTPUT_DIR, '.nojekyll'), '');

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n[Build] Complete in ${duration}s`);
    console.log(`[Build] Output: ${OUTPUT_DIR}`);
    console.log(`[Build] Articles: ${articles.length}`);
    console.log(`[Build] Categories: ${config.content.categories.length}`);

  } catch (err) {
    console.error('[Build] Failed:', err);
    process.exit(1);
  }
}

build();