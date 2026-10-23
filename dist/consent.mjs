export const CHOICE_POLICY = 'nocturne-explicit-choice-2026-10-21';

// A legacy true value may have come from a preselected control, not a choice.
export function publicationPreferred(state = {}, publication = {}) {
  if (state.publicationChoice?.policy === CHOICE_POLICY &&
      state.publicationChoice.scope === (state.scope ?? null) &&
      typeof state.publicationPreference === 'boolean') return state.publicationPreference;
  if (publication.preference === false || state.publicationPreference === false) return false;
  return publication.choicePolicy === CHOICE_POLICY && publication.preference === true;
}

export function rememberPublicationChoice(state, enabled, revision = 0, pending = false) {
  return {...state, publicationPreference: enabled === true,
    publicationChoice: {policy: CHOICE_POLICY, scope: state.scope ?? null, revision, pending}};
}

export function reconcilePublicationChoice(state, publication, scope) {
  const local = state.publicationChoice;
  if (local?.policy === CHOICE_POLICY && local.scope === scope &&
      Number.isInteger(local.revision) && (local.pending === true || local.revision >= publication.revision)) return state;
  return {...state, publicationPreference: publication.preference,
    publicationChoice: publication.choicePolicy === CHOICE_POLICY ?
      {policy: CHOICE_POLICY, scope, revision: publication.revision} : null};
}

// Only the currently pending choice may be settled by an asynchronous receipt.
export function publicationReceiptApplies(state, publication, receipt, {scope, enabled, latest}) {
 const choice=state.publicationChoice;
 return latest===true&&state.scope===scope&&choice?.policy===CHOICE_POLICY&&choice.scope===scope&&
  choice.pending===true&&state.publicationPreference===enabled&&Number.isInteger(receipt?.revision)&&
  receipt.revision>=(publication?.revision??0)&&receipt.revision>=choice.revision;
}

export const REQUIRED_ENTRY_POLICY='nocturne-required-participation-2026-10-21';
export function requiredPublicationPending(draft) {
 return draft?.complete===true&&draft.entryPolicy===REQUIRED_ENTRY_POLICY&&!draft.firstPublishedAt;
}
export function missingEntryAgreement({contribute,publication}) {
 return !contribute?'contribute':!publication?'start-publication':null;
}
