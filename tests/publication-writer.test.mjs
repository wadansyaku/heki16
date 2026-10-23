import test from 'node:test';
import assert from 'node:assert/strict';
import {createPublicationWriter} from '../src/publication-writer.mjs';
import {CHOICE_POLICY} from '../src/consent.mjs';

const deferred = () => { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return {promise, resolve, reject}; };
const tick = () => new Promise(resolve => setImmediate(resolve));
const conflict = () => Object.assign(new Error('conflict'), {code: 'conflict'});
const receipt = (enabled, revision) => ({saved: true, preference: enabled, revision, choicePolicy: CHOICE_POLICY});
function harness(transport) {
  const h = {scope: 'a', publications: {a: {revision: 0}, b: {revision: 10}}, calls: [], saved: [], errors: [], refreshes: 0, inFlight: 0, maxInFlight: 0, intent: null};
  h.writer = createPublicationWriter({
    getScope: () => h.scope,
    getPublication: () => h.publications[h.scope],
    send: async (body, scope) => {
      h.calls.push({body, scope}); h.inFlight++; h.maxInFlight = Math.max(h.maxInFlight, h.inFlight);
      try { return await transport(body, scope, h); } finally { h.inFlight--; }
    },
    refresh: async () => { h.refreshes++; await h.refresh?.(); },
    onSaved: (response, meta) => { h.saved.push({response, ...meta}); if (meta.latest) h.intent = meta.enabled; },
    onError: (error, meta) => { h.errors.push({error, ...meta}); }
  });
  return h;
}

test('a delayed on followed by off is serialized and the old success cannot replace the latest intention', async () => {
  const first = deferred(), second = deferred();
  const h = harness((_body, _scope, state) => state.calls.length === 1 ? first.promise : second.promise);
  const on = h.writer.choose(true); await tick();
  const off = h.writer.choose(false), sameOff = h.writer.choose(false);
  assert.equal(off, sameOff); assert.equal(h.calls.length, 1);
  first.resolve(receipt(true, 1));
  assert.deepEqual(await on, {status: 'saved', enabled: true, scope: 'a', latest: false, attempts: 1, response: receipt(true, 1)});
  await tick();
  assert.deepEqual(h.calls.map(call => call.body), [
    {enabled: true, expectedRevision: 0, choicePolicy: CHOICE_POLICY},
    {enabled: false, expectedRevision: 1, choicePolicy: CHOICE_POLICY}
  ]);
  assert.equal(h.intent, null); // The consumer ignored the obsolete success.
  second.resolve(receipt(false, 2));
  assert.equal((await off).latest, true); assert.equal(h.intent, false);
  assert.deepEqual(h.saved.map(event => event.latest), [false, true]); assert.equal(h.maxInFlight, 1);
});

test('identical pending intentions share a promise; intermediate unsent choices coalesce', async () => {
  const h = harness(async body => receipt(body.enabled, body.expectedRevision + 1));
  const on = h.writer.choose(true), sameOn = h.writer.choose(true);
  assert.equal(on, sameOn);
  const off = h.writer.choose(false);
  assert.equal((await on).status, 'superseded');
  assert.equal((await off).status, 'saved');
  assert.equal(h.calls.length, 1); assert.equal(h.calls[0].body.enabled, false);
});

test('a conflict refreshes the account and retries with its new revision', async () => {
  const h = harness(async (body, _scope, state) => { if (state.calls.length === 1) throw conflict(); return receipt(body.enabled, body.expectedRevision + 1); });
  h.refresh = async () => { h.publications.a.revision = 4; };
  const result = await h.writer.choose(true);
  assert.equal(result.status, 'saved'); assert.equal(result.attempts, 2);
  assert.deepEqual(h.calls.map(call => call.body.expectedRevision), [0, 4]); assert.equal(h.refreshes, 1);
  assert.equal(h.errors.length, 0); assert.equal(h.maxInFlight, 1);
});

test('a scope switch discards an old receipt and uses the new account only for its own choice', async () => {
  const pending = deferred();
  const h = harness((body, scope) => scope === 'a' ? pending.promise : receipt(body.enabled, body.expectedRevision + 1));
  const old = h.writer.choose(true); await tick();
  h.scope = 'b'; const current = h.writer.choose(false);
  assert.equal(h.calls.length, 1);
  pending.resolve(receipt(true, 1));
  assert.equal((await old).status, 'scope_changed');
  assert.equal((await current).status, 'saved');
  assert.deepEqual(h.calls.map(call => [call.scope, call.body.expectedRevision]), [['a', 0], ['b', 10]]);
  assert.deepEqual(h.saved.map(event => event.scope), ['b']); assert.equal(h.errors.length, 0); assert.equal(h.maxInFlight, 1);
});

test('a queued choice and a conflict refresh cannot write into a changed scope', async () => {
  const h = harness(async () => { throw conflict(); });
  h.refresh = async () => { h.scope = 'b'; };
  assert.equal((await h.writer.choose(true)).status, 'scope_changed');
  assert.equal(h.calls.length, 1); assert.equal(h.saved.length, 0); assert.equal(h.errors.length, 0);
  const second = harness(async body => receipt(body.enabled, body.expectedRevision + 1));
  const queued = second.writer.choose(true); second.scope = 'b';
  assert.equal((await queued).status, 'scope_changed'); assert.equal(second.calls.length, 0);
});

