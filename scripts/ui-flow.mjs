import {NAMED_DOSSIERS,PENDING_DOSSIERS} from '../src/dossier-catalog.mjs';
import {diagnose as diagnoseLegacy,encodeResult} from '../src/diagnosis.mjs';
import assert from 'node:assert/strict';
import {promises as fs} from 'node:fs';
import path from 'node:path';

// Synthetic local-only exercise. No response bodies, account IDs, cookies, or real preferences are logged.
export async function verifyUiFlow({browser, origin, outputDir, advertisingEnabled=false}) {
  assert.match(origin, /^http:\/\/127\.0\.0\.1:\d+$/);
  await fs.mkdir(outputDir, {recursive: true, mode: 0o700});
  const checks = [], screenshots = [], errors = [], accountRequests = [];
  const recordAccountRequest = request => { if (new URL(request.url()).pathname === '/api/account') accountRequests.push(Date.now()); };
  let current = 'page-identity';
  const context = await browser.newContext({viewport: {width: 390, height: 844}, acceptDownloads: true, serviceWorkers: 'block'});
  await context.route('**/*', route => {
    const url = new URL(route.request().url());
    return url.origin === origin || ['data:', 'blob:', 'about:'].includes(url.protocol) ? route.continue() : route.abort();
  });
  context.on('request', recordAccountRequest);
  const page = await context.newPage();
  page.setDefaultTimeout(5000);
  page.on('pageerror', () => errors.push('pageerror'));
  page.on('console', msg => { if (msg.type() === 'error') errors.push('console-error'); });
  const action = name => page.locator(`[data-action="${name}"]`);
  const chooseFirst = async () => {
    const input = page.locator('[name=answer]').first();
    if (!await input.isChecked()) await page.locator('.choice').first().click();
    assert.equal(await input.isChecked(), true);
  };
  const accountBudget = async (reserve=1) => {
    for (;;) {const now=Date.now(),recent=accountRequests.filter(time=>now-time<60000);if(recent.length+reserve<=10)return;const wait=recent[recent.length+reserve-10-1]+60500-now;await page.waitForTimeout(Math.min(59000,Math.max(1,wait)));}
  };
  const check = async (id, fn) => { current = id; await fn(); checks.push({id, passed: true}); };
  const capture = async name => {
    await page.screenshot({path: path.join(outputDir, name), fullPage: false});
    screenshots.push(name);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'horizontal overflow');
  };
  try {
    await check('page-identity', async () => { await page.goto(origin); assert.equal(new URL(page.url()).origin, origin); assert.match(await page.title(), /KUSEIRO/); });
    await check('eligibility-refusal', async () => { await page.locator('#eligibility-no').click(); await page.getByRole('heading', {name: 'ご利用いただけません'}).waitFor(); });
    await page.reload();
    await check('eligibility-entry', async () => { await page.locator('#eligibility-yes').click(); await page.locator('.home-entrance').waitFor(); });
    await check('home-responsive', async () => {
      assert.equal(await action('sample').count(), 0);
      for (const width of [320, 1440, 390]) {
        await page.setViewportSize({width, height: width > 600 ? 900 : 844});
        assert.ok(await action('start').isVisible());
        await capture(`home-${width}.png`);
      }
    });
    // A fresh tab can retain #quiz after browser restoration or owner-data erasure.
    await page.goto(origin + '/#quiz');
    await action('start').click();
    await check('start-validation-visible', async () => {
      await action('confirm-start').click();
      const error = page.locator('.start-actions #start-error');
      assert.match(await error.textContent(), /選んでください/);
      assert.equal(await page.locator('#mood').getAttribute('aria-invalid'), 'true');
      const errorBox = await error.boundingBox(), buttonBox = await action('confirm-start').boundingBox();
      assert.ok(errorBox && buttonBox && errorBox.y < buttonBox.y && errorBox.y > 0);
    });
    await page.locator('#gender').selectOption('diverse');
    await page.locator('#age').selectOption('30-34');
    await page.locator('#mood').selectOption('ordinary');
    await check('required-consent', async () => {
      assert.equal(await page.locator('#contribute').isChecked(), false);
      assert.equal(await page.locator('#start-publication').isChecked(), false);
      await action('confirm-start').click();
      assert.match(await page.locator('#start-error').textContent(), /回答の提供/);
      await page.locator('#contribute').check(); await action('confirm-start').click();
      assert.match(await page.locator('#start-error').textContent(), /掲載/);
      await page.locator('#start-publication').check(); await action('confirm-start').click();
      await page.locator('#question-title').waitFor();
    });
    await check('same-route-start', async () => {
      assert.equal(new URL(page.url()).hash, '#quiz');
      assert.equal(await page.locator('.home-entrance').count(), 0);
      assert.equal(await page.locator('#modal').evaluate(dialog => dialog.open), false);
      assert.equal(await action('next').isDisabled(), true);
    });
    await check('verification-does-not-cover-controls', async () => {
      // Only a synthetic local widget is injected; real verification is never bypassed.
      await page.locator('#verification').evaluate(container => {
        const widget=document.createElement('div');widget.dataset.syntheticVerification='true';
        widget.style.height='100px';widget.textContent='確認欄の配置テスト';container.append(widget);
      });
      try {
        const next=await action('next').boundingBox(),verification=await page.locator('#verification').boundingBox();
        assert.ok(next&&verification&&next.y+next.height<=verification.y,'verification covers the next action');
        await chooseFirst();await action('next').click();await action('previous').click();
        await capture('verification-layout.png');
      } finally {
        await page.locator('[data-synthetic-verification]').evaluate(widget=>widget.remove());
      }
    });
    await check('quiz-pause-and-resume', async () => {
      assert.equal(await action('next').isDisabled(), false);
      await chooseFirst();
      await action('next').click(); await action('previous').click();
      assert.equal(await page.locator('[name=answer]').first().isChecked(), true);
      await action('pause').click(); await action('resume').click();
      assert.equal(await page.locator('[name=answer]').first().isChecked(), true);
      await capture('quiz-mobile.png');
    });
    await check('quiz-24-scenes', async () => {
      for (let i = 0; i < 24; i++) {
        const fraction = await page.locator('.fraction').textContent();
        assert.match(fraction, new RegExp(`^${String(i + 1).padStart(2, '0')}`));
        await page.evaluate(async()=>{await document.fonts.ready;await Promise.all(document.getAnimations().map(animation=>animation.finished));});
        // Keep long options in view at normal phone sizes without sacrificing touch targets.
        for (const [width, height, maxScroll] of [[320,568,16],[375,667,1],[390,664,1],[393,852,1]]) {
          await page.setViewportSize({width,height});
          const layout=await page.locator('.quiz-body').evaluate(body=>{
            body.scrollTop=0;
            const options=[...body.querySelectorAll('.choice')],box=body.getBoundingClientRect();
            return {scroll:body.scrollHeight-body.clientHeight,minTarget:Math.min(...options.map(option=>option.getBoundingClientRect().height)),lastBottom:options.at(-1).getBoundingClientRect().bottom,bottom:box.bottom,horizontal:document.documentElement.scrollWidth>innerWidth+1};
          });
          assert.ok(layout.scroll<=maxScroll,`scene ${i+1} at ${width}x${height}: ${layout.scroll}px scroll`);
          if(width!==320)assert.ok(layout.lastBottom<=layout.bottom+1,'last option hidden');
          assert.ok(layout.minTarget>=43.9,`choice touch target below 44px: ${layout.minTarget}`);
          assert.equal(layout.horizontal,false,'horizontal overflow');
        }
        await page.setViewportSize({width:390,height:844});
        await chooseFirst(); await action('next').click();
      }
      await action('finish-review').waitFor(); await action('finish-review').click();
    });
    await check('server-publication-preview', async () => {
      await action('publish').waitFor();
      await page.waitForFunction(() => document.querySelector('[data-action=publish]')?.disabled === false);
      assert.equal(await page.locator('#publish-age').inputValue(), 'unset');
      assert.equal(await page.locator('#publish-gender').inputValue(), 'unset');
      for (const width of [320, 1440, 390]) {
        await page.setViewportSize({width, height: width > 600 ? 900 : 844}); await capture(`publication-${width}.png`);
      }
      await action('publish').click(); await page.locator('.result-pane').waitFor();
    });
    await check('result-navigation', async () => {
      for (let i = 0; i < 5; i++) { await page.locator(`[data-page="${i}"]`).click(); await page.locator('.result-pane').waitFor(); }
      await page.locator('[data-page="0"]').click();await page.evaluate(()=>document.fonts.ready);
      for(const [width,height]of [[320,568],[390,844],[1440,900]]){
        await page.setViewportSize({width,height});
        const visible=await page.locator('.result-pane').evaluate(pane=>{pane.scrollTop=0;const button=pane.querySelector('[data-action=open-share]').getBoundingClientRect(),box=pane.getBoundingClientRect();return button.top>=box.top&&button.bottom<=box.bottom+1;});
        assert.ok(visible,`X action below initial result viewport at ${width}x${height}`);
      }
      await page.setViewportSize({width:390,height:844});
      await page.locator('[data-page="0"]').click(); await capture('result-mobile.png');
      await page.reload(); await page.locator('.result-pane').waitFor();
    });
    await check('result-refresh-focus', async () => {
      await page.waitForLoadState('networkidle');
      let release, observed;
      const pending = new Promise(resolve => { observed = resolve; });
      const hold = async route => { observed(); await new Promise(resolve => { release = resolve; }); await route.continue(); };
      await page.route('**/api/account', hold);
      try {
        await page.reload(); await pending;
        // Result controls appear only after startup has reconciled the account.
        assert.equal(await page.locator('.result-tabs').count(), 0);
        const response = page.waitForResponse(r => new URL(r.url()).pathname === '/api/account');
        release(); await response; await page.locator('[data-page="0"]').waitFor();
        await page.locator('[data-page="0"]').click();
        assert.equal(await page.locator('[data-page="0"]').evaluate(el => el === document.activeElement), true);
        await page.evaluate(() => window.dispatchEvent(new HashChangeEvent('hashchange')));
        assert.equal(await page.locator('[data-page="0"]').evaluate(el => el === document.activeElement), true);
      } finally { release?.(); await page.unroute('**/api/account', hold); }
    });
    await check('result-keyboard-tabs', async () => {
      const selected = async index => {
        const tab = page.getByRole('tab', {selected: true});
        assert.equal(await tab.count(), 1);
        assert.equal(await tab.getAttribute('data-page'), String(index));
        assert.equal(await tab.evaluate(el => el === document.activeElement), true);
        assert.equal(await page.locator('.result-tabs [tabindex="0"]').count(), 1);
        const panel = page.getByRole('tabpanel');
        assert.equal(await panel.count(), 1);
        assert.equal(await panel.getAttribute('aria-labelledby'), await tab.getAttribute('id'));
        assert.equal(await panel.getAttribute('id'), await tab.getAttribute('aria-controls'));
        assert.equal(await page.locator('.deck-bottom>span').textContent(), `${index + 1} / 5`);
      };
      for (const width of [320, 1440, 390]) {
        await page.setViewportSize({width, height: width > 600 ? 900 : 844});
        await page.locator('[data-page="0"]').click();
        assert.equal(await page.getByRole('tablist', {name: 'カルテのページ'}).count(), 1);
        assert.equal(await page.getByRole('tab').count(), 5);
        await selected(0);
        await page.keyboard.press('ArrowRight'); await selected(1);
        assert.notEqual(await page.getByRole('tab', {selected: true}).evaluate(el => getComputedStyle(el).outlineStyle), 'none');
        await page.keyboard.press('Home'); await selected(0);
        await page.keyboard.press('End'); await selected(4);
        await page.keyboard.press('ArrowRight'); await selected(0);
        await page.keyboard.press('ArrowLeft'); await selected(4);
        await page.keyboard.press('Home'); await selected(0);
        await page.keyboard.press('Tab');
        assert.equal(await page.getByRole('tabpanel').evaluate(el => el === document.activeElement), true);
        assert.notEqual(await page.getByRole('tabpanel').evaluate(el => getComputedStyle(el).outlineStyle), 'none');
        await page.keyboard.press('Shift+Tab'); await selected(0);
        // Text editing and modal controls must not trigger result-page shortcuts.
        await page.getByRole('button', {name: 'メニューを開く', exact: true}).click();
        await page.keyboard.press('ArrowRight');
        assert.equal(await page.getByRole('tab', {selected: true}).getAttribute('data-page'), '0');
        await action('close').click();
        await page.locator('[data-page="0"]').focus();
        await page.keyboard.press('ArrowRight'); await selected(1);
        await capture(`result-keyboard-${width}.png`);
      }
      await page.locator('[data-page="0"]').click();
    });
    let receivedUrl;
    await check('direct-x-share', async () => {
      await context.route('https://twitter.com/intent/tweet**', route=>route.fulfill({contentType:'text/html',body:'<!doctype html><title>Synthetic X composer</title><p>送信は行いません</p>'}));
      let release, observed;const pending=new Promise(resolve=>{observed=resolve;});
      const hold=async route=>{observed();await new Promise(resolve=>{release=resolve;});await route.continue();};
      await page.route('**/api/share',hold);
      const pagesBefore=context.pages().length;
      try{
        await action('open-share').click();
        await pending;
        assert.equal(context.pages().length,pagesBefore,'X sharing must not reserve an about:blank tab');
        assert.equal(await page.locator('#modal').evaluate(dialog=>dialog.open),false,'no intermediate share dialog');
        for(const selector of ['#share-name-only','.share-settings','[data-action=make-link]','[data-action=save-image]','[data-action=compare-modal]'])assert.equal(await page.locator(selector).count(),0);
        assert.ok(new URL(page.url()).origin===origin,'the result stays visible while the link is saved');
        release();await page.waitForURL('https://twitter.com/intent/tweet**');
        const intent=new URL(page.url());receivedUrl=intent.searchParams.get('url');
        assert.match(intent.searchParams.get('text'),/KUSEIRO/);
        assert.equal(new URL(receivedUrl).origin,origin);assert.match(new URL(receivedUrl).pathname,/^\/s\/[A-Za-z0-9_-]{16}$/);assert.equal(new URL(receivedUrl).searchParams.get('card'),'1');
        assert.equal(context.pages().length,pagesBefore);
        await page.goto(origin+'/#profile');await page.locator('.result-name').waitFor();
        assert.equal(await page.locator('[data-action=open-promotion]').count(),advertisingEnabled?1:0);
        await capture('direct-share-result.png');
        const card=(await (await context.request.get(receivedUrl.replace('/s/','/api/share/'))).json()).card;
        for(const key of ['answers','persona','context','history','dossier','reading'])assert.equal(card[key],undefined);
        assert.equal(card.tags.length<=3,true);
      }finally{release?.();await page.unroute('**/api/share',hold);}
    });
    await check('shared-card-preview',async()=>{
      const response=await fetch(receivedUrl,{headers:{'User-Agent':'Twitterbot/1.0'}}),html=await response.text();assert.equal(response.status,200);assert.match(html,/<meta name="twitter:card" content="summary_large_image">/);
      const image=html.match(/<meta name="twitter:image" content="([^"]+)">/)?.[1];assert.ok(image&&new URL(image).origin===origin);assert.equal((html.match(/property="og:image"/g)||[]).length,1);
      const asset=await fetch(image,{headers:{'User-Agent':'Twitterbot/1.0'}});assert.equal(asset.status,200);assert.match(asset.headers.get('Content-Type'),/image\/webp/);assert.ok((await asset.arrayBuffer()).byteLength>1000);assert.match(response.headers.get('x-robots-tag'),/noindex/);
    });
    await check('received-link-eligibility', async () => {
      const recipient = await browser.newContext({viewport: {width: 390, height: 844}, serviceWorkers: 'block'});
      recipient.on('request', recordAccountRequest);
      try {
        await recipient.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
        const received = await recipient.newPage(); received.setDefaultTimeout(5000); await received.goto(receivedUrl);
        await received.locator('#eligibility-yes').click(); await received.locator('.result-pane').waitFor();
        assert.equal(await received.locator('[data-action=all-evidence]').count(), 0);
        assert.equal(await received.locator('[data-action=open-promotion]').count(), 0);
      } finally { await recipient.close(); }
    });
    await check('withdraw-synthetic-record', async () => {
      await page.getByRole('button', {name: 'メニューを開く', exact: true}).click(); await page.locator('#modal-body [data-action=account]').click(); await action('delete-prompt').click();
      await page.locator('#delete-confirm').check(); await action('delete-account').click(); await page.locator('.home-entrance').waitFor();
      // APIRequestContext requests are not emitted by the browser context's request event.
      await accountBudget();accountRequests.push(Date.now());
      const account = await (await context.request.get(origin + '/api/account')).json(); assert.equal(account.signedIn, false);
    });
    await check('browser-only-cleanup-expired-login', async () => {
      await page.evaluate(() => {
        const state={v:1,scope:'expired-synthetic',draft:null,localRecords:[{id:'synthetic-local'}],pausedDrafts:[{id:'synthetic-paused'}],tags:[],note:'synthetic'};
        localStorage.setItem('nocturne_1',JSON.stringify(state));localStorage.setItem('nocturne_1:expired-synthetic',JSON.stringify(state));localStorage.setItem('nocturne_1:other-synthetic',JSON.stringify({...state,scope:'other-synthetic',note:'preserve'}));sessionStorage.setItem('nocturne_metrics',JSON.stringify({id:'synthetic',touched:Date.now(),source:'direct',device:'mobile',sent:['visit']}));
      });
      await accountBudget();await page.reload();await page.locator('.home-entrance').waitFor();
      await page.getByRole('button',{name:'メニューを開く',exact:true}).click();await page.locator('#modal-body [data-action=account]').click();await action('local-cleanup-prompt').click();
      assert.match(await page.locator('#modal-body').textContent(),/保存した結果 1件・途中の診断 1件/);
      await action('local-cleanup').click();assert.match(await page.locator('#local-cleanup-error').textContent(),/チェック/);await capture('local-cleanup-confirm-390.png');
      await page.locator('#local-cleanup-confirm').check();await action('local-cleanup').click();await page.waitForFunction(()=>JSON.parse(localStorage.getItem('nocturne_local_cleanup')||'null')?.pending===false);
      const proof=await page.evaluate(()=>({current:JSON.parse(localStorage.getItem('nocturne_1')),other:JSON.parse(localStorage.getItem('nocturne_1:other-synthetic')),old:localStorage.getItem('nocturne_1:expired-synthetic'),metrics:sessionStorage.getItem('nocturne_metrics')}));
      assert.equal(proof.current.draft,null);assert.equal(proof.current.localRecords.length,0);assert.equal(proof.other.note,'preserve');assert.equal(proof.old,null);assert.equal(proof.metrics,null);await capture('local-cleanup-complete-390.png');
    });
    await check('canonical-library', async () => {
      await page.goto(origin + '/types/');
      assert.equal(await page.locator('[data-catalog=named] .dossier-tile').count(), NAMED_DOSSIERS.length);
      assert.equal(await page.locator('[data-catalog=pending] .dossier-tile').count(), PENDING_DOSSIERS.length);
      const named = await page.locator('[data-catalog=named]').textContent();
      for (const pending of PENDING_DOSSIERS) assert.ok(!named.includes(pending.title));
      await page.locator('[data-catalog=named] .dossier-tile').first().click();
      await page.getByRole('heading', {name: NAMED_DOSSIERS[0].title, exact: true}).waitFor();
      await page.goto(origin + '/types/DWNX/');
      assert.equal(new URL(page.url()).pathname, '/types/');
      await capture('canonical-library-390.png');
    });
    await check('legacy-share-reload', async () => {
      // Keep the extra reloads within the existing ten account requests per minute.
      // The fixture must respect production limits rather than bypass or weaken them.
      for (;;) {
        const now = Date.now(), recent = accountRequests.filter(time => now - time < 60000);
        if (recent.length + 2 <= 10) break;
        const wait = recent[recent.length + 2 - 10 - 1] + 60500 - now;
        await page.waitForTimeout(Math.min(59000, Math.max(1, wait)));
      }

      const old = diagnoseLegacy(Array(40).fill(3)), fragment = '#share=' + encodeResult(old);
      await page.goto(origin + '/' + fragment);
      await page.locator('.received .public-card h3').waitFor();
      assert.ok((await page.locator('.received').textContent()).includes(old.title));
      assert.equal(new URL(page.url()).hash, fragment);
      await page.reload(); await page.locator('.received .public-card h3').waitFor();
      assert.ok((await page.locator('.received').textContent()).includes(old.title));
      assert.equal(new URL(page.url()).hash, fragment);
      assert.equal(await page.locator('[data-action=open-promotion]').count(), 0);
      await page.locator('a[data-route=home]').click(); await page.locator('.home-entrance').waitFor();
    });
    await check('console-health', async () => assert.equal(errors.length, 0));
    return {passed: true, checks, screenshots};
  } catch (error) {
    checks.push({id: current, passed: false, message:error.message.slice(0,400)});
    await page.screenshot({path: path.join(outputDir, 'failure.png')}).then(() => screenshots.push('failure.png')).catch(() => {});
    return {passed: false, checks, screenshots, reason: 'UI_CHECK_FAILED', failure:{name:error.name,message:error.message.slice(0,400)}};
  } finally { await context.close(); }
}
