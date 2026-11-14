import { describe, it } from 'node:test';
import assert from 'node:assert';
import { formatTime } from '../lib/utils.js';
import { initialUserData } from '../lib/mock-data.js';

describe('LeetCode Data Models & Utilities', () => {
  it('formats seconds into MM:SS format correctly', () => {
    assert.strictEqual(formatTime(1500), '25:00');
    assert.strictEqual(formatTime(2700), '45:00');
    assert.strictEqual(formatTime(0), '00:00');
    assert.strictEqual(formatTime(65), '01:05');
    assert.strictEqual(formatTime(9), '00:09');
  });

  it('validates daily challenge schema integrity', () => {
    const dc = initialUserData.dailyChallenge;
    assert.ok(dc.title, 'Daily challenge must have a title');
    assert.ok(dc.titleSlug, 'Daily challenge must have a titleSlug');
    assert.ok(['Easy', 'Medium', 'Hard'].includes(dc.difficulty), 'Valid difficulty');
    assert.ok(Array.isArray(dc.tags), 'Tags must be an array');
  });

  it('validates difficulty stats total sum and percentages', () => {
    const ds = initialUserData.difficultyStats;
    assert.strictEqual(ds.easy.total, 840);
    assert.strictEqual(ds.medium.total, 1750);
    assert.strictEqual(ds.hard.total, 780);
    assert.ok(ds.easy.percentage <= 100);
    assert.ok(ds.medium.percentage <= 100);
    assert.ok(ds.hard.percentage <= 100);
  });
});
