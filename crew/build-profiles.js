// Static site generator for crew profile pages.
// Run with: node build-profiles.js
// Reads every JSON file in /data, injects it into template.html,
// and writes a static /crew/profile/{slug}/index.html for each person.
// Re-run this any time a JSON file changes.

const fs = require('fs');
const path = require('path');

// Load env variables
if (fs.existsSync('.env')) {
  process.loadEnvFile('.env');
}

const SITE_NAME = process.env.SITE_NAME || 'SITE_NAME';
const SITE_URL = process.env.SITE_URL || 'SITE_URL';

const CREW_BASE_URL = `${SITE_URL}/crew`;
const PROFILE_BASE_URL = `${CREW_BASE_URL}/profile`;

const DATA_DIR = path.join(__dirname, 'data');
const TEMPLATE_PATH = path.join(__dirname, 'template.html');
const OUT_ROOT = path.join(__dirname, 'profile');
const PROJECT_ROOT = path.dirname(__dirname);

const PLATFORM_LABELS = {
  instagram: 'Instagram',
  x: 'X',
  youtube: 'YouTube',
  linkedin: 'LinkedIn',
  website: 'Website',
};

// One generic external-link icon reused for every platform.
const LINK_ICON =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function firstSentence(bio) {
  const match = bio.match(/^.*?[.!?](\s|$)/);
  return (match ? match[0] : bio).trim();
}

function buildSocialLinksHtml(social) {
  const keys = Object.keys(social || {});
  if (keys.length === 0) return '<p class="identity__bio" style="margin:0;">TODO: add social links.</p>';
  return keys
    .map((key, i) => {
      const label = PLATFORM_LABELS[key] || key.charAt(0).toUpperCase() + key.slice(1);
      const url = social[key];
      const divider = i < keys.length - 1 ? '<span class="social__divider" aria-hidden="true">/</span>' : '';
      return `<a class="social__link" href="${url}" target="_blank" rel="noopener noreferrer">${LINK_ICON}${label}</a>${divider}`;
    })
    .join('\n        ');
}

function main() {
  const template = fs.readFileSync(TEMPLATE_PATH, 'utf8');
  const files = fs.readdirSync(DATA_DIR).filter((f) => f.endsWith('.json'));

  if (files.length === 0) {
    console.log('No JSON files found in /data. Add one per person and re-run.');
    return;
  }

  files.forEach((file, index) => {
    const person = JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), 'utf8'));
    person.photo = person.photo.startsWith('http') ?
      person.photo : `${CREW_BASE_URL}/${person.photo}`;
    const canonicalUrl = `${PROFILE_BASE_URL}/${person.slug}/`;
    const metaDescription = escapeHtml(firstSentence(person.bio));
    const sameAs = JSON.stringify(Object.values(person.social || {}));
    const keycode = `KC-${String(index + 1).padStart(3, '0')}`;

    const html = template
      .replaceAll('{{NAME}}', escapeHtml(person.name))
      .replaceAll('{{ROLE}}', escapeHtml(person.role))
      .replaceAll('{{BIO}}', escapeHtml(person.bio))
      .replaceAll('{{PHOTO_ABSOLUTE}}', person.photo)
      .replaceAll('{{PHOTO}}', person.photo)
      .replaceAll('{{META_DESCRIPTION}}', metaDescription)
      .replaceAll('{{CANONICAL_URL}}', canonicalUrl)
      .replaceAll('{{SITE_NAME}}', SITE_NAME)
      .replaceAll('{{SITE_URL}}', SITE_URL)
      .replaceAll('{{CREW_BASE_URL}}', CREW_BASE_URL)
      .replaceAll('{{KEYCODE}}', keycode)
      .replaceAll('{{SAME_AS_JSON}}', sameAs)
      .replaceAll('{{SOCIAL_LINKS_HTML}}', buildSocialLinksHtml(person.social));

    const outDir = path.join(OUT_ROOT, person.slug);
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, 'index.html'), html, 'utf8');

    console.log(`Built ${person.slug}/index.html`);
  });

  console.log(`\nDone.`);
}

main();
