const assert = require('node:assert/strict');
const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const PLACEMENTS = new Set(['post-share']);

function validateMonetization(config, now = Date.now(), knownAffinities = null) {
  assert.equal(typeof config.enabled, 'boolean');
  assert.equal(typeof config.siteApproved, 'boolean');
  assert.ok(Array.isArray(config.allowedHosts) && Array.isArray(config.campaigns));
  if (!config.enabled) return [];
  assert.equal(config.provider, 'myfans');
  assert.equal(config.mediaUrl, 'https://nocturne.ai-yu-me.com/');
  assert.equal(typeof config.personalizationEnabled, 'boolean');
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
    assert.equal(item.creativeApproved, true, 'Obtain approval for the exact displayed copy');
    assert.equal(item.linkVerified, true, 'Use a generated affiliate link for this approved media');
    assert.ok(Number.isFinite(Date.parse(item.reviewedAt)) && Date.parse(item.reviewedAt) <= now, 'Record when approval and link validity were checked');
    assert.ok(Array.isArray(item.affinities) && item.affinities.length <= 8 && item.affinities.every(id => /^[a-zA-Z]{1,32}$/.test(id)), 'Use reviewed preference IDs, never free text or demographics');
    if(knownAffinities)assert.ok(item.affinities.every(id=>knownAffinities.includes(id)), 'Every affinity must exist in the current diagnosis');
    const url = new URL(item.url);
    assert.equal(url.protocol, 'https:');
    assert.ok(!url.username && !url.password && !url.hash);
    assert.ok(config.allowedHosts.includes(url.hostname), 'Every outbound host needs an exact allowlist entry');
    assert.ok(!/^(?:localhost|127\.|0\.|\[|.*\.local$)/i.test(url.hostname));
    assert.ok(item.placements?.length && item.placements.every(p => PLACEMENTS.has(p)), 'Only the optional post-share placement is permitted');
    assert.ok(typeof item.expiresAt === 'string' && Number.isFinite(Date.parse(item.expiresAt)), 'Set a date to recheck approval and link validity');
    for (const key of url.searchParams.keys()) {
      assert.ok(!/(?:partner|name|nickname|answer|score|diagnosis|result|heki16|facet|trait|gender|mood|persona|email|session|account|record|timeframe|sexual|preference|^age$)/i.test(key), 'Never append diagnostic or personal data to advertising links');
    }
    return {id:item.id,title:item.title,description:item.description,merchant:item.merchant,url:url.href,placements:item.placements,expiresAt:item.expiresAt,affinities:config.personalizationEnabled?item.affinities:[]};
  }).filter(item => Date.parse(item.expiresAt) > now);
}

function renderAffiliateSection(campaigns, placement) {
  const items = campaigns.filter(item => item.placements.includes(placement)).slice(0, 3);
  if (!items.length) return '';
  return `<aside class="affiliate-section" aria-label="広告・PR"><p class="affiliate-label">広告・PR</p><p>リンク先で購入・申込みがあると、運営者に報酬が入る場合があります。広告は診断結果に影響しません。</p><div class="affiliate-grid">${items.map(item => `<article><p class="affiliate-label">PR · ${escapeHtml(item.merchant)}</p><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.description)}</p><a href="${escapeHtml(item.url)}" target="_blank" rel="sponsored noopener noreferrer" referrerpolicy="no-referrer">提供元で詳細を見る <span aria-hidden="true">↗</span></a></article>`).join('')}</div><a href="/advertising/">広告掲載方針</a></aside>`;
}

const affiliateCss = `.deck-bottom .pr-entry{margin:0;white-space:nowrap}.pr-entry{font-size:12px;min-height:36px;color:var(--gold,#c5a880);margin-top:4px}.pr-dialog{display:grid;gap:14px}.pr-dialog>.hint{margin:0}.pr-dialog .check{align-items:flex-start}.pr-offers{display:grid;gap:14px}.pr-offers article{border:1px solid #c5a88044;padding:16px;background:#100d12}.pr-offers h3{font-size:18px;line-height:1.6;margin:8px 0}.pr-offers p{font-size:14px;line-height:1.8;margin:8px 0 16px}.pr-offers a{white-space:normal}.pr-dialog>a{justify-self:start}.pr-pager{display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:12px}@media(max-height:650px){.pr-dialog{gap:10px}.pr-offers article{padding:12px}.pr-offers p{margin:6px 0 12px}}`;

module.exports = {escapeHtml, validateMonetization, renderAffiliateSection, affiliateCss};
