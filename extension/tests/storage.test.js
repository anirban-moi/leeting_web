import { describe, it, expect, beforeEach } from 'vitest';
import {
  getFocusModeEnabled,
  setFocusModeEnabled,
  getSolveBeforeScrollEnabled,
  setSolveBeforeScrollEnabled,
  getAutoFocusLocked,
  setAutoFocusLocked,
  getLastCoinClaimDate,
  setLastCoinClaimDate,
  getExpandedSections,
  setExpandedSections,
  storageGet,
  storageSet,
} from '../src/services/storage.js';

describe('Storage Service', () => {
  it('handles default values for unset keys', async () => {
    const val = await storageGet('non_existent_key', 'default_val');
    expect(val).toBe('default_val');
  });

  it('stores and retrieves arbitrary values', async () => {
    await storageSet('test_number', 42);
    const result = await storageGet('test_number');
    expect(result).toBe(42);
  });

  it('toggles focus mode preference', async () => {
    expect(await getFocusModeEnabled()).toBe(false);
    await setFocusModeEnabled(true);
    expect(await getFocusModeEnabled()).toBe(true);
    await setFocusModeEnabled(false);
    expect(await getFocusModeEnabled()).toBe(false);
  });

  it('toggles solve-before-scroll and auto-focus lock state', async () => {
    expect(await getSolveBeforeScrollEnabled()).toBe(false);
    await setSolveBeforeScrollEnabled(true);
    expect(await getSolveBeforeScrollEnabled()).toBe(true);
    await setSolveBeforeScrollEnabled(false);
    expect(await getSolveBeforeScrollEnabled()).toBe(false);

    expect(await getAutoFocusLocked()).toBe(false);
    await setAutoFocusLocked(true);
    expect(await getAutoFocusLocked()).toBe(true);
    await setAutoFocusLocked(false);
    expect(await getAutoFocusLocked()).toBe(false);
  });

  it('tracks last coin claim date', async () => {
    expect(await getLastCoinClaimDate()).toBeNull();
    await setLastCoinClaimDate('2026-11-11');
    expect(await getLastCoinClaimDate()).toBe('2026-11-11');
  });

  it('manages collapsible section states with default all open', async () => {
    const defaults = await getExpandedSections();
    expect(defaults).toEqual({
      user: true,
      daily: true,
      contest: true,
      sbs: true,
      focus: true,
      coins: true,
    });

    await setExpandedSections({
      user: false,
      daily: true,
      contest: false,
      focus: true,
      coins: false,
    });

    const updated = await getExpandedSections();
    expect(updated.user).toBe(false);
    expect(updated.contest).toBe(false);
    expect(updated.daily).toBe(true);
  });
});
