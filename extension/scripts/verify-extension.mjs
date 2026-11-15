import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const EXT_DIR = path.resolve('.output/chrome-mv3');
const SCREENSHOTS_DIR = path.resolve('docs/screenshots');

function findBrowserExecutable() {
  if (process.env.CHROME_PATH && fs.existsSync(process.env.CHROME_PATH)) {
    return process.env.CHROME_PATH;
  }

  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
  ];

  const playwrightDir = path.join(process.env.LOCALAPPDATA || '', 'ms-playwright');
  if (fs.existsSync(playwrightDir)) {
    for (const entry of fs.readdirSync(playwrightDir)) {
      if (entry.startsWith('chromium-')) {
        candidates.unshift(path.join(playwrightDir, entry, 'chrome-win64', 'chrome.exe'));
      }
    }
  }

  return candidates.find((p) => p && fs.existsSync(p)) || null;
}

class PipeCDPClient {
  constructor(proc) {
    this.proc = proc;
    this.nextId = 1;
    this.pending = new Map();
    this.buffer = Buffer.alloc(0);

    proc.stdio[4].on('data', (chunk) => {
      this.buffer = Buffer.concat([this.buffer, chunk]);
      let idx;
      while ((idx = this.buffer.indexOf(0)) !== -1) {
        const raw = this.buffer.subarray(0, idx).toString('utf8');
        this.buffer = this.buffer.subarray(idx + 1);
        if (!raw.trim()) continue;
        const msg = JSON.parse(raw);
        if (msg.id && this.pending.has(msg.id)) {
          const { resolve, reject } = this.pending.get(msg.id);
          this.pending.delete(msg.id);
          if (msg.error) reject(new Error(msg.error.message || JSON.stringify(msg.error)));
          else resolve(msg.result);
        }
      }
    });
  }

  send(method, params = {}, sessionId = undefined) {
    const id = this.nextId++;
    const payload = { id, method, params };
    if (sessionId) payload.sessionId = sessionId;
    this.proc.stdio[3].write(JSON.stringify(payload) + '\0');
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id);
          reject(new Error(`CDP timeout calling ${method}`));
        }
      }, 15000);
      this.pending.set(id, {
        resolve: (res) => {
          clearTimeout(timer);
          resolve(res);
        },
        reject: (err) => {
          clearTimeout(timer);
          reject(err);
        },
      });
    });
  }

  async evalInSession(sessionId, expression) {
    const res = await this.send(
      'Runtime.evaluate',
      { expression, awaitPromise: true, returnByValue: true },
      sessionId
    );
    if (res.exceptionDetails) {
      throw new Error(
        `Runtime exception: ${res.exceptionDetails.exception?.description || res.exceptionDetails.text}`
      );
    }
    return res.result?.value;
  }
}

async function launchBrowser(browserPath, userDataDir) {
  const proc = spawn(
    browserPath,
    [
      '--headless=new',
      '--no-sandbox',
      '--disable-gpu',
      '--enable-unsafe-extension-debugging',
      `--user-data-dir=${userDataDir}`,
      `--disable-extensions-except=${EXT_DIR}`,
      `--load-extension=${EXT_DIR}`,
      '--remote-debugging-pipe',
      'about:blank',
    ],
    { stdio: ['ignore', 'pipe', 'pipe', 'pipe', 'pipe'] }
  );

  const cdp = new PipeCDPClient(proc);
  let swTarget = null;
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 250));
    const { targetInfos } = await cdp.send('Target.getTargets');
    swTarget = targetInfos.find(
      (t) =>
        t.type === 'service_worker' &&
        t.url.startsWith('chrome-extension://') &&
        t.url.endsWith('/background.js')
    );
    if (swTarget) break;
  }

  if (!swTarget) {
    throw new Error('Extension service worker did not register within timeout');
  }

  const extId = new URL(swTarget.url).hostname;
  const { sessionId: swSession } = await cdp.send('Target.attachToTarget', {
    targetId: swTarget.targetId,
    flatten: true,
  });

  return { proc, cdp, extId, swSession };
}

async function stopBrowser(proc) {
  return new Promise((resolve) => {
    proc.once('close', resolve);
    proc.kill();
    setTimeout(resolve, 1500);
  });
}

