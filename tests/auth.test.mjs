import { describe, it } from 'node:test';
import assert from 'node:assert';
import { initialUserData } from '../lib/mock-data.js';
import { fetchUserProfile, updateUserProfile } from '../lib/services/profile-service.js';

describe('Web Authentication & Profile Workflows', () => {
  it('provides complete fallback profile data when unauthenticated', async () => {
    const profile = await fetchUserProfile(null);
    assert.strictEqual(profile.username, 'The-Boss');
    assert.strictEqual(profile.streak, 12);
    assert.strictEqual(profile.leetCoins, 1894);
    assert.strictEqual(typeof profile.ranking, 'number');
  });

  it('handles profile updates gracefully when userId is null', async () => {
    const result = await updateUserProfile(null, { streak: 15 });
    assert.strictEqual(result, false);
  });

  it('guarantees required initial user profile data keys are present', () => {
    const p = initialUserData.profile;
    assert.ok(p.username, 'Profile must have username');
    assert.ok(p.avatarUrl, 'Profile must have avatarUrl');
    assert.strictEqual(typeof p.totalSolved, 'number');
    assert.strictEqual(typeof p.totalAvailable, 'number');
  });
});
