import {CHOICE_POLICY} from './consent.mjs';

const MAX_ATTEMPTS = 3;
const errorWithCode = code => Object.assign(new Error(code), {code});

/**
 * Serializes explicit publication preferences; it never changes UI state itself.
 *
 * choose(boolean) returns a Promise which always resolves to:
 * {status: 'saved'|'failed'|'superseded'|'scope_changed', enabled, scope, latest,
 *  attempts, response?, error?}. Transport/callback failures do not reject it.
 * Identical pending choices in the same scope share their Promise. Intermediate
 * choices superseded before dispatch are not sent. A dispatched request cannot
 * be unsent: send must use its supplied scope, and its response is ignored after
 * a scope change. Callbacks are synchronous observers; only latest=true may
 * replace the current UI intention or clear its pending marker.
 *
 * send resolves the API receipt {saved:true, preference:boolean, revision:int,
 * choicePolicy:CHOICE_POLICY}. getPublication supplies the active account's
 * known revision; refresh must update that getter after a conflict. At most
 * three writes are attempted for an intention; only conflicts are retried.
 * cancel() supersedes unsent work and invalidates the in-flight intention. An
 * already-dispatched response may notify observers with latest:false, but it
 * cannot retry or satisfy a new choice across that cancellation boundary.
 */
export function createPublicationWriter({getScope, getPublication, send, refresh, onSaved = () => {}, onError = () => {}}) {
  for (const callback of [getScope, getPublication, send, refresh, onSaved, onError]) {
    if (typeof callback !== 'function') throw new TypeError('Publication writer callbacks must be functions');
  }
  let desired = null, active = null, draining = false, acknowledged = null;
  const inScope = task => task.scope !== null && task.scope !== undefined && getScope() === task.scope;
  const latest = task => desired === task && inScope(task);
  const finish = (task, status, extra = {}) => {
    if (task.finished) return;
    task.finished = true;
    task.resolve({status, enabled: task.enabled, scope: task.scope, latest: latest(task), attempts: task.attempts, ...extra});
  };
  const notifyError = (error, task) => {
    try { onError(error, {enabled: task.enabled, scope: task.scope, latest: latest(task)}); }
    catch { /* An observer must not break the queue or cause another write. */ }
  };
  const revision = task => {
    const current = getPublication()?.revision;
    const confirmed = acknowledged?.scope === task.scope ? acknowledged.revision : null;
    const known = Number.isInteger(current) && current >= 0 ? current : null;
    if (known === null && confirmed === null) return null;
    return Math.max(known ?? 0, confirmed ?? 0);
  };
  async function perform(task) {
    try {
      while (task.attempts < MAX_ATTEMPTS) {
        if (!inScope(task)) { finish(task, 'scope_changed'); return; }
        if (task.cancelled || desired !== task) { finish(task, 'superseded'); return; }
        let expectedRevision = revision(task);
        if (expectedRevision === null) {
          await refresh();
          if (!inScope(task)) { finish(task, 'scope_changed'); return; }
          if (task.cancelled || desired !== task) { finish(task, 'superseded'); return; }
          expectedRevision = revision(task);
          if (expectedRevision === null) throw errorWithCode('publication_revision_unknown');
        }
        task.attempts++;
        let response;
        try {
          response = await send({enabled: task.enabled, expectedRevision, choicePolicy: CHOICE_POLICY}, task.scope);
        } catch (error) {
          if (!inScope(task)) { finish(task, 'scope_changed'); return; }
          if (error?.code === 'conflict' && !task.cancelled && desired === task && task.attempts < MAX_ATTEMPTS) {
            await refresh();
            continue;
          }
          throw error;
        }
        if (!inScope(task)) { finish(task, 'scope_changed'); return; }
        if (response?.saved !== true || response.preference !== task.enabled || response.choicePolicy !== CHOICE_POLICY || !Number.isInteger(response.revision) || response.revision !== expectedRevision + 1) {
          throw errorWithCode('publication_receipt_invalid');
        }
        acknowledged = {scope: task.scope, revision: response.revision};
        try { onSaved(response, {enabled: task.enabled, scope: task.scope, latest: latest(task)}); }
        catch (error) { notifyError(error, task); finish(task, 'failed', {response, error}); return; }
        finish(task, 'saved', {response});
        // on -> off -> on while the first on was in flight: the intermediate
        // off was never sent, so the same verified receipt satisfies the last on.
        const queued = desired;
        if (!task.cancelled && queued && queued !== task && queued.enabled === task.enabled && queued.scope === task.scope && inScope(queued) && revision(queued) === response.revision) {
          try { onSaved(response, {enabled: queued.enabled, scope: queued.scope, latest: latest(queued)}); }
          catch (error) { notifyError(error, queued); finish(queued, 'failed', {response, error}); if (desired === queued) desired = null; return; }
          finish(queued, 'saved', {response});
          if (desired === queued) desired = null;
        }
        return;
      }
    } catch (error) {
      if (!inScope(task)) { finish(task, 'scope_changed'); return; }
      notifyError(error, task);
      finish(task, 'failed', {error});
    }
  }
  async function drain() {
    try {
      while (desired) {
        const task = desired; active = task;
        await perform(task);
        if (desired === task) desired = null;
        active = null;
      }
    } finally {
      draining = false; active = null;
      if (desired) start();
    }
  }
  function start() {
    if (draining) return;
    draining = true;
    queueMicrotask(() => { void drain(); });
  }
  function choose(enabled) {
    const scope = getScope();
    if (typeof enabled !== 'boolean') {
      const error = errorWithCode('publication_choice_invalid');
      const task = {enabled, scope, attempts: 0};
      notifyError(error, task);
      return Promise.resolve({status: 'failed', enabled, scope, latest: false, attempts: 0, error});
    }
    if (desired && !desired.finished && desired.scope === scope && desired.enabled === enabled) return desired.promise;
    if (desired && desired !== active) finish(desired, 'superseded', {latest: false});
    const task = {enabled, scope, attempts: 0, finished: false};
    task.promise = new Promise(resolve => { task.resolve = resolve; });
    desired = task; start();
    return task.promise;
  }
  function cancel() {
    const pending = desired;
    desired = null;
    if (active) active.cancelled = true;
    if (pending && (pending !== active || pending.attempts === 0)) finish(pending, 'superseded', {latest: false});
  }
  return {choose, cancel};
}
