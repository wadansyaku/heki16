// Public snapshots and private history use the same disclosure and missing-value rules.
export function visibleCard(card, nameOnly = false) {
  return nameOnly ? {...card, quote:'████████', summary:'詳しい好みは、本人だけの秘密。', tags:[], traits:[]} : card;
}

export function facetRate(facet) {
  if (!facet || !Number.isFinite(facet.opportunities) || facet.opportunities <= 0 || !Number.isFinite(facet.count)) return null;
  return Math.round(100 * facet.count / facet.opportunities);
}

export function historyComparison(current, rows, axes) {
  const before = rows.filter(row => row.id !== current.id && row.profile?.instrument === current.profile?.instrument && row.context?.timeframe === current.context?.timeframe && row.completedAt < current.completedAt).sort((a,b) => b.completedAt-a.completedAt)[0];
  return {before, items:axes.map(([id,label]) => ({id,label,now:facetRate(current.profile?.facets?.find(f=>f.id===id)),before:facetRate(before?.profile?.facets?.find(f=>f.id===id))}))};
}

// Empty placeholders are not consent to omit a demographic answer.
export function firstMissingChoice(values, options) {
  return Object.keys(options).find(key=>!Object.hasOwn(options[key],values[key]));
}