function assert(cond, message) {
  if (!cond) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runVerification() {
  if (!fs.existsSync(EXT_DIR)) {
    throw new Error(`Built extension missing at ${EXT_DIR}. Run build first.`);
  }

  const browserPath = findBrowserExecutable();
  if (!browserPath) {
    throw new Error('No Chromium/Chrome executable found. Set CHROME_PATH env var.');
  }
  console.log(`Using browser: ${browserPath}`);

  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'leeting-e2e-'));

  try {
    // Session 1: Service worker, alarms, DNR blocking, popup rendering & screenshots
    let session = await launchBrowser(browserPath, userDataDir);
    let { cdp, extId, swSession, proc } = session;
    console.log(`Loaded extension ID: ${extId}`);

    const swChecks = await cdp.evalInSession(
      swSession,
      `(async () => {
        const manifest = chrome.runtime.getManifest();
        const alarms = await chrome.alarms.getAll();
        return {
          version: manifest.version,
          name: manifest.name,
          alarmNames: alarms.map(a => a.name).sort(),
        };
      })()`
    );
    assert(swChecks.version === '1.0.9', `Expected manifest version 1.0.9, got ${swChecks.version}`);
    assert(swChecks.alarmNames.includes('leeting_alarm_daily_check'), 'Daily check alarm missing');
    assert(swChecks.alarmNames.includes('leeting_alarm_contest_check'), 'Contest check alarm missing');
    console.log('✓ Manifest & background alarms verified:', swChecks);

    // Seed solved dashboard state + Focus Mode ON
    await cdp.evalInSession(
      swSession,
      `(async () => {
        const today = new Date().toISOString().split('T')[0];
        await chrome.storage.local.set({
          leeting_focus_mode_enabled: true,
          leeting_solve_before_scroll_enabled: true,
          leeting_auto_focus_locked: false,
          leeting_last_coin_claim: today,
          leeting_notified_contests: { 'weekly-contest-475': Date.now() },
          leeting_cached_user: {
            isSignedIn: true,
            hasSessionCookie: true,
            username: 'The-Boss',
            points: 1894,
            avatar: '',
            currentStreak: 12,
            longestStreak: 25,
            lastChecked: Date.now()
          },
          leeting_cached_daily: {
            date: today,
            isSolved: true,
            title: '3Sum',
            titleSlug: '3sum',
            frontendId: '15',
            difficulty: 'Medium',
            link: 'https://leetcode.com/problems/3sum/',
            topicTags: ['Array', 'Two Pointers', 'Sorting']
          }
        });
      })()`
    );

    await new Promise((r) => setTimeout(r, 400));

    const focusRules = await cdp.evalInSession(
      swSession,
      `(async () => {
        const rules = await chrome.declarativeNetRequest.getDynamicRules();
        return rules.map(r => r.id).sort((a, b) => a - b);
      })()`
    );
    assert(
      focusRules.includes(3001) && focusRules.includes(3002) && focusRules.includes(3003),
      `Expected Focus DNR rules [3001, 3002, 3003], got ${JSON.stringify(focusRules)}`
    );
    console.log('✓ Active Focus Mode DNR rules verified:', focusRules);

    // Verify live DNR redirection for Instagram, Facebook, and LinkedIn Video
    for (const testUrl of [
      'https://www.instagram.com/reels/',
      'https://www.facebook.com/',
      'https://www.linkedin.com/video/',
    ]) {
      const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' });
      const { sessionId: pageSession } = await cdp.send('Target.attachToTarget', { targetId, flatten: true });
      await cdp.send('Page.enable', {}, pageSession);
      await cdp.send('Page.navigate', { url: testUrl }, pageSession);
      await new Promise((r) => setTimeout(r, 800));
      const finalUrl = await cdp.evalInSession(pageSession, 'window.location.href');
      assert(
        finalUrl === `chrome-extension://${extId}/blocked.html`,
        `Expected ${testUrl} to redirect to blocked.html, got ${finalUrl}`
      );
      if (testUrl.includes('instagram.com')) {
        await cdp.send(
          'Emulation.setDeviceMetricsOverride',
          { width: 1200, height: 760, deviceScaleFactor: 2, mobile: false },
          pageSession
        );
        const { data } = await cdp.send('Page.captureScreenshot', { format: 'png' }, pageSession);
        fs.writeFileSync(path.join(SCREENSHOTS_DIR, 'blocked-page.png'), Buffer.from(data, 'base64'));
        console.log('✓ Captured docs/screenshots/blocked-page.png');
      }
      await cdp.send('Target.closeTarget', { targetId });
    }
    console.log('✓ Verified live DNR blocking for Instagram, Facebook, and LinkedIn Video');

    // Capture popup-dashboard.png
    {
      const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' });
      const { sessionId: popupSession } = await cdp.send('Target.attachToTarget', { targetId, flatten: true });
      await cdp.send('Page.enable', {}, popupSession);
      await cdp.send(
        'Emulation.setDeviceMetricsOverride',
        { width: 380, height: 600, deviceScaleFactor: 2, mobile: false },
        popupSession
      );
      await cdp.send('Page.navigate', { url: `chrome-extension://${extId}/popup.html` }, popupSession);
      await new Promise((r) => setTimeout(r, 1200));
      const bodyText = await cdp.evalInSession(popupSession, 'document.body.innerText');
      assert(bodyText.includes('The-Boss') && bodyText.includes('12 Days'), `Unexpected popup state: ${bodyText}`);
      const { data } = await cdp.send('Page.captureScreenshot', { format: 'png' }, popupSession);
      fs.writeFileSync(path.join(SCREENSHOTS_DIR, 'popup-dashboard.png'), Buffer.from(data, 'base64'));
      console.log('✓ Captured docs/screenshots/popup-dashboard.png');
      await cdp.send('Target.closeTarget', { targetId });
    }

    // Seed Solve-Before-Scroll Locked state and capture popup-locked.png
    await cdp.evalInSession(
      swSession,
      `(async () => {
        const today = new Date().toISOString().split('T')[0];
        await chrome.storage.local.set({
          leeting_focus_mode_enabled: true,
          leeting_solve_before_scroll_enabled: true,
          leeting_auto_focus_locked: true,
          leeting_last_coin_claim: null,
          leeting_cached_daily: {
            date: today,
            isSolved: false,
            title: 'Two Sum',
            titleSlug: 'two-sum',
            frontendId: '1',
            difficulty: 'Easy',
            link: 'https://leetcode.com/problems/two-sum/',
            topicTags: ['Array', 'Hash Table']
          }
        });
      })()`
    );

    {
      const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' });
      const { sessionId: popupSession } = await cdp.send('Target.attachToTarget', { targetId, flatten: true });
      await cdp.send('Page.enable', {}, popupSession);
      await cdp.send(
        'Emulation.setDeviceMetricsOverride',
        { width: 380, height: 600, deviceScaleFactor: 2, mobile: false },
        popupSession
      );
      await cdp.send('Page.navigate', { url: `chrome-extension://${extId}/popup.html` }, popupSession);
      await new Promise((r) => setTimeout(r, 1200));
      const bodyText = await cdp.evalInSession(popupSession, 'document.body.innerText');
      assert(bodyText.includes('Locked') && bodyText.includes('Solve Before Scroll'), 'Locked popup state missing');
      const { data } = await cdp.send('Page.captureScreenshot', { format: 'png' }, popupSession);
      fs.writeFileSync(path.join(SCREENSHOTS_DIR, 'popup-locked.png'), Buffer.from(data, 'base64'));
      console.log('✓ Captured docs/screenshots/popup-locked.png');

      // Test live frame-by-frame animation & smooth upward easing of lower modules
      const animTelemetry = await cdp.evalInSession(
        popupSession,
        `new Promise((resolve) => {
          const dailyHeader = document.querySelector('[title*="Daily Challenge"]');
          const sbsCard = document.querySelector('[data-testid="sbs-dropdown"]').parentElement;
          const dailyDropdown = document.querySelector('[data-testid="daily-dropdown"]');

          const initialDailyHeight = dailyDropdown.getBoundingClientRect().height;
          const initialSbsTop = sbsCard.getBoundingClientRect().top;

          // Trigger collapse on Daily Challenge
          dailyHeader.click();

          const samples = [];
          const t0 = performance.now();
          const interval = setInterval(() => {
            const elapsed = Math.round(performance.now() - t0);
            const sbsTop = sbsCard.getBoundingClientRect().top;
            const dailyHeight = dailyDropdown.getBoundingClientRect().height;
            samples.push({ elapsed, sbsTop, dailyHeight });
            if (elapsed >= 360) {
              clearInterval(interval);
              resolve({
                initialDailyHeight,
                initialSbsTop,
                finalDailyHeight: dailyDropdown.getBoundingClientRect().height,
                finalSbsTop: sbsCard.getBoundingClientRect().top,
                samples,
              });
            }
          }, 25);
        })`
      );

      assert(animTelemetry.initialDailyHeight > 40, 'Daily challenge should be expanded initially');
      assert(animTelemetry.finalDailyHeight === 0, 'Daily challenge must smoothly collapse to 0px');
      assert(
        animTelemetry.finalSbsTop < animTelemetry.initialSbsTop,
        'Lower module (Solve Before Scroll) must glide up when upper module collapses'
      );
      const midSample = animTelemetry.samples.find((s) => s.elapsed >= 80 && s.elapsed <= 200);
      assert(
        midSample &&
          midSample.sbsTop < animTelemetry.initialSbsTop &&
          midSample.sbsTop > animTelemetry.finalSbsTop,
        'Lower module must glide smoothly through intermediate positions, not jump instantaneously'
      );
      console.log(
        `✓ Verified live easing animation: lower module glided up smoothly at ease (top: ${Math.round(
          animTelemetry.initialSbsTop
        )}px -> mid: ${Math.round(midSample.sbsTop)}px -> final: ${Math.round(
          animTelemetry.finalSbsTop
        )}px over 280ms)`
      );

      // Now collapse all sections to verify the minimal compact popup height
      await cdp.evalInSession(
        swSession,
        `chrome.storage.local.set({
          leeting_expanded_sections: {
            user: false,
            daily: false,
            contest: false,
            sbs: false,
            focus: false,
            coins: false,
          }
        })`
      );
      await cdp.send('Page.reload', {}, popupSession);
      await new Promise((r) => setTimeout(r, 1000));
      const collapsedHeight = await cdp.evalInSession(popupSession, 'document.body.offsetHeight');
      console.log(`✓ Collapsed popup rendered with compact height: ${collapsedHeight}px (takes minimal space)`);
      const { data: collapsedData } = await cdp.send('Page.captureScreenshot', {
        format: 'png',
        clip: { x: 0, y: 0, width: 360, height: collapsedHeight, scale: 2 }
      }, popupSession);
      fs.writeFileSync(path.join(SCREENSHOTS_DIR, 'popup-collapsed.png'), Buffer.from(collapsedData, 'base64'));
      console.log('✓ Captured docs/screenshots/popup-collapsed.png');

      await cdp.send('Target.closeTarget', { targetId });
    }

    await stopBrowser(proc);

    // Session 2: Reload same userDataDir to confirm persisted storage & DNR rules survive restart
    session = await launchBrowser(browserPath, userDataDir);
    ({ cdp, swSession, proc } = session);

    const persistedAfterReload = await cdp.evalInSession(
      swSession,
      `(async () => {
        const stored = await chrome.storage.local.get(null);
        const rules = await chrome.declarativeNetRequest.getDynamicRules();
        return { stored, ruleIds: rules.map(r => r.id).sort((a, b) => a - b) };
      })()`
    );

    assert(persistedAfterReload.stored.leeting_focus_mode_enabled === true, 'Focus Mode lost after reload');
    assert(
      persistedAfterReload.stored.leeting_solve_before_scroll_enabled === true,
      'Solve Before Scroll lost after reload'
    );
    assert(persistedAfterReload.stored.leeting_auto_focus_locked === true, 'Auto lock flag lost after reload');
    assert(persistedAfterReload.stored.leeting_cached_user?.username === 'The-Boss', 'Cached user lost after reload');
    assert(persistedAfterReload.stored.leeting_cached_daily?.title === 'Two Sum', 'Cached daily lost after reload');
    assert(persistedAfterReload.ruleIds.includes(3001), 'Focus DNR rules not restored on startup');
    console.log('✓ Persistent storage & Focus DNR restoration verified across browser restart');

    await stopBrowser(proc);
    console.log('\nALL LIVE CHROMIUM MV3 EXTENSION VERIFICATIONS PASSED!');
  } finally {
    try {
      fs.rmSync(userDataDir, { recursive: true, force: true });
    } catch {
      // Ignore Windows temp handle lag
    }
  }
}

runVerification().catch((err) => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
