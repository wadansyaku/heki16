const {escapeHtml,validateAffiliateConfig,publicCampaigns}=require('../src/affiliate-config.mjs');
const {promotionForm}=require('../src/affiliate-core.mjs');
const validateMonetization=validateAffiliateConfig;

function renderAffiliateSection(campaigns, placement) {
  const items = campaigns.filter(item => item.placements.includes(placement)).slice(0, 3);
  if (!items.length) return '';
  return `<aside class="affiliate-section" aria-label="広告・PR"><p class="affiliate-label">広告・PR</p><p>リンク先で購入・申込みがあると、運営者に報酬が入る場合があります。広告は診断結果に影響しません。</p><div class="affiliate-grid">${items.map(item => `<article><p class="affiliate-label">PR · ${escapeHtml(item.merchant)}</p><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.description)}</p>${promotionForm(item)}</article>`).join('')}</div><a href="/advertising/">広告掲載方針</a></aside>`;
}

const affiliateCss = `.deck-bottom .pr-entry{margin:0;white-space:nowrap}.pr-entry{font-size:12px;min-height:44px;color:var(--brass);margin-top:4px}.pr-dialog{display:grid;gap:18px}.pr-context{display:flex;align-items:center;gap:10px;font-size:12px;color:var(--muted)}.pr-badge{color:var(--brass);font-size:11px;letter-spacing:.12em;border:1px solid #c5a88066;padding:3px 8px}.pr-dialog .check{align-items:flex-start}.pr-offers{display:grid;gap:14px}.pr-offers article{border:1px solid var(--line);border-top:2px solid var(--brass);padding:22px;background:linear-gradient(150deg,#1c151c,var(--panel))}.pr-merchant{font:12px Georgia,serif;letter-spacing:.14em;color:var(--brass)}.pr-offers h3{font-size:23px;line-height:1.65;margin:12px 0}.pr-offers p{font-size:14px;line-height:1.9;color:var(--muted);margin:10px 0 22px}.pr-offers form{display:grid;gap:12px}.pr-offers .btn{min-height:48px;border-color:#c5a88066;background:#221b23;white-space:normal}.pr-offers .btn:hover:not(:disabled){background:#30232d;border-color:var(--brass)}.pr-disclosure{font-size:12px!important;line-height:1.8!important;color:var(--muted)!important;padding-left:12px;border-left:2px solid var(--line)}.pr-dialog>a{justify-self:start;min-height:44px}.pr-pager{display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:12px}@media(max-width:600px){.pr-dialog{gap:14px}.pr-offers article{padding:18px}.pr-offers h3{font-size:21px}.pr-offers p{font-size:13px}.pr-disclosure{font-size:12px!important}}`;

module.exports = {escapeHtml, validateMonetization, publicCampaigns, renderAffiliateSection, affiliateCss};
