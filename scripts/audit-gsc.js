/**
 * GSC Audit Script - Monthly Google Search Console Analysis
 * Run: node scripts/audit-gsc.js
 * 
 * Requires: GA4_ID, SEARCH_CONSOLE_ID, GSC_API_KEY (via env vars)
 * Or: Use OAuth2 with service account for full API access
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const OUTPUT_DIR = path.join(__dirname, '..', 'public');
const REPORT_DIR = path.join(__dirname, '..', 'reports');

const GA4_ID = process.env.GA4_ID || '';
const SEARCH_CONSOLE_ID = process.env.SEARCH_CONSOLE_ID || '';
const GSC_CREDENTIALS = process.env.GSC_CREDENTIALS || ''; // JSON string of service account
const SITE_URL = 'https://spacesmart-guide.com';

async function audit() {
  console.log('[GSC Audit] Starting monthly audit...\n');

  const results = {
    timestamp: new Date().toISOString(),
    site: SITE_URL,
    traffic: { pages: [], queries: [], countries: [], devices: [] },
    issues: { drops: [], newKeywords: [], lostKeywords: [], errors: [] },
    recommendations: []
  };

  // Try to fetch real GSC data if credentials available
  if (GSC_CREDENTIALS) {
    try {
      await fetchGSCData(results);
    } catch (err) {
      console.warn('[GSC Audit] Failed to fetch live data:', err.message);
      console.log('[GSC Audit] Falling back to local analysis...\n');
      await analyzeLocalBuild(results);
    }
  } else {
    console.log('[GSC Audit] No GSC credentials found. Running local analysis only.\n');
    console.log('To enable live GSC data, set GSC_CREDENTIALS env var with service account JSON.\n');
    await analyzeLocalBuild(results);
  }

  // Generate report
  generateReport(results);
  printSummary(results);

  // Exit with error code if issues found
  if (results.issues.drops.length > 0 || results.issues.errors.length > 0) {
    process.exit(1);
  }
}

async function fetchGSCData(results) {
  const credentials = JSON.parse(GSC_CREDENTIALS);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/webmasters.readonly']
  });

  const webmasters = google.webmasters({ version: 'v3', auth });
  const siteUrl = `sc-domain:${new URL(SITE_URL).hostname}`;

  // Date range: last 28 days vs previous 28 days
  const endDate = new Date();
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - 28);
  const prevEndDate = new Date(startDate);
  prevEndDate.setDate(prevEndDate.getDate() - 1);
  const prevStartDate = new Date(prevEndDate);
  prevStartDate.setDate(prevStartDate.getDate() - 28);

  const formatDate = d => d.toISOString().split('T')[0];

  console.log(`[GSC Audit] Fetching data for ${formatDate(startDate)} to ${formatDate(endDate)}...`);

  // Current period
  const [currentPages, currentQueries, currentCountries, currentDevices] = await Promise.all([
    queryGSC(webmasters, siteUrl, formatDate(startDate), formatDate(endDate), 'page'),
    queryGSC(webmasters, siteUrl, formatDate(startDate), formatDate(endDate), 'query'),
    queryGSC(webmasters, siteUrl, formatDate(startDate), formatDate(endDate), 'country'),
    queryGSC(webmasters, siteUrl, formatDate(startDate), formatDate(endDate), 'device')
  ]);

  // Previous period
  const [prevPages, prevQueries] = await Promise.all([
    queryGSC(webmasters, siteUrl, formatDate(prevStartDate), formatDate(prevEndDate), 'page'),
    queryGSC(webmasters, siteUrl, formatDate(prevStartDate), formatDate(prevEndDate), 'query')
  ]);

  results.traffic.pages = currentPages;
  results.traffic.queries = currentQueries;
  results.traffic.countries = currentCountries;
  results.traffic.devices = currentDevices;

  // Detect traffic drops
  detectTrafficDrops(currentPages, prevPages, results);
  detectKeywordChanges(currentQueries, prevQueries, results);
  detectNewKeywords(currentQueries, prevQueries, results);
}

function queryGSC(webmasters, siteUrl, startDate, endDate, dimension) {
  return new Promise((resolve, reject) => {
    webmasters.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate,
        endDate,
        dimensions: [dimension],
        rowLimit: 1000,
        startRow: 0
      }
    }, (err, res) => {
      if (err) return reject(err);
      resolve((res.data.rows || []).map(row => ({
        key: row.keys[0],
        clicks: row.clicks,
        impressions: row.impressions,
        ctr: row.ctr,
        position: row.position
      })));
    });
  });
}

function detectTrafficDrops(current, previous, results) {
  const prevMap = new Map(previous.map(p => [p.key, p.clicks]));

  for (const page of current) {
    const prevClicks = prevMap.get(page.key) || 0;
    const drop = prevClicks - page.clicks;
    const dropPct = prevClicks > 0 ? (drop / prevClicks * 100).toFixed(1) : 0;

    if (dropPct > 30 && drop > 10) {
      results.issues.drops.push({
        url: page.key,
        currentClicks: page.clicks,
        previousClicks: prevClicks,
        drop: drop,
        dropPct: `${dropPct}%`,
        severity: dropPct > 50 ? 'high' : 'medium'
      });
    }
  }

  results.issues.drops.sort((a, b) => b.drop - a.drop);
}

function detectKeywordChanges(current, previous, results) {
  const prevMap = new Map(previous.map(p => [p.key, { clicks: p.clicks, position: p.position }]));

  for (const query of current) {
    const prev = prevMap.get(query.key);
    if (!prev) continue;

    const posChange = query.position - prev.position;
    const clickChange = query.clicks - prev.clicks;

    if (posChange > 3 && clickChange < -5) {
      results.issues.lostKeywords.push({
        query: query.key,
        currentPosition: query.position.toFixed(1),
        previousPosition: prev.position.toFixed(1),
        positionChange: posChange.toFixed(1),
        clickChange: clickChange,
        currentClicks: query.clicks
      });
    }
  }

  results.issues.lostKeywords.sort((a, b) => b.positionChange - a.positionChange);
}

function detectNewKeywords(current, previous, results) {
  const prevKeys = new Set(previous.map(p => p.key));

  for (const query of current) {
    if (!prevKeys.has(query.key) && query.clicks > 5) {
      results.issues.newKeywords.push({
        query: query.key,
        clicks: query.clicks,
        impressions: query.impressions,
        position: query.position.toFixed(1),
        ctr: (query.ctr * 100).toFixed(1) + '%'
      });
    }
  }

  results.issues.newKeywords.sort((a, b) => b.clicks - a.clicks);
}

async function analyzeLocalBuild(results) {
  console.log('[GSC Audit] Analyzing local build for SEO health...\n');

  // Check sitemap
  const sitemapPath = path.join(OUTPUT_DIR, 'sitemap.xml');
  if (fs.existsSync(sitemapPath)) {
    const sitemap = fs.readFileSync(sitemapPath, 'utf8');
    const urlCount = (sitemap.match(/<url>/g) || []).length;
    console.log(`  Sitemap: ${urlCount} URLs`);
    if (urlCount < 10) {
      results.issues.errors.push({ type: 'sitemap', message: 'Very few URLs in sitemap' });
    }
  } else {
    results.issues.errors.push({ type: 'sitemap', message: 'sitemap.xml not found' });
  }

  // Check robots.txt
  const robotsPath = path.join(OUTPUT_DIR, 'robots.txt');
  if (fs.existsSync(robotsPath)) {
    const robots = fs.readFileSync(robotsPath, 'utf8');
    if (!robots.includes('Sitemap:')) {
      results.issues.errors.push({ type: 'robots', message: 'Sitemap not referenced in robots.txt' });
    }
  } else {
    results.issues.errors.push({ type: 'robots', message: 'robots.txt not found' });
  }

  // Analyze article pages
  const articleDirs = fs.readdirSync(OUTPUT_DIR).filter(d => {
    const full = path.join(OUTPUT_DIR, d);
    return fs.statSync(full).isDirectory() && d !== 'assets';
  });

  for (const cat of articleDirs) {
    const catPath = path.join(OUTPUT_DIR, cat);
    const articles = fs.readdirSync(catPath).filter(d => fs.statSync(path.join(catPath, d)).isDirectory());

    for (const article of articles) {
      const indexPath = path.join(catPath, article, 'index.html');
      if (!fs.existsSync(indexPath)) continue;

      const html = fs.readFileSync(indexPath, 'utf8');
      analyzeArticle(html, `/${cat}/${article}/`, results);
    }
  }

  // Generate recommendations
  generateRecommendations(results);
}

function analyzeArticle(html, url, results) {
  const issues = [];

  // Check title
  const titleMatch = html.match(/<title>([^<]+)<\/title>/);
  if (!titleMatch || titleMatch[1].length < 30 || titleMatch[1].length > 60) {
    issues.push({ type: 'title', message: `Title length: ${titleMatch ? titleMatch[1].length : 0} chars (optimal: 30-60)`, url });
  }

  // Check meta description
  const descMatch = html.match(/<meta name="description" content="([^"]*)"/);
  if (!descMatch || descMatch[1].length < 120 || descMatch[1].length > 160) {
    issues.push({ type: 'description', message: `Meta description length: ${descMatch ? descMatch[1].length : 0} chars (optimal: 120-160)`, url });
  }

  // Check h1
  const h1Matches = html.match(/<h1[^>]*>([^<]+)<\/h1>/g);
  if (!h1Matches || h1Matches.length !== 1) {
    issues.push({ type: 'h1', message: `H1 count: ${h1Matches ? h1Matches.length : 0} (should be 1)`, url });
  }

  // Check JSON-LD
  const schemaMatches = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g);
  if (!schemaMatches || schemaMatches.length < 2) {
    issues.push({ type: 'schema', message: `JSON-LD schemas: ${schemaMatches ? schemaMatches.length : 0} (recommend 3+)`, url });
  }

  // Check images
  const imgMatches = html.match(/<img[^>]*>/g);
  if (imgMatches) {
    const noAlt = imgMatches.filter(img => !img.includes('alt=')).length;
    if (noAlt > 0) {
      issues.push({ type: 'images', message: `${noAlt} images missing alt text`, url });
    }
  }

  // Check word count
  const textContent = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const wordCount = textContent.split(' ').length;
  if (wordCount < 1000) {
    issues.push({ type: 'content', message: `Low word count: ${wordCount} (recommend 1500+)`, url });
  }

  results.issues.errors.push(...issues);
}

function generateRecommendations(results) {
  const recs = [];

  if (results.issues.drops.length > 0) {
    recs.push({
      priority: 'high',
      title: 'Investigate Traffic Drops',
      action: `${results.issues.drops.length} pages with >30% traffic drop. Check for: content freshness, technical issues, competitor content, algorithm updates.`
    });
  }

  if (results.issues.lostKeywords.length > 0) {
    recs.push({
      priority: 'high',
      title: 'Recover Lost Keyword Positions',
      action: `${results.issues.lostKeywords.length} keywords dropped >3 positions. Update content, improve internal linking, check for technical issues.`
    });
  }

  if (results.issues.newKeywords.length > 0) {
    recs.push({
      priority: 'medium',
      title: 'Capitalize on New Keywords',
      action: `${results.issues.newKeywords.length} new ranking keywords. Create supporting content, optimize existing pages, build internal links.`
    });
  }

  const titleIssues = results.issues.errors.filter(e => e.type === 'title').length;
  if (titleIssues > 0) {
    recs.push({
      priority: 'medium',
      title: 'Optimize Title Tags',
      action: `${titleIssues} pages have suboptimal title length. Rewrite to 30-60 chars with target keyword near start.`
    });
  }

  const descIssues = results.issues.errors.filter(e => e.type === 'description').length;
  if (descIssues > 0) {
    recs.push({
      priority: 'medium',
      title: 'Fix Meta Descriptions',
      action: `${descIssues} pages have missing or suboptimal meta descriptions. Write compelling 120-160 char summaries.`
    });
  }

  const schemaIssues = results.issues.errors.filter(e => e.type === 'schema').length;
  if (schemaIssues > 0) {
    recs.push({
      priority: 'medium',
      title: 'Add JSON-LD Schemas',
      action: `${schemaIssues} pages missing recommended schemas. Add Article, Product, FAQ, Breadcrumb, Review schemas.`
    });
  }

  const contentIssues = results.issues.errors.filter(e => e.type === 'content').length;
  if (contentIssues > 0) {
    recs.push({
      priority: 'low',
      title: 'Expand Thin Content',
      action: `${contentIssues} pages under 1000 words. Add buying guides, FAQs, comparisons, personal experience sections.`
    });
  }

  if (recs.length === 0) {
    recs.push({
      priority: 'low',
      title: 'Site Health Good',
      action: 'No critical issues found. Continue publishing quality content and monitoring GSC monthly.'
    });
  }

  results.recommendations = recs;
}

function generateReport(results) {
  ensureDir(REPORT_DIR);
  const filename = `gsc-audit-${new Date().toISOString().split('T')[0]}.json`;
  const filepath = path.join(REPORT_DIR, filename);

  fs.writeFileSync(filepath, JSON.stringify(results, null, 2));
  console.log(`\n[GSC Audit] Report saved to: ${filepath}`);

  // Also create human-readable markdown
  const mdPath = filepath.replace('.json', '.md');
  fs.writeFileSync(mdPath, generateMarkdownReport(results));
  console.log(`[GSC Audit] Markdown report: ${mdPath}`);
}

function generateMarkdownReport(r) {
  const date = new Date(r.timestamp).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  let md = `# GSC Audit Report — ${date}\n\n`;
  md += `**Site:** ${r.site}\n`;
  md += `**Generated:** ${r.timestamp}\n\n`;

  if (r.traffic.pages.length > 0) {
    md += `## Traffic Overview (Last 28 Days)\n\n`;
    md += `| Metric | Value |\n|--------|-------|\n`;
    const totalClicks = r.traffic.pages.reduce((sum, p) => sum + p.clicks, 0);
    const totalImpressions = r.traffic.pages.reduce((sum, p) => sum + p.impressions, 0);
    const avgCtr = totalImpressions > 0 ? (totalClicks / totalImpressions * 100).toFixed(2) : 0;
    const avgPos = r.traffic.pages.length > 0
      ? (r.traffic.pages.reduce((sum, p) => sum + p.position, 0) / r.traffic.pages.length).toFixed(1)
      : 0;
    md += `| Total Clicks | ${totalClicks} |\n`;
    md += `| Total Impressions | ${totalImpressions} |\n`;
    md += `| Avg CTR | ${avgCtr}% |\n`;
    md += `| Avg Position | ${avgPos} |\n`;
    md += `| Pages with Traffic | ${r.traffic.pages.length} |\n`;
    md += `| Queries Tracked | ${r.traffic.queries.length} |\n\n`;
  }

  if (r.issues.drops.length > 0) {
    md += `## ⚠️ Traffic Drops (${r.issues.drops.length})\n\n`;
    md += `| URL | Current | Previous | Drop | Drop % | Severity |\n|-----|---------|----------|------|--------|----------|\n`;
    for (const d of r.issues.drops.slice(0, 20)) {
      md += `| ${d.url} | ${d.currentClicks} | ${d.previousClicks} | ${d.drop} | ${d.dropPct} | ${d.severity} |\n`;
    }
    md += '\n';
  }

  if (r.issues.lostKeywords.length > 0) {
    md += `## 📉 Lost Keyword Positions (${r.issues.lostKeywords.length})\n\n`;
    md += `| Query | Current Pos | Prev Pos | Change | Clicks |\n|-------|-------------|----------|--------|--------|\n`;
    for (const k of r.issues.lostKeywords.slice(0, 20)) {
      md += `| ${k.query} | ${k.currentPosition} | ${k.previousPosition} | +${k.positionChange} | ${k.currentClicks} |\n`;
    }
    md += '\n';
  }

  if (r.issues.newKeywords.length > 0) {
    md += `## 🆕 New Ranking Keywords (${r.issues.newKeywords.length})\n\n`;
    md += `| Query | Clicks | Impressions | Position | CTR |\n|-------|--------|-------------|----------|-----|\n`;
    for (const k of r.issues.newKeywords.slice(0, 20)) {
      md += `| ${k.query} | ${k.clicks} | ${k.impressions} | ${k.position} | ${k.ctr} |\n`;
    }
    md += '\n';
  }

  if (r.issues.errors.length > 0) {
    md += `## 🔧 Technical Issues (${r.issues.errors.length})\n\n`;
    const byType = {};
    for (const e of r.issues.errors) {
      byType[e.type] = (byType[e.type] || 0) + 1;
    }
    md += `| Issue Type | Count |\n|------------|-------|\n`;
    for (const [type, count] of Object.entries(byType).sort((a, b) => b[1] - a[1])) {
      md += `| ${type} | ${count} |\n`;
    }
    md += '\n';
  }

  if (r.recommendations.length > 0) {
    md += `## 🎯 Recommendations\n\n`;
    for (const rec of r.recommendations) {
      md += `### ${rec.priority.toUpperCase()}: ${rec.title}\n`;
      md += `${rec.action}\n\n`;
    }
  }

  return md;
}

function printSummary(r) {
  console.log('\n========== GSC AUDIT SUMMARY ==========');
  console.log(`Site: ${r.site}`);
  console.log(`Date: ${new Date(r.timestamp).toLocaleDateString()}`);

  if (r.traffic.pages.length > 0) {
    const totalClicks = r.traffic.pages.reduce((sum, p) => sum + p.clicks, 0);
    const totalImpressions = r.traffic.pages.reduce((sum, p) => sum + p.impressions, 0);
    console.log(`Total Clicks: ${totalClicks}`);
    console.log(`Total Impressions: ${totalImpressions}`);
    console.log(`Pages with Traffic: ${r.traffic.pages.length}`);
    console.log(`Queries: ${r.traffic.queries.length}`);
  }

  console.log(`Traffic Drops: ${r.issues.drops.length}`);
  console.log(`Lost Keywords: ${r.issues.lostKeywords.length}`);
  console.log(`New Keywords: ${r.issues.newKeywords.length}`);
  console.log(`Technical Issues: ${r.issues.errors.length}`);
  console.log(`Recommendations: ${r.recommendations.length}`);
  console.log('=========================================\n');

  if (r.recommendations.length > 0) {
    console.log('TOP RECOMMENDATIONS:');
    r.recommendations.slice(0, 3).forEach((rec, i) => {
      console.log(`  ${i + 1}. [${rec.priority.toUpperCase()}] ${rec.title}`);
      console.log(`     → ${rec.action.substring(0, 100)}...`);
    });
  }
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

audit().catch(err => {
  console.error('[GSC Audit] Fatal error:', err);
  process.exit(1);
});