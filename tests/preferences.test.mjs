import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  fetchUserPreferences,
  saveUserPreferences,
} from '../lib/services/preferences-service.js';

describe('User Preferences & Cloud Sync Workflows', () => {
  it('returns default preferences from mock data when user is null', async () => {
    const prefs = await fetchUserPreferences(null);
    assert.strictEqual(prefs.solveBeforeScroll, false);
    assert.ok(Array.isArray(prefs.focusRules));
    assert.strictEqual(prefs.focusRules.length, 5);
  });

  it('handles saveUserPreferences gracefully when user is null', async () => {
    const result = await saveUserPreferences(null, { solveBeforeScroll: false });
    assert.strictEqual(result, false);
  });
});
