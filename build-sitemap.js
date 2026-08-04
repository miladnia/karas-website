// Sitemap builder
// Run with: node build-sitemap.js
// Recursively scans for directories that include index.html,
// then creates a sitemap.xml file for them.

const fs = require('fs');
const path = require('path');

// Load env variables
if (fs.existsSync('.env')) {
  process.loadEnvFile('.env');
}

const SITE_URL = process.env.SITE_URL || 'SITE_URL';

const CURRENT_DIR = process.cwd();
const SITEMAP_FILENAME = 'sitemap.xml';
const ROBOTS_FILENAME = 'robots.txt';

/**
 * Recursively searches a directory for index.html files.
 * @param {string} dir - Directory to start searching from.
 * @returns {string[]} Array of parent directory paths containing index.html.
 */
function findIndexHtmlDirs(dir) {
  const results = [];

  function walk(currentDir) {
    let entries;
    try {
      entries = fs.readdirSync(currentDir, { withFileTypes: true });
    } catch (err) {
      // Skip directories we can't read (permissions, etc.)
      return;
    }

    let hasIndexHtml = false;

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        // Skip common directories you probably don't want to traverse
        if (entry.name === 'node_modules' || entry.name === '.git') continue;
        walk(fullPath);
      } else if (entry.isFile() && entry.name === 'index.html') {
        hasIndexHtml = true;
      }
    }

    if (hasIndexHtml) {
      results.push(path.resolve(currentDir));
    }
  }

  walk(dir);
  return results;
}

function dirToUrl(dir, rootDir, baseUrl) {
  const relDir = path.relative(rootDir, dir)
    .replaceAll(path.sep, '/');
  const urlPath = relDir ? `/${relDir}/` : '/'
  return baseUrl + urlPath;
}

function createSitemapXML(urls) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url><loc>${url}</loc></url>`).join('\n')}
</urlset>
`;
}

function createRobotsRules(sitemapUrl) {
  return `User-agent: *
Allow: /

Sitemap: ${sitemapUrl}
`;
}

function main() {
  // Find all dirs that contain index.html
  const dirsWithIndexHtml = findIndexHtmlDirs(CURRENT_DIR);

  if (dirsWithIndexHtml.length === 0) {
    console.log('No index.html');
    return;
  }

  // Generate URLs based on the found dirs
  const urls = dirsWithIndexHtml.map(
    dir => dirToUrl(dir, CURRENT_DIR, SITE_URL)
  );

  // Create sitemap.xml
  const sitemapXML = createSitemapXML(urls, SITE_URL);
  fs.writeFileSync(SITEMAP_FILENAME, sitemapXML, 'utf8');

  // Create robots.txt
  const sitemapUrl = `${SITE_URL}/${SITEMAP_FILENAME}`;
  const robotsRules = createRobotsRules(sitemapUrl);
  fs.writeFileSync(ROBOTS_FILENAME, robotsRules, 'utf8');

  console.log(`\nBuilt sitemap.xml with ${dirsWithIndexHtml.length} URLs`);
  console.log(`\nDone.`);
}

main();
