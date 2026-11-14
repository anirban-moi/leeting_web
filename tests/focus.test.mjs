import { describe, it } from 'node:test';
import assert from 'node:assert';
import { initialUserData } from '../lib/mock-data.js';
import { logFocusSession, fetchFocusHistory } from '../lib/services/focus-service.js';

describe('Focus Session & Timer Cloud Workflows', () => {
  it('logs focus session locally without throwing when Supabase is unconfigured', async () => {
    const result = await logFocusSession(null, {
      durationMinutes: 25,
      completed: true,
      notes: 'Test cycle',
    });
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.localOnly, true);
  });

  it('fetches focus history fallback with recent sessions when unauthenticated', async () => {
    const history = await fetchFocusHistory(null);
    assert.ok(Array.isArray(history));
    assert.ok(history.length >= 1);
    assert.ok(history[0].duration_minutes > 0);
  });

  it('validates focus rules have complete domains and valid categories', () => {
    const rules = initialUserData.focusRules;
    assert.ok(Array.isArray(rules));
    assert.strictEqual(rules.length, 5);

    const domains = rules.map((r) => r.domain);
    assert.ok(domains.includes('youtube.com'));
    assert.ok(domains.includes('instagram.com'));
    assert.ok(domains.includes('facebook.com'));
    assert.ok(domains.includes('linkedin.com'));

    rules.forEach((rule) => {
      assert.ok(rule.id.startsWith('rule-'));
      assert.ok(rule.name.length > 0);
      assert.strictEqual(typeof rule.enabled, 'boolean');
    });
  });
});