test('three conflicts stop the intention and a later explicit choice can recover', async () => {
  let rejecting = true;
  const h = harness(async body => { if (rejecting) throw conflict(); return receipt(body.enabled, body.expectedRevision + 1); });
  h.refresh = async () => { h.publications.a.revision++; };
  const failed = await h.writer.choose(true);
  assert.equal(failed.status, 'failed'); assert.equal(failed.attempts, 3); assert.equal(failed.error.code, 'conflict');
  assert.equal(h.calls.length, 3); assert.equal(h.refreshes, 2); assert.equal(h.errors.length, 1); assert.equal(h.errors[0].latest, true);
  rejecting = false;
  const recovered = await h.writer.choose(true);
  assert.equal(recovered.status, 'saved'); assert.equal(recovered.attempts, 1); assert.equal(h.calls.length, 4);
});

test('a transport error is not retried, and the next choice still runs', async () => {
  const h = harness(async (body, _scope, state) => { if (state.calls.length === 1) throw new Error('offline'); return receipt(body.enabled, body.expectedRevision + 1); });
  assert.equal((await h.writer.choose(true)).status, 'failed');
  assert.equal(h.refreshes, 0); assert.equal(h.calls.length, 1);
  assert.equal((await h.writer.choose(false)).status, 'saved'); assert.equal(h.calls.length, 2); assert.equal(h.maxInFlight, 1);
});

test('an obsolete conflict is not retried before the latest choice', async () => {
  const pending = deferred();
  const h = harness((body, _scope, state) => state.calls.length === 1 ? pending.promise : receipt(body.enabled, body.expectedRevision + 1));
  const on = h.writer.choose(true); await tick(); const off = h.writer.choose(false);
  pending.reject(conflict());
  assert.equal((await on).status, 'failed'); assert.equal((await off).status, 'saved');
  assert.deepEqual(h.calls.map(call => call.body.enabled), [true, false]);
  assert.equal(h.errors[0].latest, false); assert.equal(h.refreshes, 0);
});

test('an unknown revision is refreshed rather than assumed to be zero', async () => {
  const h = harness(async body => receipt(body.enabled, body.expectedRevision + 1));
  h.publications.a = null; h.refresh = async () => { h.publications.a = {revision: 6}; };
  assert.equal((await h.writer.choose(false)).status, 'saved');
  assert.equal(h.calls[0].body.expectedRevision, 6); assert.equal(h.refreshes, 1);
});

test('a malformed receipt cannot clear the current pending choice', async () => {
  const h = harness(async () => ({saved: true, preference: true, revision: 1}));
  const result = await h.writer.choose(true);
  assert.equal(result.status, 'failed'); assert.equal(result.error.code, 'publication_receipt_invalid'); assert.equal(h.saved.length, 0);
});

test('on-off-on during a delayed on coalesces the unsent intermediate choice without another write', async () => {
  const pending = deferred();
  const h = harness(() => pending.promise);
  const firstOn = h.writer.choose(true); await tick();
  const off = h.writer.choose(false), latestOn = h.writer.choose(true);
  assert.equal((await off).status, 'superseded');
  pending.resolve(receipt(true, 1));
  assert.equal((await firstOn).latest, false);
  const result = await latestOn;
  assert.equal(result.status, 'saved'); assert.equal(result.latest, true); assert.equal(result.attempts, 0);
  assert.equal(h.calls.length, 1); assert.equal(h.maxInFlight, 1); assert.equal(h.intent, true);
  assert.deepEqual(h.saved.map(event => event.latest), [false, true]);
});

test('cancel supersedes queued intentions before any write is dispatched', async () => {
  const h = harness(async body => receipt(body.enabled, body.expectedRevision + 1));
  const pending = h.writer.choose(true); h.writer.cancel();
  assert.equal((await pending).status, 'superseded'); await tick();
  assert.equal(h.calls.length, 0); assert.equal(h.saved.length, 0);
  assert.equal((await h.writer.choose(false)).status, 'saved'); assert.equal(h.calls.length, 1);
});

test('cancel drops the queued choice and prevents an in-flight conflict from retrying across an external action', async () => {
  const pending = deferred();
  const h = harness(() => pending.promise);
  const on = h.writer.choose(true); await tick();
  const off = h.writer.choose(false); h.writer.cancel();
  assert.equal((await off).status, 'superseded');
  pending.reject(conflict());
  const result = await on;
  assert.equal(result.status, 'failed'); assert.equal(result.latest, false);
  await tick(); assert.equal(h.calls.length, 1); assert.equal(h.refreshes, 0);
  assert.deepEqual(h.errors.map(event => event.latest), [false]);
});

test('cancel during conflict refresh prevents a second old write after the external boundary', async () => {
  const refreshing = deferred();
  const h = harness(async () => { throw conflict(); });
  h.refresh = () => refreshing.promise;
  const on = h.writer.choose(true); await tick();
  assert.equal(h.refreshes, 1);
  const off = h.writer.choose(false); h.writer.cancel();
  assert.equal((await off).status, 'superseded'); refreshing.resolve();
  assert.equal((await on).status, 'superseded'); assert.equal(h.calls.length, 1);
});

test('a cancelled old success stays obsolete and cannot coalesce a new same-value choice', async () => {
  const pending = deferred();
  const h = harness((body, _scope, state) => state.calls.length === 1 ? pending.promise : receipt(body.enabled, body.expectedRevision + 1));
  const old = h.writer.choose(true); await tick(); h.writer.cancel();
  const current = h.writer.choose(true);
  pending.resolve(receipt(true, 1));
  assert.equal((await old).latest, false);
  assert.equal((await current).latest, true);
  assert.equal(h.calls.length, 2); assert.equal(h.maxInFlight, 1);
  assert.deepEqual(h.saved.map(event => event.latest), [false, true]);
});
