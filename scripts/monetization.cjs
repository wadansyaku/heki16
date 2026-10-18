const assert = require('node:assert/strict');
const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const PLACEMENTS = new Set(['home', 'result', 'content']);

function validateMonetization(config, now = Date.now()) {
  assert.equal(typeof config.enabled, 'boolean');
  assert.equal(typeof config.siteApproved, 'boolean');
  assert.ok(Array.isArray(config.allowedHosts) && Array.isArray(config.campaigns));
  if (!config.enabled) return [];
  assert.equal(config.siteApproved, true, 'Confirm this site is approved by the advertising partner before activation');
  assert.ok(config.campaigns.length > 0 && config.campaigns.length <= 6);
  const ids = new Set();
  return config.campaigns.filter(item => item.enabled !== false).map(item => {
    assert.match(item.id, /^[a-z0-9-]{1,48}$/);
    assert.ok(!ids.has(item.id), 'Campaign IDs must be unique');
    ids.add(item.id);
    for (const field of ['title', 'description', 'merchant']) {
      assert.ok(typeof item[field] === 'string' && item[field].trim().length > 0 && item[field].length <= 240);
    }
    const url = new URL(item.url);
    assert.equal(url.protocol, 'https:');
    assert.ok(!url.username && !url.password && !url.hash);
    assert.ok(config.allowedHosts.includes(url.hostname), 'Every outbound host needs an exact allowlist entry');
    assert.ok(!/^(?:localhost|127\.|0\.|\[|.*\.local$)/i.test(url.hostname));
    assert.ok(item.placements?.length && item.placements.every(p => PLACEMENTS.has(p)), 'Advertising is never allowed in the quiz');
    assert.ok(typeof item.expiresAt === 'string' && Number.isFinite(Date.parse(item.expiresAt)), 'Set the end date agreed with the partner');
    for (const key of url.searchParams.keys()) {
      assert.ok(!/^(partner|name|nickname|answers|scores|diagnosis|result|heki16_.*)$/i.test(key), 'Never append diagnostic or personal data to advertising links');
    }
    return {...item, url: url.href};
  }).filter(item => Date.parse(item.expiresAt) > now);
}

function renderAffiliateSection(campaigns, placement) {
  const items = campaigns.filter(item => item.placements.includes(placement)).slice(0, 3);
  if (!items.length) return '';
  return `<aside class="affiliate-section" aria-label="広告・PR"><p class="affiliate-label">広告・PR</p><p>リンク先で購入・申込みがあると、運営者に報酬が入る場合があります。広告は診断結果に影響しません。</p><div class="affiliate-grid">${items.map(item => `<article><p class="affiliate-label">PR · ${escapeHtml(item.merchant)}</p><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.description)}</p><a href="${escapeHtml(item.url)}" target="_blank" rel="sponsored noopener noreferrer" referrerpolicy="no-referrer">提供元で詳細を見る <span aria-hidden="true">↗</span></a></article>`).join('')}</div><a href="/advertising/">広告掲載方針</a></aside>`;
}

const affiliateCss = `.affiliate-section{margin:2rem 0;padding:1.25rem;border:1px solid #a855f740;border-radius:1.25rem;background:#131024;color:#ddd6fe;font-size:.875rem;line-height:1.8}.affiliate-label{font-size:.75rem;font-weight:800;color:#f9a8d4;letter-spacing:.06em}.affiliate-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,15rem),1fr));gap:1rem;margin:1rem 0}.affiliate-grid article{padding:1rem;border:1px solid #ffffff20;border-radius:1rem;background:#ffffff04}.affiliate-grid h3{font-weight:800}.affiliate-section a{color:#f9a8d4;text-decoration:underline;text-underline-offset:3px}.affiliate-section a:focus-visible{outline:2px solid #f9a8d4;outline-offset:4px}`;

module.exports = {escapeHtml, validateMonetization, renderAffiliateSection, affiliateCss};
