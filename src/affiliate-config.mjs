export const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
export const REGISTERED_MEDIA_URL = 'https://kuseiro.com/';
export const MYFANS_MEDIA_POLICY = 'approved-media-policy-2026-10-22';
export const KUSEIRO_MEDIA_APPROVAL = 'kuseiro-media-approved-2026-10-24';
const check = (condition, message) => { if (!condition) throw Error(message); };

// Shared by the build and the departure handler. The latter never trusts the catalog.
export function validateAffiliateConfig(config, now = Date.now(), knownAffinities = null) {
  check(typeof config?.enabled === 'boolean' && typeof config.siteApproved === 'boolean', 'Invalid delivery flags');
  check(Array.isArray(config.allowedHosts) && Array.isArray(config.campaigns), 'Invalid campaign configuration');
  if (!config.enabled) return [];
  check(config.accountApproved === true && config.siteApproved === true, 'Account and registered media approval are required');
  check(config.provider === 'myfans' && config.mediaUrl === REGISTERED_MEDIA_URL, 'Use the approved provider and media');
  check(typeof config.personalizationEnabled === 'boolean', 'Explicit personalization policy required');
  check(config.campaigns.length > 0 && config.campaigns.length <= 24, 'Use one to twenty-four approved campaigns');
  const ids = new Set();
  return config.campaigns.filter(item => item.enabled !== false).map(item => {
    check(typeof item.id === 'string' && /^[a-z0-9-]{1,48}$/.test(item.id) && !ids.has(item.id), 'Unique campaign ID required');
    ids.add(item.id);
    for (const field of ['title', 'description', 'merchant']) check(typeof item[field] === 'string' && item[field].trim().length > 0 && item[field].length <= 240, 'Invalid reviewed copy');
    // The authenticated support reply permits approved media to publish after a compliance review.
    // This is distinct from an individual creative approval, which remains a valid alternative.
    // The 2026-10-22 policy reviewed the previous medium. KUSEIRO uses its own approval.
    const complianceReviewed = item.complianceVerified === true && item.publicationBasis === KUSEIRO_MEDIA_APPROVAL
      && Date.parse(item.reviewedAt) >= Date.parse('2026-10-23T16:00:00Z');
    check((item.creativeApproved === true || complianceReviewed) && item.linkVerified === true, 'Creative approval or a recorded approved-media compliance review and a verified link are required');
    check(Number.isFinite(Date.parse(item.reviewedAt)) && Date.parse(item.reviewedAt) <= now, 'Record the publication review date');
    check(Array.isArray(item.affinities) && item.affinities.length <= 8 && item.affinities.every(id => typeof id === 'string' && /^[a-zA-Z]{1,32}$/.test(id)), 'Only reviewed preference IDs may be used');
    if (knownAffinities) check(item.affinities.every(id => knownAffinities.includes(id)), 'Unknown preference');
    const url = new URL(item.url);
    check(url.protocol === 'https:' && !url.username && !url.password && !url.hash, 'Invalid advertising URL');
    check(config.allowedHosts.includes(url.hostname) && !/^(?:localhost|127\.|0\.|10\.|192\.168\.|169\.254\.|172\.(?:1[6-9]|2\d|3[01])\.|\[|.*\.local$)/i.test(url.hostname), 'An exact public host allowlist entry is required');
    check(Array.isArray(item.placements) && item.placements.length > 0 && item.placements.every(p => p === 'post-share' || p === 'post-result'), 'Only optional post-result and post-share placements are permitted');
    check(typeof item.expiresAt === 'string' && Number.isFinite(Date.parse(item.expiresAt)), 'Set the next review deadline');
    for (const key of url.searchParams.keys()) check(!/(?:partner|name|nickname|answer|score|diagnosis|result|heki16|facet|trait|gender|mood|persona|email|session|account|record|timeframe|sexual|preference|^age$)/i.test(key), 'Never append diagnostic or personal data');
    return {id:item.id,title:item.title,description:item.description,merchant:item.merchant,url:url.href,placements:item.placements,expiresAt:item.expiresAt,affinities:config.personalizationEnabled?item.affinities:[]};
  }).filter(item => Date.parse(item.expiresAt) > now);
}

export function publicCampaigns(campaigns) {
  return campaigns.map(item => ({...item, url: '/out/' + item.id}));
}

export function advertisingFormOrigins(config,now=Date.now()) {
  const items=validateAffiliateConfig(config,now);
  if(!items.length)return [];
  // Chrome also applies form-action to redirects after the official short link.
  return [...new Set([...items.map(item=>new URL(item.url).origin),'https://myfans.jp'])];
}
