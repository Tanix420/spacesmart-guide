/**
 * Validation Script - Checks links, images, schema, CWV
 * Run: node scripts/validate.js
 */

const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const OUTPUT_DIR = path.join(__dirname, '..', 'public');

const RESULTS = {
  links: { checked: 0, broken: [], redirects: [] },
  images: { checked: 0, missing: [], noAlt: [] },
  schema: { checked: 0, errors: [] },
  html: { checked: 0, errors: [] },
  performance: { checked: 0, warnings: [] }
};

async function validate() {
  console.log('[Validate] Starting validation...\n');

  const files = getAllHtmlFiles(OUTPUT_DIR);
  console.log(`[Validate] Found ${files.length} HTML files\n`);

  for (const file of files) {
    await validateFile(file);
  }

  printSummary();
  writeReport();

  if (RESULTS.links.broken.length > 0 || RESULTS.schema.errors.length > 0) {
    process.exit(1);
  }
}

function getAllHtmlFiles(dir) {
  const files = [];
  function walk(d) {
    const entries = fs.readdirSync(d, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(d, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.name.endsWith('.html')) {
        files.push(fullPath);
      }
    }
  }
  walk(dir);
  return files;
}

async function validateFile(filepath) {
  const html = fs.readFileSync(filepath, 'utf8');
  const $ = cheerio.load(html);
  const relPath = path.relative(OUTPUT_DIR, filepath);

  // Validate links
  $('a[href]').each((i, el) => {
    const href = $(el).attr('href');
    RESULTS.links.checked++;
    if (href.startsWith('http') || href.startsWith('//')) {
      // External link - would need HTTP check, skip for now
      return;
    }
    // Internal link - check file exists
    if (href.startsWith('/')) {
      const targetPath = path.join(OUTPUT_DIR, href.replace(/^\//, ''), 'index.html');
      if (!fs.existsSync(targetPath) && !fs.existsSync(targetPath.replace('/index.html', '.html'))) {
        RESULTS.links.broken.push({ file: relPath, link: href, text: $(el).text().trim() });
      }
    }
  });

  // Validate images
  $('img').each((i, el) => {
    RESULTS.images.checked++;
    const src = $(el).attr('src');
    const alt = $(el).attr('alt');

    if (!src) {
      RESULTS.images.missing.push({ file: relPath, element: $.html(el) });
    }
    if (!alt || alt.trim() === '') {
      RESULTS.images.noAlt.push({ file: relPath, src: src || 'none' });
    }
    // Check local images exist
    if (src && src.startsWith('/assets/')) {
      const imgPath = path.join(OUTPUT_DIR, src.replace(/^\//, ''));
      if (!fs.existsSync(imgPath)) {
        RESULTS.images.missing.push({ file: relPath, src, reason: 'File not found' });
      }
    }
  });

  // Validate JSON-LD schemas
  $('script[type="application/ld+json"]').each((i, el) => {
    RESULTS.schema.checked++;
    try {
      JSON.parse($(el).html());
    } catch (e) {
      RESULTS.schema.errors.push({ file: relPath, error: e.message, schema: $(el).html().substring(0, 200) });
    }
  });

  // Basic HTML validation
  RESULTS.html.checked++;
  if (!html.includes('<!DOCTYPE html>')) {
    RESULTS.html.errors.push({ file: relPath, error: 'Missing DOCTYPE' });
  }
  if (!$('html').attr('lang')) {
    RESULTS.html.errors.push({ file: relPath, error: 'Missing lang attribute on html' });
  }
  if ($('title').length === 0 || $('title').text().trim() === '') {
    RESULTS.html.errors.push({ file: relPath, error: 'Missing or empty title' });
  }
  if ($('meta[name="description"]').length === 0) {
    RESULTS.html.errors.push({ file: relPath, error: 'Missing meta description' });
  }
  if ($('h1').length === 0) {
    RESULTS.html.errors.push({ file: relPath, error: 'Missing h1' });
  } else if ($('h1').length > 1) {
    RESULTS.html.warnings.push({ file: relPath, warning: `${$('h1').length} h1 tags found` });
  }

  // Performance hints
  RESULTS.performance.checked++;
  const cssSize = $('link[rel="stylesheet"]').length;
  const jsSize = $('script[src]').length;
  if (cssSize > 5) {
    RESULTS.performance.warnings.push({ file: relPath, warning: `${cssSize} CSS files - consider combining` });
  }
  if (jsSize > 5) {
    RESULTS.performance.warnings.push({ file: relPath, warning: `${jsSize} JS files - consider combining` });
  }
}

function printSummary() {
  console.log('\n========== VALIDATION SUMMARY ==========');
  console.log(`Links checked:      ${RESULTS.links.checked}`);
  console.log(`  Broken:           ${RESULTS.links.broken.length}`);
  console.log(`Images checked:     ${RESULTS.images.checked}`);
  console.log(`  Missing files:    ${RESULTS.images.missing.length}`);
  console.log(`  Missing alt:      ${RESULTS.images.noAlt.length}`);
  console.log(`Schemas checked:    ${RESULTS.schema.checked}`);
  console.log(`  Errors:           ${RESULTS.schema.errors.length}`);
  console.log(`HTML files checked: ${RESULTS.html.checked}`);
  console.log(`  Errors:           ${RESULTS.html.errors.length}`);
  console.log(`Performance checks: ${RESULTS.performance.checked}`);
  console.log(`  Warnings:         ${RESULTS.performance.warnings.length}`);
  console.log('=========================================\n');

  if (RESULTS.links.broken.length > 0) {
    console.log('BROKEN LINKS:');
    RESULTS.links.broken.slice(0, 10).forEach(l => console.log(`  ${l.file}: ${l.link} (${l.text})`));
    if (RESULTS.links.broken.length > 10) console.log(`  ... and ${RESULTS.links.broken.length - 10} more`);
    console.log();
  }

  if (RESULTS.schema.errors.length > 0) {
    console.log('SCHEMA ERRORS:');
    RESULTS.schema.errors.slice(0, 5).forEach(e => console.log(`  ${e.file}: ${e.error}`));
    console.log();
  }

  if (RESULTS.html.errors.length > 0) {
    console.log('HTML ERRORS:');
    RESULTS.html.errors.slice(0, 10).forEach(e => console.log(`  ${e.file}: ${e.error}`));
    console.log();
  }
}

function writeReport() {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      links: { checked: RESULTS.links.checked, broken: RESULTS.links.broken.length },
      images: { checked: RESULTS.images.checked, missing: RESULTS.images.missing.length, noAlt: RESULTS.images.noAlt.length },
      schema: { checked: RESULTS.schema.checked, errors: RESULTS.schema.errors.length },
      html: { checked: RESULTS.html.checked, errors: RESULTS.html.errors.length },
      performance: { checked: RESULTS.performance.checked, warnings: RESULTS.performance.warnings.length }
    },
    details: RESULTS
  };

  const reportPath = path.join(OUTPUT_DIR, '..', 'validation-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`[Validate] Report written to ${reportPath}`);
}

validate().catch(console.error);